---
name: launch-pad
description: Ships a new web app through a launch-pad repository, a monorepo where pushing apps/NAME/ on a branch other than main makes a GitHub Action create the repo ORG/NAME, deploy it to https://NAME.DOMAIN, wire auto-deploy and list it in the app directory. Scaffolds with scripts/new-app.sh, builds only inside apps/NAME, fills in ship.json, commits, pushes, runs scripts/watch.sh, then reports the live URL in four lines or fixes what the Action refused. Use when the user has a launch pad (this repo, a sibling checkout or one the session can attach) and says "ship an app", "launch this idea", "spin up a site for", "deploy this as its own app", "put this on [domain]", "make a repo and host it", "turn this HTML into a live site" or "re-ship [name]", and when they ask to retire or delete a shipped app by name.
---

# Ship an app through the launch pad

A launch pad is a monorepo whose GitHub Action `ship` turns each `apps/<name>/` pushed on a non-main branch into the repo `<org>/<name>`, a site at `https://<name>.<domain>`, auto-deploy (production from `main`, a preview URL for every other branch) and, if the owner keeps one, a row in the public app directory.

```
idea → apps/<name>/ on a session branch → push → Action "ship"
     → <org>/<name> + https://<name>.<domain> + auto-deploy + directory row
```

Why CI does it: in the cloud, an agent session can only push its own branch and has no way to create repos or call the hosting API. The Action keeps the tokens and does that part. Don't create the repo, deploy or set secrets yourself.

The launch pad's own `CLAUDE.md` and `README.md` are the contract. If they disagree with this skill about a flag, a `ship.json` field or a rule, they win.

## Conventions

- **Name.** 1-63 lowercase letters, digits and single hyphens, with no hyphen at either end. It is the repo name, the Worker name and the subdomain, unchanged. When the user doesn't give one, pick one from the idea and keep going without asking.
- **Org and domain.** From `launchpad.json`: the default owner, unless the user names another org listed there.
- **Visibility.** Private, unless the user asks for public.
- **Template.** `--static` when the app is a single HTML page or an HTML file the user already has; otherwise the default template.
- **Description.** A one-sentence `description` in `ship.json`, reused as the repo's description and as the directory row. An app shipped without one goes live but isn't listed.

## Step 0: Get into the launch pad

From the repo root, confirm that `launchpad.json` and `scripts/new-app.sh` both exist (`ls launchpad.json scripts/new-app.sh`). Load `CLAUDE.md` unless you've already read it this session.

- **Not in the launch pad:** in a session with several repos, find the launch pad's checkout among the sibling folders and `cd` into it. In a cloud session that has a tool for attaching repositories, attach the launch pad with push access and clone it. Failing both, stop and ask the user to open a session on the launch-pad repo with the same request.
- **Branch:** use this session's branch, or create one with `git switch -c ship/<name>`. `main` is never the working branch.
- **Local sessions** need bash, Node, `jq`, `perl` and a signed-in `gh`.

## Step 1: Scaffold

```bash
scripts/new-app.sh <name> [--static] [--public] [--title "Display Title"]
```

The script makes a copy of the template with the name, host and compatibility date filled in, writes `apps/<name>/ship.json`, and proves it by installing, building and dry-running the deploy. If it fails, fix the cause it reports; never assemble the app from the template by hand.

If a repo `<org>/<name>` already exists and the launch pad didn't create it, don't scaffold that name: the ship will refuse it. Choose another name, or, if that repo is the one the user means and the launch pad has an adopt script, use the script instead.

## Step 2: Build the app

- Write code only under `apps/<name>/`; leave `templates/`, `scripts/`, `.github/` and `launchpad.json` alone while shipping.
- Keep the Worker name and the single custom-domain route as scaffolded, and add no routes; the Action refuses any other.
- **Worker-side code** (say, an API call that needs a key): point `main` at a worker script, bind the static assets, run the worker first for `/api/*` and serve everything else from the assets. Secrets come from `env`; for local development keep them in `.dev.vars`, which git ignores. Previews (non-main branches) don't inherit production settings: repeat vars and bindings under `"previews"` in `wrangler.jsonc`. The session has no way to set hosting secrets, so once the app has shipped, give the user each secret's exact name and where it goes, for production and again for Previews (`npx wrangler preview base-config secret put NAME`). Never ask anyone to paste a secret into the chat.
- Fill in `ship.json`: `description`, plus any directory fields the scaffold left empty.
- Last, run `npm run build` in `apps/<name>/`; don't push until it passes.

## Step 3: Commit, push, watch

```bash
git add apps/<name>
git commit -m "Add <name>: <one-line summary>"
git push -u origin HEAD
scripts/watch.sh          # give this command a 10-minute timeout
```

`watch.sh` locates the Action run for your HEAD commit and reports every job, any step that failed and the Action's messages. Its last line is `RESULT: <conclusion>`.

| Exit | Meaning | Do |
|---|---|---|
| 0 | Success | Report (Step 4). |
| 1 | The run failed | Read the failed step and its message, then see "When the Action stops". |
| 2 | No run found | Once you've confirmed the push landed, start the run yourself: `gh workflow run ship.yml -f app=<name> --ref "$(git branch --show-current)"`, or the GitHub tool's workflow dispatch with the same inputs. Then run `scripts/watch.sh` again. If you can't dispatch it, give the user the Actions → ship → Run workflow link, plus the branch and app name to enter there. |
| 3 | Still running | Run `scripts/watch.sh` again. |

Leave the launch pad's `main` alone: no pull request into it and no merge.

## Step 4: Report

Only after `RESULT: success`, in four lines at most:

```
Site         https://<name>.<domain>
Code         https://github.com/<org>/<name> (private)
Auto-deploy  main → production; any other branch → its own preview URL
To do        <one action for the user, or "nothing">
```

When the run warned that the site doesn't answer yet, tell the user DNS and the certificate usually need another 1-3 minutes. A directory warning, or a secret the user has to add, goes on the To do line. A failed run is never reported as live.

## When the Action stops

| Message says | Do |
|---|---|
| A repository secret is not set, or was rejected | Name the secret for the user and where it goes (the launch pad's Settings → Secrets and variables → Actions); the README gives its scopes. Don't handle tokens yourself. |
| The PAT can't push `.github/workflows` | The app includes a workflow file. Ask the user to grant Workflows read and write on that PAT, then re-run. |
| An existing repo has that name but no `ship.json` at its root | Someone else holds the name. Suggest another, rename the app with the commands below, and go through commit, push and watch again. |
| A Worker of that name exists, or the hostname already serves another Worker | Also taken: rename, then commit, push and watch. |
| The hostname has DNS records but no Worker | If the user confirms the records are stale, ask them to delete them in the Cloudflare DNS settings, then re-run with the dispatch command from Step 3. Otherwise rename, commit, push, watch. |
| The run was cancelled because a newer push replaced it | That push's app didn't ship. Dispatch it with the command from Step 3, then watch again. |
| The app repo's `main` has moved on, so the push was rejected | The app repo is now the source of truth. Make the change in a session on `<org>/<name>` instead, and tell the user so. |
| Production auto-deploy isn't connected | The app is already serving. Pass on the fix the message gives, then dispatch again with the command from Step 3. |
| Build or deploy CLI errors | Correct the code under `apps/<name>/`, get `npm run build` passing, and push again. |
| Warning: shipped but not listed in the directory | Fill in `description`, then push again. |

To rename an app, run from the launch-pad root:

```bash
git mv apps/OLD apps/NEW
git grep -l OLD -- apps/NEW | grep -v package-lock.json | xargs perl -pi -e 's/OLD/NEW/g'
(cd apps/NEW && npm install && npm run build)
```

## Iterating

- **Same session:** change `apps/<name>/`, build, then commit, push and watch. Each push moves the app repo's `main` forward and deploys it again.
- **Later:** work in `<org>/<name>` itself. Its branches get Preview URLs, built from the `"previews"` settings rather than production's, and a merge to `main` deploys production. The launch-pad copy goes stale from then on, and once the app repo has moved on the Action won't overwrite it. That refusal is deliberate, not a bug.

## Retiring an app

Retire an app only when the user names it and asks for it to be removed.

```bash
gh workflow run retire.yml --ref main -f app=<name> -f confirm=<name>   # add -f owner=<org> for a non-default org
gh run list -w retire.yml -L 1     # then gh run watch <id>
```

The workflow removes the auto-deploy connection, the custom domain, the Worker, the repo and the directory row, and refuses to touch anything the launch pad didn't create. Read the run's conclusion before telling the user the app is gone. If you can't dispatch it, send the user the Actions → retire link; they type the name twice.
