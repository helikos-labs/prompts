---
title: Ask 2–4 clarifying questions with tappable options
summary: Before an expensive generation, ask only the questions whose answers would change the result, as JSON your UI can render as chips.
category: ai-features
tags: [structured-output, ux]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: beginner
use_as: prompt
---

## The prompt

Send this, with the user's brief filled in, as the only message of a cheap, fast call before the main generation.

```text
You are reviewing a {{task_type}} brief before any work starts. Ask 2 to 4 short questions whose answers would materially change the result: {{dimensions_that_matter}}.

Rules:
- Do not ask about anything the brief already answers.
- Never assume a country, region, currency or audience the brief does not state. If {{required_inputs}} are missing, ask about them first.
- Each question gets 2 to 5 concise options the user can tap. Set "multi" to true only when several options can apply together.
- Keep "why" to one short clause saying what the answer changes.

Return JSON only:
{"questions":[{"id":"q1","question":"...","why":"...","multi":false,"options":["...","..."]}]}

Brief:
{{brief}}
```

## Example

**Input**:
- `task_type`: trip plan
- `dimensions_that_matter`: which places and in what order, nights in each, getting around, daily pace, accommodation, must-dos, limits
- `required_inputs`: the destination, dates or start and end points
- `brief`: "Japan, 10 days in mid-May. Two adults, mid-range budget. We like food markets, long walks and old towns. No car. Fly into Tokyo."

**Output** (trimmed to the first three of four questions, one per line; the fourth asks about a ryokan stay):

```json
{"questions":[
{"id":"q1","question":"Where do you fly home from?","why":"Decides whether the route loops back to Tokyo or runs one way.","multi":false,"options":["Tokyo","Osaka (Kansai)","Elsewhere in Japan","Not booked yet"]},
{"id":"q2","question":"Besides Tokyo, which areas appeal?","why":"Sets the stops and the order you visit them.","multi":true,"options":["Kyoto & Nara","Osaka","Kanazawa & Takayama","Hiroshima & Miyajima","Hakone or Nikko"]},
{"id":"q3","question":"How many bases over the 10 days?","why":"Sets nights per stop and how often you repack.","multi":false,"options":["2, few moves","3, balanced","4 or more, see more"]},
…
]}
```

The first question goes to the one required input the brief leaves out, the end point, and none of the four asks about dates, budget, transport or interests, which the brief already gives. Only the areas question sets `multi` to true, since a trip can take in several.

## Why it works

- **"Materially change the result"** is the filter. Naming the dimensions that matter stops the model asking about trivia it could decide itself.
- **"Do not ask about anything the brief already answers"** stops the most annoying failure: questions that make the user repeat themselves. Naming the required inputs and saying "ask about them first" puts the gap that blocks any plan at the top, instead of a guess.
- **Tappable options plus a `multi` flag** turn every answer into a tap or two, so the step costs the user seconds. The answers append cleanly to the brief for the real run.
- **A fixed JSON shape** lets the UI render the questions straight away. With an API that supports JSON-schema output, pass the same shape as a schema and run at low effort; this step needs no deep reasoning.

## Variations

- **Allow zero questions.** Add "If nothing material is missing, return an empty list" when most briefs are already complete, and skip the step in the UI.
- **Free-text escape.** Render an "Other…" chip next to the options; anything typed there goes into the brief verbatim.
- Generalised from a trip-planner app.
