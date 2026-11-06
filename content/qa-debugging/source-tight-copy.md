---
title: "Source-tight copy audit: every claim says no more than its source"
summary: "Make every number in your copy say no more than its source: quote the passage, label the figure, then keep, tighten or cut it."
category: qa-debugging
tags: [writing, research, review]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: intermediate
use_as: prompt
---

## The prompt

Run it in a chat before you publish copy that cites research: a landing page, a deck, a report, a press release. Paste the copy, including headlines, captions, chart labels and alt text. For each source, paste its title, publisher, date, who commissioned it, the method section and the passages behind each figure.

```text
Audit every claim in the copy below against the sources below. The goal: each claim says no more than its source does, and a reader can tell what kind of number it is, who was counted and when.

Work only from the sources given. Do not use anything you remember about the topic, even when you think a figure is right. If no passage supports a claim, it has no source. If the copy names a source that isn't below, don't judge the claim: mark the row "source not provided" and list that source under Check before publishing.

A claim is: every number; every quantity word ("most", "few", "half", "twice"); every cause ("cuts", "drives", "leads to", "because"); every attribution ("X found"); every superlative ("first", "only", "leading"); every time word ("now", "today", "latest"); every requirement or scope ("must", "required by", "applies to", "from <date>"), meaning what a law, standard or policy covers, for whom and from when. List each occurrence separately, including headlines, captions, chart labels and alt text. Claims that share one passage and one rewrite can share a row. Bold each claim word in the copy cell.

For each claim:
1. Quote the passage that supports it, word for word in quotation marks, with where it is (section, page, table). Never paraphrase in this column. If nothing supports it, write "no supporting passage".
2. Match the words. Keep the source's verb, quantifier, unit and rounding. "Use it in their weekly planning" is not "plan with it every week". "Below target" is not "missed". "Said they could" is not "did". "Expect to" is not "will". 1.8 times is not "twice", and 43% is not "almost half" unless the source rounds it that way, and then say so. Keep the source's category too: if it measured one kind of tool, product or behaviour, the copy can't speak for the whole field.
3. Check the base: who was counted, how many, where and when. Flag every change of subject: respondents to organisations, users to everyone, a subgroup to the whole sample, one country or company size to "businesses". Check the unit too: per person or per team, per order or per customer, share of projects or share of companies, share of those surveyed or of everyone. Give n for a subgroup or a small sample.
4. Label the status, one or more of: measured (observed, logged or counted by the researchers), self-reported (people's own estimate of their time, money or results), survey (the share of respondents giving an answer), correlational (groups compared: an association, not a cause), modelled (computed from assumptions or other figures), prediction (a forecast), rule of thumb (an expert's or firm's heuristic, no data shown), vendor claim (from someone who sells the thing: their own data, or a study they paid for).
5. Date it: the source's month and year, plus the fieldwork period if given. Replace "now", "today", "this year" and "latest" with "as of <month year>".
6. Decide:
   - keep: the copy already says no more than the quote and carries the status, base and date a reader needs, in the line or in the note below.
   - tighten: the source supports a narrower claim. Rewrite to exactly that.
   - cut: no passage supports it, or these sources can't confirm it. Remove the number. Don't soften it into "many" or "thousands", and don't rescue it from memory.
7. Rewrite. Keep it copy, not a footnote, in the voice and at roughly the length of the original line. Put the status in the verb ("say", "report", "estimate", "expect", "is linked with") and the source in a short tag at the end, e.g. "(Source, Mon YYYY, n = 812)". Base, method and caveats that don't fit go in the reading note, not in every line. Correlational and self-reported figures never take a causal verb in the copy's own voice; a cause the respondents gave stays inside "said". A rewrite can be more specific than the copy, never broader than the source.

Also:
- Two figures from different studies, methods or years are not one statistic and don't make a trend. Don't add, average or compare them as if they were.
- A source's own caveat ("an association", "preliminary", "not peer reviewed", "commissioned by", a ranking or score rather than a count, a result the authors say is not statistically significant) goes into the status or the note. Never drop it.
- If a source is a press release or cites someone else's study, say so; the primary source still needs checking.

Return, in this order:
1. A table: | # | Claim in the copy | Source says (exact quote) | Status · base · date | Verdict and why | Rewrite |. For a cut, the rewrite cell says what to do instead: remove the sentence, or use another row's sourced figure.
2. "How to read these numbers": if the copy uses any survey, self-reported, correlational, modelled, predicted, rule-of-thumb or vendor figure, 2 to 5 plain sentences that can be published under the copy. Say what the figures are (what people said, not measurements; associations, not causes; forecasts, not results; rules of thumb, not findings), who commissioned the research, the date the figures refer to and what they were checked against (the full report, a release or excerpts), and any label or threshold that is the writer's own rather than the source's. Skip it if every figure is measured.
3. "Check before publishing": anything these sources can't settle, such as the exact question wording, a subgroup's size, the primary study behind a release, or whether a newer edition or a correction replaces a figure. One line each, or "none".

Copy:
{{copy}}

Sources:
{{sources}}
```

## Example

**Input** (all names and figures are invented):

`copy`, a landing-page block for a task-board app:

```text
Most small teams now run their work on a task board every day. Shared boards cut missed deadlines by 23%, and teams that hold a weekly review are twice as likely to hit their deadlines. Orbitask saves teams over an hour a week. By 2028, half of all teams will have ditched email. Join the 10,000 teams already on Orbitask.
```

`sources`, an excerpt from the survey the copy cites:

```text
Halden Research, The Small Team Tools Report 2026. Published 12 March 2026. Commissioned by Orbitask.

Method (p. 2): Online survey of 812 project managers at organisations with 10 to 200 staff in Canada and Portugal, fielded 6 to 27 January 2026. Respondents answered about their own work and their own team. All figures are self-reported.

Key findings (p. 3):
- 61% of respondents said they use a task board in their daily work.
- Respondents who use a shared task board reported missing 23% fewer deadlines in the past quarter than respondents who don't. This is a comparison between groups; the survey cannot show that the boards caused the difference.
- Respondents whose teams hold a weekly review of 15 minutes or more were 1.8 times as likely to say their projects usually finish on time.
- Of the 204 respondents who use Orbitask, 72% said it saves them at least an hour a week.

Outlook (p. 7): "We expect around half of small teams to stop using email for task updates by 2028."
```

**Output** (trimmed to four of the 13 rows and part of the reading note; the nine-line Check before publishing list is omitted):

> | # | Claim in the copy | Source says (exact quote) | Status · base · date | Verdict and why | Rewrite |
> |---|---|---|---|---|---|
> | 4 | "Shared boards **cut** missed deadlines by 23%" | "Respondents who use a shared task board reported missing 23% fewer deadlines in the past quarter than respondents who don't. This is a comparison between groups; the survey cannot show that the boards caused the difference." (Key findings, p. 3) | Correlational, self-reported. Vendor claim (study commissioned by Orbitask). **Base:** shared-board users compared with non-users among the 812 respondents. Group sizes not given. **Date:** "the past quarter", as reported in the Jan 2026 fieldwork. Published Mar 2026. | **Tighten.** The source says outright that it cannot show the boards caused the difference, but "cut" states a cause in the copy's own voice. The source compares groups of respondents. It does not measure an effect of the boards. | "Project managers who use a shared task board reported missing 23% fewer deadlines in the past quarter than those who don't, though the survey can't show the boards caused the gap (Halden Research for Orbitask, Mar 2026)." |
> | 6 | "teams that hold a **weekly** review" | "Respondents whose teams hold a weekly review of 15 minutes or more were 1.8 times as likely to say their projects usually finish on time." (Key findings, p. 3) | Survey, self-reported, correlational (groups compared). Vendor claim (study commissioned by Orbitask). **Base:** respondents whose teams hold a weekly review of 15 minutes or more. Subgroup size and comparison group not given. **Date:** fieldwork Jan 2026, published Mar 2026. | **Tighten.** The source counts only weekly reviews of 15 minutes or more. It counts respondents, not teams. | "Project managers whose teams hold a weekly review of 15 minutes or more…" (full line in #7). |
> | 7 | "are **twice as likely** to hit their deadlines" | Same passage as #6. | Same as #6. | **Tighten.** 1.8 times is not twice. The outcome is respondents saying their projects "usually finish on time", not teams hitting deadlines. The source compares groups, so this is an association. It doesn't say which group the 1.8 is measured against. | "Project managers whose teams hold a weekly review of 15 minutes or more were 1.8 times as likely to say their projects usually finish on time (Halden Research for Orbitask, Mar 2026)." |
> | 13 | "Join the **10,000** teams **already** on Orbitask." | No supporting passage. The only Orbitask count in the sources is "Of the 204 respondents who use Orbitask" (Key findings, p. 3). That is a survey subgroup, not a user count. | No source, no base, no date. | **Cut.** No source gives an Orbitask user count, and nothing gives a date that "already" could refer to. | Remove the number and "already". Either remove the sentence or end on the sourced figure in #8. If a call to action must stay, use one with no count, such as "Try Orbitask." Don't replace it with "thousands" or with the 204 survey respondents, which are a sample, not a user count. |
>
> **How to read these numbers**
>
> … The figures are what respondents said about their own work and their own team, not measured deadlines, hours or tool use. The hour-a-week figure comes only from the 204 respondents who use Orbitask. The deadline and weekly-review figures compare groups of respondents, so they show an association, not that boards or reviews cause the difference. The 2028 figure is the authors' forecast, not a result, and the report excerpts don't define "small teams". …

The audit split the five sentences of copy into 13 rows, tightened 12 and cut 1. The causal "cut" became a group comparison carrying the report's own caveat, "twice" went back to 1.8 and "weekly review" to the source's 15 minutes or more, and the unsourced 10,000 was removed rather than softened into "thousands".

## Why it works

- **Quote first, from these sources only.** The exact-quote column, with "no supporting passage" as the only alternative, and the ban on memory stop the audit from paraphrasing or recalling a figure into agreement with the copy. A source that wasn't pasted is marked, not judged, so a missing file doesn't read as an overclaim.
- **Words, base and status are separate checks.** Overclaims hide in small words: "below target" becomes "missed", "expect to" becomes "will", 1.8 becomes "twice". Most keep the number and change what it describes: respondents become organisations, one kind of tool becomes the whole field, a rule for some becomes a rule for all, an estimate becomes a measurement, an association becomes a cause. Naming the status picks the honest verb ("say", "report", "is linked with", "expect"), and two studies stay two figures, never one trend.
- **Cut, don't soften.** An unsourced number turned into "many" or "thousands" is still unsourced. Removing it is the honest edit, and the rewrite cell can point to a sourced figure instead.
- **Copy lines, dates and one reading note.** Each rewrite reads as copy, with the status in the verb and the source in a short tag, though it runs longer than the original when it has to name who was counted. The base, method and caveats that don't fit go once into "How to read these numbers", in plain sentences, with who commissioned the research and when it ran. A figure without a date goes stale silently, and "now" is wrong a year later.

## Variations

- **Apply it.** Ask for the revised copy after the table. In Claude Code, ask the skill to apply the fixes: it searches for each figure so captions, alt text and meta tags get the same fix.
- **Keep figures as data.** When copy lives in code, store each figure with its source line and add a build check that fails on a figure without one.
- **Second pass.** Run it again on the revised copy in a fresh chat. A second reader catches what the writer of the rewrite stopped seeing.
- Generalised from a statistics-heavy explainer site.
