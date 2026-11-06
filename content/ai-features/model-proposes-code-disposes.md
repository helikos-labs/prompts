---
title: "Model proposes, code disposes: split one big LLM call into checked stages"
summary: Let the model return only choices and unit values while code derives every total, checks each unit and re-prompts only the parts that fail.
category: ai-features
tags: [pipelines, structured-output, validation]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: advanced
use_as: prompt
---

## The prompt

Use this as the system prompt of each model stage, filled once per stage; give `{{rules}}` as `- ` lines that continue the list. The prompt is half the technique: the pipeline code around it (constraint lines, checks, repair loop) is in the skill. Code builds the user message for every call in the layout shown under the prompt.

```text
You are the {{stage_name}} stage of a {{domain}} generator. {{stage_job}}

You propose; code disposes. From what you return, code works out {{fields_code_derives}}. It then checks the result and may send back named problems to fix. So return only {{fields_model_provides}}. Give unit values (per item, per day, per person), never derived values such as totals, sums, counts, computed dates or verdicts. Code drops any you add.

Return one JSON object in exactly this shape:
{{json_shape}}

Rules:
- Everything under "Fixed facts" is settled: the user's inputs and the results of earlier stages. Build on it and never change it. Do not add items that code or another stage owns.
- Each unit under "Plan these units" has a constraint line computed by code. Meet every limit on that line exactly: counts, minutes, time windows, what is allowed on that unit. Return each unit under its id exactly as given.
- Never repeat anything listed under "Already used", and never repeat an item across the units in this reply.
- Items marked LOCKED belong to the user. Plan around them and leave them out of your reply.
- Name only things you are sure exist or that appear in the materials you are given. If you cannot confirm a name, number or fact, return "" or null for it; code uses a safe default. Never invent a value to fill a field.
- Every number uses the unit and basis its field names (minutes, per person, per group). Never mix bases.
- If the message ends with "Fix these problems from the previous version:", fix every problem listed, change nothing else, and return every unit under "Plan these units" in full.
{{rules}}
- Return the JSON object only: no prose before or after it, no code fences.
```

The user message, built by code for each call. Lines in angle brackets are filled per call; leave out a section when it is empty. On a repair round, "Already used" leaves out the items of the units being redone, since they appear under "Current version".

```text
<the user's brief, verbatim>

Fixed facts: <user inputs and earlier stages' results: dates, counts, limits, materials>

Plan these units:
- <unit id> · <constraint line code computed for this unit>

Quotas for these units: <counts code computed for this chunk, e.g. at least 2 practice blocks on weak topics>

Never flag as "<quality>": <the blocklist code supplies; or "Never use:" for a ban>

Already used (do not repeat): <titles from other units, capped to the most recent few dozen>

LOCKED (plan around these; do not return them): <items the user locked>

Current version of these units:
<unit id>: <its items, with every field the model owns (or code merges unchanged items back by id)>

Fix these problems from the previous version:
- <unit id>: <the failed check with the numbers code measured, then the allowed fixes>
```

## Example

A study-plan generator's session stage, on a repair round: code's checks failed two days, so only those two go back.

**Input**:
- `domain`: study plan
- `stage_name`: session-planning
- `stage_job`: The topic order, the dates and each day's available minutes are fixed. Fill each listed day with study blocks.
- `fields_model_provides`: each block's kind, topic, activity, minutes and resource
- `fields_code_derives`: block start times, minutes per day and per topic, progress against each topic's estimate, and whether the plan is on track for the exam
- `json_shape`:

```json
{"days":[{"date":"YYYY-MM-DD","blocks":[{"kind":"learn|practice|recall","topic":"a topic name from Fixed facts","activity":"what to do, one sentence","minutes":0,"resource":"an exact part of the course materials, or empty"}]}]}
```

- `rules`:

```text
- Blocks are 10 to 45 minutes.
- A REVIEW day has only practice and recall blocks, on topics already covered.
- End every day with a recall block of at least 10 minutes: closed-book questions answered from memory.
- Take resources only from the course materials in Fixed facts and name the exact part (section or question numbers). Recall blocks have resource "".
```

- User message:

```text
A first-year Introduction to Statistics student with a final exam on 2026-12-10. Weak on probability, confident with descriptive statistics. Prefers worked examples to videos.

Fixed facts: Topic order: 1 Descriptive statistics, 2 Probability rules, 3 Discrete distributions, 4 Normal distribution, 5 Sampling distributions, 6 Confidence intervals, 7 Hypothesis tests. Covered before these days: topics 1-3. Course materials: Textbook chapters 1-9 (chapter 5 is the normal distribution, sections 5.1-5.4); Problem sets 1-7 (set N matches topic N, questions 1-14 each); Past papers 2023 and 2024 (questions 1-12 each).

Plan these units:
- 2026-11-23 (Mon) · 90 min available · new topic: Normal distribution · end with 10+ min recall
- 2026-11-24 (Tue) · 45 min available · REVIEW day: topics 1-3 only, no new material · end with 10+ min recall

Already used (do not repeat): Problem set 2; Problem set 3 questions 1-6; Past paper 2023 questions 1-4

Current version of these units:
2026-11-23: learn Normal distribution 40 min (Textbook 5.1-5.2) "Read Textbook sections 5.1-5.2 and work through each worked example on paper before checking the printed solution."; practice Normal distribution 40 min (Problem set 4 questions 1-8) "Solve Problem set 4 questions 1-8 by hand, writing out every step and checking each answer before moving on."; practice Normal distribution 30 min (Problem set 4 questions 9-14) "Solve Problem set 4 questions 9-14 against the clock, about 5 minutes each, then mark them."; recall Normal distribution 10 min (no resource) "With the book closed, write from memory how to standardise a value and turn it into a probability, then check against today's notes."
2026-11-24: learn Normal distribution 30 min (Textbook 5.4, normal approximation to the binomial) "Read Textbook section 5.4 and work its examples of approximating a binomial probability with a normal one."; recall Probability rules 15 min (no resource) "With the book closed, write from memory the complement, addition and multiplication rules and the definition of conditional probability, with one short example of each."

Fix these problems from the previous version:
- 2026-11-23: blocks total 120 min; the day has 90 min available. Shorten or drop practice blocks; keep the learn and recall blocks.
- 2026-11-24: "Textbook 5.4, normal approximation to the binomial" is new material on a REVIEW day. Replace that block with practice on topics 1-3 from materials not listed under Already used.
```

**Output** (complete; reformatted onto lines, whitespace only):

```json
{"days":[
  {"date":"2026-11-23","blocks":[
    {"kind":"learn","topic":"Normal distribution","activity":"Read Textbook sections 5.1-5.2 and work through each worked example on paper before checking the printed solution.","minutes":40,"resource":"Textbook 5.1-5.2"},
    {"kind":"practice","topic":"Normal distribution","activity":"Solve Problem set 4 questions 1-8 by hand, writing out every step and checking each answer before moving on.","minutes":40,"resource":"Problem set 4 questions 1-8"},
    {"kind":"recall","topic":"Normal distribution","activity":"With the book closed, write from memory how to standardise a value and turn it into a probability, then check against today's notes.","minutes":10,"resource":""}]},
  {"date":"2026-11-24","blocks":[
    {"kind":"practice","topic":"Discrete distributions","activity":"Solve Problem set 3 questions 7-12 by hand, writing out every step, then check your answers and redo any you got wrong.","minutes":30,"resource":"Problem set 3 questions 7-12"},
    {"kind":"recall","topic":"Probability rules","activity":"With the book closed, write from memory the complement, addition and multiplication rules and the definition of conditional probability, with one short example of each.","minutes":15,"resource":""}]}
]}
```

Both days now fit (40 + 40 + 10 = 90 minutes; 30 + 15 = 45), and the reply holds no totals: code sums the minutes. The model dropped Monday's 30-minute practice block, replaced Tuesday's new-material block with topic 3 practice on Problem set 3 questions 7-12, past the already-used 1-6, and returned the other four blocks word for word.

## Why it works

- **Unit values in, derived values out.** Ask a model for the lines and the total, and sooner or later they disagree, with nothing downstream to notice. When the schema holds only judgement calls and unit values (minutes per block, a rate per night), code computes every date, count, total and verdict, so they are right by construction. Code also writes any sentence that quotes a derived number, from a template, so a check can parse the numbers back.
- **One constraint line per unit, computed by code.** A rule list that applies "on review days" or "on travel days" gets applied unevenly across a long reply. Code already knows each unit's role, budget and limits, so it states them on that unit's line and the model only has to meet what it is shown. Chunks of up to four units keep each reply small enough to check and redo alone; the "Already used" list carries de-duplication across chunks, leaving out the units being redone on a repair round.
- **"Fix these problems from the previous version:"** Checks in code, in priority order (consistency, feasibility, fit, data quality), report each violation with the numbers they measured and the fixes allowed. Only the failing units go back, with their current version, for at most two rounds. Code reruns every check on the whole output and rolls a round back only if failures (failed checks plus quota shortfalls) went up. Judging unit by unit would discard the redraft of a unit added only to fill a quota. "Change nothing else" stops a repair round from churning the parts of a unit that already passed.
- **Empty beats invented.** A model that must fill every field will make up a name or a figure. Allowing "" or null, with a safe default in code, turns a hallucination into a visible gap. Where the API supports JSON-schema output (Claude: `output_config.format`), pass each stage's shape as a schema: small per-stage schemas compile where one whole-document schema may not. Claude's structured outputs don't accept limits such as `minimum` or `maxLength` (a raw schema with them is rejected; most SDK helpers strip them and check the reply), so code still checks every limit. Without schema output, tolerant coercion and a loose JSON parser absorb the formatting slips; if parsing still fails, one retry says "That reply was not one valid JSON object. Return only the JSON object, nothing else."

## Variations

- **The skeleton stage.** Run the same template first to get the structure: here, the topic order and study hours per topic, from which code lays out dates and review days. Fill it without the "Plan these units" rule, and end the repair rule with "return the whole object" instead. Check the skeleton in code; on violations, re-prompt once with its current version and the same "Fix these problems from the previous version:" list, keep the redraft unless it has more violations, then fix what is left in code.
- **Earned flags.** A label that claims a quality ("staff pick", "beginner-friendly") needs a reason field and is never allowed on items from a blocklist code supplies, such as the catalogue's best-sellers. Code clears any flag that fails either test.
- **Re-runs after user edits.** Pass the user's locked items as LOCKED, and let items the model kept take their old ids, so links and notes don't move to a different item.
- **Convert an existing app.** The SKILL.md walks through turning an app's single call into this pipeline.
- Generalised from a trip-planner app.
