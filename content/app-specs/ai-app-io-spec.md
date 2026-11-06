---
title: Spec an AI app's inputs, outputs and model stages before any code
summary: Turn a one-paragraph AI app idea into a spec of every input, output, model call, code check, cost and fallback, so the model's job stays narrow and testable.
category: app-specs
tags: [specs, structured-output, pipelines, validation, testing]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: intermediate
use_as: prompt
---

## The prompt

Paste this into a Claude chat before you write any code. The answer runs to about 400 lines (around 11,000 output tokens), so use a strong model. Save it as `docs/ai-spec.md` in the new repo and build to it.

```text
Write the input/output spec for an AI web app before any code exists. The spec is the contract the build follows: it names every input, every output, every model call and every check, so the model's job inside the app stays narrow and testable.

App idea:
{{app_idea}}

Users: {{users}}
Constraints (stack, storage, sign-in, language, currency, units): {{constraints}}
Model budget per run (if blank, propose one): {{model_budget}}

Write Markdown with exactly these sections, in this order. Prefer tables to prose, one line per row.

0. Decisions. Open with one line naming the file that will hold the types: the single source of truth for every shape below. Then list each decision the idea leaves open, with the simplest choice marked **Assumed**. Never assume a country, currency, language or unit system the idea doesn't state.

1. Flow. Every step from first input to export, including steps with no model call. Columns: Step | Input | Processing | Output | Model calls.

2. Inputs. One table per input object. Columns: Field | Type | Range / values | Default | Used for.
- "Used for" names the stage that reads the field. Cut any field no stage reads.
- Give each enum value its meaning in numbers ("quick = under 20 min"), not just its name.
- Defaults are neutral. Required fields default to blank and block the run with a message naming the missing field.

3. Outputs. The stored shape, JSON-schema style. Columns: Field | Type | Content. Every number has a unit (minutes, grams, currency) and a basis (per person, per group, per unit). Give id formats and enum values. Mark the origin of every editable item or value (model or user). Then a "Coercion" line: how code turns loose model JSON into this exact shape (numbers parsed from strings, missing ids generated, unknown enum values fall back to a named default, an empty result rejected). Then the job-state shape (status, stage, partial results, cost so far) and a storage table: Key | Value | Retention | Who can delete it.

4. Pipeline. Columns: Stage | Who (model, code, or code lookup: <library or API>) | Input | Output.
- The model proposes; code derives. Anything computable from other values (dates, counts, sums, totals, verdicts, final times, ids) is computed in code. Ask the model for unit values, never totals. Any sentence that states a derived number (summaries, verdicts, assumptions, check messages) is written by code from a template using the same variables.
- Facts a library or API can supply (calendars and holidays, weather, daylight, exchange rates, distances) are looked up in code. Name the source. A model value is only a labelled fallback when the lookup fails.
- Split any "write the whole thing" call into stages whose output can each be checked. Batch repeated units, with a stated batch size, so one bad unit can be redone alone.
- For each model stage, state the model tier (fast or strong), reasoning effort, tools (web search or none) and the JSON it returns. Keep that JSON small and flat. Use the API's structured-output mode with it where available, and still coerce in code: code checks ranges and lengths, and a refusal or max_tokens stop can still break the shape.
- Code computes each unit's constraints and passes them in as short lines, with a list of what is already used so nothing repeats.
- If a fact can't be verified, the model returns it empty and code uses a named safe fallback. The model never invents one. Code also checks each fact the model does give against a bound it can verify (an enum, a distance, a range); a fact that fails takes the same fallback.

5. Checks in code. Columns: Check | Level | Rule | On failure.
Levels: P0 consistency (totals recompute from their lines, counts agree, ids unique, numbers quoted in text match the computed values), P1 feasibility (real-world limits), P2 fit to the user's input, P3 data quality. On failure: repair in code, or re-prompt only the failing unit, with its current version and the violations listed, and tell it to change nothing else. At most 2 rounds, then ship with the failed check visible. Store the results on the output and show them to the user. Never grade content the user wrote (use the origin marks from section 3).

6. Re-runs. If users can edit the output and regenerate, a table of what a re-run keeps and how: locked items, items the user added, values the user changed on model-made items (kept, never overwritten), and ids (never reused for a different thing, so references don't move).

7. Cost per run. Columns: Action | Model calls | Tier | Tools | Typical input / output tokens | Cap. Say what is metered (input tokens, output tokens including thinking, cache reads and writes, searches), what context is cached across calls, and the per-visitor caps. Fit the model budget. Give each charge or cap increment a unique ref so a retry never counts twice, and state what a failed or cancelled run counts. Don't quote prices from memory: write cost as a formula over per-token prices the builder fills in.

8. Failures. Columns: Failure | Detected by | Fallback | What the user sees. Cover at least: malformed or truncated JSON (repair, then one retry), rate limit or quota (one short backoff, then a fallback model or provider; state the SDK's own retry setting so retries don't stack), a run longer than one request should last (a server-side job the client polls, which survives reloads), a cancelled run, checks still failing after the last round, and every fallback from section 4.

9. API. Columns: Method | Path | Auth | Body → Response. Keep every route under /api. Long model work is a POST that creates a job, then a GET that polls it. End with one line of error codes, each with its JSON body.

10. Test fixtures. Three regression inputs (typical, edge case, hostile) and a scripted mock model that returns known-bad output. Name the checks each one must trip and the ones it must pass.

Write the spec only, no code. If the idea is too thin for a section, fill it with assumptions marked **Assumed** rather than skip it.
```

## Example

**Input**:
- `app_idea`: "A weekly dinner planner. The user enters household size, dietary rules (for example vegetarian, no nuts), what is already in the pantry, and how many minutes they can cook each weeknight. The app returns seven dinners with short recipes and one shopping list for the week, grouped by supermarket aisle. The user can lock dinners they like and regenerate the rest."
- `users`: Home cooks on phones, cooking for 1 to 6 people. No sign-in needed for the first plan.
- `constraints`: One serverless backend that calls the Claude API; key-value storage only, no database; metric units; English only; free to use, with a daily cap per visitor.
- `model_budget`: At most 4 model calls per weekly plan and 1 per regenerate; a fast model wherever a call is small.

**Output** (trimmed to two rows of the section 4 model-stage table, one row of its call settings, the lines code sends for one unit, two rows of its fact table, and two rows of section 5, Checks in code):

> | Stage | Tier (model) | Effort | Tools | max_tokens | Returns (structured-output JSON) |
> |---|---|---|---|---|---|
> | S4 Menu | strong (`claude-opus-5-5`) | medium | none | 3,000 | `{"dinners":[{"slot":1,"title":"","protein":"","base":"","key":[""]}]}` where key = 2–6 main ingredient names |
> | S6 Recipes | fast (`claude-haiku-5-5`) | low | none | 6,000 | `{"recipes":[{"slot":1,"ingredients":[{"name":"","qty":0,"unit":"","aisle":""}],"steps":[{"text":"","min":0,"hands":"","overlap":false}]}]}` |
>
> …
>
> | Setting | Value |
> |---|---|
> | Never asked of the model | Ids, totals, scaled amounts, dates, weekdays, servings, summaries, verdicts |
>
> **Lines code sends.** These are computed per unit, short, and include what is already used.
> ```
> household: 4 people · banned: peanut, almond, cashew, pesto, satay, … · avoid: <user_data>mushroom</user_data>
> pantry (prefer, names only): <user_data>rice; tinned tomatoes; onion</user_data>
> protein caps: legumes ≤3 · eggs ≤3 · dairy ≤3 · other_plant ≤3
> used: legumes ×2 · rice ×2 · titles: Chickpea curry; Lentil ragù
> slot 3 · Wed 2026-11-11 · weeknight · ≤30 min total for 4 people · concept: Spinach dal · legumes · rice
> slot 3 fix: title contains "satay" (banned by No nuts); change the dish, keep the protein and base
> ```
>
> | Fact | Model returns | Code verifies against | Named fallback |
> |---|---|---|---|
> | Aisle | An aisle enum, or "" if unsure (never a guess) | Aisle enum; the table's aisle wins when the ingredient is in the table | TABLE_AISLE, else `other` |
> | Amount per person | A number; null only with to_taste | Table min–max per person (matched); generic range (unmatched): g 1–400, ml 1–500, pc 0.05–3 | Matched: table typical, shown "estimated". Unmatched: null, "amount not given". |
>
> …
>
> | Check | Level | Rule | On failure |
> |---|---|---|---|
> | C04 Amount math | P0 | qtyTotal = qtyPerPerson × servings under the §3 rounding rule. | Code: recompute |
> | C07 Time math | P0 | totalMinutes = sum of non-overlapping steps; activeMinutes = sum of active steps. | Code: recompute |

The model returns one person's amounts and each step's minutes; code computes the totals, times and shopping list, and C04, C05 and C07 recompute them on every run. To fit the 4-call budget, this run spends one strong call on dish ideas, two fast calls on recipe batches and at most one on repair, and makes the second repair round code-only.

## Why it works

- **"The model proposes; code derives."** A model that writes both the lines and the total will sooner or later disagree with itself. Ask it for unit values only. Code computes every total, date and verdict, writes every sentence that quotes one, and looks up facts a library knows, so those numbers are right by construction.
- **Small, checkable stages.** Each model call gets one job, one small JSON shape and constraints code computed for it, so a scripted mock model can test it. Structured-output modes can reject a large schema as too complex and don't enforce every range, so code still coerces and checks.
- **Repairs that touch only what failed.** P0 to P3 checks run on every output. Re-prompting only the failing unit, with its current version and "change nothing else", fixes it without breaking what passed and keeps cost bounded. Origin marks stop a check or a re-run from "fixing" what the user wrote.
- **Open choices written down.** One types file gives the build one vocabulary for every shape. **Assumed** rows turn each choice the idea left open into a visible line you can overrule, instead of a silent default such as the builder's own currency or units.

## Variations

- **Retrofit an existing app.** In Claude Code on the repo: "Read the code and write `docs/ai-spec.md` in this shape for what the app does today. Mark every place where the model produces a value code could compute or look up."
- **Keep it current.** Add one line to the project's `CLAUDE.md`: "Change `docs/ai-spec.md` in the same commit as any change to an input, output, route or stage."
- **Checks first.** Follow up with "Turn section 5 into failing tests against the mock model from section 10", then build until they pass.
- **Build the pipeline.** Use [Model proposes, code disposes](https://prompts.helikos.dev/p/model-proposes-code-disposes/) to write the stage prompts for section 4 and wire in the checks from section 5.
- Generalised from a trip-planner app.
