---
name: source-tight-copy
description: Audits copy that cites numbers, research, surveys or statistics against its sources, so every claim says no more than its source does. For each claim it quotes the source word for word, checks who was counted and the unit, labels the figure (measured, self-reported, survey, correlational, modelled, prediction, rule of thumb, vendor claim), dates it, then keeps, tightens or cuts it and rewrites it. Returns an audit table, a publishable "How to read these numbers" note and open checks, and applies the fixes to files when asked. Use before publishing a landing page, deck, report, blog post, press release, chart or app copy that quotes figures, and when the user says "fact-check this", "check these stats against the sources", "are these numbers right", "source-check the copy", "audit the claims", "does this overclaim", "tighten the wording to match the research" or "add sources and dates to the figures".
---

# Source-tight copy audit

Every claim in the copy says no more than its source does, and a reader can tell what kind of number it is, who was counted and when.

## Inputs

- **The copy**: pasted text, or files. In a codebase, look beyond the body text: headlines, chart and figure labels, captions, alt text, tooltips, meta descriptions, social-card text and data files that hold figures.
- **The sources**: pasted excerpts, files, PDFs, or links you can open. Read the method section and the passage behind each figure, not only the summary or the press release. If a link is blocked or paywalled, say so and ask for the text. Never judge a claim from a search snippet or an abstract.

Work only from these sources. Never fill a gap from memory, even when you think a figure is right. If a claim's source is missing, ask for it once. If it doesn't arrive, mark the row "source not provided", leave the claim unedited and list the source under Check before publishing, so a missing file isn't mistaken for an unsupported claim.

## Workflow

### 1. List every claim

A claim is any of:

- a number (percentages, multiples, counts, money, time)
- a quantity word: "most", "few", "half", "twice", "the majority"
- a cause: "cuts", "drives", "boosts", "leads to", "because", "results in"
- an attribution: "X found", "research shows"
- a superlative: "first", "only", "leading", "fastest"
- a time word: "now", "today", "this year", "latest", "recent"
- a requirement or scope: "must", "required by", "applies to", "from <date>", meaning what a law, standard or policy covers, for whom and from when

List each occurrence separately. The same figure in a headline, a chart label and alt text is three rows, because each can drift on its own. Claims in one sentence that share one passage and one rewrite can share a row. Bold each claim word in the copy cell.

### 2. Quote the source

For each claim, copy the supporting passage word for word, in quotation marks, with its location (section, page, table, paragraph). Never paraphrase in the quote. If no passage supports the claim, write "no supporting passage".

### 3. Match the words

Keep the source's verb, quantifier, unit and rounding.

- "Use it in their weekly planning" is not "plan with it every week".
- "Below target" is not "missed".
- "Said they could" is not "did". "Expect to" is not "will".
- 1.8 times is not "twice". 43% is not "almost half", unless the source itself rounds it that way, and then say so.
- Don't widen the category: if the source measured one kind of tool, product or behaviour, the copy doesn't speak for the whole field.

### 4. Check the base and the unit

Who was counted, how many, where and when. Flag every change of subject:

- respondents become organisations ("respondents say their company…" is not "companies…")
- users of a product become everyone
- a subgroup becomes the whole sample
- one country, sector or company size becomes "businesses"

Check the unit: per person or per team, per order or per customer, share of projects or share of companies, share of those surveyed or of everyone. Give n for any subgroup or small sample.

### 5. Label the status

One or more per figure:

| Status | What it is | Words that fit |
|---|---|---|
| measured | observed, logged or counted by the researchers, or an experiment | "did", "took", "rose" |
| self-reported | people's own estimate of their time, money or results | "say", "report", "estimate" |
| survey | the share of respondents giving an answer | "x% of respondents said" |
| correlational | groups compared: an association, not a cause | "is linked with", "those who X also Y" |
| modelled | computed from assumptions or from other figures | "an estimate based on…" |
| prediction | a forecast | "expects", "predicts", "projected to" |
| rule of thumb | an expert's or firm's heuristic, no data shown | "as a rule of thumb", "X suggests" |
| vendor claim | from someone who sells the thing: their own data, or a study they paid for | "according to X, which sells Y", "commissioned by" |

Correlational and self-reported figures never take a causal verb in the copy's own voice; a cause the respondents gave stays inside "said". Also carry any caveat the source gives about itself: preliminary or not peer reviewed, corrected or replaced by a later version, a ranking or score rather than a count, or a result the authors say is not statistically significant (then don't present the point estimate as a finding).

### 6. Date it

Give the source's month and year, plus the fieldwork period when the source states it. Replace "now", "today", "this year" and "latest" with "as of <month year>", so the line doesn't go stale silently.

### 7. Decide

- **keep**: the copy already says no more than the quote, and carries the status, base and date a reader needs, in the line or in the reading note.
- **tighten**: the source supports a narrower claim. Rewrite to exactly that.
- **cut**: no passage supports it, or the sources can't confirm it. Remove the number. Don't soften it into "many" or "thousands"; that is still unsourced.

Two figures from different studies, methods or years are not one statistic and don't make a trend. Don't add, average or compare them as if they were. If a source is a press release or cites another study, say so: the primary still needs checking.

### 8. Rewrite

Keep it copy, not a footnote. Put the status in the verb ("say", "report", "expect", "is linked with") and the source in a short tag at the end: "(Source, Mon YYYY, n = 812)". A rewrite can be more specific than the copy, never broader than the source. Keep the voice and roughly the length of the original. Base, method and caveats that don't fit go in the reading note, not in every line.

### 9. Write the reading note

If the copy uses any survey, self-reported, correlational, modelled, predicted, rule-of-thumb or vendor figure, write "How to read these numbers": 2 to 5 plain sentences that can be published under the copy or on a sources page. Say:

- survey figures are what people said, not measurements
- correlational figures show association, not cause
- predictions are forecasts, not results
- rules of thumb are heuristics, not findings
- who commissioned the research, when it is a vendor
- the date the figures refer to, and when and against what they were checked (the full report, a release or excerpts)
- which labels, scores, thresholds or frameworks are the writer's own rather than the source's

Skip the note if every figure is measured.

### 10. Apply (only when asked)

Edit files only when the user asked for fixes; otherwise return the table and offer to apply it. When applying:

- Change only the claims. Keep the surrounding copy.
- The fix travels with the number: search the project for each figure in all its forms ("61%", "61 per cent", "1.8×", "1.8 times") and fix every occurrence, including labels, captions, alt text and meta tags.
- Put the reading note under the copy or on the sources page.
- Read the edited copy once more as a stranger: does any sentence now say more than its row's quote?
- If figures live in code, consider storing each with its source string and adding a check that fails when one is missing.

## Output

1. The audit table:

   | # | Claim in the copy | Source says (exact quote) | Status · base · date | Verdict and why | Rewrite |
   |---|---|---|---|---|---|

   For a cut, the rewrite cell says what to do instead: remove the sentence, or use another row's sourced figure.
2. **How to read these numbers**, if needed.
3. **Check before publishing**: anything the sources can't settle, such as the exact question wording, a subgroup's size, the primary study behind a release, or whether a newer edition or a correction replaces a figure. One line each, or "none".
4. When files were edited: each file and what changed.
