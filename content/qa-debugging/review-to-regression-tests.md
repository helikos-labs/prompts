---
title: Turn an adversarial review into acceptance checks and one regression test per defect
summary: Claude Code turns each defect from a review of one AI output into a check that runs on every result, a mock-model replay and a named offline regression test.
category: qa-debugging
tags: [testing, mocking, validation, review]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: advanced
use_as: claude-code
---

## The prompt

Run it in Claude Code at the root of the app that generated the output, on a branch: it changes how results are generated and saved (a re-prompt loop, and results with a P0 failure are no longer saved), not only the tests. First commit the request and the model's raw reply that the review covers. Paste the review's defect list as written, one defect per line, each with an ID and a severity. If the review has none, number the defects and give each a severity from the scale in the prompt.

```text
Below is the defect list from an adversarial review of one real {{output_type}} this app generated. Each defect has an ID (D1, D2…) and a severity: P0 wrong or unsafe, P1 unworkable, P2 misses the brief, P3 data quality. Turn every defect into code that catches it on every future result, and into a test that reproduces it offline.

Defect list:
{{defect_list}}

The request and the model's raw reply that the review covers: {{reviewed_output}}. Build the defect fixture from them; never reconstruct a reply from the defect list.

First read the generation path: where the model is called, how its reply is parsed, the result type, and where results are saved and shown. Then work in this order.

1. Coverage table
- Before writing code, list one row per defect: ID, severity, check id, fix (code, re-prompt or warn) and test name.
- Name the unit: the smallest part of the result you can regenerate on its own (a day, a section, a slide).
- If a defect can't be judged from the request and the result alone, mark it "review only" and say what is missing. Don't write a weak check for it.

2. Code fixes first
- Anything code can derive (totals, counts, dates, lists built from other fields, unit conversions) is computed after parsing, and the model's version is discarded.
- When dropping, moving or relabelling an item makes a unit valid without breaking it (a duplicate, a closed venue, an activity past a time limit), do it in code. Re-prompt only for the gap that leaves.
- Every number in model-written prose (a summary, an assumptions line) is generated from the same variables, or checked against them.
- Record each fix as a plain sentence ("Recomputed the total: …", "Removed …").
- You may tighten the generation prompt too, but a prompt change never replaces a check.

3. Acceptance checks: one module of pure functions, no model, no network
- runChecks(request, result) returns { checks, failingUnits, shortfalls }.
- A check is { id, level: 'P0' | 'P1' | 'P2' | 'P3', ok, message }. Its level is the defect's severity.
- A failing message names the offending items and the rule they break, precisely enough to send to the model as an instruction. A passing message states the rule that holds. A check that doesn't apply passes and says why.
- failingUnits maps each unit to its reasons. shortfalls lists result-wide gaps that no single unit owns.
- Take limits from the request when it states them, else from one rules module that the checks, fixes, mock and tests all import.
- Run the checks on every result, after the code fixes. Store them on the result as `checks`, plus one info row (level "info", always passing, not counted in N/M) that lists the code fixes. If there is a UI, show them as "Quality checks: N/M passed", failures first.

4. Targeted re-prompts
- Re-prompt only the failing units, plus the passing units you hand a shortfall to: those best placed to close it (the most cost to cut, the most free time), each told how much to close. Leave every other unit untouched. Never re-prompt content the user edited or locked.
- A check on a value code computes is never re-prompted, since code discards the model's version. If it fails after the code fixes, fix the code.
- Each re-prompt names its unit on its own line, gives the unit's current content, and ends with its reasons under the exact heading "Fix these problems from the previous version:".
- Above that heading, list what the other units already contain under "Already used (do not repeat):", leaving out the units revised in the same round.
- Keep a repaired unit only if it parses and its worst failing level is no worse than the current unit's. Otherwise keep the current unit and its reasons.
- After each round, apply the code fixes and run the checks again. Stop after 2 rounds, or sooner when no unit has a reason left to re-prompt.
- A P0 still failing after the last round blocks the result: don't save it or show it as done; return the failing P0 messages instead. P1 and P2 failures are re-prompted, then shipped with their failed checks visible. P3 never triggers a re-prompt; it only warns.

5. A scripted mock model
- Same signature as the real model caller. It records every call it gets.
- A fixture file holds the request, the replies that reproduce each defect and each unit's repair replies, one per round. Copy the defect replies from the reviewed output: trim only what no check reads, and keep whole anything a total or cross-unit defect depends on.
- The repair heading and the unit-line prefix are constants that the prompt builder and the mock both import. When a prompt contains the heading, the mock answers with the next repair reply for the unit it names.
- Units with nothing scripted get generic, well-formed content, so the whole pipeline runs end to end.

6. Tests with {{test_runner}}
- One test per defect ID, named "D<n>: <the rule>". Assert the property directly on the final result (recompute the total, search for the excluded term), not just the check's own verdict.
- Before repair: run the defect fixture with re-prompts off. Defects fixed in code already pass; every other defect's check fails. For each defect fixed in code, also run the checks on the raw parsed reply, before the code fixes, and assert its check fails with a message naming the offending items. Together these prove every check catches its defect.
- Re-prompts reached only the failing units and the units given a shortfall, within 2 rounds: count the recorded calls.
- Severity: a repair reply that leaves a P0 failing blocks the result and nothing is saved; one that leaves a P2 failing ships with that check visible, failures first; a P3 failure makes no re-prompt.
- A repair reply that doesn't parse, or fails at a worse level than the unit it would replace, is discarded: the unit keeps its current content and reasons.
- A clean fixture with no defects passes every check, so the checks don't fire on good output.
- A unit test for each code fix, on a small hand-made input. Applying the code fixes twice changes nothing.
- No test calls the real model or the network. Wire the tests into the repo's test script so CI runs them.

Run the tests, and the type check or build if the repo has one. Finish with the coverage table, each changed file's path with one line on what changed, and the test output.
```

## Example

**Input**:
- `output_type`: weekly dinner plan (seven dinners with recipes, a shopping list, a cost estimate and a one-line summary)
- `defect_list`:
  ```text
  D1 · P0 · Thursday's "Peanut satay noodles" uses peanut butter; the household brief excludes peanuts (allergy).
  D2 · P0 · The summary says "about EUR 52 for the week"; the shopping-list lines add up to EUR 57.10, and the recipes' own ingredient costs come to EUR 63.00, over the EUR 60 budget. No warning.
  D3 · P1 · The shopping list doesn't cover the recipes: feta (Wed) and coconut milk (Fri) are missing; chickpeas are listed at 400 g, but Mon and Wed need 800 g.
  D4 · P2 · Weekday dinners over the 30-minute cap: Tuesday's beef lasagne takes 75 minutes.
  D5 · P3 · Rice appears twice on the shopping list in different units: "300 g" and "2 cups".
  ```
- `reviewed_output`: `samples/brief.json` and `samples/reviewed-plan.json`
- `test_runner`: node:test, run as `node --experimental-strip-types --test test/*.test.ts` (TypeScript, no dependencies)
- The repo: a small TypeScript meal planner with no tests. `src/generate.ts` makes one model call for the whole week and parses the JSON reply into the `MealPlan` type; `src/api.ts` saves the plan and returns it as done. The household brief asks for 4 people, no peanuts, weekday dinners of 30 minutes at most and EUR 60 a week.

**Output** (trimmed to the opening lines, the coverage table and part of the test output):

> Code fixes and checks now catch all five defects, and re-prompts repair the rest. On the reviewed reply, the pipeline makes 5 model calls and ends with all 8 checks passing. All 27 tests pass offline, and a strict `tsc` check is clean.
>
> …
>
> | ID | Sev | Check id | Fix | Test |
> |---|---|---|---|---|
> | D1 | P0 | `no-excluded-ingredients` (searches titles, ingredients and steps, including other names: peanut, groundnut, satay, arachis, monkey nut) | Re-prompt Thu. Taking the peanut butter out would break "Peanut satay noodles". The shopping list drops it automatically because it is rebuilt from the recipes. | `D1: no dinner contains an excluded ingredient (peanuts), in any form` |
> | D2 | P0 | `cost-figures-match-recipes`, `prose-figures-match-plan`, `within-budget` | Code: recompute the cost, rebuild the list, rewrite the summary's figures, add an over-budget warning. Re-prompt: the EUR 3.00 gap goes to the costliest dinners (Fri cuts 2.54, Sun cuts 0.46). The result is blocked if it is still over budget. | `D2: the estimated cost, the shopping-list total and the summary state the recipes' real cost, which stays within the weekly budget` |
> | D3 | P1 | `shopping-list-covers-recipes` | Code: the list is rebuilt from the recipes | `D3: the shopping list holds every recipe ingredient in the total quantity the recipes use` |
> | D4 | P2 | `weekday-prep-cap` (uses the longer of prepMin and the longest timed step) | Code swaps the dinner with a weekend dinner that fits the cap; otherwise re-prompt. Here Sat (60 min) and Sun (90 min) don't fit, so Tue is re-prompted. | `D4: weekday dinners (Mon-Fri) take at most the brief's 30-minute cap` |
> | D5 | P3 | `shopping-list-one-line-per-ingredient` | Code merges lines by converting units (rice at 185 g a cup gives 670 g). If the units can't be converted, it only warns. | `D5: each ingredient is on the shopping list once, in one unit` |
>
> …
>
> No defect is marked "review only". The one limit: the checks trust the model's cost estimate for each ingredient. Telling whether those prices are realistic would need a price source, and no defect asked for that.

```
…
✔ before repair: code fixes already pass D2's figures, D3 and D5; D1, D2's budget and D4 still fail
…
✔ re-prompts reach only the failing units and the units handed the budget shortfall, within 2 rounds
✔ severity P0: a repair that leaves a P0 failing after the last round blocks the result, and nothing is saved
✔ severity P2: a repair that leaves a P2 failing ships, with that check visible and listed first
✔ severity P3: a P3 failure only warns and makes no re-prompt
✔ discard: a repair reply that doesn't parse is dropped, and the unit keeps its content and reasons
✔ discard: a repair that fails at a worse level than the unit it would replace is dropped
✔ clean: a reply with none of the defects passes every check, before and after the code fixes, with no re-prompt
…
ℹ tests 27  ℹ pass 27  ℹ fail 0
```

The code fixes alone cleared D2's figures, D3 and D5. One round of re-prompts then went to Tue (D4), Thu (D1) and the two costliest dinners, Fri and Sun, for the EUR 3.00 budget gap, and left Mon, Wed and Sat untouched.

## Why it works

- **One defect, three artefacts.** Each ID becomes a check that runs in production, a replay in the mock and a named test, tied together by the coverage table, so the same mistake won't come back unflagged, as far as its check is precise. The fixture is the reviewed reply itself, not a reply rebuilt from the defect list, so the replay proves something. "Review only" rows show what code can't judge instead of hiding it behind a weak check.
- **Code computes, the model writes.** Totals, derived lists and dates are what models get wrong and code gets right every time, so computing them removes the defect rather than catching it later; re-prompting for them would be wasted, since code discards the model's version. Dropping a duplicate or an item past a limit in code costs no call and can't add a new mistake, so the model only fills the gap. One rules module keeps checks, fixes, mock and tests on the same limits.
- **The failure message is the re-prompt.** A failing check names the items and the rule, so one string drives the re-prompt, the UI row and the test failure. Only failing units and those handed a shortfall go back, at most twice, never what the user edited, and the "Already used" list stops a redone unit from repeating the others. A redo that fails worse is dropped, so a fix for a slow recipe can't bring back the allergen. Severity sets the consequence: P0 blocks, P1 and P2 ship flagged, P3 only warns.
- **Tests prove both directions.** Asserting the property directly catches a buggy check that would pass its own test. Running the checks on the raw reply proves that even the checks behind code fixes fire, so a fix that regresses is caught; the clean fixture proves the checks stay quiet on good output. The heading is a shared constant, so the mock can tell a re-prompt from a first call, and the scripted replies let CI run it all offline in seconds.

## Variations

- **No UI yet.** Return `checks` in the API response and log the failed check ids. The pass rate per check is a cheap quality metric when you change the model or the prompt.
- **Live eval.** Swap the mock for the real model and run the defect fixtures' requests as an eval: same checks, real replies.
- **The next review.** Append new defects to the same fixture and table as D6, D7… and never renumber, so test names stay stable across reviews.
- **Staged generation.** Pairs with [Model proposes, code disposes](https://prompts.helikos.dev/p/model-proposes-code-disposes/), which splits one big call into checked stages and gives the full re-prompt layout under the same heading.
- Generalised from a trip-planner app.
