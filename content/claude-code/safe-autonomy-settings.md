---
title: "Allow, ask, deny: Claude Code permissions and a SessionStart status hook"
summary: "Sort a repo's commands by what they can break: routine work runs unprompted, merges wait for an Allow tap, pushes to main and deploys are refused; a start hook flags a broken toolchain."
category: claude-code
tags: [security, agents, ops]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: intermediate
use_as: claude-code
---

## The prompt

Run it in a Claude Code session at the root of the repository. It writes two files and leaves the commit to you.

```text
Set up safe autonomy for Claude Code in this repository. Write .claude/settings.json (permission rules and a SessionStart hook) and the hook script, so that routine work runs without prompts, outward-facing or hard-to-undo steps wait for a person's Allow, and destructive steps are refused.

Repo: {{repo_description}}
Every way production gets deployed: {{deploy_paths}}
Protected branch: {{protected_branch}}
Other shared branches: {{other_shared_branches}}

1. Inspect, read-only.
Read the manifest and its scripts (package.json, Makefile, pyproject.toml or similar), every CI workflow, the deploy config, the README, CLAUDE.md and any existing .claude/settings.json. List each command the repo uses to restore dependencies, build, test, lint, format, type-check, run locally, release and deploy, and the toolchain those commands need: runtime version, CLIs, browsers. If settings.json exists, merge into it and keep its other keys.

2. Sort every command by what it can break.
- allow: routine and reversible, inside the working tree or on a work branch. Each build, test, lint, format, type-check and dev script by name; restoring dependencies exactly from the lockfile (npm ci or equivalent); git status, diff, log, show, add, commit, fetch, switch; pushing a work branch; opening and updating a pull request from it, reading PRs and checks, commenting (gh pr create, edit, view, checks, comment, and a GitHub MCP server's equivalents by exact tool name); code search. In the pull request flow, only the merge asks.
- ask: outward-facing or hard to undo, so the person's Allow tap is the decision. Merging a pull request in any form (gh pr merge, and a GitHub MCP server's merge and auto-merge tools if this session has one, by exact name or a tool-name glob such as `mcp__github__*merge*`); committing or writing files through the GitHub API, because the push rules can't see its branch (a GitHub MCP server's push_files, create_or_update_file and delete_file; `gh api` calls that write contents or merge); pushing tags, or pushing to the other shared branches; adding, removing or upgrading a dependency; deleting a branch, local or remote; discarding uncommitted work (git checkout -- <path>, git restore, git clean, git stash drop).
- deny: destructive, or skips review. Pushing to {{protected_branch}}; force pushes; git reset --hard; the direct production deploy and the CLI behind it, however it is called.

3. Write the rules in current syntax.
- Prefix rules are `Bash(<command> *)`. The space before `*` is part of the rule (`Bash(ls *)` doesn't match `lsof`; `Bash(ls*)` does). A trailing ` *` also matches the bare command, but only when it is the rule's only `*`: `Bash(git push *)` covers `git push`; `Bash(git push * -f *)` doesn't cover `git push origin x -f`. `Bash(<command>:*)` is an older spelling of the same rule; use one form throughout.
- Put the `*` after the subcommand: `Bash(git log *)`, never `Bash(git *)`.
- Allow scripts by name (`Bash(npm run build *)`), never `Bash(npm run *)`: a broad rule silently allows any script added later, a deploy script included.
- Claude Code checks deny first, then ask, then allow, whatever the specificity. So allow a family and carve out its dangerous members: allow `Bash(git push *)`, deny `Bash(git push * {{protected_branch}})`. Never put a broad pattern in ask that also covers a routine allowed command.
- For each allow rule, name the worst command it matches. If that is destructive, narrow the rule or add the ask or deny rule that catches it: `Bash(git branch *)` also matches `git branch -D`.
- Cover every spelling in ask and deny. Push to {{protected_branch}}: `<remote> {{protected_branch}}` last or followed by more arguments, `<ref>:{{protected_branch}}`, `refs/heads/{{protected_branch}}`, and `--all` or `--mirror`, which push it too. Force: `--force`, `--force-with-lease`, `-f`, a `+` before a refspec. Git accepts flags anywhere, so cover each flag in every position: a long flag as `<cmd> *--hard*`, a short one first, in the middle and last: `<cmd> -f *`, `<cmd> * -f *`, `<cmd> * -f` (the same for `-d` and `-D`). Deploy: the CLI directly, through npx or equivalent, and through the package script.
- Check every ask and deny rule both ways: one command it must stop, with each flag last as well as first, and one routine command it must let through (a push to a work branch whose name contains {{protected_branch}}).
- Claude Code splits commands on `&&`, `;` and `|` and strips wrappers such as `timeout` and `nohup` before matching. It also strips a leading `VAR=x` assignment: for deny and ask rules any variable, for allow rules only a known-safe one such as `NODE_ENV`. Ask and deny rules hold in every permission mode. But rules match the command text, not the program: `git -C . push origin {{protected_branch}}`, `bash -c "…"`, `env …` and absolute paths aren't refused, and unless an allow rule matches they get the mode's normal handling (a prompt in default mode). A bare `git push` while on {{protected_branch}} pushes to it (the hook's warning covers that case). Rules are guard rails for the usual spelling; the real boundary is branch protection on the remote and deploy credentials the session doesn't hold.

4. Add the SessionStart hook.
Register it in settings.json with no matcher, so it runs on every start, including resume, /clear and compaction, when the earlier status has left the context:
"hooks": {"SessionStart": [{"hooks": [{"type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh\"", "timeout": 30}]}]}
Claude Code adds the script's stdout to Claude's context.

Write .claude/hooks/session-start.sh so that it:
- Prints one status line: the repo name, the runtime version against the version the repo requires, each tool the checks need with its version or MISSING, whether dependencies are installed, the current branch, uncommitted files and unpushed commits.
- Prints open work in at most 3 lines: what is in progress here (drafts or TODOs the repo tracks in files, uncommitted and unpushed changes) and where the rest lives ("open PRs: check GitHub"), without calling the network.
- Prints a warning line only when something is wrong: a capitalised tag, what not to do, what to do instead. For example `NODE TOO OLD: 18 found, 22 required; don't claim tests passed; say they couldn't run.`, `ON {{protected_branch}}: create a work branch before the first commit.`, `DEPS MISSING: run npm ci before build or test.`
- Never fails or stalls the session: guards every probe (`2>/dev/null || echo MISSING`), makes no network calls, installs and changes nothing, finishes in a few seconds and ends with `exit 0`.
- Runs from any directory: `cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0`.
- Prints nothing secret: no environment dumps, tokens or config values.

5. Check, then reply.
Don't commit. Parse settings.json (jq or node), run `bash -n` on the script, run it once and fix anything that fails. Reply with:
- The hook's output from that run.
- A table of the ask and deny rules, grouped: group | rules | a command the group stops | a routine command it lets through.
- Gaps: what the rules can't stop, each marked "runs unprompted" (an allow rule matches it) or "prompts". Include an edit to an allowed script or to CI, which then runs through an allowed command, and say that edits under .claude/ prompt in default and acceptEdits modes but not in auto mode (a classifier decides) or bypassPermissions. End with the settings outside the repo that do stop them (branch protection, deploy credentials).
- Up to 4 lines to add to CLAUDE.md: what the hook prints; that a warning line overrides the plan; "If a person denies an ask prompt, stop and say so; never reach the same result another way."; and "Never edit .claude/settings.json, the hook, CI or an allowed script to get past a rule, prompt or warning; propose that change in its own PR."
```

## Example

**Input**: run at the root of a small static-site repo: Markdown entries under `content/` (one marked `draft: true`), validate, build and test scripts in `scripts/`, `wrangler.jsonc`, a CI workflow that runs `npm ci`, validate, test and build, and `package.json` scripts `build`, `validate`, `test`, `dev` (build, then `wrangler dev`) and `deploy` (build, then `wrangler deploy`). The session starts on `main` with one uncommitted change and no `node_modules`.

- `repo_description`: A Node 22 static site that builds a public prompt library from Markdown files; npm run validate, test, build and dev.
- `deploy_paths`: Cloudflare Workers Builds deploys every push to main. `npm run deploy` (wrangler deploy) also deploys straight from the working tree.
- `protected_branch`: main
- `other_shared_branches`: none

**Output** (trimmed to the hook's output from the test run, five of the twelve rule groups, four of the eleven gaps and two of the four settings outside the repo):

```text
Status: prompt-library | node 22.23.4 (needs >=22) | npm 10.9.9 | git 2.43.0 | gh 2.89.0 | wrangler MISSING | deps MISSING | branch main | uncommitted 1 file(s) | unpushed 0 commit(s) (to origin/main)
In progress: content/claude-code/test-plan.md (draft, TODO)
Local changes: uncommitted: M content/claude-code/test-plan.md; unpushed: 0 commit(s) (to origin/main)
Elsewhere: open PRs, review comments and CI runs: check GitHub (gh pr list, gh pr checks); not checked here, no network.
DEPS MISSING: run npm ci (not npm install) before validate, test, build or dev; until then don't claim they passed.
ON main: create a work branch (git switch -c <name>) before the first commit; never push main, it deploys production.
```

> **Ask and deny rules**
>
> | Group | Rules | A command it stops | A routine command it lets through |
> |---|---|---|---|
> | **ask:** Merge or approve a PR | `Bash(gh pr merge *)`, `Bash(gh pr review *)`, `mcp__github__merge_pull_request`, `mcp__github__enable_pr_auto_merge`, `mcp__github__pull_request_review_write` | `gh pr merge 12 --squash --auto`; `gh pr review 12 --approve` | `gh pr checks 12 --watch`; `gh pr comment 12 --body "…"` |
> | … | | | |
> | **deny:** Push to main | `Bash(git push * main)`, `Bash(git push * main *)`, `Bash(git push *:main)`, `Bash(git push *:main *)`, `Bash(git push *refs/heads/main)`, `Bash(git push *refs/heads/main *)`, `Bash(git push *--all*)`, `Bash(git push *--mirror*)` | `git push origin main`; `git push origin main -u`; `git push origin HEAD:main`; `git push origin :main`; `git push origin x:refs/heads/main`; `git push origin --all` | `git push -u origin fix/main-nav`; `git push origin main-fix`; `git push origin HEAD:main-fix`; `git push origin domain-main` |
> | **deny:** Force push | `Bash(git push *--force*)`, `Bash(git push -f *)`, `Bash(git push * -f *)`, `Bash(git push * -f)`, the same three for `-fu` and for `-uf`, `Bash(git push * +*)` | `git push --force-with-lease origin x`; `git push origin x --force`; `git push -f origin x`; `git push origin x -f`; `git push origin x -uf`; `git push origin +x` | `git push origin fix-f`; `git push origin feat/c++` |
> | **deny:** Hard reset | `Bash(git reset *--hard*)` | `git reset --hard HEAD~1`; `git reset HEAD~1 --hard` | `git reset --soft HEAD~1` (not refused, but it prompts because no allow rule matches) |
> | **deny:** Production deploy and the wrangler CLI | `Bash(npm run deploy *)`, `Bash(npm * deploy*)`, `Bash(pnpm * deploy*)`, `Bash(yarn deploy*)`, `Bash(yarn * deploy*)`, `Bash(bun * deploy*)`, `Bash(wrangler *)`, `Bash(npx *wrangler *)`, `Bash(npx *wrangler@*)`, `Bash(npm exec *wrangler*)`, `Bash(npm x *wrangler*)`, `Bash(pnpm *wrangler*)`, `Bash(yarn *wrangler*)`, `Bash(bunx *wrangler*)`, `Bash(bun *wrangler*)`, `Bash(*/.bin/wrangler *)`, `Bash(*/bin/wrangler *)`, `Bash(*/wrangler.js *)` | `npm run deploy`; `npm -s run deploy`; `npx -y wrangler@4 deploy`; `./node_modules/.bin/wrangler deploy`; `wrangler versions deploy`; `bunx wrangler deploy` | `npm run dev` (it runs `wrangler dev` inside the script); `npm run build`; `git switch -c deps/wrangler origin/main` |
> | … | | | |
>
> **Gaps: what the rules can't stop**
>
> - **Editing an allowed script or CI, then running it** (runs unprompted). For example, adding `wrangler deploy` to `scripts/build.mjs`, to the `build` or `test` script, or to a `prebuild` script, then running `npm run build`. The allow rule matches and the deploy happens inside the script. An edited `.github/workflows/validate.yml` runs when the allowed `git push` of a work branch triggers a PR build. `npm ci` also runs dependency install scripts. The edit itself only prompts in default mode; it goes through without a prompt in acceptEdits, auto and bypassPermissions.
> - **Editing `.claude/settings.json` or the hook:** this prompts in default and acceptEdits modes, but not in auto mode (a classifier decides) or bypassPermissions.
> - **Bare `git push`, or `git push origin HEAD`, while on main** (runs unprompted). This pushes main and deploys production. Only the hook's `ON main` warning covers it.
> - **Other ways of writing the same command** (prompts): `git -C . push origin main`, `bash -c "npm run deploy"`, `env npm run deploy`, `sh -c …`, `xargs …`, `/usr/bin/git push origin main`. No allow rule matches them. They prompt in default mode, the classifier decides in auto mode, and they run in bypassPermissions.
> - …
>
> **Settings outside the repo that do stop these:**
> - **GitHub ruleset on `main`:** require a pull request with the Validate check passing and an approval from someone other than the author, block force pushes and deletion, and allow no bypass for admins or the session's account. This rejects every way of pushing to main, and any merge through the API by the agent.
> - …
> - **Cloudflare deploy credentials:** keep them out of the session (no API token, no `wrangler login`), so `wrangler deploy` fails however it is called. Keep Workers Builds' production branch set to `main` only.
> - …

The hook turned the starting state (on `main`, no `node_modules`) into two warnings that say what to do first. Each rule group names a command it stops and a routine one it lets through, such as pushes to work branches whose names contain `main`, and Claude also ran 207 commands through a matcher that follows the rule syntax; none landed in the wrong group.

## Why it works

- **Sorted by consequence, not by tool.** Git lands in all three lists: `git commit` is allowed, `git branch -D` asks, `git push --force` is refused. Routine, reversible work runs unprompted, with scripts allowed one by one so a deploy script added later isn't; the agent doesn't stall, and people stop approving prompts without reading them. Outward-facing steps wait for a tap, commits through the GitHub API included; since opening, updating and commenting on a pull request run unprompted, the merge's Allow prompt becomes the release button. Destructive steps are refused, so a tired "yes" can't happen.
- **Precedence does the carving.** Claude Code checks deny, then ask, then allow, whatever the specificity, so a broad allow with narrow deny rules is safe for every spelling those rules list, in every position, and a broad ask rule would swallow routine work. Testing each rule on one command it must stop and one it must let through catches both holes and false positives.
- **Guard rails, not the wall.** Rules match the command text, so `git -C . push origin main` isn't refused; it falls back to a normal prompt. The prompt makes Claude list such gaps, say which would run unprompted, and name the real boundary (branch protection, deploy credentials). Its CLAUDE.md lines cover what rules can't: a denied prompt means stop, not find another route, and a rule, hook or allowed script changes only in its own PR.
- **A start hook that turns environment gaps into instructions.** Plain stdout goes into Claude's context at every session start, including `/clear` and compaction. A missing runtime or missing dependencies print a warning not to claim the checks passed, so an agent that couldn't run a check doesn't report it as passing; being on the protected branch prints what to do first. The hook never fails, calls no network and changes nothing (in the test it took 0.16 s and left `git status` unchanged), so it is safe to run every session.

## Variations

- **Cloud sessions only.** Start the script with `[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0` when developers' own machines don't need the status.
- **Long checks.** If a routine check (browser QA, a full test suite) runs past the 2-minute default Bash timeout, add `"env": {"BASH_DEFAULT_TIMEOUT_MS": "300000", "BASH_MAX_TIMEOUT_MS": "900000"}` to the same file.
- **Keep secrets away from Claude's file tools.** Add `Read(./.env)`, `Read(./.env.*)` and `Read(./secrets/**)` to the deny list; for a hard boundary, enable the sandbox.
- **Surface a status the repo records.** If CLAUDE.md keeps a status line (say, `Status: staging is down until the migration lands`), have the hook print it with `grep -m1 '^Status:' CLAUDE.md`, so every session starts from the current state.
- **A publishing pipeline.** [Publish from your phone: checkpoints, a facts gate and a one-tap merge](https://prompts.helikos.dev/p/checkpointed-publish/) uses these rules to make the merge's Allow tap the publish button.
- Generalised from a blog published through pull requests.
