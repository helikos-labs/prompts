---
title: Write PR descriptions with evidence, debatable choices and what wasn't tested
summary: Turn a diff into a PR description a reviewer can act on, with the defect in numbers, what changed per file, the choices they might dispute, what wasn't tested and how to undo it.
category: claude-code
tags: [review, writing, testing]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: beginner
use_as: prompt
---

## The prompt

Paste this into a Claude chat with your diff and your test output. Paste the diff itself; use a summary only if the diff is too long. The first line of the result is the PR title; paste the rest into the description.

```text
Write the pull-request description for the change below. The reader is a reviewer with the diff open who must decide whether to merge. Give them the case for the change, the decisions to look at hard, and what nobody has checked yet.

The change (the diff; a summary only if the diff is too long):
{{diff_or_summary}}

Context (the problem, its evidence, who reviews, who merges, what merging triggers):
{{context}}

What was run, and what happened:
{{tests_run}}

Start with a title line: imperative, under 70 characters, naming the outcome, not the files ("Stop sending duplicate invoice emails on retry", not "Update scripts"). Then these sections, in this order:

## Why
The defect or need, stated as a claim in the first sentence. Then the evidence, with numbers: counts, timings, dates, the incident. "Timed out on 312 of 4,000 checkouts" beats "checkout was sometimes slow". Then the cause, if known, so the reviewer can judge whether the fix reaches it. If the change lives in an unexpected place or takes an unexpected shape, one sentence on why.

## What
One bullet per file or component: its name in bold backticks, then what it now does, in one or two lines. Describe behaviour, not edits: "rejects uploads over 10 MB with 413", not "adds an if-statement". If a file's change answers a specific failure, name it in a few words. Fold trivial files into one bullet. If the PR deliberately leaves alone something a reviewer might expect it to touch, say so in one line.

## Choices worth a second look
The decisions a careful reviewer could disagree with: defaults and limits, failure behaviour (fail open or closed, warn or block), ordering, what is skipped or refused, anything hard to undo. One to three for a small change, never more than five. Each is a bold one-line statement of the decision, one sentence of reason, then one sentence of risk: what can go wrong, when, and what happens then. Name the alternative and why it lost only when there was a real one. Never write "no risks".

## Testing
Each check that was run, with its result: the command or scenario, and the outcome (counts, exit codes, responses). Report only what the input above says was run; never invent a run, a number or a pass. Then a line starting "Not tested:" listing what was not exercised (each behaviour claimed under What that no test covers, real traffic, real infrastructure), why, and where it will first run for real.

## Plan after merge
Include this section whenever merging changes something live (deploys, migrates data, sends messages, switches a feature on); otherwise leave it out. Say what a correct first real run looks like, so a failure is recognisable. Say how to undo the change (revert, flag, config value, rollback step) and what an undo will not restore (data written, messages sent, caches, external state). If steps must follow the merge, number them in order, each with why the order matters (what breaks if it is skipped or done early).

End with one line that hands over the decision: what has not been done yet (merged, deployed, switched on), why it waits, and who decides.

Rules:
- Claim first, in every section and every bullet; the reason follows.
- No marketing. No "robust", "seamless", "improves", "enhances". Every adjective must be checkable against the diff.
- Don't restate the diff line by line. Say what it means.
- Check every claim against the diff before you write it. Words like "read-only", "idempotent", "no downtime", "backwards compatible" and "nothing lost" must be true of the code as written, or leave them out. If you were given a summary instead of the diff, don't state such words from it as fact; attribute them: "per the author, not checked against the code".
- Use the diff's own names (files, functions, flags, routes, config keys) in backticks so the reviewer can search for them.
- If the input lacks something that would change the merge decision, write "Not supplied:" and what is missing; don't guess. Leave out gaps that would change nothing.
- About 300–500 words; go longer only for a large or risky change. Cut any sentence that would not change the reviewer's decision.
```

## Example

**Input**:

- `diff_or_summary`:

  ```text
  src/middleware/rateLimit.ts (new): fixed one-minute window per client, keyed on req.ip (the app already sets trust proxy for the load balancer). Counter in the existing Redis, key rl:<ip>:<minute>, expires after 60 s. Over the limit: 429 with Retry-After set to the seconds left in the window. On a Redis error: logs a warning and lets the request through.
  src/routes/search.ts: applies rateLimit to GET /api/search only.
  src/config.ts: reads RATE_LIMIT_PER_MIN, default 60.
  .env.example: adds RATE_LIMIT_PER_MIN=60.
  test/rateLimit.test.ts (new): 5 tests.
  ```

- `context`: "GET /api/search is public, with no sign-in. Last Tuesday one IP sent 41,000 requests in 20 minutes; p95 latency for all users rose from 180 ms to 2.4 s and database CPU sat at 100% until we blocked the IP by hand. Our heaviest normal clients make about 20 searches a minute. The API runs as 3 instances behind a load balancer. The backend lead reviews and merges; merging to main deploys to production."
- `tests_run`: "npm test: the 5 new tests pass (under the limit → 200; 61st request in a minute → 429 with Retry-After; counter resets in the next minute; Redis stopped → request allowed and warning logged; limit read from env). The 212 existing tests pass. Locally, a script sent 100 requests in 10 s from one IP: 60 got 200, 40 got 429. Not run in staging."

The change is a summary here to keep the example short. With a summary, the model can only check claims against the author's words, so paste the real diff when you can.

**Output** (trimmed):

```markdown
Cap public search at 60 requests per minute per client IP

## Why
`GET /api/search` has no per-client limit, so a single client can saturate the database and slow search for everyone. Last Tuesday one IP sent 41,000 requests in 20 minutes, about 2,050 a minute. p95 latency for all users rose from 180 ms to 2.4 s, and database CPU stayed at 100% until we blocked the IP by hand. … At 60 a minute, Tuesday's IP would have been served about 1,200 of its 41,000 requests.

## What
- **`src/middleware/rateLimit.ts`** (new): counts requests per `req.ip` per clock minute in Redis. The key is `rl:<ip>:<minute>` and it expires after 60 s. Once an IP goes over the limit in a minute, it gets 429 with `Retry-After` set to the seconds left in that minute. If Redis returns an error, it logs a warning and serves the request.
- **`src/routes/search.ts`**: applies `rateLimit` to `GET /api/search` only. No other route is limited.
…

The counter is kept in Redis, not in process memory. So the limit should cover all three instances together, not allow 60 on each one. This comes from the author's summary and has not been checked against the code.

## Choices worth a second look
**A Redis error lets the request through, with a warning (fail open).** A problem in Redis should not take search down as well. Risk: while Redis is failing there is no limit, so a flood like Tuesday's reaches the database unchecked and logs one warning per request, about 2,000 lines a minute. Not supplied: the Redis client timeout. If a slow Redis stalls instead of returning an error, every search waits on it.

**Clients are keyed on `req.ip`, which relies on the existing `trust proxy` setting.** Search has no sign-in, so the IP is the only key available. Risk: there are two ways this can go wrong:
- If `req.ip` resolves to the load balancer, all users share one bucket, and most searches get 429 from the first busy minute after deploy.
- If `trust proxy` accepts any `X-Forwarded-For` value, a client can change that header on every request and never be limited.

Not supplied: the `trust proxy` value used in production.
…

## Testing
…
Not tested:
- what `req.ip` resolves to behind the production load balancer
- one counter shared by three instances
- a slow Redis, as opposed to a stopped one
…

The local run did not go through the load balancer, and nothing was run in staging. All of these will first run in production when this is merged.

Not supplied: how many IPs other than Tuesday's went over 60 searches in a minute in recent access logs. That count would show whether real users will get 429s.

## Plan after merge
- **What a correct first run looks like:** in the first 15 minutes, 429s on `GET /api/search` are rare and come from only a few IPs. Search p95 stays near 180 ms, and the rate-limit Redis warning does not appear.
- **What a failure looks like:**
  - 429s spread across many different IPs. That means everyone is sharing one key, so check what `req.ip` resolves to in production.
  - A steady stream of Redis warnings. That means the limiter is not limiting anything.
- **Undo:** raise `RATE_LIMIT_PER_MIN`, or revert this PR, which redeploys when the revert is merged. … Undoing does not give back searches already refused with 429. Redis needs no cleanup, because each key expires within 60 s.

This PR is not merged or deployed yet. Merging sends it straight to production without a staging run. It waits for the backend lead to confirm the production `trust proxy` value and accept 60 a minute as the default, and the backend lead decides whether to merge.
```

The incident figures are from the input or worked out from it (2,050 a minute is 41,000 over 20 minutes; 1,200 is 60 a minute for 20 minutes). Because the change was given as a summary, the shared-counter claim is attributed to the author, and the missing production `trust proxy` value is marked "Not supplied:" and becomes the condition in the closing line.

## Why it works

- **"Choices worth a second look" points the review at decisions, not syntax.** Reviewers check the code they can see; the costly mistakes hide in defaults, failure behaviour and what gets skipped. A bold decision with a sentence of reason and a sentence of risk invites the disagreement before merge and stops the description reading as a sales pitch. The sentence caps and the word budget push against the model's habit of listing every risk it can think of, which makes the reviewer stop reading. They don't fully hold: in the test run the model still bulleted two or three risks under two of its three choices and ran to about 840 words, so trim before posting.
- **Evidence with numbers, then the cause.** "312 of 4,000" or "41,000 requests in 20 minutes" lets the reviewer judge whether the fix is proportionate and check later that it worked. The cause tells them whether the change reaches the problem or only its symptom.
- **Nothing is stated that nobody checked.** Left alone, a model writes "all tests pass" whatever ran, and descriptions often call a change "read-only" or "no downtime" when the code says otherwise. So Testing comes only from reported runs, "Not tested:" lists each claimed behaviour no test covers and where it first runs for real, safety words must match the code (or are attributed to the author when only a summary was given), and missing input is marked "Not supplied:" instead of guessed.
- **The description ends with what happens after merge, and who decides.** Saying what a correct first run looks like makes a failure recognisable. Naming the undo and what it cannot restore (data written, messages sent) shows the real cost of being wrong, and numbered steps with reasons stop someone doing them out of order. The closing line says what has not happened yet and whose call it is, so nobody assumes merging is safe because the description sounded sure.

## Variations

- **In Claude Code.** Replace `{{diff_or_summary}}` with "Run `git fetch` and `git diff origin/<base>...HEAD`, and read this branch's commit messages". Keep `{{context}}`, because commit messages rarely say who merges or what merging triggers. Replace `{{tests_run}}` with "Run the test suite and report its real output". Then put the first line in the title and the rest in a file: `gh pr create --title "<first line>" --body-file pr-body.md`.
- **Make it house style.** Put the sections and rules in your `CLAUDE.md` under a "Pull requests" heading, or the headings alone in `.github/pull_request_template.md`.
- **Review the description too.** Follow up with "Read this as the reviewer. Which claim isn't backed by the diff or the test output?" and fix what it finds.
- Generalised from pull requests in a deployment repo.
