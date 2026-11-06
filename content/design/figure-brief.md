---
title: Reality-checked briefs for every figure, before anyone draws it
summary: Write one checkable brief per figure before anything is drawn, covering the real subject, the facts the picture has to get right, how faithful it claims to be and the mistakes to avoid.
category: design
tags: [illustration, specs, review, accessibility]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: beginner
use_as: prompt
---

## The prompt

Paste this into a Claude chat once you know which figures a piece needs and before anyone draws them. For more than 4 figures, ask for the briefs a few at a time. Save the result next to the piece, and hand whoever draws (a coding model, an image model or a person) the "Rules for every figure" section plus that figure's brief.

```text
Write one brief per figure for the piece below, before anything is drawn. The figures will be drawn by {{drawn_by}}. Each brief is the drawer's instructions for one figure: every line must be something the drawer can act on, and something a reviewer can check by looking at the result.

House style:
{{house_style}}

Figures (for each: a working title, what it should explain, and what the current version shows, if there is one):
{{figures}}

The piece:
{{piece}}

Sources, measurements or data you trust (or "none"):
{{sources}}

Write a Markdown document in this order.

1. A title, "Figure briefs: <title of the piece>", then this line: "Each brief below is the spec for one figure: the real subject, the facts the picture has to get right, how faithful it claims to be, and the mistakes an earlier or a default version makes."

2. "## Rules for every figure": the house style in 3 to 6 bullets, then these honesty rules:
   - Without a scale bar, a map or plan counts as a schematic. A to-scale drawing shows its bar and says it is to scale; a map also gets a north arrow.
   - Where marks stand for a count (dots, people, icons, boats), their number is in proportion to the true value, and the caption says what one mark is worth.
   - Draw no made-up landmark, building, part or number. Every number a figure shows is written in its brief, and the drawer copies it from there.
   - If an axis is stretched (a section with exaggerated height, a chart axis that doesn't start at zero), the figure says so and by how much.

3. One block per figure:

   ## Fig. <n>: <title>
   **Subject:** one sentence: the one thing a reader should take from this figure. Then the view (plan, section, elevation, isometric, cutaway, timeline, chart), which way it faces, and what the frame holds.
   **Real referent:** what actually exists or happened that this figure draws: the named place, object, mechanism, event or dataset, with the facts that pin it down (dates, places, dimensions, counts). If it shows a typical case rather than one real instance, start with "Typical, not a specific <thing>" and give typical true values.
   **Must show:** 3 to 7 bullets, in the order a viewer should notice them (or the order they appear, if the figure builds). Each is "**<element>:** the true detail", with its numbers, scale or count; for a code drawer, sub-bullets with coordinates are fine. Where a drawer would reach for a stock version, name the right one and the wrong one: "mitre gates closing in a V, not a single flat door".
   **Fidelity:** "<level> · <name>: <a note of a few words>". Pick the highest level that every part of the figure can back: the weakest part sets it.
     5 Measured: one real site, drawing or dataset, at true values.
     4 To scale: typical geometry at true dimensions, not one site.
     3 Sourced: values plotted from a cited source.
     2 Illustrative: numbers built to match a source; the shape is right.
     1 Schematic: shows a relation, not a size.
   At 4 or 5 a drawing carries a scale bar and something of known size (a person, a door, a boat), and a chart carries labelled axes in the dataset's units. At 1 or 2, an honesty tag says what isn't true to life.
   **Honesty:** 1 to 3 short tags the caption will carry ("Section · not to scale", "Height ×3", "One dot = 100 boats"), plus any rule only this figure needs, such as a level, clearance or line of sight that must be computed from the stated dimensions, not drawn by eye.
   **Caption:** one or two sentences that state the figure's point and carry its honesty tags, and what one mark is worth if marks count something.
   **Errors fixed:** one bullet per error: "[category] what was wrong → the Must show line that now prevents it". Categories: generic-for-specific, wrong-fact, misleading-scale, impossible-physics, missing-context, label-contradicts-drawing, label-collision, decorative-colour, wrong-form.
     - If a current version exists, list every error its description shows.
     - If none exists, head the list "Pre-empted (no v1 yet)" and give the 2 to 4 mistakes a drawer is most likely to make by default with this subject.
   **Alt text:** one sentence that names the figure and its point. Don't start with "Image of".
   **Long description:** 2 to 4 sentences describing the correct figure in reading order: what is shown, how the parts relate, and the key numbers. The page links it to the figure with aria-describedby.
   Write the alt text and long description from the brief, not from any existing drawing: once the figure is drawn, any sentence in them that isn't true of it marks a fault in the drawing.

4. "## Facts to check": every [check] and [missing] item from the briefs, one line each, with its figure.

Rules:
- Use the facts the piece and the sources state as given. Add facts from your own knowledge only when you are confident, and mark each one [check]. Never fill a gap with a plausible guess: write [missing: what to find] instead.
- If the drawing needs a value you don't have, still write [missing: what to find]. Then either leave that element out, or use a placeholder that Honesty names as illustrative and the figure never prints as a number. List the placeholder under Facts to check.
- Write every Must show and Errors fixed line so a reviewer can answer yes or no by looking at the drawing.
- Write for the drawer. Code needs sizes and positions as numbers. A person needs to know what to look up. An image model needs only what is visible, phrased positively: its Must show lines name only the right version, and the wrong one stays in Errors fixed for the reviewer. List its words and numbers as labels the page sets over the image afterwards: image models can still misspell or change text, and labels set by the page stay exact, editable and readable by screen readers.
- Don't repeat the house style inside a brief; mention it only where a figure departs from it.

Return the document and nothing else.
```

## Example

**Input**:
- `drawn_by`: inline SVG written by a coding model, shown 720 px wide on desktop and 360 px wide on phones
- `house_style`: Flat vector, 1.5 px slate outlines (#2B3640), no gradients or shadows. Palette: paper #F7F4ED, water #6A9CC7, deep water #3F6E99, stone #B8AD9A, timber #8B5E3C, and one accent, amber #D98A2B, for the thing each figure is about. Labels in a sans-serif, numbers in a monospace. Static, no animation.
- `figures`:
  1. Going up through the lock. A long section through the lock showing a boat rising in three steps: entering at the lower level, rising as the chamber fills, leaving at the upper level. Current version (v1, from an image model): one flat door at each end; in step 3 the water in the chamber stands higher than the upper pound; the boat is a speedboat longer than the chamber; no paddles; water pours over the top of the upper gate like a weir.
  2. Why the gates hold. A plan view of one closed pair of mitre gates, showing which way the water pushes. No version yet.
- `piece`: the text below.
- `sources`: none

```text
How a canal lock lifts a boat

A lock lets a boat climb or descend a slope in a canal. It is a walled chamber with a pair of gates at each end, between an upper pound and a lower pound. This is a typical narrow lock: the chamber is about 22 m long and 2.1 m wide, and it lifts boats 2.4 m.

Going up, the boat enters the chamber at the lower level and the bottom gates close behind it. The crew winds up the paddles, small sluices in the top gates and in culverts beside them, and water from the upper pound flows into the chamber. The boat rises with the water. When the chamber is level with the upper pound, the top gates swing open and the boat moves on.

The gates are mitre gates: each pair meets in a shallow V that points upstream, so the higher water presses them shut. No one can open a gate until the water on both sides is level.

Every trip up or down sends one chamber of water, about 110,000 litres, downhill.
```

**Output** (trimmed: from the Fig. 1 brief, part of the real referent, parts of three Must show items, the fidelity and honesty lines, every Errors fixed line and the alt text; then the start of Fig. 2's pre-empted list):

> **Real referent:** Typical, not a specific lock. This is a narrow canal lock as the piece describes it: …
>
> One fill is one chamber of water, about 110,000 litres. The piece's numbers agree: 22 × 2.1 × 2.4 = 110.9 m³. These are the dimensions of the standard English narrow-canal lock, about 72 ft × 7 ft [check]. …
>
> **Must show:**
> - **Three steps, one frame:** three panels stacked top to bottom, …
>   - …
>   - These values are placeholders and are never printed:
>     - water depth 1.5 m [missing: water depth in the pounds and chamber of a typical narrow lock];
>     - coping 0.5 m above the upper pound [missing: height of the coping and gate tops above the upper pound];
>     - …
> - …
> - **Water that obeys the pounds:** the lower pound surface is at z = 0 and the upper pound surface at z = 2.4 in every panel. The chamber surface is:
>   - z = 0 in step 1, level with the lower pound;
>   - z = 1.2 in step 2, halfway (a chosen moment);
>   - z = 2.4 in step 3.
>
>   In step 3 the chamber and the upper pound form one unbroken surface at z = 2.4 from x = 0 to 27, never higher. …
> - **A pair of gates at each end, at their true heights:** …
>   - The top gates stand on the cill, from z = 0.9 to 2.9. They are 2.4 m shorter than the bottom gates, and their tops stand 0.5 m above the upper pound, so no water runs over them.
>   - Label them "bottom gates" and "top gates", not one flat door per end. A section cannot show their V; Fig. 2 does that.
>   - The piece says a pair at each end [check: many English narrow locks have a single top gate].
>   - …
>
> …
>
> **Fidelity:** 2 · Illustrative: true length and lift; other sizes to shape.
>
> **Honesty:** "Section · length and lift to scale" · "Water depths, boat, gate and paddle details illustrative". Compute every level from the numbers; do not judge it by eye:
> - The chamber surface is at z = 0, 1.2 and 2.4.
> - …
>
> …
>
> **Errors fixed:**
> - [wrong-form] There was one flat door at each end → **A pair of gates at each end:** labelled "gates"; the bottom gates run from floor to coping and the top gates stand on the cill, 2.4 m shorter; the V is drawn in Fig. 2.
> - [impossible-physics] In step 3 the chamber water stood higher than the upper pound → **Water that obeys the pounds:** in step 3 the chamber and upper pound are one unbroken surface at z = 2.4 from x = 0 to 27.
> - [generic-for-specific] The boat was a speedboat → **The narrowboat:** a long, low hull with a flat-roofed cabin along most of its length.
> - [impossible-physics] The boat was longer than the chamber, so the gates could not have closed behind it → **The narrowboat:** 18 m long, inside the 22 m chamber with water at both ends.
> - [missing-context] There were no paddles → **Paddles:** a gate paddle and a ground-paddle culvert, shut in step 1 and open with inflow arrows in step 2.
> - [wrong-fact] Water poured over the top of the upper gate like a weir → **A pair of gates at each end:** the top gates' tops stand 0.5 m above the upper pound; **Paddles:** water enters only through the paddle openings, below the surface.
>
> **Alt text:** Fig. 1, three side sections of a narrow canal lock: a narrowboat enters at the lower level, rises 2.4 m as paddles let water from the upper pound fill the chamber, and leaves through the open top gates once the chamber is level with the upper pound.
>
> …
>
> **Errors fixed:** Pre-empted (no v1 yet)
> - [wrong-form] A V that points downstream, toward the lower water, or a single flat door across the lock → **The V, pointing upstream:** the point is 0.35 m upstream of the heels, on the chamber side.
> - [impossible-physics] Push arrows on the lower-pound side, pointing upstream, or drawn as water flowing through the shut gates → **The water's push:** eight arrows, only on the chamber face, at right angles to it and pointing downstream.
> - …

Each defect in the v1 description became a tagged line that points to the Must show item preventing it, and the water levels the image model got wrong are now z values computed from the 2.4 m lift. Facts the model added from its own knowledge carry [check], one of them questions the piece itself (many narrow locks have a single top gate), and values it couldn't source, such as the water depth, are [missing] placeholders the figure never prints.

## Why it works

- **The real referent comes before the picture.** Left alone, a drawer, human or model, draws the stock version: a speedboat in a narrow canal, a flat door where the lock has mitre gates, a generic bridge for a famous one. Naming what actually exists, and writing the wrong version next to the right one in Must show, closes that gap. The [check] and [missing] markers stop the brief itself from becoming a source of invented facts, and a value the drawing can't do without becomes a labelled placeholder instead of a guess that passes as fact.
- **Fidelity and honesty rules state what the picture claims.** Readers take a tidy diagram as measured unless told otherwise. A five-step ladder, set by the figure's weakest part, forces one honest choice per figure and ties it to what must appear: a scale bar and something of known size at the top, a tag saying what isn't true to life at the bottom. The caption carries those tags where readers see them. Proportional marks and the ban on made-up landmarks and numbers stop decoration from passing as data.
- **Errors fixed is a ratchet.** Every mistake found in a version becomes a line tied to the Must show item that prevents it, so the next redraw, by any tool, can't bring it back. Before a first draft, pre-empting the likely defaults gets much of that benefit early. The categories, including two that drawn figures hit often (the accent colour spent on decoration, labels that collide at phone width), show which kind of mistake keeps coming back.
- **Every line is checkable, and the alt text comes before the drawing.** Yes-or-no lines turn the brief into the review checklist. The alt text and long description are written from the brief, so they describe the correct figure and double as an acceptance test. A screen reader reads alt text in one run, so the alt stays one sentence and the detail goes in the long description. Writing for the drawer (numbers for code; for an image model, only the right version, with its words set over the image afterwards) means the brief works as the drawing prompt without a rewrite.

## Variations

- **Review pass.** Once a figure is drawn, give the model its brief and the drawing (a screenshot, or the SVG): "For each Must show and Errors fixed line, answer yes or no and say where it shows. Add each new defect to Errors fixed with a category." Then check that it reads at a glance: a single main point, a clear focal point, the accent colour only on the subject, no surplus labels, honesty tags visible, and labels that don't overlap and pass 4.5:1 contrast at the smallest width. Redraw from the updated brief, not by patching the old drawing.
- **Briefs as data.** Keep each brief as a JSON file beside its figure, with one key per section of the brief and a category on each Errors fixed item. The caption can then print the fidelity level and honesty tags, and a build step can refuse a figure with no Must show items or no alt text.
- **Charts.** For a bar or line chart, the real referent is the dataset: name it and give its values as the sources. Put each value once in a data file that both the text and the drawing code read, so the chart can't disagree with the text.
- Generalised from illustrated-explainer sites.
