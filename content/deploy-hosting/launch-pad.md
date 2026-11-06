---
title: "Build a launch pad: one push gives an app its own repo, Worker and subdomain"
summary: Claude Code builds a monorepo where pushing one app folder makes a GitHub Action create its repo, deploy it to its own subdomain and wire auto-deploy, refusing anything it didn't create.
category: deploy-hosting
tags: [deploy, github-actions, cloudflare, claude-md, skills]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: advanced
use_as: claude-code
---

## The prompt

Run it in a Claude Code session at the root of a new, empty, private repository in the org that will own the apps. App code lives on its branches, so a public launch pad would publish private apps. Claude writes the pipeline; you merge it into main, add the secrets and GitHub Apps, then ship the first app from a branch.

```text
Build a launch pad in this repository: a monorepo where a Claude Code session ships a new web app by pushing one folder.

GitHub org that will hold only app repos: {{github_org}}
Apps live at: https://<name>.{{domain}}
Hosting: Cloudflare Workers with static assets, one custom domain per app, Workers Builds for auto-deploy
App templates: {{templates}}
Public app directory (repo, JSON file and the fields of one row, or "none"): {{directory_repo}}

The contract: when apps/<name>/ is pushed on any branch except main, a GitHub Action
1. creates the repo {{github_org}}/<name> and pushes the folder, with its history, to that repo's main;
2. deploys it to https://<name>.{{domain}};
3. connects Workers Builds, so pushes to the app repo's main deploy production and other branches get Preview URLs;
4. adds a row for it to the app directory, if there is one.

Why an Action: in the cloud, an agent session can only push its own branch; it has no way to create repos or call the Cloudflare API. CI keeps the tokens as repository secrets and runs every privileged step. Local sessions go through it too, so there is a single pipeline to debug.

Write these files. Above each check that isn't obvious, add a one-line comment saying what it prevents.

1. launchpad.json: owners keyed by org (domain, the name of the org's PAT secret, the directory repo, file and row fields if any), the default owner, and the Cloudflare account ID (not a secret). Key it by org so a second org can be added later.

2. templates/<variant>/ for each template, using the placeholders __APP__, __HOST__, __TITLE__ and __COMPAT_DATE__. Each one carries its wrangler.jsonc (Worker named __APP__, one custom-domain route for __HOST__, static assets from the build output, an empty "previews": {} block), a package.json with wrangler ^4.135.0 or later in devDependencies, and a .gitignore covering node_modules, build output, .wrangler and .dev.vars*. Without the previews block, `wrangler preview` fails every non-main build.

3. apps/<name>/ship.json, the manifest: owner, visibility (private by default), host, variant, description, plus the directory's fields. A repo with ship.json at its root is one the launch pad created; every script uses that as its ownership test. apps/ exists only on branches; main never holds an app.

4. scripts/new-app.sh <name> [--static] [--public] [--title "Title"]
   - Accept 1-63 lowercase letters, digits and single hyphens, with no hyphen at either end. It is the repo name, the Worker name and the subdomain.
   - Stop if apps/<name> exists.
   - Copy the template and fill the placeholders. Strip quotes, backticks, backslashes, $ and angle brackets from the title so it is safe in TSX, HTML and JSON.
   - Write ship.json with an empty description.
   - Prove it: install, build and dry-run the deploy. A broken template fails here, not in CI.
   - Print the next steps: build inside apps/<name>, fill in the description, build, commit, push, run scripts/watch.sh.

5. .github/workflows/ship.yml
   - Trigger on push to any branch but main, paths apps/**, and on workflow_dispatch with an `app` input, for re-runs and for a push that started no run.
   - permissions: contents: read. One concurrency group per ref with cancel-in-progress: false, so a second push never cuts a deploy off halfway.
   - A detect job runs scripts/detect-apps.sh with github.event.before and the default branch, and outputs a JSON array. When before is all zeros or not in the history (a new branch, a force-push), diff against the merge-base with the default branch. List only folders that still have ship.json, so deleting an app doesn't ship it. Skip the ship job when the array is empty. On dispatch, check that app is a valid name and that apps/<app>/ship.json exists on the branch before shipping it.
   - A ship job per app: matrix, fail-fast: false, a timeout. Check out with fetch-depth: 0 (the subtree split needs history) and persist-credentials: false. Run `scripts/ship.sh build <app>` in a step with no secrets, because it runs the app's own npm scripts. Pass the secrets only to the next step, `scripts/ship.sh deploy <app>`.

6. scripts/ship.sh build|deploy <name>
   build (no secrets): check wrangler.jsonc names the Worker <name> and has exactly one route, a custom domain for <name>.{{domain}} (a second route would let the deploy take over a hostname the refusals never checked). Then npm ci (npm install if there is no lockfile), build, and dry-run the deploy.
   deploy: read-only until every check passes, then write in this order.
   a. Credentials. Verify the Cloudflare token and the PAT with one call each. On failure, name the secret and the scopes it needs.
   b. Refusals. Fail closed, before the first write. An API error is a failure, never "free".
      - Repo: 404 is absent. 200 with ship.json at its root is ours. 200 with no commits (409 on the commits list) is empty and usable. Anything else is foreign: stop and say to pick another name.
      - A Worker named <name> that doesn't serve <name>.{{domain}}, when the repo isn't ours: stop.
      - <name>.{{domain}} already served by a different Worker: stop.
      - The hostname isn't on any Worker but has DNS records in the zone (an old CNAME to a previous host): stop and print the records.
      These exist because wrangler deploy, run non-interactively, silently takes over a custom domain or DNS record that something else holds.
   c. Create the repo if absent: the org endpoint, or POST /user/repos when {{github_org}} is the token owner's personal account (its login equals the owner). Private unless ship.json says public; description and homepage from ship.json.
   d. Push before deploying. Run `git subtree split --prefix=apps/<name> HEAD` and push that commit to refs/heads/main. Never force. A non-fast-forward rejection means the app repo has moved on: stop with "iterate in the app repo", so stale launch-pad code never redeploys over it. Send the PAT as an http extraheader with credential.helper unset, mask it, and never put it in a URL.
   e. Deploy.
   f. Wire auto-deploy with the current Workers Builds API: connect the repo with production settings (branch main, `npx wrangler deploy`) and Preview settings (every other branch, `npx wrangler preview`). Skip this if the Worker is already connected. If Cloudflare needs a one-time dashboard step first (there is no Builds token until some Worker in the account has been linked to Git from the dashboard), fail with that step. If only Previews can't be turned on, warn; unwired production auto-deploy fails the run, after the site is live, with the fix.
   g. Live check: poll https://<name>.{{domain}}/ for a 200 for up to 3 minutes. If it doesn't answer, warn that DNS and certificates take 1-3 minutes. Don't fail.
   h. Directory, last: only when the live check passed and the description isn't empty (otherwise warn that the app shipped but isn't listed). Build the row from ship.json. Write the shipped date when the row is first added and keep it on later ships. Skip the commit if the row hasn't changed. Any failure here is only a warning, because the app is already live and a missed commit to another repo shouldn't fail the run.
   i. Write a step summary table: Live, Repo, Directory, Auto-deploy.
   Every step checks before it creates, so re-running resumes after a partial failure. Every failure is one ::error annotation that names the fix; warnings are ::warning. Read the API base URLs, the git base URL, the live-check URL and the retry count from the environment, with real defaults, so tests can point them at stubs.

7. scripts/watch.sh [sha], run in the session after a push. Use only GitHub REST calls (gh api, or curl with a token), which work through a cloud session's GitHub proxy. Find the ship run for the commit (poll up to 2 minutes), wait for it to finish (up to 7), then print each job's conclusion, each failed step and the run's annotations, skipping "Process completed with exit code". If the run was cancelled because a newer push took its place in the queue, say so and print the dispatch command for each app the commit changed. The last line is `RESULT: <conclusion>`. Exit 0 on success, 1 on failure, 2 when no run was found (print the command that dispatches ship.yml for the current branch with input app=<name>), 3 while it is still running (run it again).

8. .github/workflows/retire.yml and scripts/retire.sh: workflow_dispatch only, inputs `app`, `confirm` and `owner` (default: the default owner), one concurrency group per app.
   - If confirm doesn't equal app, stop with "Nothing was deleted."
   - Refuse a repo without ship.json at its root, a Worker that serves any hostname other than <name>.{{domain}}, and a Worker with no custom domain when the repo isn't ours.
   - Delete in this order: the Workers Builds connection, the custom domain, the Worker, then the repo. Remove the directory row last, as a warning only. If nothing exists, say so and exit 0.

9. .github/workflows/test-ship.yml, on pull requests that touch scripts/: run ship.sh deploy against stubs (a curl wrapper that answers the overridden endpoints, a stub wrangler, a bare repo on disk as the app remote). Cover a fresh ship, a re-ship with nothing to change, each refusal and a diverged main.

10. CLAUDE.md, under 30 lines, the contract for sessions: scaffold with new-app.sh; keep all app code inside apps/<name>; before any push, npm run build passes there and ship.json has a description; push the session branch, then run scripts/watch.sh with a 10-minute timeout; on exit 2, dispatch ship.yml with app=<name>; main is never pushed to or merged into; templates/, scripts/, .github/ and launchpad.json stay untouched while shipping an app; once an app has shipped, its repo, not the launch pad, is the source of truth; retire an app only when the owner names it; no one is ever asked to paste a secret.

11. README.md: a diagram of the flow, the one-time setup and what the workflow refuses.
   - Setup step 1 is merging the pipeline, without apps/, into main: workflow_dispatch works only for workflows on the default branch, and session branches start from main.
   - State the trust boundary: anyone who can push a branch here runs ship.yml with the secrets, so write access to this repo equals the PAT's and the Cloudflare token's power. Use an org that holds only launch-pad apps.
   - List each secret with its exact scopes:
     - <ORG>_REPO_TOKEN (one per org; launchpad.json names it): fine-grained, resource owner {{github_org}}, all repositories, Administration and Contents read and write (add Workflows if app repos will carry workflow files).
     - CLOUDFLARE_API_TOKEN: a user API token, since the Workers Builds API refuses account-owned ones. Edit Workers, edit Workers Builds configuration, read the zone and its DNS for {{domain}}.
   - The Cloudflare Workers GitHub App and the Claude GitHub App, each with access to all repositories in {{github_org}}: the first lets auto-deploy connect every new repo, the second lists new repos in the session's repo picker.

Don't deploy, push, create repos or set secrets. Prove new-app.sh once on a throwaway name, then delete that folder. Reply with the file tree (one line on what each file does), the one-time setup the owner must do, and anything you couldn't verify.
```

## Example

**Input**: a tabletop run in a new private repository, `northwind-apps/shipyard`, that holds only a short `README.md`. Claude wrote the files outside the repo and had no network access to Cloudflare or GitHub. The values:

- `github_org`: northwind-apps
- `domain`: northwind.app
- `templates`: `web` (Vite, React and TypeScript) and `static` (one HTML page in `public/`, no build step)
- `directory_repo`: `northwind-apps/www`, file `data/catalog.json`, rows of `name`, `title`, `description`, `url` and `shipped`

**Output** (trimmed to the refusals in `scripts/ship.sh`):

```bash
  # b. Refusals. Read-only, fail closed: an API error stops the run, it never counts as "free".
  #    They exist because wrangler deploy, run non-interactively, silently takes over a custom domain
  #    or DNS record that something else holds.
  step "Refusals"
  local repo_state worker_exists=false host_worker zone_id records
  http GET "$GH_API/repos/$REPO"
  case "$HTTP_CODE" in
    404) repo_state=absent ;;
    200)
      http GET "$GH_API/repos/$REPO/contents/ship.json"
      if [ "$HTTP_CODE" = 200 ] && [ "$(jq -r '.type // empty' <<<"$HTTP_BODY")" = file ]; then
        repo_state=ours
      elif [ "$HTTP_CODE" = 404 ]; then
        http GET "$GH_API/repos/$REPO/commits?per_page=1"
        case "$HTTP_CODE" in
          409) repo_state=empty ;;   # a repo with no commits holds nothing to overwrite
          200) fail "github.com/$REPO already exists and the launch pad didn't create it (no ship.json at its root). Nothing was changed. Pick another name: scaffold a new app with scripts/new-app.sh and move the code there." ;;
          *)   fail "GitHub API error listing commits of github.com/$REPO ($HTTP_CODE: $(gh_err)). Nothing was changed. $(hint "$PAT_SECRET can read all $OWNER repositories.")" ;;
        esac
      …
  # The deploy would move the hostname off the Worker that serves it now.
  [ -z "$host_worker" ] || [ "$host_worker" = "$APP" ] \
    || fail "$HOST is already served by the Worker \"$host_worker\". Nothing was changed. Pick another name."
  # A Worker with this name that isn't on its hostname belongs to something else; the deploy would replace its code.
  if [ "$worker_exists" = true ] && [ "$host_worker" != "$APP" ] && [ "$repo_state" != ours ]; then
    fail "A Worker named \"$APP\" already exists, doesn't serve $HOST and has no launch-pad repo. Nothing was changed. Pick another name."
  fi
  …
    # An old record (say a CNAME to a previous host) would be replaced by the deploy without a word.
    [ -z "$records" ] || fail "$HOST has DNS records but no Worker: $records. Nothing was changed. If nothing uses them, delete them (Cloudflare dashboard → $DOMAIN → DNS → Records) and re-run; otherwise pick another name."
```

The refusals run read-only before the first write, every one ends with "Nothing was changed.", and an unexpected status from GitHub or Cloudflare stops the run instead of counting as free. Beyond the brief, Claude also made the build step refuse a custom `build` block in `wrangler.jsonc`, which would run the app's commands next to the secrets, and its offline test script passed all 97 checks.

## Why it works

- **Privilege lives in CI, and only in the deploy step.** The session needs nothing but a branch push. The build step runs the app's own npm scripts, so it gets no secrets, though a malicious dependency can still tamper with the shared runner; full isolation needs a separate deploy job. The workflow also runs the branch's own scripts, so push access to the launch pad is the real privilege: keep the app org separate from anything else.
- **One ownership marker, checked before the first write.** `ship.json` at a repo's root is how ship and retire tell their own work from everything else. The refusals matter because a non-interactive `wrangler deploy` claims a custom domain or DNS record that something else holds without asking, so a reused name would hijack a live site rather than fail. Allowing exactly one route keeps a second hostname from slipping past them, and treating an API error as "taken" stops a flaky call becoming a takeover. Retire repeats the same checks behind a typed confirmation.
- **Push before deploy, never force.** The subtree push fast-forwards the app repo's `main`, so after the first ship the app repo can become the source of truth. Once it has moved on, the rejected push stops the run before old launch-pad code redeploys over newer work.
- **The session can read its own result.** `watch.sh` uses only GitHub REST, finishes inside a 10-minute command timeout, prints the failing step and the annotation that names the fix, and exits with a code the session can act on. Side effects (the directory row, Previews, a slow certificate) only warn; the one failure after deploy is unwired production auto-deploy, reported with its fix once the site is live. The SKILL.md drives that loop from the session side.

## Variations

- **Adopt an existing repo.** Land `ship.json` and a deploy config that agrees with it on the repo's `main` through a pull request. Then use `git subtree add` to pull the repo, history and all, into `apps/<name>`, and confirm that splitting that subtree gives back exactly the repo's `main` commit. The first ship push then has nothing to fast-forward, and the repo keeps its name and history.
- **Add a backend.** A `--backend` flag layers a container service on the web template. The same Action deploys it with keyless OIDC sign-in rather than a stored key, the Worker forwards `/api/*` to it, and a label on the service is the ownership marker for the refusal and retire checks. Secrets go from a secret manager into Worker secrets through stdin in CI, never through a person or a log.
- Generalised from a launch-pad repo that ships small web apps.
