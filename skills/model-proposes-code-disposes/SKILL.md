---
name: model-proposes-code-disposes
description: Splits an app's single large LLM call ("write the whole plan / schedule / itinerary / report as JSON") into checked stages. The model proposes choices and unit values; code derives the totals, runs the checks and re-prompts only the failing parts. Use when an LLM feature's totals don't add up, dates or counts disagree, items repeat, constraints are ignored on some units, or JSON comes back truncated or malformed, and when the user says "split this prompt into stages", "validate the LLM output in code", "make the generation reliable" or "model proposes, code disposes".
---

# Model proposes, code disposes

Turn one "write the whole thing" LLM call into stages. The model makes the judgement calls and returns unit values. Code derives everything computable, repairs what it can, checks the result, and sends back only the parts that fail.

```
skeleton (model) → derive (code) → content per chunk (model)
  → coerce, repair, checks (code) → re-prompt failing chunks (model, at most 2 rounds)
  → ship with the check results visible
```

Use it when one call returns a large JSON document and the output has sums that don't add up, dates or counts that disagree, items repeated across sections, constraints honoured on some units but not others, or JSON cut off at the token limit. Skip it for small single-answer calls: the pipeline costs more calls and more code.

Work in this order. Each step names what to write; keep the existing feature working until step 8 replaces the old call.

## 1. Inventory the current call

Read the current prompt, its output schema and the code that consumes the output. Classify every output field:

| Class | Examples | Who produces it |
|---|---|---|
| Judgement | names, choices, order, descriptions, unit estimates (minutes per task, rate per night) | the model |
| Derivable | dates, day of week, counts, sums, totals, averages, verdicts (fits / doesn't fit), ids, start times | code |
| User input | anything the user typed or picked | code copies it; never ask the model to echo it |
| Lookup | public holidays, time zones, exchange rates, unit conversions | code, from a library or API |

Remove every derivable, user-input and lookup field from what the model returns. A total the model is asked for is a total it will one day get wrong.

## 2. Split out the skeleton stage

The skeleton is the smallest set of model choices that fixes the structure: an outline, a route, a topic order, a list of sessions. Ask for it in its own call, with unit values only (per item, per night, per person), never totals.

- Pick one field the model returns as the **source of truth** for structure (for example the dated transitions between sections, not the model's count per section) and derive the rest from it. When the model's own counts disagree, rebuild from the source of truth and record the correction as a sentence.
- Validate the skeleton in code: first and last units are the ones the user fixed, counts add up to the fixed total, a link exists between each consecutive pair, caps are respected.
- On violations, re-prompt once with the current version and `Fix these problems from the previous version:` plus the list (the stage prompt adapted for the skeleton is in [references/stage-prompt.md](references/stage-prompt.md)). Keep the redraft unless it has more violations, then fix what is left in code.

## 3. Derive the structure in code

Build the full structure from the skeleton: every unit (day, session, section), its date, its role (first, last, transition, normal, review), calendar facts and lookups. Then, for each unit, compute one constraint line the content stage will see:

```
- 2026-11-24 (Tue) · 45 min available · REVIEW day: topics 1-3 only, no new material · end with 10+ min recall
```

Also compute every verdict from numbers in code (does it fit, is the bundle worth it) and write its sentence from a template that contains the numbers compared. Any generated text that quotes a derived number comes from a template, so a check can parse the numbers back.

## 4. Fill content in chunks

- Write the stage system prompt from [references/stage-prompt.md](references/stage-prompt.md): one filled copy per stage.
- Group units into chunks of at most 4, never across a structural boundary (one place, one week, one section).
- Make one call per chunk. The user message carries: the brief, `Fixed facts`, `Plan these units` (the constraint lines), per-chunk quotas (for example a minimum count of items of a kind the user weighted highly, scaled by the number of units), any blocklist, and `Already used` (titles from other units, capped to the most recent few dozen).
- On a repair round, build `Already used` without the items of the units being redone; they appear under `Current version` instead. Otherwise "never repeat" forbids the very items "change nothing else" tells the model to keep.
- Flags that claim a quality ("staff pick", "beginner-friendly") need a reason field and are never allowed on items from a blocklist code supplies. Code clears any flag that fails either test.
- Scale max tokens with the chunk (a fixed allowance per unit plus headroom). Thinking counts against max tokens and can't be turned off on Claude Opus 5.5, so add a fixed allowance for it too, and stream large requests. If a reply stops at max tokens, split the chunk in half and call again instead of parsing the cut-off reply ([references/loose-json.md](references/loose-json.md)).
- Run chunks in order when `Already used` matters; otherwise they can run in parallel.

## 5. Parse, coerce and repair in code

- Where the API supports JSON-schema output, pass each stage's shape as a schema; otherwise parse with the loose parser and one retry. Both are in [references/loose-json.md](references/loose-json.md). A schema guarantees the shape, not the limits, so the steps below still run.
- Coerce with readers that never throw: `obj`, `list`, `str`, `num(fallback)`, `numOrNull` (keeps "unknown" distinct from 0), `bool`, `oneOf(allowed, fallback)`. An unknown enum value becomes a named default, a missing id is generated, an item without its required field is dropped. Fields the schema doesn't name are ignored.
- Repair everything code can fix without the model, and log each fix as a sentence: clamp values to their allowed range, move items into their allowed window, drop items that break a hard rule, drop duplicates, clear unearned flags, normalise every amount to one basis (per person or per group). What code can't fix, such as a unit left too thin, becomes a violation for step 7.

## 6. Write the acceptance checks

Checks run on the finished, repaired output. Each returns `{ id, level, ok, message }`, where `level` is one of the four below, in priority order. Failing units return a map of unit id to reasons; collection-wide shortfalls return quota lines.

| Level | Checks | Example |
|---|---|---|
| Consistency | totals recompute from their lines; counts match dates; each unit belongs to exactly one parent; every number in generated text appears in the calculation | `Minutes per day and per topic recompute exactly from the blocks.` |
| Feasibility | real-world limits: capacity, time windows, availability, physical limits | `Every block fits inside the day's available minutes.` |
| Fit | the user's preferences: pace, quotas, weights reflected in the mix | `Each weak topic gets at least its weighted share of practice.` |
| Data quality | labels, notes and names present and honest | `Every non-recall block names an exact section or question range.` |

Write each violation as an instruction: the measured numbers, then the allowed fixes. `blocks total 120 min; the day has 90 min available; shorten or drop a block` gets a targeted fix; `too long` gets guessed at. Never grade items the user wrote; count them toward totals only.

## 7. Re-prompt only what failed

```
for round in 1..2:
  targets = failing units
  if quota lines exist: add a few units with the most room
  if no targets: stop
  for each chunk of targets (max 4):
    call the content stage with "Current version of these units" and
    "Fix these problems from the previous version:" + that chunk's violations + the quota lines
  coerce, repair and rerun every check on the whole output
  if failed checks + quota shortfalls went up: restore the version from before this round
```

Judge a round on the whole output, not unit by unit. A unit added only to take a quota has no violations of its own before or after its redraft, so a per-unit "fewer violations" test would throw away the very redraft that fills the quota.

After the last round, ship with the remaining failures visible. Two rounds cap cost and latency; a third rarely fixes what two did not.

## 8. Ship with the checks visible, then remove the old call

- Store the check results on the output and show them: a pass count such as `17 of 19 checks passed`, plus the list of repairs code made in steps 2 and 5.
- Strip draft-only fields (such as a "needs review" marker) before saving.
- Delete the single-call path once the pipeline passes step 9.

## 9. Test with a scripted mock model

- Make the model caller an injected function, so tests can pass a mock that returns scripted `{ text, stopReason }` replies per stage.
- Write three fixtures: typical, edge case (one unit, a return to an earlier section, a boundary date) and hostile.
- Script the mock to return known-bad content first and repaired content when the prompt contains `Fix these problems`, and one `max_tokens` reply to exercise the chunk split.
- Assert: every consistency and feasibility check passes; repair calls happen and stay bounded; derived numbers recompute from their inputs; no item appears twice.
- Run the hostile fixture with repair rounds set to 0 and assert that code alone passes every consistency and feasibility check it can fix, and that only model-owned failures remain, reported as violations for re-prompting.

## Re-runs, if users edit and regenerate

- Pass items the user locked under `LOCKED (plan around these; do not return them)` and merge them back in code.
- Items the user added stay on their unit while it still fits; otherwise they move to a side list instead of disappearing.
- An item the model kept takes its old id. A new item gets an id no earlier item had, so links and notes never move to a different item.

## Done when

- [ ] The model's schemas contain no derivable, user-input or lookup fields.
- [ ] Every content call carries per-unit constraint lines and an `Already used` list that leaves out the units being redone.
- [ ] Schema-constrained output where available, else loose parsing plus one "Return only the JSON object" retry, wraps every model call; a reply cut off at max tokens splits its chunk instead of being parsed.
- [ ] Consistency, feasibility, fit and data-quality checks run on every output, and their results are stored and shown.
- [ ] Re-prompts target failing units only, at most 2 rounds, and a round is rolled back if the whole output's failures go up.
- [ ] Mock-model tests cover the three fixtures and the run with repair rounds off, and pass.
