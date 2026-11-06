---
title: Hardening round for a public AI app that spends your own API key
summary: "Before launch, audit and patch a public AI app that spends your API key: fail-closed quotas, keyed IP hashes, a bot gate, CSP, provider terms, spend-cap arithmetic and bring-your-own-key."
category: deploy-hosting
tags: [security, privacy, cloudflare, deploy, testing]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: advanced
use_as: skill
---

## The prompt

This is the skill's `SKILL.md`. Install the skill from this page into `.claude/skills/public-ai-app-hardening/`; the download adds `references/patterns.md`, code patterns for network keys, counters, charging, the bot gate and headers. Then, in a Claude Code session at the root of the app's repository, ask Claude to harden the app and say what it does, where it runs, which provider it calls and the monthly cap. You can also paste the text into a session with that request, but without the patterns file Claude writes those parts from the rules alone.

````markdown
---
name: public-ai-app-hardening
description: Use when the user says "harden my app", "before launch", "someone could drain my API key", "add rate limits to my AI endpoint", "abuse controls", "free tier on my key", "bring your own key" or "spend cap", or is about to make an AI demo public that calls a paid AI API with the owner's key, on Cloudflare Workers, Vercel, Netlify, Cloud Run or similar. Runs one hardening round (fail-closed quotas, keyed IP hashes, a bot gate, CSP, provider terms, spend-cap arithmetic) and returns a findings table with tested patches.
---

A public app that calls a paid AI API with the owner's key is a wallet anyone can spend. Anyone with a script can call the route directly, so browser-side limits are only a courtesy. This skill runs one hardening round. It maps every paid call, audits ten areas, patches the gaps with tests, and reports what was verified.

## Inputs

Read these from the repository and the user's message:

- The app: what it does, and which routes make paid calls.
- The platform (Cloudflare Workers, Vercel, Netlify, Cloud Run, …) and its config files.
- The provider(s) and models, and whether visitors can bring their own key.
- The audience: anonymous or signed in, which countries, and any age assumptions.
- The monthly spend cap. If it's missing, ask once in one line and carry on with `MONTHLY_CAP` as a named blank in every sum.

Never ask the user to paste or screenshot a secret. Name the secret and where to set it.

## Workflow

1. **Map.** List every route that triggers a paid call (model, image, paid lookup), what one call costs at worst and who can reach it. The worst case counts max input tokens (the context window if input is unbounded), max output tokens including any thinking, and any pre-checks, retries and follow-on calls. Include routes that only read counters, such as a health check.
2. **Audit** areas A to J below. Every gap is a finding with a file and line.
3. **Patch**, P0 first: the smallest change that closes each gap, each with a test. Code patterns for the subtle parts are in `references/patterns.md`.
4. **Verify.** Run the tests and the build. Report the exact commands and results. Never report a test as passing that you did not run, and never weaken a check to make a test pass. Name what can only be checked on the deployed site.

## Areas and rules

### A. Quotas: the server is the guard; the browser only nudges

- Count shared-key calls on the server, in a store a client can't reset that increments atomically: a Durable Object, Redis `INCR` with an expiry, or a database row updated `WHERE used < limit`. Not an eventually consistent key-value store, and not localStorage.
- Keep three counters per window, charged narrowest first: the visitor's network (IPv4 address or IPv6 /64), its wider allocation (IPv4 /24 or IPv6 /48), and the whole site. The site counter is the spend cap. The allocation counter stops one cheap IPv6 block from draining the site.
- If a counter refuses, give back the charges already made. If the store errors, refuse the call (fail closed). A per-minute rate limiter in front may fail open, because the counters still cap spend.
- Refund only what the provider doesn't bill: transport errors, rejected requests, empty bodies, and blocks before any output that its docs list as unbilled. Check the docs; don't assume. Tag each charge with its window so a late refund can't credit the next one.
- Check the cache before charging: cached answers are free. Cache only shared-key answers that finished cleanly.
- Shared-key POSTs need an `Origin` header equal to the site's own origin. Refuse other origins and remove any `Access-Control-Allow-Origin: *`. A bare script usually sends no Origin; this is a cheap filter, not authentication.
- Bound every request: body size, schema and field lengths. Set max output tokens to about twice a typical answer; it sets the worst case.
- A browser-side allowance (a few free calls, a nudge, then "add your own key") is UX. A refusal from the network or site counter must not mark the browser as spent.
- Rate-limit any route that reads the counters, such as a health check that reports whether free calls are open.
- A second paid call triggered by a first (for example, an image or audio call made for an answer) needs a signed ticket (a random id and an expiry, signed with HMAC), minted only with a first call that passed every check. Allow a fixed number of uses, counted by id. Charge each follow-on call, retries included, to its own network, allocation and site counters, with a site cap sized from that service's price, and count a call that timed out as paid. Don't bind the ticket to the client's IP address, which can change between requests.

### B. Keyed hashes, never raw IPs

- Counter and limiter keys are `HMAC-SHA-256(server secret, "quota:" + network)`, truncated to 128 bits. A plain hash of an IPv4 address can be reversed by trying all 2^32. Use a dedicated secret; rotating it resets everyone's counts. No secret means fail closed.
- No raw address in storage, counter names, limiter keys or logs. IPv4-mapped IPv6 counts as IPv4; anything unparseable shares one bucket.
- Compare secrets and access codes in constant time (hash both sides, then compare every byte).

### C. Bot gate on shared-key calls only

- Use Turnstile or a similar challenge. Verify every token on the server: single use, short-lived, the hostname must match, and set a timeout. A failed or unreachable check refuses the call.
- Tell visitor failures ("try again") apart from setup errors (invalid or missing secret, hostname mismatch) in the message and the logs, so a misconfiguration is fixed instead of blamed on visitors.
- People using their own key skip it. The bot gate is what stops scripts from many networks draining the site counter.

### D. Headers and third parties

- CSP: `default-src 'self'`, plus only the bot gate's origin for script, frame and connect; `object-src 'none'`; `base-uri 'none'`; `frame-ancestors 'none'`; `form-action 'self'`. Add `nosniff`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy`. Static-file header rules don't cover API responses: set those in code.
- Self-host fonts and scripts so no visitor request goes to a third party you haven't named. Ship their licences.
- Check whether the platform injects scripts at the edge (analytics beacons) that the privacy note says you don't use. Turn the injection off, or let the CSP block it and say so.

### E. Safety filters and refusals

- Turn on the provider's harm filters or moderation where it offers them, and measure what they cost in latency. If they are too slow, run a cheap one-word classifier (answer, refuse or support) in parallel with other work, with a short timeout and a tiny max output. Tell it what to allow as well as what to refuse, and test it on a dozen borderline-legitimate and harmful requests before trusting it. State whether it fails open or closed.
- Handle the provider's block or refusal signal (a stop or finish reason, or a prompt-level block): discard everything written, title included. Offer "Go back" rather than "Try again", don't retry automatically, and refund only what A allows. Other early stops (length, other) keep the partial answer. Never cache a blocked or broken answer.
- A request that suggests self-harm gets a short reply with a helpline link, not a bare refusal.
- A decline from the cheap pre-check costs no free answer. The pre-check is still a paid call: run it on the same key as the main call, behind the bot gate and the per-minute limiter. A decline or refusal that the main model bills keeps its charge.

### F. Provider terms

- Read the provider's current API terms and usage policy, not your memory. Check the minimum age and services aimed at minors, available regions, region rules for free tiers, and whether inputs may be used for training or read by people. Quote each clause with its URL. If you can't read them now, list the exact questions and leave the gates as configuration marked unverified.
- Gate in code. The provider sees your server's region, not your visitor's, so check the visitor's country at the edge yourself (on Cloudflare, `request.cf.country`). Refuse regions the provider doesn't serve, and unknown or anonymised ones (Cloudflare reports `XX` and `T1`). Put the list, its source and the date checked in a comment, with tests.
- If the provider's free tier has its own region rules, treat a visitor's own key as free tier unless they confirm its project has billing (a checkbox sent as a header), and apply those rules by the visitor's country.
- If the terms bar minors, remove anything aimed at children (modes, sample content, wording) and say who the app is for.
- Run the API route in a region the provider serves (the platform's placement setting), not wherever is nearest to the visitor.

### G. Spend, sized with arithmetic

- Take prices from the provider's pricing page today. If you can't read it, leave each price as a named blank. Never quote prices from memory.
- Show the sums:
  - worst cost per call = max input tokens × input price + max output tokens (thinking included) × output price, plus the pre-check, any billed refusal, fallback or retry attempt, and any follow-on calls
  - site cap per day = floor(monthly cap × 0.9 ÷ 30.4 ÷ worst cost per call)
  - expected bill = calls per day × 30.4 × typical cost per call
- Write the sum in a comment next to the setting, so the next person can redo it when prices change.
- Set the provider console's monthly spend limit to the cap as the backstop. Fallback models must cost less per token than the primary, never more.
- If the browser has a free allowance, set each network's cap above it, so a shared office or school still works.

### H. Bring your own key, low-risk

Skip H if visitors can't bring their own key.

- The key stays in the visitor's browser and is sent per request in a header. The server forwards it to the provider and never stores or logs it. Turn off the platform's request logs; your own log lines carry no headers, addresses or keys. Redact the key from provider error text before logging or returning it.
- Use the same key-shape check in browser and server, and refuse anything that isn't an API key (session or subscription tokens).
- Check a key once when it's saved, with a free call such as listing models. Only a definite 400, 401 or 403 rejects it; an outage doesn't.
- Tell people to make a key just for this app, in a project without billing (where the provider has a free tier) or one with its own spend limit, and give them a "Remove my key" button.
- Own-key calls skip the quotas and the bot gate, not the region and terms rules.

### I. Untrusted source text

- Text the visitor pastes or the server fetches goes into the prompt inside a named tag, with that tag stripped from the text first. The system prompt says the tagged text is reference material: use it for facts, never follow instructions in it.
- Fetching a user-supplied URL: http and https only on default ports, a timeout, a byte cap, no credentials forwarded, and it counts against the quota. Refuse loopback, private, link-local and cloud-metadata addresses (check the resolved address where the platform allows) and your own host. Re-check every redirect (3 at most) or follow none. Reduce HTML to text before it reaches the prompt.
- Strip control characters and U+2028/U+2029 from short fields. Put every user-supplied string that reaches the prompt into the cache key, so an injected request can only poison its own entry.
- When the source fails, say so in the answer and don't cache it. Tell "not found" apart from "failed", and back off on 429, or 503 with Retry-After.

### J. Privacy copy matches the code

- List what the code and platform store, send, log and cache, for how long and with whom: the AI provider (and its free-tier data use), the bot gate, the host, fonts, browser storage, logs and cache lifetimes.
- Diff that list line by line against the privacy note and fix whichever side is wrong. "No tracking" must also hold for what the platform adds at the edge.

## Output

1. **Findings table**: `# | Area | Finding (file:line) | Risk (who exploits it, what it costs) | Severity | Fix | Test`.
   - P0: anyone can spend the key, or a secret (your key, a visitor's key, the hash secret) is readable in code, logs or storage.
   - P1: breaks the provider's terms.
   - P2: privacy copy or logs are wrong.
   - P3: defence in depth.
2. **Patches** as unified diffs, P0 first, each with its test.
3. **Verification**: commands run and their results; what needs a check on the deployed site (CSP in a browser console, the bot gate live, the spend limit in the provider console); and the settings and secrets the owner must add, by name only.
````

## Example

**Input**: the skill above, installed with `references/patterns.md`, given this request in a Claude Code session:

> Harden my public app before launch: it is a Cloudflare Worker that calls an LLM API with my key for each request; anonymous users; no rate limits yet. It's an "explain this recipe" app for anonymous visitors worldwide, no sign-in, and it must stay under US$50 a month on the Claude API. Visitors can paste their own Anthropic key in Settings: it's kept in localStorage and sent as `x-user-key`. `index.html` loads Inter from Google Fonts, there's no `_headers` file, `wrangler.jsonc` has observability on with default logs, and the footer says "We don't keep your data. No tracking." Here's the whole Worker:
>
> ```ts
> // src/worker.ts
> export interface Env { ASSETS: Fetcher; ANTHROPIC_API_KEY: string }
>
> export default {
>   async fetch(request: Request, env: Env): Promise<Response> {
>     const url = new URL(request.url)
>     if (url.pathname !== '/api/explain') return env.ASSETS.fetch(request)
>     const { recipe, recipeUrl } = await request.json<{ recipe?: string; recipeUrl?: string }>()
>     const text = recipeUrl ? await (await fetch(recipeUrl)).text() : recipe ?? ''
>     console.log('explain', request.headers.get('cf-connecting-ip'), recipeUrl ?? text.slice(0, 80))
>     const upstream = await fetch('https://api.anthropic.com/v1/messages', {
>       method: 'POST',
>       headers: {
>         'x-api-key': request.headers.get('x-user-key') || env.ANTHROPIC_API_KEY,
>         'anthropic-version': '2023-06-01',
>         'content-type': 'application/json',
>       },
>       body: JSON.stringify({
>         model: 'claude-haiku-4-5', max_tokens: 8000, stream: true,
>         system: 'Explain this recipe step by step for a beginner cook.',
>         messages: [{ role: 'user', content: text }],
>       }),
>     })
>     return new Response(upstream.body, {
>       status: upstream.status,
>       headers: { 'content-type': 'text/event-stream', 'access-control-allow-origin': '*' },
>     })
>   },
> } satisfies ExportedHandler<Env>
> ```

**Output** (trimmed: the opening, three of the twenty-two findings, the spend arithmetic and the verification):

> Your cap is US$50 a month on the Claude API, and I sized everything to that. Right now anyone with a script can spend your key without limit, and one stuffed request can cost about $0.23. I found 22 issues, 7 of them P0. The patches are below with their tests, and the tests, type check and build all pass. …
>
> | # | Area | Finding (file:line) | Risk (who exploits it, what it costs) | Sev | Fix | Test |
> |---|---|---|---|---|---|---|
> | 1 | A | `src/worker.ts:14`: every request without `x-user-key` runs on your key, and nothing counts calls on the server | Anyone with curl can loop the route. At today's worst case (row 3, $0.232 a call), about 215 calls use up $50. | P0 | Atomic Durable Object counters per 24 h: network (IPv4 or IPv6 /64) 10, allocation (/24 or /48) 30, site 88. Charged narrowest first and given back on refusal. A store error refuses the call (503). | `worker.test` "stops at the network cap", "fails closed with 503 when the counter store is down"; `quota.test` |
> | 6 | H | `wrangler.jsonc` `observability` with default logs: invocation logs record each request, and Cloudflare's docs don't say whether headers are redacted | A visitor's `x-user-key` may sit in Workers Logs for 3–7 days, readable from your dashboard | P0 | `"logs": { "invocation_logs": false }`. The Worker's own log lines carry no headers. | Own log lines: "logs neither the key, the address nor the recipe". Invocation logs: check on the deployed site. |
> | 8 | F | `src/worker.ts:11`: no region check | Visitors in unsupported regions (CN, RU, IR…) reach Claude through you, which breaches Commercial Terms D.2 | P1 | `regionAllowed(cf.country, cf.regionCode)`: 185 listed countries plus territories. Refuses XX, T1, unknown locations and the excluded Ukrainian regions. Applies to own-key calls too. | `region.test` (6); "refuses an unsupported or unknown region with 451, own key included" |
>
> …
>
> Haiku 4.5 costs $1 per million input tokens and $5 per million output tokens (https://platform.claude.com/docs/en/about-claude/pricing, read today).
>
> - Before: worst cost per call = 192,000 × $1/M + 8,000 × $5/M = **$0.232**.
> - After: worst cost per call = (8,000 + 1,200) × $1/M + 1,500 × $5/M = **$0.0167**. There is no pre-check, retry, fallback or follow-on call.
> - Site cap per day = floor(50 × 0.9 ÷ 30.4 ÷ 0.0167) = **88**. At the cap with every call at its worst, that is 88 × 30.4 × $0.0167 = $44.68 a month.
> - Expected bill = calls per day × 30.4 × typical cost per call. My estimate for a typical recipe is 1,200 tokens in and 700 out, which is $0.0047. At 40 free answers a day that's 40 × 30.4 × $0.0047 = **$5.72 a month**; at the 88-a-day cap with typical answers it's $12.57. Replace the 1,200/700 estimate with real figures from the Console's Usage page.
>
> …
>
> **Commands run in the patched tree …:**
>
> - `npx vitest run`: **8 files, 78 tests passed** (source 28, worker 18, quota 7, net 6, region 6, sse 5, turnstile 5, config 3).
> - `npx tsc --noEmit` with `@cloudflare/workers-types@5.20261019.1`: **exit 0**.
> - `npx wrangler deploy --dry-run --outdir dist` with wrangler 4.151.3: **exit 0**. Total upload 30.14 KiB. Bindings: `env.QUOTA (Quota)`, `env.RATE_LIMITER (6 requests/60s)`, `env.ASSETS`.
> - To confirm the tests have teeth, I put three flaws back one at a time. Each made exactly one test fail, and the code was then restored:
>   - logging `cf-connecting-ip` fails "logs neither the key, the address nor the recipe"
>   - failing open on a counter-store error fails "fails closed with 503…"
>   - restoring `access-control-allow-origin: *` fails "…sends no CORS header"
> - `git apply --check` of `hardening-p0.patch` against the original `src/worker.ts` and `wrangler.jsonc`: applies, and the result matches the patched `src/`.
> - While writing these, the prompt-overhead check failed (1,023 bytes against an assumed 1,000). I raised the overhead to 1,200 and redid the sums ($0.0165 → $0.0167, 89 → 88 a day) rather than loosen the check.
>
> **Not run:**
>
> - The browser code (`explain-client.js`, the Turnstile widget, the refusal display) was not run.
> - The Durable Object, rate limiter and Cache API were tested only against in-memory fakes, not on Cloudflare's runtime.
> - No real Turnstile or Anthropic calls were made.

The model priced the original Worker's worst call at $0.232 (192,000 input and 8,000 output tokens), capped one call at $0.0167 and took the 88-a-day site cap from the skill's formula. When its own overhead test failed, it raised the assumed overhead and redid the sums instead of loosening the check, and it listed what it had tested only against in-memory fakes.

## Why it works

- **The server is the guard, and the site counter is the spend cap.** A browser counter resets when someone clears storage, so it can only nudge. Three nested counters in an atomic store are charged narrowest first: the network counter stops one visitor, the allocation counter stops one cheap IPv6 block rotating through its /64s, and the site counter caps the bill. The bot gate keeps a script spread over many networks from using it up. Failing closed when the store errors means an outage can't turn into unmetered spend. Refunding only what the provider doesn't bill means its errors don't use up a visitor's allowance, and a billed decline can't be looped for free.
- **Keyed hashes, grouped by network.** IPv4 has only 2^32 addresses, so a plain SHA-256 of one can be reversed by brute force; an HMAC under a server secret can't. Grouping IPv6 by /64 and /48 matters because one household or one rented server can rotate addresses within its block for free.
- **Terms become gates, and the cap is a sum you can check.** The provider sees your server's location, not your visitor's, so region rules it can't apply become a gate in code you own, with the source and date beside the list; an age rule becomes a stated audience. Your server can't tell whether a visitor's own key is billed either, so where the provider has a free tier, the key gets free-tier rules unless the visitor says otherwise. Writing the cap as a sum over today's prices (never remembered ones) makes it auditable. Max input and output tokens bound the worst case, and cheaper-only fallbacks stop a fallback from doubling the bill.
- **"Never stored or logged" has to be true at the platform level.** Platform request logs can capture headers and addresses unless you turn them off, and provider error text can echo a key. A key from a project without billing, or a workspace with its own spend limit, turns a leak into a nuisance instead of a bill. Diffing the privacy note against the code catches drift, such as an edge-injected analytics script behind a "no tracking" claim.

## Variations

- **No Durable Objects.** In Redis, `SET k 0 EX <ttl> NX`, then `INCR` (or one Lua script), and `DECR` on a refusal. In Postgres or SQLite, `UPDATE … SET used = used + 1 WHERE id = ? AND used < ? RETURNING used`. Don't use an eventually consistent key-value store for counters, because parallel requests overspend it.
- **One area at a time.** When you change provider or model, rerun E (filters, refusals, what's billed), F (terms), G (spend) and H (key shape, key check). Rerun J (privacy copy) whenever you add a third party.
- Generalised from a public AI app.
