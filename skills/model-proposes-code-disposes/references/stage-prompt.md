# Stage system prompt and user message

Fill the system prompt once per model stage. Code builds the user message for each call.

## System prompt

| Placeholder | What to put there | Example (a study-plan generator) |
|---|---|---|
| `{{stage_name}}` | the stage's name | session-planning |
| `{{domain}}` | what the app generates | study plan |
| `{{stage_job}}` | what is fixed and what this stage fills, two sentences | The topic order, the dates and each day's available minutes are fixed. Fill each listed day with study blocks. |
| `{{fields_code_derives}}` | everything code computes from this stage's output | block start times, minutes per day and per topic, whether the plan is on track |
| `{{fields_model_provides}}` | the judgement fields only | each block's kind, topic, activity, minutes and resource |
| `{{json_shape}}` | a small, flat JSON example with enum values inline | `{"days":[{"date":"YYYY-MM-DD","blocks":[{"kind":"learn\|practice\|recall","minutes":0}]}]}` |
| `{{rules}}` | domain rules as `- ` lines | `- A REVIEW day has only practice and recall blocks.` |

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

For the skeleton stage, `{{stage_job}}` says what structure to propose, and the message has no "Plan these units" section. Delete the rule about "Plan these units", and in the repair rule replace `return every unit under "Plan these units" in full` with `return the whole object`.

## User message

Leave out any section that is empty. "Current version" and "Fix these problems" appear only on repair rounds.

- **Blocklist.** Write `Never use:` instead when the items are banned outright.
- **Already used.** On a repair round, build it without the items of the units being redone; they appear under "Current version" instead. Otherwise "never repeat" forbids the very items "change nothing else" tells the model to keep.
- **Current version.** List every field the model owns, or have code merge unchanged items back by id after the round. "Change nothing else" holds only for what the model was shown.
- **Problems.** Give the measured numbers, then the allowed fixes, so the model doesn't pick a fix of its own.

```text
<the user's brief, verbatim>

Fixed facts: <user inputs and earlier stages' results: dates, counts, limits, materials>

Plan these units:
- <unit id> · <constraint line code computed for this unit>

Quotas for these units: <counts code computed for this chunk, e.g. at least 2 practice blocks on weak topics>

Never flag as "<quality>": <the blocklist code supplies>

Already used (do not repeat): <titles from other units, capped to the most recent few dozen>

LOCKED (plan around these; do not return them): <items the user locked>

Current version of these units:
<unit id>: <its items, with every field the model owns>

Fix these problems from the previous version:
- <unit id>: <the failed check with the numbers code measured, then the allowed fixes>
```

The skeleton stage's single re-prompt ends the same way: its current version, then `Fix these problems from the previous version:` and the list.
