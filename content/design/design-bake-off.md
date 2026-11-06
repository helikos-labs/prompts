---
title: "Pick a visual direction by bake-off, then write it up as DESIGN.md"
summary: Build 3–4 named specimen pages, judge them against your product's jobs, graft the best ideas from the losers, and write a DESIGN.md with a colour budget and AA fixes.
category: design
tags: [design-tokens, accessibility, specs]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: intermediate
use_as: prompt
---

## The prompt

Paste this into a Claude chat with artifacts on, or into a Claude Code session, so each specimen becomes a page you can open. It takes two turns: Claude builds the specimens and stops, you open them, then you reply "judge". Fill in the five placeholders.

```text
Choose the visual direction for {{product}} by bake-off, not by first idea.

The main screen every specimen shows (what is on it, the primary action, any sample data):
{{main_screen}}

The jobs the design must do, most important first:
{{jobs}}

References (products or styles to learn from): {{references}}
Constraints: {{constraints}}

Work in two turns. In this turn, do step 1 only, then stop so I can open the pages. When I reply "judge" (perhaps naming my favourite, which you score like the others), do steps 2–5.

1. Specimens. Make 3 or 4 specimens, each a small, self-contained HTML page in a clearly different direction.
   - Give each a two- or three-word name that describes its look (never "Option A"), a one-line idea, the references it leans on, and its signature device: the one thing someone would remember it by.
   - Every specimen shows the same real content: the main screen above with realistic data, including its primary action, one data display (a chart, score or progress), a list or table, a paragraph of body text, and an empty or error state.
   - Directions must differ in more than colour: light or dark base (where the constraints allow), type, shape and depth, density, and how data is drawn. Four palettes on one layout count as one specimen.
   - Each page must hold up at 390 px wide as well as on a desktop.
   - Blend mode: if the references are written "X × Y", every specimen is a different blend of the two (for example X-led, Y-led, X's structure with Y's moments), and each says what it takes from which.
   - Write the complete HTML for every page, never a description of it: in a chat, each page as its own artifact; in Claude Code, a file at specimens/<specimen-name>.html.

2. Judge. Score every specimen 1–5 against each job and each constraint, with one line of evidence per score that points at something on the page. Weight the job scores by rank (for n jobs, ×n for the first down to ×1 for the last) and total them; total the constraint scores separately. Also note craft (does it hold up at phone width and small sizes) and coherence (could someone design a new screen from its rules alone). Pick the specimen with the best weighted job total, not the prettiest. Contrast failures don't decide the pick, because step 4 fixes them; a constraint that can't be met without changing the direction (its base, its layout at 390 px) rules a specimen out. Say in one sentence why the pick beat each of the others.

3. Graft. Bring 2 or 3 named ideas from the losing specimens into the pick. For each: the idea, the specimen it came from, the job it serves, and how it is redrawn and renamed in the pick's vocabulary (its metaphor, colours, type and shapes). Reject a graft that needs a colour outside the budget below, or a second signature device that competes with the first.

4. Fix. Check the pick plus grafts against the contrast rules below and list each fix as before → after.

5. Write DESIGN.md for the chosen system, with these sections:
   - The idea: one sentence, then the base (light or dark) and why, from who uses it and where (glanced at on a phone, read at night, printed).
   - Provenance: the pick, the specimens it beat and on which jobs, and each graft with its source specimen.
   - Borrowed and dropped: a table with one row per reference. Columns: Reference | Borrowed | Dropped, and the cost. The last column names the concrete cost (a contrast ratio that fails, a reading cost, a print or performance cost, token sprawl) and what replaced it.
   - Colour budget: at most four colour jobs: neutral (the default for all UI); one action colour (buttons, links, focus and selection only, kept out of headings and running text); one data scale (the sole source of hue in charts and scores); status colours only if the product needs them. One job per colour, never shared. If categories would also need colour while the data scale uses it, tell them apart with labels and symbols instead. To stress a word or number in a heading, underline it or raise its weight in the heading colour, never in the action colour. Then a token table: Token | Value | Role | Contrast against the surface it sits on.
   - Contrast: compute WCAG 2.x ratios from the hex values; never estimate. Run code to compute them if you can (a short script in Claude Code, or code execution in chat). Body text needs 4.5:1. Large text (24 px, or 18.66 px bold) and non-text UI (borders that define a control, focus rings, chart marks, icons) need 3:1. Name the faintest colour any text may use. When a signature colour fails as a fill behind white text, use a darker step of it for fills and link text, and keep the bright step for non-text (focus outline, progress bar, icons) only where it reaches 3:1 against every surface it sits on; otherwise use the darker step there too. Keep all text off data fills; place values next to or above the mark. List every fix with its before and after ratio.
   - Type: a table Role | Face | Weight and size | Setting, covering display, headings, numbers (tabular), body and UI, and labels or metadata. Give the display face a minimum size. Confine any signature setting (wide tracking, an extreme weight) to the one place it belongs. Check that each face has the glyphs and features you use (arrows, ×, ≈, currency signs, tabular figures) in the subset you actually load, or change the glyph or move the numbers to a face that has them.
   - Shape and depth: at most two radii, one depth recipe (for example a 1 px border plus one faint shadow), and one treatment for everything pressable, with a minimum target (24×24 px; 44–48 px for primary touch targets).
   - Layout and motion: breakpoints including 390 px, what moves and for how long, and the prefers-reduced-motion fallback.
   - Never: what this system refuses, including what it dropped from the references and the losing specimens.
   - Rules for whoever builds next, another agent or a person. Each must be checkable: colours and type come only from tokens, with no hex values or font names in components; a new colour needs a job in the budget or it does not go in; re-run the contrast checks after any colour or type token change; for each rule a script could check, say how.

In turn 1, return for each specimen: name, idea, references, signature device, then the page (in Claude Code, its file path). In turn 2, return in order: the scorecard as a table, the pick and grafts, the fixes, then DESIGN.md in full. In Claude Code, write DESIGN.md at the repo root instead and return only the scorecard, pick, grafts and fixes in chat.
```

## Example

**Input**:
- `product`: Kept, a habit-tracker web app
- `main_screen`: Today's check-in list (5–8 habits, tap to tick) above a dashboard: current streaks, this week's completion, and a 12-week history grid. Primary action: add a habit.
- `jobs`: 1. Tick off today's habits in under 10 seconds, one-handed on a phone. 2. Show at a glance which habits are slipping this week. 3. Make 12 weeks of history readable without hunting for a legend. 4. Feel calm, not guilt-inducing, after a missed day.
- `references`: Things 3, Linear, Strava
- `constraints`: Mobile first (390 px). Light theme only for now. Free web fonts only. WCAG 2.2 AA. No illustrations or photos.

**Output** (a Claude Code run, so the pages and DESIGN.md went to files and the chat only gave their paths; trimmed to the turn-1 comparison and two of the four specimens, then part of the scorecard, the pick, two grafts and three fixes):

> === Turn 1 ===
>
> I made four specimens. All four are light, since the brief rules out dark. They differ in typeface, shape and depth, density and how the 12 weeks are drawn, not only in colour.
>
> All four show the same data:
> - …
> - **This week:** 24 of 39 check-ins kept, with Stretch and Strength training slipping.
> - …
> - **Every page also has:** an Add habit button, a week note paragraph, an empty state (new account) and an error state (offline).
>
> …
>
> | | Typeface | Shape and depth | Density | 12 weeks drawn as |
> |---|---|---|---|---|
> | Quiet Paper | Figtree | Hairlines, round ticks, flat | Airy | One dot per week, filled by how much of the goal was kept |
> | Hairline Console | Inter + IBM Plex Mono | 1 px panels, 6 px corners | Dense | Green heat-map squares with a legend |
> | Training Log | Barlow Condensed + Barlow | Square cards, heavy numbers | Medium | Bubbles per day, sized by habits kept |
> | Pebble Tiles | Fraunces + Nunito | 22 px raised tiles, soft shadows | Low | One bar per week for each habit |
>
> **Quiet Paper**
> - **Idea:** a calm checklist on warm paper that also keeps your history. What's left sits on top; what's done folds away.
> - **References:** Things 3 (round ticks, whitespace, one blue, done items leaving the list), plus a little of Linear's restraint in the hairlines.
> - **Signature:** the "Kept today" tray. Ticked habits stay put for 1.4 s, then settle into a folded tray, so the list only ever shows what's left.
> - …
>
> …
>
> **Training Log**
> - **Idea:** habits as training: big condensed numbers, a weekly goal to chase, and a log that shows effort at a glance.
> - **References:** Strava (training-log bubbles, orange add button in the tab bar, row of big stats, streak leaderboard). Things 3 only in the one-tap round ticks.
> - **Signature:** the bubble training log. Twelve weeks of days, each a circle sized by how many habits you kept.
> - …
>
> …
>
> === Turn 2 ===
>
> I've picked **Quiet Paper**. It has the best weighted job total, 42 of 50. …
>
> | Criterion (weight) | Quiet Paper | Hairline Console | Training Log | Pebble Tiles |
> |---|---|---|---|---|
> | **1. Tick in under 10 s, one-handed (×4)** | **5**: only the 4 habits left are shown, as full-width 64 px rows (y 134–395) with ticks on the right. Ticked rows wait 1.4 s before moving, so quick taps never land on a row that has shifted. | **4**: 50 px full-width rows, but all 7 habits are mixed together. The headline numbers push the list down to y 259. The checkbox is 18 px on the far left, and the New habit button is 36 px tall. | **4**: 68 px rows with 44 px ticks on the right, in easy thumb reach (y 225–701). But done and pending habits are mixed, and a stats strip sits above them. | **4**: 173×136 px tiles that never move. But the left column needs a stretch, and the seven tiles plus Add fill the whole first screen (to y 790). |
> | **2. Slipping habits visible at a glance (×3)** | **3**: the "Could use some care" group comes first, with missed days shown hollow. But it starts at y 830, off the first screen, and the check-in rows give no signal. | **5**: "Behind" chips at the top of This week, a "Behind: 2 habits" headline number, and a "2/5" week meter on every row, all on the first screen. | **4**: "Behind pace" badges sit right in the check-in rows (y 580). But they're the same orange as the ticks, bars and bubbles, so they don't stand out. | **3**: each tile's ring shows "2 of 5" but not whether that's behind. The habits are only named in "Gentle nudges" at y 1058. |
> | … | … | … | … | … |
> | **Weighted job total (max 50)** | **42** | **38** | **36** | **38** |
> | … | … | … | … | … |
> | WCAG 2.2 AA | **4**: all text at least 5.71:1, button 5.55:1, tick ring 3.21:1. But the future-day dots are 1.20:1 and the day initials are 11 px. | **3**: text at least 4.69:1. But two heat-map steps are 1.31:1 and 1.77:1 on white, and the week meter fill against its track is 2.41:1. All three fail the 3:1 needed for chart marks. | **3**: white on orange #FC4C02 is 3.40:1, which passes only for text at least 18.66 px bold. The 17 px desktop "+ Add habit" button fails. Orange bars on their track are 2.75:1. | **4**: text at least 5.40:1, terracotta button 5.74:1. But kept and partial bars differ by only a 1.53:1 step, and the ring track is 1.33:1. |
> | … | … | … | … | … |
> | **Constraint total (max 25)** | **24** | **22** | **23** | **23** |
> | … | … | … | … | … |
>
> …
>
> - **Over Hairline Console (38):** Console flags slipping habits best. But its heat map needs a legend, its dense list mixes done and pending, and its tone feels like a work queue. It loses more on jobs 1, 3 and 4 than it gains on job 2.
> - …
> - **Over Training Log (36):** it flags slipping in the list itself. But its stats strip, bubble sizes and streak leaderboard cost it on ticking speed, readable history and calm.
>
> …
>
> | Idea | From | Job | Redrawn in Quiet Paper's terms (new name) |
> |---|---|---|---|
> | A "Behind" status shown in each check-in row | Hairline Console (status chips and the "2/5" meter in each row) | 2 | **Care mark.** A slipping habit's row swaps "5 days a week · 11 weeks" for a small half-filled dot and "2 of 5 this week" in ochre (#8A5A00). There's no chip, no fill and no orange. The summary line under "Today" gains "· 2 need care", so slipping shows on the first screen while you tick. |
> | … | … | … | … |
> | A kept week drawn in a darker step than a partial week | Pebble Tiles (full-height bars in deep sage) | 3 | **Full dot.** A kept week becomes a full disc in dark slate #2E4259. A partial week becomes a wedge in lighter slate #5B7491 inside a grey ring. Same slate hue as before, no green. |
>
> **Rejected:**
> - **Training Log's orange bubbles:** they need a colour outside the budget, and they'd compete as a second signature.
> - **Hairline Console's command bar:** a second signature competing with the tray, and built for a keyboard rather than a thumb.
> - …
>
> …
>
> 1. **Future-day dots (Sat–Sun):** a ring in #E8E5DF was **1.20:1**, failing 3:1 for a chart mark. It's now a 4 px dot in grey #858D99, **3.21:1**.
> 2. **Full versus partial week dots:** both used slate #3D5573 (7.33:1), so a full week and a 6/7 week differed only by one thin wedge. Now a full week is #2E4259 (**9.86:1**) and the partial wedge is #5B7491 (**4.62:1**). The two now differ by a **2.13:1** step.
>
> …
>
> 5. **"Kept today" count:** it was action blue on a pale blue tint (4.90:1), which put the action colour on a plain label. It's now plain secondary grey on white (**5.96:1**), and the tint colour is removed.
>
> …
>
> DESIGN.md includes a short Python script that recomputes every pair above. It passes all 18 checks against the final colour values.

Quiet Paper wins on the rank-weighted job total even though it scores only 3 on job 2, and the Care mark graft redraws Hairline Console's per-row "Behind" status as the pick's own half-filled dot in ochre to cover that gap. The weighted totals add up, and each ratio in the fixes matches a recomputation from the hex values.

## Why it works

- **Same content, directions that differ in more than colour.** A first idea always looks good alone. Specimens showing the same screen, data and empty state make the comparison fair, and requiring them to differ in type, shape, density and how data is drawn (and in base, where the constraints allow) stops the bake-off from collapsing into one layout in four palettes. Asking for the HTML itself, never a description, means you compare pages, not promises. Names make each idea something you can point to later.
- **Open the pages, then judge by ranked jobs.** Stopping after the specimens lets you open them before Claude grades its own work, and keeps each reply to a length that finishes. Scores per job, with evidence from the page and weighted by rank, pick the direction that works rather than the prettiest, and the same one on a re-run; contrast failures lower the constraint total but never decide the pick, because step 4 fixes them. Grafts bring back the losers' best ideas renamed in the pick's vocabulary, and the graft test (no colour outside the budget, no competing signature) protects its coherence.
- **The dropped column records costs, not taste.** Writing the concrete reason a reference trait was dropped (Strava's orange at 3.40:1 behind white text, replaced by a blue at 5.55:1 and a slate data scale) stops the next person or agent from bringing it back because it looked good in the reference. The checkable rules at the end let a script catch it if it comes back anyway.
- **One job per colour, with computed contrast.** What usually goes wrong is an action colour creeping into headings and category colours colliding with the data scale. A budget with one job per colour, labels and symbols for categories, computed ratios, and a darker step wherever the bright one fails keeps both the brand colour and AA.

## Variations

- **Straight blend.** When you already know the two references, skip the specimens: ask for one page that blends "X × Y" and the same DESIGN.md. The borrowed-and-dropped table does the judging.
- **Judge from screenshots.** In Claude Code with Playwright, screenshot each specimen at 390 and 1280 px and score from the images rather than the code.
- **Chart-heavy products.** Extend the data scale rules: order the data colours by lightness, check each pair stays distinct under colour-blindness simulation, and list pairs that must never sit side by side.
- Generalised from a report-style web app and an explainer blog.
