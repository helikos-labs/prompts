---
title: Parallel specialist research agents, then a composer that marks unverified facts
summary: Fan research out to narrow specialists, each with its own search budget and word cap, then compose one result that flags every unsourced fact.
category: ai-features
tags: [agents, pipelines, research]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: intermediate
use_as: prompt
---

## The prompt

Call it from code. Send part 1 once per specialist, all in parallel, with the web search tool's maximum uses set to that specialist's budget. When every call has finished or failed, send part 2 once, with maximum uses set to 3. If no specialist succeeded, stop and report the error instead of calling the composer. Your code fills the [square-bracket] slots on each call.

With web search, a reply that ends with stop_reason "pause_turn" is not finished: send the conversation again with that reply appended (a few times at most), then join every text block in order. If URLs come back only as structured citations, write each one inline after its fact before you pass the findings on.

```text
=== PART 1 · SPECIALIST · system prompt ===
You are one specialist on a team preparing {{deliverable}}. Research only the area in your assignment. Other specialists cover the rest, and a composer will turn everyone's findings into the final result.

Rules:
- Stay inside your assignment, even where you know more.
- Do not write the final result, a draft of it or an overall recommendation. Write findings only.
- Give every field your assignment asks for, for every option it names. If you don't know a field, write "unknown" rather than guess.
- Write concise, fact-dense findings in plain Markdown: short ### headings and bullets, with specific names, numbers, dates and versions, in the units and currency the brief uses. No introduction and no conclusion.
- Stay under {{word_cap}} words.
- If you have web search, use no more searches than your assignment allows. Spend them on facts that change over time (numbers, limits, dates, versions, policies, availability), not on what you know reliably.
- Put each source URL inline, right after the fact it supports. Cite only pages you found or opened in this run; never write a URL from memory.
- Mark every changeable fact you did not confirm in this run with "(verify)". With no search tool, that is every changeable fact.

=== PART 1 · user message (one per specialist) ===
{{brief}}

Your assignment: [one line from SPECIALISTS, as written]

=== SPECIALISTS · config for your code, not sent to a model (one parallel call each; "Name (N searches): what to find and which fields to return") ===
{{specialists}}

=== PART 2 · COMPOSER · system prompt ===
You are the composer. Turn the brief and the specialists' findings into {{deliverable}}.

Rules:
- The findings are your evidence: build from them and do not redo the research. If you have web search, use at most 3 searches, only to fill a gap or settle a conflict that changes the result.
- Add no changeable fact of your own unless you searched it in this run or mark it "(verify)".
- When findings conflict, prefer the fact with a source URL over one marked "(verify)". If neither wins, state the conflict in one line, go with the more cautious option and list it under "Still to verify". Never average conflicting numbers or pick one silently.
- Keep each source URL next to the fact it supports. Add no URL that is not in the findings or your own searches.
- Keep "(verify)" on every fact that still has no source, including in summaries and comparisons. Do not drop it to sound more confident.
- The message lists missing reports. Name each missing area in the result and say what it leaves open; cover it only with facts you searched or marked "(verify)".
- End with two lists: "Sources" (each URL once) and "Still to verify" (the "(verify)" facts the result depends on, most important first).

=== PART 2 · user message ===
{{brief}}

Specialist findings: [n] of [total] reports in. Missing: [names, or "none"].

## [Specialist name]
[that specialist's findings, unedited]

[…one section per specialist that finished]
```

## Example

**Input**:
- `deliverable`: a one-page recommendation of which host to use and why
- `brief`: "Choose a host for the docs site of a small open-source app. Three maintainers. The site is built with Astro into about 400 static pages and the code is on GitHub. We need a preview URL for every pull request, our own domain over HTTPS, redirects from old URLs, and no servers to maintain. Candidates: GitHub Pages, Netlify, Cloudflare. Pricing is out of scope."
- `word_cap`: 200
- `specialists`:
  - Deploy workflow (4 searches): For each candidate: how a push to main and a pull request get built and deployed, whether per-pull-request preview URLs are built in or need extra setup, and how to roll back a bad deploy.
  - Limits and routing (4 searches): For each candidate: limits a 400-page static site could hit (build time, deploys, file count, file size), how redirects are configured and whether they allow wildcards, and how a custom domain gets HTTPS.
  - Exit and lock-in (2 searches): For each candidate: which features we would have to rebuild to move to another host, and whether the configuration lives in our repo.

Test conditions: one model played all three calls in order, in one session, with no tools and a short wrapper asking it to follow each system prompt exactly. So every changeable fact had to carry "(verify)", and the search budgets, inline URLs and the sourced-beats-"(verify)" conflict rule were not exercised. The third specialist was treated as a failed call, so the composer received 2 of 3 reports.

**Output** (trimmed to Netlify from each specialist's report, then parts of the composer's result):

> ### Call 1: specialist "Deploy workflow"
>
> (trimmed)
>
> ### Netlify
> - Main: the Netlify GitHub App builds on Netlify for each push to the production branch; deploys are atomic (verify).
> - Pull requests: Deploy Previews built in, one URL per PR, linked from the PR; fork PRs built, may need approval (verify).
> - Rollback: earlier deploys are kept; "Publish deploy" restores one instantly (verify).
>
> (trimmed)
>
> ### Call 2: specialist "Limits and routing"
>
> (trimmed)
>
> ### Netlify
> - Limits: 15-minute build timeout; 1 concurrent build on the free plan (verify). Deploy count, file count, file size: unknown.
> - Redirects: `_redirects` file in the output or `[[redirects]]` in `netlify.toml`; splats (`/old/*` → `/new/:splat`) and `:placeholders`; 301, 302, 200 and 404; first match wins (verify).
>
> (trimmed)
>
> ### Call 3: composer
>
> #### Recommendation: Netlify
>
> Host the docs on **Netlify**. Going by the findings, it is the only candidate that meets all four needs without extra setup. That includes preview builds for pull requests from forks (verify), which is how most outside contributors to an open-source project send changes. Cloudflare is a close second. GitHub Pages does not fit.
>
> A caveat: no specialist had web search, so every host fact below is unconfirmed and marked "(verify)". The two reports do not conflict. The ranking holds only if the top items under "Still to verify" turn out to be true.
>
> #### How the candidates meet the brief
>
> | Need | Netlify | Cloudflare | GitHub Pages |
> |---|---|---|---|
> | Preview per PR | Built in, one URL per PR, linked from the PR; fork PRs built, may need approval (verify) | Pages: built in per branch/PR; fork PRs not built (verify) | Not built in; third-party action, branch publishing only; fork PRs lack write tokens (verify) |
> | Redirects from old URLs | `_redirects` or `netlify.toml`; splats and placeholders; 301/302 (verify) | `_redirects`; 2,000 static + 100 dynamic rules; splats and placeholders (verify) | No server-side redirects; meta-refresh pages only, no wildcards (verify) |
>
> (trimmed)
>
> #### Missing report: Exit and lock-in
> This report failed, so the cost of leaving each host is still unknown. That includes how much configuration is specific to the host, whether deploy history and settings can be exported, and how tied the domain becomes. The other findings give two partial answers:
> - Netlify and Cloudflare both read a `_redirects` file with splats and placeholders (verify), so redirect rules may move between them with little editing. Whether the syntax matches exactly is unknown.
> - A Cloudflare apex domain means moving DNS to Cloudflare (verify), which is more work to undo.
>
> #### Sources
> - None. No specialist had web search, and the findings contain no source URLs.
>
> #### Still to verify
> 1. Netlify builds Deploy Previews for fork PRs, and what approval that needs. Cloudflare Pages does not build them.
> 2. Netlify Deploy Previews are built in, one URL per PR, with no extra setup.
>
> …
>
> 5. Netlify's deploy count, file count and file size limits (reported unknown), its 15-minute build timeout and 1 concurrent build on the free plan.
>
> …

The specialists stayed under the word cap, wrote findings rather than recommendations, marked every changeable fact "(verify)" and wrote "unknown" where they had no figure. The composer kept "(verify)" in every table cell, named the missing report and what it leaves open, listed no sources rather than inventing URLs, and put first under "Still to verify" the fork-preview claim its ranking depends on.

## Why it works

- **Narrow briefs, each with its own search budget.** One agent asked to research everything skims; a specialist with one area goes deep, and the parallel calls finish in the time of the slowest. Size each budget to how many changeable facts the area holds, and set the tool's maximum uses to the same number: the prompt lets the model plan its searches, the API enforces the cap.
- **"Do not write the final result" plus a word cap.** Without them every specialist writes its own mini version of the answer, and the composer gets competing drafts instead of evidence. Capped, field-by-field findings keep the composer's input small and easy to merge; ### headings let each report nest under its ## name. "unknown" keeps a gap visible instead of filling it with a plausible number; the composer then lists it under Still to verify, as with Netlify's file limits. Treat the cap as soft (both specialists here stayed under 200 words, but an earlier test run went about 4% over): set it a little below what you can afford, and keep max_tokens as the hard stop.
- **Inline URLs and "(verify)" make provenance travel with each fact.** The composer can settle conflicts by evidence (sourced beats unverified) instead of picking the more confident wording, and the reader sees what still needs checking. Asking every specialist for the brief's units and currency keeps figures comparable, so only real disagreements count as conflicts. The same prompt works with no search tool: changeable facts are marked instead of silently guessed, and "never a URL from memory" stops invented links.
- **The composer builds from findings and names the gaps.** A small search budget only for gaps and conflicts stops it redoing the research. Telling it which reports are missing makes it say so, rather than quietly filling an area from memory.

## Variations

- **Split the models.** Run the specialists on a faster model and the composer on your strongest; most of the tokens go into research, while the judgement happens in the composer.
- **Rate-limited or small models.** Run only as many specialists at once as the provider's rate limit allows, and shorten the joined findings before passing them to a model with a small context window.
- **Refinements skip the fan-out.** When the user asks to change an existing result, send the composer the previous result and the change request, with no new specialist calls. Drop the findings line and the missing-report rule, and give the composer a slightly larger search budget than its usual 3, in the rule and in maximum uses, because it has no fresh findings.
- **Show the work.** Stream each specialist's text and search queries into the UI as a live board while the job runs.
- Generalised from a trip-planner app.
