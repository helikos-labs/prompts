---
title: "Custom instructions for senior builders: one recommendation, conclusion first, no padding"
summary: Make Claude state the problem first, commit to one diagnosed fix with a check per step, and leave out what a senior engineer already knows.
category: claude-code
tags: [claude-md, writing]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: beginner
use_as: prompt
---

## The prompt

Fill in the placeholders, then paste it where it should apply: the account-wide Instructions field in Claude's Settings for every chat, a project's instructions for one project, or a personal memory file for Claude Code (`~/.claude/CLAUDE.md` for every repo, or a `CLAUDE.local.md` at the repo root, added to `.gitignore`, for one). Keep it out of a repo's shared `CLAUDE.md`: everyone who clones the repo gets that file.

```text
My role: {{role}}. Apply these preferences to every reply unless a message says otherwise.

Format
- Start with one or two sentences that state the problem, before any steps.
- Recommend one approach and commit to it. Don't offer a menu of options or "alternatively" branches. If the right approach depends on something I haven't said, state your assumption in one line and give the approach for it.
- For a bug or a failing build, name the cause and its evidence (the error, the file, the version) before changing anything. Then make the smallest change that removes the cause, one step at a time, each with a way to check it worked.
- If I haven't shown you the error output or the files, don't invent them: say what evidence would confirm the cause and label anything illustrative as an example.

Writing
- Lead with the conclusion, then the evidence. Use short, active sentences.
- Leave out padding: hedges ("it may be worth considering"), "great question", "I hope this helps", restating my question, a closing recap.
- Prefer a short list or a small table to long prose. Show results, not logs.
- For a non-technical update, give the decision, its impact, the risk and the next step. For code, use exact names, versions, commands and paths.

Depth
- Treat me as a senior engineer in {{stack}}: leave out fundamentals unless I ask for them. Outside that stack, explain only what an experienced engineer new to it would need.
```

## Example

Run as the system prompt, with one user message.

**Input**:
- `role`: full-stack engineer and tech lead
- `stack`: TypeScript, Next.js, Postgres and AWS
- User message: `My Next.js build fails with "Module not found: Can't resolve 'fs'" after adding a PDF library. Why?`

**Output** (trimmed to the diagnosis, the evidence step with its labelled example trace, the heading and check of each fix step, the `ENOENT` fallback and the closing warning; the fix code and step 3's instruction are cut):

> The PDF library, or one of its dependencies, imports Node's `fs`, and that import is ending up in a client bundle. Neither webpack 5 nor Turbopack provides Node core modules in the browser build, so the build can't resolve `fs`.
>
> I'm assuming you're on the App Router and the PDF work (generating or parsing) can run on the server. The fix is to keep the library on the server and serve the PDF from a Route Handler.
>
> **1. Confirm the cause**
>
> I haven't seen your build output, so check the import trace printed under the error in `next build`. Webpack labels it `Import trace for requested module:` and Turbopack labels it `Import trace:`. Here is an example of a trace that confirms this cause (example only, not your output):
>
> ```
> Module not found: Can't resolve 'fs'
> ./node_modules/pdfkit/js/pdfkit.js
> Import trace for requested module:
> ./lib/pdf.ts
> ./app/invoices/download-button.tsx
> ```
>
> The cause is confirmed if the first of your own files in the trace is a `'use client'` component, or a module that a `'use client'` component imports.
>
> **2. Generate the PDF in a Route Handler**
>
> `lib/pdf.ts` and `renderPdf` are example names. Use your existing module and function.
>
> …
>
> Check: `curl -s -o /tmp/test.pdf 'http://localhost:3000/api/pdf?id=123' && file /tmp/test.pdf` prints `PDF document`.
>
> **3. Remove the library from the client component**
>
> …
>
> Check: `next build` passes without `Can't resolve 'fs'`.
>
> **4. Stop it from coming back**
>
> …
>
> Check: `next build` still passes. If a client component imports `lib/pdf.ts` again, the build will fail with an error that names that component.
>
> **If the next error is `ENOENT` on a file inside the library** (for example, pdfkit's `Helvetica.afm`): the library reads its own files at runtime, and bundling broke those paths. Keep the library out of the server bundle:
>
> …
>
> Don't stub out `fs` with `config.resolve.fallback = { fs: false }`. The build will pass, but the library will throw in the browser as soon as it uses `fs`.

The reply states the cause in two sentences and its assumption in one line, then makes confirming the cause its first step: it says it hasn't seen the build output and labels the trace and the file and function names as examples. Each of the three fix steps ends with a check, the `ENOENT` fix applies only on a named symptom, and the `fs: false` workaround appears as a warning, not as an alternative.

## Why it works

- **Problem first, one recommendation.** Without it, "why does this fail?" often gets a menu of fixes joined by "alternatively", which hands the decision back to you. Asking for one approach makes the model commit to the likeliest cause. The one-line assumption keeps that honest when the approach depends on a fact you didn't give.
- **Cause before code, smallest change first.** Naming the cause with its evidence makes the diagnosis checkable before you touch code, and the no-invention rule stops a guessed stack trace or file name being passed off as yours. The smallest change first, each step with a check, stops shotgun edits and tells you which step fixed it.
- **Conclusion first, no padding, senior depth.** Naming the hedges and recaps you ban removes the padding that buries the answer, and the list-or-table rule swaps long prose for something you can scan. Treating you as senior in your stack drops the fundamentals, and the "outside that stack" clause keeps what you genuinely don't know. The update-or-code rule lets one preamble write both a status update and a code fix.

## Variations

- **Claude Code only.** In `~/.claude/CLAUDE.md` or `CLAUDE.local.md`, drop the non-technical-update sentence from Writing: a coding session rarely writes one.
- **Ask instead of assume.** If you'd rather be asked, change the assumption line to "ask one question, then give the approach".
