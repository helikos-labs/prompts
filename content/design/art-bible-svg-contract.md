---
title: Art bible plus a build-blocking SVG contract, so any AI tool can add art
summary: Split your art rules into a style guide people judge by eye and an SVG contract a script checks before every build, so AI-drawn art can't collide, leak or break the sprite.
category: design
tags: [illustration, validation, design-tokens, agents]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: intermediate
use_as: claude-code
---

## The prompt

Run this in a Claude Code session at the root of an app repo with an npm build, before the first piece of art goes in. Any tool that adds art later only needs `docs/ART_BIBLE.md` and the checker.

```text
Set up an art pipeline in this repo so that any AI tool (Claude, another coding agent, an SVG generator) or a person can add art without breaking the build or the look.

Project: {{project}}
Art categories (name: what it shows, where and at what size it appears): {{asset_categories}}
Style direction (look, colours, light, and any print or export needs): {{style_direction}}

First read the repo: the framework, how the build runs, where static files live and how the UI will draw the art. Put art in src/art/<category>/ unless the repo already has a better home. Don't stop to ask: where the inputs leave a choice open, pick the simplest option and list it in your report.

1. docs/ART_BIBLE.md, in two halves, in this order.

   Contract (machine-checked). Only rules a script can test. Open with one line: "npm run check:art enforces this section; a failure blocks the build."
   - A table: Category | Folder | viewBox | Background | Content bounds. Use a centred viewBox per category (for example -50 -50 100 100), so placing, rotating and clipping need no offsets. Background is full bleed, transparent, or a base shape drawn first (disc, shield, rounded square), written as its exact geometry (<circle cx="0" cy="0" r="44">, a hex's corner coordinates, the shield path) so a tool that can't see its output still hits it. Content bounds is a safe radius or inset in viewBox units, outlines included.
   - File names are kebab-case. Asset id = <category>-<file name>.
   - Root element: <svg xmlns="http://www.w3.org/2000/svg" viewBox="…"> and nothing else on it: no width or height (size comes from the viewBox) and no paint, because the loader keeps only the root's children.
   - Every internal id starts with "<asset id>-" and is unique across all art: it never appears in another file or equals another asset's id. Every href="#…" and url(#…) points to an id in the same file. All art ends up in one sprite, so a bare id="grad" in two files collides and one file silently paints with the other's gradient.
   - Allowed elements inside the root: g, defs, use, path, circle, ellipse, rect, line, polyline, polygon, linearGradient, radialGradient, stop, clipPath; anything else fails. Forbidden attributes: class, style, on…, xlink:href and any namespaced attribute; any href or url() that doesn't start with # fails. No <?xml?>, <!DOCTYPE>, CDATA or entities.
   - Every fill, stroke and stop-color is none, url(#…) to this file, or a hex from the Style half's Palette table. Every stroke is the ink hex. At most one gradient per file.
   - No stroke thinner than the hairline floor after transforms: 0.1 mm at the smallest printed size, converted to viewBox units, or 0.5 px at the smallest display size if the art is never printed. Write the result in units.
   - A size cap per file (12 KB unless the style needs more). Repeat shapes with <defs> + <use>; the same path data twice in one file fails.
   - One catalogue entry per file, with status placeholder, v1 or final.

   Style (judged by eye). Everything a script can't test, written as numbers and rules, not adjectives. Say where it gets judged: the gallery page.
   - Look: one sentence.
   - Line: stroke weights for the main silhouette and for inner detail, as two ranges with a gap between them. The silhouette is at least 1 px at the smallest display size (units ≥ viewBox width ÷ smallest px); inner detail is clearly thinner. Joins and caps.
   - Light: one direction. Highlight on the lit side, a darker plane opposite. A gradient, if any, goes on the base fill only.
   - Shadows: where they go, with colour and opacity, or "none".
   - Detail density per category: how many motifs, and what must still read in silhouette at the smallest size.
   - No text or numbers in art, not even drawn as paths; the UI adds labels.
   - Palette: a table of Role | Hex | Use, with an Ink row. The checker reads the allowed hexes from it.
   - Visual language per category or group: a shape vocabulary a reviewer can check by eye ("no straight edges", "only 0°, 45° and 90° edges", "one symbol centred on the base shape").
   - Print and export: important detail at least N units inside the edge, so print bleed, icon masks and round crops never cut it.

2. src/art/catalogue.json: "categories" maps each folder to its viewBox, background (with the base shape's geometry), content bounds ({ radius } or { inset }) and a one-line purpose; "assets" lists { id, name, status, notes }. catalogue.json is the source for each category's values: the checker, the gallery and the loader read them there.

3. scripts/check-art.mjs, using Node built-ins only. Every Contract rule has a check, and every check enforces a Contract rule.
   - Walk every folder under the art directory. A folder missing from "categories" is an error, and so is any file that isn't .svg.
   - On every file: kebab-case name, size cap, the root's attributes and the exact viewBox from the catalogue, the element allowlist and forbidden attributes, id prefixes and internal references, colours against the Palette table, the gradient cap, and repeated path data.
   - Measure the geometry: the base shape, if the category has one, is the first painted element, with the catalogue's exact geometry; every shape's points after transforms and <use>, plus half its stroke width, stay inside the content bounds; no stroke is under the hairline floor.
   - Across files: no id appears in two files or equals another asset's id.
   - Check the catalogue both ways: every file has an entry, every entry has a file, no duplicate ids, status in the allowed set. Check the bible's Category table against the catalogue and fail on any mismatch.
   - Collect every problem before exiting. One line each: the file path, what is wrong and how to fix it ("forbidden <style>: use presentation attributes; a stylesheet in one file restyles the whole sprite"). Exit 1 if there are any; otherwise print "check-art: N SVGs OK".
   - Add "check:art": "node scripts/check-art.mjs" to package.json and put it at the front of "build" (node scripts/check-art.mjs && <the existing build>), so a bad SVG blocks every deploy.

4. If the app has no way to draw art yet, add a loader that turns each SVG into <symbol id="<asset id>" viewBox="<its category viewBox>"> holding the root's children, all in one sprite hidden with width="0" height="0" and position:absolute. Never hide it with display:none, which stops gradients and clip paths inside symbols rendering. Add a component that draws art by id as a standalone <svg>, and, if the app draws SVG scenes, one that places art with <use> inside them. Code refers to art by id only, never by file path, so replacing a file never touches code.

5. A gallery page reachable from the running app (a route or a tab; dev-only if the app has no place for it). Group by category, and under each heading show its viewBox and purpose. Draw each asset the way the app will (inside its clip shape, on its usual background, at its smallest and largest size) with its name, id and status.

6. An "Adding art" recipe in AGENTS.md (create it if missing, and add a line @AGENTS.md to CLAUDE.md so Claude Code loads it), short enough to paste into any AI tool:
   1. Read docs/ART_BIBLE.md.
   2. Save as src/art/<category>/<kebab-name>.svg. Its id is <category>-<kebab-name>.
   3. Prefix every internal id with that id and a hyphen.
   4. Add a catalogue entry with a status.
   5. Run npm run check:art, then look at it in the gallery.
   6. To replace an asset, keep its file name and id and bump its status.

7. Seed one placeholder SVG per category that follows both halves. Then prove the checker bites: add one file that breaks three rules (a bare id, a <text> element, no catalogue entry), run the checker, confirm it lists all three and exits 1, delete the file, and run it again clean. Finish with npm run build (run npm install first if dependencies are missing).

Report the files you wrote, the checker's failing and passing output, and every choice you made that the inputs left open.
```

## Example

Run in a fresh Vite, React and TypeScript repo with no art yet.

**Input**:
- `project`: Simmer, a recipe web app (Vite, React, TypeScript). Icons appear on recipe cards, in filter chips and in the shopping list, and on printable A6 recipe cards.
- `asset_categories`: ingredients: single foods for filters and the shopping list, 24–64 px on white cards, transparent background. tools: kitchen equipment a recipe needs, same sizes, transparent. badges: round diet labels (vegetarian, vegan, gluten-free, spicy) in 20 px chips and on the printed cards.
- `style_direction`: Friendly cookbook illustration: warm off-black ink outlines, flat fills with one soft highlight, light from the top left, herb greens and tomato red on cream. Must read at 24 px and print cleanly at 300 dpi with 3 mm bleed.

**Output** (trimmed: excerpts from both halves of `docs/ART_BIBLE.md`, then the checker with the planted file in place, and the build after deleting it):

```markdown
## Contract (machine-checked)

npm run check:art enforces this section; a failure blocks the build.

### Categories

| Category | Folder | viewBox | Background | Content bounds |
|---|---|---|---|---|
| ingredients | `src/art/ingredients/` | `-50 -50 100 100` | transparent | radius 46 |
| tools | `src/art/tools/` | `-50 -50 100 100` | transparent | inset 4 |
| badges | `src/art/badges/` | `-50 -50 100 100` | disc, `<circle cx="0" cy="0" r="44">`, drawn first | radius 47 |

…

3. **Ids.** Every internal id starts with `<asset id>-` (`ingredients-tomato-body`) and is unique across all art: it never appears in another file or equals another asset's id. Every `href="#…"` and `url(#…)` points to an id in the same file. All art ends up in one sprite, so a bare `id="grad"` in two files collides and one file silently paints with the other's gradient.

…

7. **Hairline floor: 1.25 units.** No stroke is thinner than this after transforms. It is 0.1 mm at the smallest printed size: every category prints at 8 mm on the A6 card, so 100 units = 8 mm and 0.1 mm = 1.25 units. `stroke-width` is a plain number in viewBox units; an unset width is 1, under the floor.

…

## Style (judged by eye)

Everything here is judged in the gallery: the **Art** tab of `npm run dev` (or `/#art` on any build). …

### Line

| Line | Width (units) | At 20 px | At 24 px | At 64 px | Used for |
|---|---|---|---|---|---|
| Silhouette | 5–6 | 1.0–1.2 px | 1.2–1.4 px | 3.2–3.8 px | the outer contour of the object, the badge rim, the badge symbol's outline |
| Inner detail | 2.5–3 | 0.5–0.6 px | 0.6–0.7 px | 1.6–1.9 px | veins, seams, rims, calyx, stems, folds |

- Nothing between 3 and 5 units: the gap keeps the two weights apart at every size.
- The silhouette is at least 1 px at the smallest display size: 100 ÷ 20 px = 5 units for badges, 100 ÷ 24 px = 4.2 units for ingredients and tools, so 5 units minimum everywhere.
…
```

`npm run check:art` with the planted `src/art/ingredients/lemon.svg` (exit code 1):

```text
> simmer@0.1.0 check:art
> node scripts/check-art.mjs

src/art/ingredients/lemon.svg: no catalogue entry for "ingredients-lemon": add { "id": "ingredients-lemon", "name": "…", "status": "placeholder", "notes": "" } to "assets" in src/art/catalogue.json
src/art/ingredients/lemon.svg:2: id "body" lacks the "ingredients-lemon-" prefix: rename it "ingredients-lemon-body" and update its href/url(#…) references; bare ids collide in the sprite
src/art/ingredients/lemon.svg:3: forbidden <text>: draw shapes; labels and numbers come from the UI
check-art: 3 problems in 4 SVGs; see docs/ART_BIBLE.md
```

`npm run build` after deleting it (exit code 0):

```text
> simmer@0.1.0 build
> node scripts/check-art.mjs && tsc -b && vite build

check-art: 3 SVGs OK
vite v7.3.7 building client environment for production...
…
✓ built in 864ms
```

The checker listed all three planted problems, each with its fix, and exited 1, which also failed `npm run build`; once the file was gone the build, which now runs the checker first, exited 0. The Contract turns the 8 mm print size into a 1.25-unit hairline floor, and the checker reads that floor, the size cap and the palette from the bible itself.

## Why it works

- **Two halves, split by who checks them.** Every Contract rule has a check that blocks the build, so the doc never claims enforcement it doesn't have, and only taste is left to the gallery. Most AI tools never see what they draw, so colours, base shapes, bounds and line floors are written as numbers a script measures.
- **Prefixed, unique ids and an element allowlist make one shared sprite safe.** SVG ids are global within a page, so two files with `id="grad"` paint each other's gradient with no error; the prefix and the cross-file check rule that out. The loader puts every file into the page, and an allowlist keeps scripts, CSS and external fetches out because anything new fails by default.
- **Errors that carry the fix, and a planted failure.** Collecting every problem with its path and fix lets the tool that drew the file repair it in one round without reading the bible. Breaking three rules on purpose proves the checker fails when it should.
- **One catalogue, and art by id.** The checker, the gallery and the loader read each category's values from the catalogue. The checker fails if the bible's table disagrees with the catalogue, so the copy written for people can't drift. Because code names art by id, swapping a placeholder for final art is a file replacement and a status bump.

## Variations

- **Warn while exploring.** While the palette is still changing, have the palette check warn instead of fail, and switch it to fail before the first asset goes final.
- **Bitmap art.** For PNG or WebP from an image model, keep the two halves but make the Contract check pixel size per category, alpha channel, format and a byte cap, read from the file header.
- **Its own CI step.** Also run `npm run check:art` as a separate CI step, so a pull request shows art errors apart from type errors.
- Generalised from a game prototype.
