---
title: "Spec a maturity assessment app: content contract, tested scoring, results in the URL"
summary: Spec a browser-only maturity assessment whose content is checked data and whose scoring is pinned by simulated respondents, so every result is reproducible from a link.
category: app-specs
tags: [specs, validation, testing, privacy]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: advanced
use_as: prompt
---

## The prompt

Run it in a chat, then hand the spec to the person or coding agent who builds the app. The spec holds one sample question. Have the builder, or a follow-up prompt run one dimension at a time, write the full content module to the section 1 standard; the section 2 contract rejects stubs. Review every anchor yourself.

```text
Write the build spec for a browser-only scored assessment on {{assessment_topic}}, for {{audience}}. An engineer or a coding agent will build the app from your spec without asking you anything, so make every rule exact enough to test.

Framework:
- Dimensions: {{dimensions}}
- Maturity levels, lowest first: {{levels}}
- Foundations (the dimensions that hold the others back): {{foundation_dimensions}}
- Pillars (groups of dimensions, or "none"): {{pillars}}

Where the framework leaves something open, decide it and list the decision under "Assumptions".

1. Content is data
- One content module holds the levels, dimensions, questions, KPIs, actions, red-flag texts and result profiles. The UI and the engine read it; neither hard-codes a question, label or threshold that belongs to the content.
- Every dimension has the same number of questions (default 5). Each question has an id prefixed by its dimension (e.g. design.q1), a topic, the question, a one-line help note, one anchor per level, and an evidence line: what someone could show to back the answer.
- Anchors describe behaviour an observer could check: who does what, how often, with what artefact. No anchor leans on adjectives such as "good", "mature" or "strong", and each differs from its neighbours in something observable. The respondent picks the anchor that fits; there are no 1-to-5 rating scales.
- Every question also offers "Don't know", stored as 0. It is an answer, not a skip.
- Exactly one question per dimension is flagged quick, so the quick scan asks one question per dimension and runs through the same engine.
- Each dimension has 3 KPIs: id, definition, unit, leading or lagging, how to collect it, and a target for each of the top three levels.
- Each dimension has an action library keyed by the level you move FROM, with at least 2 actions for every transition. Each action has an id, title, detail, owner role, effort (S, M or L), deliverable, and the id of a KPI in the same dimension that shows it worked.

2. A content contract the build enforces
List the assertions a build script runs over the content module; each failure message names the offending id. At minimum: the counts (levels, dimensions, questions per dimension, anchors per question, KPIs); with pillars, each dimension sits in one pillar and only one; no id appears twice anywhere in the module; each dimension has one quick question, no more and no fewer; no anchor is empty or a stub (set a minimum length); actions exist for every from-level; effort is S, M or L; each action points at a KPI of its own dimension; each flag the engine can return has its explanation and what-to-do, and each profile its description, risk and first move. The build runs these checks and the section 7 scenarios, and any failure blocks the deploy.

3. A pure scoring engine
- One module of pure functions: no DOM, no storage, no clock. The browser and the build script import the same file.
- Dimension score = mean of its answered questions. "Don't know" is left out of the mean and counted. A dimension with no answers scores null, never 0, and charts leave a gap for it.
- Level bands split the range 1 to L (the number of levels) into L equal bands. For five levels: below 1.8 is L1, below 2.6 L2, below 3.4 L3, below 4.2 L4, else L5. A dimension's current level is its band. Index = (score - 1) / (L - 1) x 100.
- Pillar score = mean of its dimensions; skip pillar scores if there are no pillars. Overall = mean of all scored dimensions, so pillar size does not skew it.
- Ceiling: progress can't outrun the weakest foundation. Ceiling = min(L, the weakest foundation's level + 1). Show it when it is below the ambition.
- Targets: the respondent picks an ambition (for example three options mapping to the middle, second-highest and top level). State any condition that raises one dimension's target above it.
- Gap = max(0, lower bound of the target level's band - score), so a dimension at its target level has no gap. Priority = gap x weight, + 0.3 when 40% or more of the dimension's answers are "Don't know". Weight starts at 1: + 0.25 for a foundation scoring below level 3, + 0.35 for a dimension named in a high-severity red flag. Rank by priority, then by lower score.
- Red flags: 6 to 12 named rules over dimension scores or specific answers, each with a severity (high or medium), the dimensions it names, a two-sentence explanation and a one-sentence what-to-do. An unknown input never raises a flag, and a "Don't know" never makes one high. Always include Blind spots: 40% or more "Don't know" in a dimension.
- Result profiles: 5 to 8 named profiles checked in a fixed order, first match wins, the last a catch-all. Each has a one-line description, its main risk and its first move. A profile that needs every dimension at some level fails if any dimension scores null.
- No flag or profile text claims anything its rule does not test.

4. A sequenced 12-month plan
- For each dimension below target, list the transitions from its current level up to its target and take every action for each. The first two transitions go into the 12 months and any later ones go to a "Beyond 12 months" backlog, so the plan never asks a dimension to climb more than two levels in a year. Never plan a transition at or above the target.
- Horizons: first 30 days, days 31-90, months 4-6, months 7-12, each with a cap on actions (e.g. 6, 10, 14, 16). First-transition actions land by effort: S in the first 30 days, M in days 31-90, L in months 4-6. Second-transition actions land in months 4-6, or 7-12 if L.
- 30-day slots go only to the three highest-priority dimensions; the S actions of other dimensions start in days 31-90. A dimension named in a fired high-severity flag is urgent: its S and M first-transition actions go into the first 30 days whatever its rank, and its L actions stay in months 4-6.
- When a horizon is full, its lowest-priority actions move to the next one; after month 12 they go to the backlog. Within a horizon: urgent first, then priority rank, then transition, then effort.

5. Results live in the URL
- No server, no database, no account. A result is a link: the answers encoded into the URL fragment (for example #result=...) as base64url JSON with a version number, the mode, the ambition, and one character per question in content order ("-" unanswered, "0" don't know, "1" up to the top level). Browsers never send the fragment to the server.
- Encode answers, not scores, so a fix to a scoring rule re-scores old links. A change to question order or count bumps the version.
- Decoding checks the version and the length, and shows a clear error for anything malformed instead of a wrong report.
- Leave names and organisations out of a share link unless the respondent ticks a box to include them.

6. The report
In this order: overall level, index and profile; the ceiling, if it binds; a chart of dimension scores against targets; red flags, each with what to do; the top three priorities with their gap; the plan by horizon, backlog collapsed; KPI targets for the target level; a "Method and limits" note saying this is a structured self-assessment, not a validated instrument, and that its thresholds and scoring rules are the author's assumptions. It prints cleanly and exports to JSON and CSV.

7. Scoring scenarios the build runs
Simulated respondents with fixed answers and the exact result each must produce. At least:
- every answer at the lowest level: L1, index 0, the lowest profile, a first 30 days that is non-empty and within its cap;
- every answer at the top level, top ambition: top level, index 100, no plan, no flags;
- for each red flag, one respondent that fires it and a near miss that must not;
- a "Don't know" among a flag's inputs keeps it at medium; all "Don't know" in a dimension gives a null score and Blind spots;
- the quick scan scores exactly one question per dimension;
- one respondent that lands in each result profile;
- an urgent dimension outside the top three lands in the first 30 days; a full horizon spills its lowest-priority actions into the next; each condition that raises a target;
- encode then decode returns the same answers.
Run the plan scenarios against a fixture action library (S, S, M, L for every transition) so content edits don't break them. Say whether expected numbers are raw or rounded for display, and keep to it.

Return Markdown with these sections: Overview (users; modes: quick scan, full assessment, shared report); Content model, with a sample of one question and its anchors and the actions for one transition, written to the standard above; Content contract checklist; Scoring rules, every threshold as a number; Red flags (table: name, rule, severity, dimensions); Result profiles, in check order; Plan rules; URL format; Report; Scoring scenarios (table: name, answers, expected result); Assumptions. Code only as short function signatures.
```

## Example

**Input**:
- `assessment_topic`: a product team's web accessibility practice
- `audience`: product teams of 5 to 50 people; each member answers for their own team
- `dimensions`: Ownership & policy · Design · Engineering · Testing & tooling · Content & media · Skills & training
- `levels`: 1 Unaware · 2 Reactive · 3 Defined · 4 Embedded · 5 Leading
- `foundation_dimensions`: Ownership & policy, Testing & tooling
- `pillars`: Foundations: Ownership & policy, Testing & tooling · Practice: Design, Engineering, Content & media, Skills & training

**Output** (trimmed to the sample question with three of its anchors, three of the nine red-flag rules and four of the 52 scoring scenarios):

> | Field | Value |
> |---|---|
> | question | How often is the product tested with a screen reader, and by whom? |
> | 2 Reactive | Someone tests with a screen reader only after a complaint, audit finding or customer request, and only on the screen it names; no record of the test is kept. |
> | 3 Defined | A written script names the screen reader and browser pairs and the key journeys to cover; a named tester runs it before each release that changes UI and logs defects in the tracker. |
> | 4 Embedded | As level 3, and every ticket that changes UI records a screen reader check by its engineer or tester before merge, using the scripted pairs. |
>
> …
>
> | # | id: name | Rule | Severity | Dimensions |
> |---|---|---|---|---|
> | 1 | `no-owner`: Nobody accountable | `answer(ownership.q1) ≤ 2` | high | Ownership & policy |
> | 2 | `shipping-blind`: Shipping blind | `score(testing) < 1.8` | high | Testing & tooling |
> | 4 | `regulated-exposure`: Legal duty, weak foundations | `regulated AND (score(ownership) < 2.6 OR score(testing) < 2.6)` | high | Ownership & policy, Testing & tooling |
>
> …
>
> - **Notation.** `all=k` sets all 30 answers to k. `dim=[a,b,c,d,e]` sets that dimension's q1–q5. `qid=k` sets one answer. `?` = Don't know (0). Later settings override earlier ones.
> - **Defaults.** Full mode, ambition `defined` (3), regulated off.
> - **Numbers.** All expected numbers are raw engine outputs, unrounded, compared with absolute tolerance 1e-6. Repeating decimals are written to 6 places. Levels, ranks, counts, ids and orders compare exactly.
>
> | ID | Name | Answers | Expected result |
> |---|---|---|---|
> | F2a | shipping-blind fires | `all=3; testing=[2,2,1,1,1]` | Testing 1.4. shipping-blind H, names testing. |
> | F2b | shipping-blind near miss | `all=3; testing=[2,2,2,2,1]` | Testing 1.8, L2. shipping-blind absent. |
> | D1 | Don't know caps severity | `all=3; testing=[1,1,1,1,?]` | Testing 1.0 from 4 answers, dkShare 0.2. shipping-blind fires M (base high, downgraded). Testing not urgent: weight 1.25, priority 2.0. blind-spots absent. |
> | PL1 | Urgent outside the top three | ambition embedded; `ownership=[2,4,4,3,3]; design=[2,2,2,2,2]; engineering=[2,2,2,2,2]; testing=[4,4,4,4,4]; content=[2,2,3,2,1]; skills=[4,4,4,4,4]` | Scores 3.2, 2.0, 2.0, 4.0, 2.0, 4.0. Flags exactly: no-owner H. Ranking: design 1.4, engineering 1.4, content 1.4, ownership 0.27 (rank 4, urgent). d30 = ownership.a3.1, .a3.2, .a3.3, design.a2.1, design.a2.2, engineering.a2.1. … |

Each anchor adds something an observer could check, from testing only after a complaint, finding or request, to a written script and a named tester, to a check recorded on every UI ticket. The rows check by hand: in D1 the Don't know demotes shipping-blind to medium, so testing keeps only the foundation weight (gap 2.6 − 1.0 = 1.6, × 1.25 = 2.0), and in PL1 ownership ranks fourth at 0.2 × 1.35 = 0.27 yet, as an urgent dimension, takes the first three 30-day slots.

## Why it works

- **Content as data behind a contract.** Assessment content is large and gets edited by people who never read the engine. The build check catches what a review misses (a stub anchor, a second quick question, an action pointing at another dimension's KPI, a duplicate id) and names the id, so structurally broken content cannot ship.
- **One observable anchor per level, plus "Don't know".** Respondents match what actually happens instead of rating themselves, which damps optimism and makes answers more comparable between people. Counting "Don't know" rather than guessing turns low visibility into a finding (Blind spots), and a null score stops an unknown dimension reading as a weak one.
- **Exact numbers in a pure engine, tested on simulated respondents.** With bands, weights and caps written as numbers, every result is reproducible, so known profiles can pin it down: all-lowest, all-top, each flag and its near miss. The foundation weight pushes weak foundations up the plan, the ceiling shows when one holds the rest back, urgent red-flag fixes jump the queue, and the two-levels-a-year and horizon caps keep the plan believable.
- **Answers, not scores, in the URL fragment.** Nothing about a respondent is stored on a server, yet the link reproduces the report anywhere. Because it carries answers, a corrected rule re-scores old links, and the version number stops a link made for an older question set from being scored against the new one.

## Variations

- **Cognitive test instead of a self-assessment.** Replace anchors with items that have one keyed answer, generated from a seeded PRNG so the form is identical for every taker. An answer-key validator fails the build when an item has other than one keyed option, a key index out of range, duplicate options, a key that differs from the answer recomputed from the item's rule, or a guessing parameter other than 1 / number of options, or when the keyed position never varies. Difficulty that falls within a section is a warning, not a failure.
- **Scoring a cognitive test.** Score each section with a three-parameter IRT model and estimate ability by EAP over a grid with a normal prior: unlike maximum likelihood, it gives a finite estimate for a perfect or a zero score, plus a standard error for a confidence range. Item parameters are set by hand until calibrated on real takers; say so in the report. Combine k standardised (z) domain scores as their sum divided by √(k + k(k−1)r), where r is their average intercorrelation, then rescale to mean 100, SD 15. The scoring check prints the expected raw score across a range of abilities, so you can see whether the items spread people out, and simulates candidates at known abilities; their mean recovered score must land near the truth.
- **Group mode.** Paste many result links into one view and aggregate only finished responses. Average each question across respondents, show the spread per dimension, and flag a gap between groups (for example leaders and everyone else) when it passes a threshold you state. Treat that flag as high severity, so it raises those dimensions' priority. Give each respondent a random id in the link so identical anonymous answers still count as two people.
- **Facilitated use.** Give each dimension a discovery brief in the content (interview questions, evidence to ask for and common pitfalls, each with a minimum count you set) and count them in the contract, so a facilitator can run the assessment as an interview.
