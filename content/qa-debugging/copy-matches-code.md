---
title: Make the privacy note and credits match the code
summary: Claude Code inventories every data flow from the code, with file and line, rewrites the privacy note and credits to match, and leaves a review marker that CI warns about.
category: qa-debugging
tags: [privacy, writing, review]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: intermediate
use_as: claude-code
---

## The prompt

Run it in Claude Code at the root of the repo before launch, and again whenever you add a provider, a cache, a font or a tracker.

```text
Make the privacy note and the credits for this app say exactly what the code does, no more and no less, in as few words as the facts allow.

App (its path, and one line on what it is): {{app}}
Current privacy note, credits and claims (the files or pages that hold them, or "none yet"): {{current_copy}}
Facts not in the repo (live provider and tier, log retention, host dashboard features, contact address), or "none": {{deployment_facts}}

Work from the code, not from the current copy, the README or what apps like this usually do. Read the browser code, server code, build config, HTML head, stylesheets, security headers, environment and deployment config, and the built output if there is one.

1. Inventory. One row per data flow, each with the file and line that proves it.
- Sent out: every request the browser or the server makes to another host: AI providers, ad networks, analytics, fonts, maps and tiles, search or suggestion APIs, bot checks, error reporting, CDNs, embeds. Say what triggers it (page load, each keystroke, submit), exactly which fields go (text typed, earlier context, a user's own key) and on whose account (the app's, or the user's own key). Loading a font, script or image from another host sends that host the visitor's IP address and browser details: that is a row too. For a user's own API key, say where it is stored, every server it passes through, and whether any log or error report can capture it.
- Through links: any link, redirect, form or share button that carries user input to another site, and what the Referer carries under the page's Referrer-Policy.
- In the browser: every localStorage, sessionStorage and IndexedDB key, every Cache Storage cache a service worker fills, and every cookie, even a small flag, with what it holds and when it is cleared.
- On the server: databases, key-value stores and caches. What is kept, keyed by what (per user, or shared so one person's result can be served to another), and for how long: quote the TTL. If a cached result is served to other people, check the cache key includes everything that changes its credit or licence (for example, which licensed source was used), so nobody gets a result carrying another result's attribution.
- Logged: what the app's own logs write, what the host's request logs hold (URLs with query strings, IP addresses), and what rate limiters and abuse checks keep. Check every limiter: one that keys on the raw address for a minute still uses the raw address. A hashed address is a pseudonym, not anonymous.
- Decided by config: anything an environment variable or deployment setting switches (which AI provider, free or paid tier, a feature flag). Record every case, not just the default.
- Every path: follow the fallback, error, retry and cache-hit paths as well as the normal one (no source found, a source or provider unreachable, the user's own key). Give a path its own row when what it sends, keeps or credits differs.
Where a fact I gave fills a row, cite "owner" as its evidence. If neither the code nor those facts can tell you something (a provider's own retention, an owner's decision), write "unknown" and add it to the questions. Never fill a gap from memory.

2. Credits and notices, from the same reading.
- Every package that ships to the browser, with its licence. Build-only tools don't count; code that a pre-bundled package inlines, and helpers the bundler injects, do. For a dual-licensed package, say which licence you use. If the build can generate this list, make it do so.
- Content, data, maps, images and fonts the app shows, each with its licence and the attribution wording it requires.
- Generated content is credited to AI, naming the provider this deployment uses, so nobody takes it for a person's work, and says AI can be wrong.
- Trademarks the copy names, with their owners, and a not-affiliated line. Scope the app's own copyright to what it owns.

3. Mismatches. Check every sentence of the current copy against the inventory: privacy note, credits, footers, README, help text under inputs, onboarding dialogs, tooltips, error and fallback messages, meta tags (description, copyright, og) and aria-labels. Mark each one true, false, overclaims, missing, stale or unknown, and cite the row. Treat absolutes as false until a row proves them: "never", "only", "nothing", "every", "all", "anonymous", "no tracking", "stays in your browser", "no limits". When the copy makes a promise worth keeping and the code breaks it, propose a code fix instead of weakening the copy, and say which you chose.

4. Rewrite: the same facts in fewer words.
- The privacy note is a short list, one line per heading: In your browser, Sent out, Advertising, AI providers, Abuse checks, Hosting and logs, Caching, Contact, Last updated. Each line says what, to whom and for how long. Drop a heading that has no rows.
- Link each third party's policy or terms instead of paraphrasing them.
- Keep every disclosure a provider's terms require, even where it costs words: an ad network's cookie, opt-out and consent wording, a bot check's privacy notice, age limits, and whether a free tier (including a user's own unbilled key) may use what is sent for training. Cite the term that requires it.
- A fact that depends on config is rendered from the same config the code reads, or states every case.
- Where text goes to a third party as the user types, say so beside the input and link the privacy note from there. Check every link to the note lands on it.
- Credits: one or two short sentences per section, keeping every attribution a licence requires.
- Add nothing the code or those terms don't back: no legal bases, certifications or rights procedures unless the owner confirms them. Put those in the questions.

5. Review marker.
- Put a comment at the top of the privacy note's source, in that file's comment syntax, starting with the token "privacy-review". It says what to check, so whoever finds it can do the review without this prompt, and ends "then delete this comment". Check it doesn't show as text on the shipped page; if the build prints or escapes comments, strip it in the build.
- Add a step to the build or CI that already runs on every push. It searches only the privacy note's file for the token (a repo-wide search finds the check itself) and prints a warning, not a failure, naming the file and what to do. It also warns when that file is missing. Print the warning where people look: in GitHub Actions, a `::warning file=<path>,line=1::` annotation. Search the file that ships if it ships as written (a static HTML page); otherwise search the source.
- Don't delete the marker yourself. A person deletes it after checking, and the warning stops.

Write the privacy note, credits, copy fixes, marker and CI step into the repo. List the code fixes and wait for my go-ahead before making them.

Reply under these headings, in this order, keeping every one (write "none" under an empty one):
- Inventory: a table (what, where it goes or is kept, trigger, how long, evidence)
- Mismatches
- Privacy note, in full
- Credits, in full
- Code fixes, not yet applied
- Marker and CI step
- Open questions for the owner
```

## Example

**Input**:
- `app`: `.`, the repository root of a static prompt-library site (`scripts/build.mjs` renders every page into `dist/`, `site/app.js` is the only browser script, and Cloudflare serves the pages as static assets)
- `current_copy`: none yet; the only privacy and licence claims are in `README.md` and the site footer that `scripts/build.mjs` writes
- `deployment_facts`: none

**Output** (trimmed to three of the 25 inventory rows, two of the 19 mismatches, one line of the privacy note, the first code fix and two of the five marker and CI bullets):

> | # | What | Where it goes or is kept | Trigger | How long | Evidence |
> |---|---|---|---|---|---|
> | R2 | Search text typed on the home page | written into the page address as `?q=` with no request. From there it is in browser history, in the URL on a reload or shared link, and in the Referer of the next same-origin request to Cloudflare, because `strict-origin-when-cross-origin` sends the full URL within the site | each keystroke (80 ms debounce) | history: until cleared. Cloudflare: unknown | app.js:123-128,137-143,148-152; build.mjs:396; dist/_headers:3 |
> | R5 | The prompt text plus every filled-in placeholder value | claude.ai (Anthropic), inside the link (`/new?q=` or `/code?prompt=`), in the visitor's own Claude session. Also stays in browser history | a click on Open in Claude or Open in Claude Code (opens a new tab) | Anthropic: unknown (its policy). History: until cleared | build.mjs:68-72,217,260; app.js:190,249-259 |
> | R10 | localStorage `fill:<slug>`, holding JSON of every placeholder value for that entry | this browser | each keystroke in a blank | until every blank is empty or Clear all is used, or site data is cleared. No expiry | app.js:174,182-193,195-198,204-208 |
>
> …
>
> 1. **README.md:15.** … "no tracking" **overclaims**: the code has no trackers and the CSP blocks third-party scripts (R4), but Cloudflare receives every request with IP and URL (R1), and host analytics are unknown (R14). I rewrote it to what the code proves.
> 2. **README.md:20.** … "your values stay in your browser" **overclaims**: values are saved with no expiry (R10) and Open in Claude puts them in a claude.ai link (R5). I fixed the copy rather than the code, because sending them is what Open does.
>
> …
>
> - **AI providers:** this site runs no AI. *Open in Claude* and *Open in Claude Code* open claude.ai in your own Claude account, with the prompt and your filled-in blanks in the link, which also stays in your browser history. From there [Anthropic's privacy policy](https://www.anthropic.com/legal/privacy) applies. *Copy* sends nothing.
>
> …
>
> 1. **Optional:** change the Referrer-Policy at build.mjs:396 from `strict-origin-when-cross-origin` to `strict-origin`. Moving between pages would then stop sending the previous address, including any `?q=` search, to Cloudflare. Nothing on the site uses that header. A reload or shared link would still carry `?q=`.
>    - I disclosed this instead of changing the code, because no current promise is broken.
>    - If you say go, I'll change the header and drop "the previous page's address" from the Hosting line.
>
> …
>
> - **Hidden on the page:** the Markdown renderer prints raw HTML as visible text (build.mjs:45), so the build now strips HTML comments before rendering `PRIVACY.md` and `CREDITS.md`. In a test build, `dist/privacy/index.html` had no "privacy-review".
> - **Check:** `scripts/build.mjs` searches only `PRIVACY.md`. Under GitHub Actions it prints `::warning file=PRIVACY.md,line=1::still has its privacy-review comment. Do the check it describes, fix the note, then delete the comment.`; elsewhere it prints `warning  PRIVACY.md: …`. A missing file gives "is missing, so the site has no privacy note…". It never fails the build.

The absolute "your values stay in your browser" fails on two rows with evidence, saved with no expiry and carried to claude.ai by Open in Claude, and the run says it chose a copy fix over a code fix. It also traced typed search text into the address bar and the same-origin Referer, disclosed it and left the Referrer-Policy change waiting for a go-ahead; and because the renderer would print the marker as text, the build strips comments before rendering and warns with a GitHub Actions annotation, never a failure.

## Why it works

- **Inventory before prose, on every path, with file and line for every row.** Copy written from memory or from the old copy repeats the old claims. A row per data flow, with its evidence, makes each sentence checkable, and "unknown" stops the model filling gaps with what apps usually do. Fallback, error and cache-hit paths get their own rows because claims break there: "every image is licensed" fails on the placeholder path, and a shared cache keyed only on the query can serve one result with another's attribution.
- **Absolutes are false until a row proves them.** The wrong sentences are nearly always "never", "only", "every" and "anonymous": "we never keep your address" fails when the host's request log or an abuse check keeps it. Hunting those words finds most mismatches fast. When a promise is worth keeping, fixing the code beats weakening the sentence, so the model has to say which it chose, and code fixes wait for your go-ahead.
- **Config and terms decide, so the copy follows them.** Which AI provider runs, and on which tier, is a deployment setting: copy that names the default is wrong on every other deployment, so the copy reads the same config or states every case. Some wording is owed, not chosen (an ad network's cookie and consent notice, a provider's age limit), and citing the term that requires it stops "fewer words" from cutting it.
- **A marker the build warns about.** The comment at the top of the note's source tells the reviewer what to check, and the build warns on every run until a person deletes it, or if the note goes missing. A warning, not a failure, keeps deploys moving. The check reads only the note's file, since a repo-wide search finds the check itself, and reads the shipped file only when it ships as written. When the build drops or escapes comments (in the example it would have printed the comment as text), strip it in the build and search the source.

## Variations

- **Tighten pass.** Once the facts are right, run: "Same facts and obligations in about half the words: one or two short sentences per credits section, the privacy note as a list."
- **Start every app flagged.** Put the privacy page, marker included, in your project template, so every new app starts with a note that still needs its review.
- **Generated notices.** Ask for a build plugin that walks the modules in the bundle, writes `licenses.txt` and warns when it can't find the licence of a package it has to credit, so the notices can't drift from the dependencies.
- Generalised from an AI reference app and an app template.
