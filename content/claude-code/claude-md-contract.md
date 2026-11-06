---
title: Write CLAUDE.md as a short, checkable contract from the repo's scripts and CI
summary: Claude Code reads the repo's scripts, CI and docs and writes a short CLAUDE.md in which every rule cites a source and can be checked in review.
category: claude-code
tags: [claude-md, agents, review]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: beginner
use_as: claude-code
---

## The prompt

Run it in a Claude Code session at the root of the repository. `/init` describes the repo; this writes rules with a source for each. It writes the files and leaves the commit to you.

```text
Write this repository's CLAUDE.md as a contract: a short list of rules that an agent can follow and a reviewer can check. Inspect the repo before you write a line, and propose rather than invent: every rule must come from a file in this repo or from the owner's notes below.

What the repo is for (if blank, take it from the README): {{repo_purpose}}
Owner's rules and settled decisions (may be blank): {{extra_rules}}
AI tools that work in this repo (if blank: Claude Code only, unless other tools' rules files exist): {{ai_tools}}

1. Inspect, read-only.
Read the README, CONTRIBUTING and docs/; any roadmap, backlog or design doc; the manifest and its scripts (package.json, Makefile, pyproject.toml or similar); every CI workflow; the scripts/ folder, including the errors each script prints; .gitignore and CODEOWNERS; any CLAUDE.md or AGENTS.md (nested ones too) and .claude/rules/; other agents' rules files (.cursor/rules/, .cursorrules, .github/copilot-instructions.md, GEMINI.md, .windsurf/rules/, .windsurfrules, .clinerules); and the last 50 commit messages, looking for fixes and reverts. Note the source path of every fact you use.

2. Write these sections, in this order. Leave a section out only when the repo has nothing for it.

Title: the repo name as the H1. Under it, one line: what this repo is. Add what it is not when that is a likely mistake ("a docs site, not an app server"). If CODEOWNERS, the README or the owner's notes say who approves decisions and hard-to-undo actions, name them; the rules call that person "the owner".

## Source of truth
Table: Topic | File | Rule. One row wherever two places could disagree: spec and code, config and docs, generated output and its source, a copy and its original. The rule says which one wins and what else changes in the same commit (for example, a changelog entry in the design doc). If there is a roadmap or backlog, give it a row too: new work comes from the stage it marks as current, and an item is checked off in the commit that completes it.

## Layout
Where code goes: one line per folder Claude writes to or must avoid, with any invariant the repo states for it ("lib/parsers/: no network or file I/O"). Link to longer docs; don't copy them.

## Hard rules
Cross-cutting invariants the repo states or its tests enforce: purity or immutability, where data lives, which kinds of change require a new test and which named tests must stay green, and any dependency major version whose API differs from common examples (name the removed API and its replacement). Version gotchas with no source go to Proposed rules.

## Commands
Exact commands copied from the manifest or CI, each with a short comment. Mark the ones that must pass before any push: at least everything CI runs on a pull request. Never list a command you did not find.

## Never
- Paths never to edit by hand: generated output, vendored code, licences, shared templates, anything another system owns.
- Actions that are hard to undo, taken only when the owner asks for that exact action and names the target. List the ones this repo can do, such as pushing or merging to the default branch, deploying, force-pushing, deleting or taking down anything. For each, give the exact command (with any confirmation flag), the check that proves it worked, and what the owner gets instead if a tool refuses it.
- If the repo uses secrets: never commit one, never ask anyone to send one in chat (typed or as an image), and say where secrets live instead.

## When something fails
One line per known failure: "If <exact error text or exit code>: <recovery step>." Take them from script error messages, CI steps, README troubleshooting and fix commits. Include slow or flaky steps that pass on a second attempt: say whether a retry is safe, and have Claude warn the owner when a delay is normal.
- Status: name the command that shows status, so Claude looks it up itself rather than asking the owner to run something and report back. If the repo has none, say so and put a candidate under Proposed rules.
- Done: after a push or deploy, run that status or watch command (state its timeout) until it reports the deployed URL or the step that failed, and report that, not "pushed".
- Owner steps: where only the owner can act (a cloud console, a shell Claude can't reach), hand over every command in one block plus the single step only they can take, then confirm the outcome with read-only access; don't ask them to send back output, screenshots or secrets.

## Settled decisions (ask first)
Choices that look open but are settled: stack, data formats, names or URLs others link to, public interfaces, numbers the owner picked. Then list what the owner has said may change freely, so Claude doesn't ask about it.

## Open questions
- Record each unclear requirement or design point as a question in the roadmap; if the repo has none, raise it in your reply or the pull request description. Keep going on the settled parts, and don't fill the gap with a rule of your own.
- When the owner answers, move the question under an "Answered" heading with the answer and date, note it as temporary if the owner says so, and add it to Settled decisions in the same commit.

Last line of the file: "Change this file in the same commit as any change to a command, path or rule it names."

3. Rules for every line.
- One imperative rule per line, naming a path, a command or an observable result. Give a reason in one clause only where the rule would look arbitrary ("CI caches on the lockfile, so never edit it by hand").
- Every rule is checkable from a command's exit code, a path in the diff or a file's content. Rewrite or cut anything like "write clean code", "be careful" or "follow best practices".
- Keep the file under 80 lines and about 800 words, with no line over about 160 characters. It loads into every session, so move step-by-step procedures into docs or a skill and link them with a plain path or Markdown link, not @ (an @ import loads the whole file into every session). Put rules for one folder in .claude/rules/<topic>.md with paths: frontmatter, so they load only for matching files.
- If a CLAUDE.md or AGENTS.md exists, keep every rule that is still true, fix those that point to commands or paths that no longer exist, and list each change. Fold rules from other tools' files into the contract or list them under Proposed rules; don't delete those files.
- If more than one AI tool works here, write the contract to AGENTS.md, with one short section per tool-specific task. Make CLAUDE.md start with @AGENTS.md alone on its first line (punctuation touching the path breaks the import), followed only by rules just for Claude Code.

4. Check. Run each must-pass command once if it only reads, or writes ignored build output; never install, deploy, publish or push. If dependencies aren't installed, mark those commands "unverified: dependencies missing". Fix any command you copied wrong. Report any that fail on their own; don't fix the code.

5. Write the files; don't commit. Then reply with three lists:
- Sources: each section and the files it came from.
- Proposed rules: rules you think belong but have no source for, each with your evidence, plus, for each hard-to-undo action, the permission deny rule or PreToolUse hook that would enforce it. Keep them out of the file until the owner agrees.
- Questions: what you could not determine.
```

## Example

**Input**: run at the root of a small static-site repo: Markdown entries under `content/`, a validator and a shared loader in `scripts/`, a build script, `site.config.json`, `CONTRIBUTING.md` and one CI workflow. The run was read-only, so the file was written outside the repo, the commit-history scan was skipped and `npm run build` was not run. Values:

- `repo_purpose`: A static site that builds a public library of tested prompts from Markdown files.
- `extra_rules`: Ask before adding a category or a frontmatter field. Never edit LICENSE or LICENSE-CONTENT.
- `ai_tools`: Claude Code only

**Output** (trimmed to two of the five Source of truth rows, two Hard rules, and parts of Never and When something fails from the 74-line file; then lines from the reply):

```markdown
## Source of truth
| Topic | File | Rule |
|---|---|---|
| Entry rules | `scripts/content.mjs`; categories, labels: `site.config.json` | Win; update `CONTRIBUTING.md`, `TEMPLATE.md`, `README.md` in the same commit. |
| Copies | `staleAfterMonths` (`site.config.json`), `MAX_OPEN_URL` (`scripts/build.mjs`) | Keep `STALE_MONTHS` and `MAX_OPEN_URL` in `site/app.js` equal. |
…

## Hard rules
- Never write or edit an `## Example` output yourself: it is real, trimmed output of the prompt on `model_tested`.
…
- marked is v15: renderer overrides take a token object, `link({ href, title, tokens })`, not `(href, title, text)`.
…

## Never
- Edit `LICENSE`, `LICENSE-CONTENT`, `dist/`, `.wrangler/` or `node_modules/`; commit `.env*` or `.dev.vars*`.
…
- Act only when the owner asks for that exact action and names the target:
  - Push, merge or force-push to `main` (deploys production). Proof: Validate passes on `main`; the live page changed. Blocked: give the owner the PR link.
  - `npm run deploy` (`wrangler deploy` to production, skipping CI). Proof: the change is live. Blocked: hand the owner that command.
  - Delete or rename an entry or skill (removes `/p/<slug>/`, `/skills/<slug>.zip`). Proof: validate passes; no file names the old slug.

## When something fails
- Status: no status script; read the PR's Validate check and the Preview URL that Workers Builds posts on it.
- Done: after a push, report that Preview URL or the failing check (CI times out at 10 minutes), not "pushed".
- If `N problems. See CONTRIBUTING.md for the entry format.` (exit 1): fix each `error` line in the file it names; re-run.
…
- If `"date_tested" <d> is in the future.`: the check uses today's UTC date; set the UTC date of the real run.
…
```

> **Sources**
> - …
> - **Hard rules**:
>   - …
>   - The marked rule comes from `package.json` (`^15.0.12`), `node_modules/marked/lib/marked.d.ts` line 194 and `scripts/build.mjs` lines 46–47.
> …
>
> **Proposed rules** (left out of the file until you agree)
> - **Status command.** Use `gh pr checks <n> --watch` with a 10-minute timeout to match the CI job, and … The evidence is that the README only says the Preview URL is posted on the PR; there is no script to check it.
> - …
> - **Node 22.2 or later.** `scripts/build.mjs` imports `crc32` from `node:zlib`, which first shipped in Node 22.2. `package.json` `engines` only says `>=22`.
> - …
> - **Enforcing the hard-to-undo actions** in `.claude/settings.json`. Use `ask` instead of `deny` if you want to approve each one at the prompt:
>   - **Push, merge or force-push to `main`:** deny `Bash(git push origin main:*)`, `Bash(git push origin HEAD:main:*)`, `Bash(git push --force:*)`, `Bash(git push -f:*)`, `Bash(gh pr merge:*)` and `mcp__github__merge_pull_request`.
>     - Prefix rules miss forms like `git push origin main --force`, so also add a PreToolUse hook on `Bash`.
>   - …
>
> **Questions**
> - …
> - **Local or UTC date for `date_tested`?** `CONTRIBUTING.md` says "the day you ran it", but the validator compares against today's UTC date. A run in a timezone ahead of UTC can fail as "in the future".
> - …
> - **Which `MAX_OPEN_URL` wins?** No file says whether the copy in `scripts/build.mjs` or the one in `site/app.js` is authoritative.

Each hard-to-undo action in the file carries a proof check, and the reply turns each one into a deny rule or hook. The marked rule has a source and went into the file, while the Node 22.2 floor, which no file states, went to Proposed rules, as did a status command because the repo has none.

## Why it works

- **Inspect first, cite every line.** From habit, Claude writes a plausible CLAUDE.md: `npm test` where the repo runs `make check`, rules nobody agreed to. A source for each line, and a separate "Proposed rules" list for everything else, keeps the file true and leaves anything new for the owner to approve. CLAUDE.md guides but doesn't enforce, so the reply also proposes a deny rule or hook for each hard-to-undo action.
- **Checkable rules in a small budget.** A rule that names a path, a command or a visible result can be followed by an agent and checked in review. "Be careful" can't, and it still costs context in every session. A word and line-length cap stops rules being packed into 300-character lines that a line count misses. Procedures sit behind plain links (an @ import would load them anyway) and folder rules in `.claude/rules/`, so the contract stays short enough to read in full.
- **The sections hold what code can't show.** Code shows how things work, not which folder is generated, which invariant a test guards, which library version broke the usual example, or which action can't be undone. Exact error text lets Claude match a failure to its fix. An exact command with its proof check, a "done" that means the deployed URL, and one block of commands for owner-only steps let Claude finish and check the work itself. "Ask first" plus a list of what may change freely stops both silent redesigns and needless questions.
- **Gaps become questions, and the file changes with the code.** An unclear point logged in the roadmap stays a visible question, not an invented rule that later passes for a decision; once answered, it moves to Answered and into Settled decisions in one commit. Updating CLAUDE.md in the same commit as the command or path it names keeps it from going stale.

## Variations

- **Several AI tools.** Set `ai_tools` to the list ("Claude Code, Cursor and an image generator"). The contract moves to AGENTS.md, and non-coding tools get their own short section, such as "Adding images": where files go, how to name them, the check to run. CLAUDE.md becomes `@AGENTS.md` alone on its first line plus any Claude-only rules: an @ path followed by punctuation is not imported, so a sentence such as "Agents: see @AGENTS.md." loads nothing.
- **Audit instead of rewrite.** Replace step 5 with: "Don't edit. For each existing rule say keep, fix or cut, with the reason, then list the missing sections."
- **Contract plus skill.** For a long multi-step workflow (set up, build, release, confirm it is live), put the steps in a skill and start CLAUDE.md with "Step-by-step work: use the <skill> skill. These rules always apply:", then list only the rules.
- Generalised from a deployment repo and a game prototype.
