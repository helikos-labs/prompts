---
title: Spec a no-backend site-planning studio POC on free, keyless map data
summary: Turn a site-planning idea into a POC spec for a static map app, where constraints with provenance drive a rules-based layout and every free data source has a fallback.
category: data-geospatial
tags: [maps, open-data, specs]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: advanced
use_as: prompt
---

## The prompt

Paste this into a Claude chat with web search on, before any code exists. Expect a long answer; if it stops early, ask it to continue from the last section. Save the answer as `docs/SPEC.md` and build to it.

```text
Write the proof-of-concept spec for a browser-based planning studio. The spec is the contract the build follows. Write the spec only, no code, except the generator's header comment (section 5) and the state shape (section 9).

Domain: {{domain}}
Users: {{users}}
Jurisdiction for the first presets: {{jurisdiction}}
Anything else the POC must do: {{brief}}

Fixed architecture (state it in section 1; don't debate it):
- Static files only: no backend, no build step, no API keys. Any static file server runs it.
- MapLibre GL JS and Turf are vendored as pinned files in vendor/. Pin MapLibre 5.x, its last script-tag build, and load it and Turf with plain script tags, or vendor MapLibre 6's maplibre-gl.mjs with maplibre-gl-worker.mjs beside it and import it from the app's modules. The app's own code is ES modules, one job per file.
- All data comes from free public services. Each sits behind a small interface with a timeout and a fallback, so a production API can replace it later without touching callers.
- One versioned state object holds the whole project. It persists to localStorage and exports and imports as JSON.

Write Markdown with exactly these sections, in this order. Prefer tables to prose, one line per row.

0. Decisions. What the POC proves, in one sentence. Then each choice the brief leaves open, with the simplest option marked **Assumed**. Use the units and currency of {{jurisdiction}}; never assume others.

1. Files. A tree of public/ with one line per file: its job, and the state keys it reads and writes.

2. External data. Columns: Service | Used for | Request | Timeout | Fallback | What the user sees | Production swap. Cover at least:
- Nominatim: forward search on submit, never per keystroke (its usage policy caps the whole app, all users together, at one request a second and bans autocomplete: fine for a POC, but proxy or swap it before launch). Reverse geocoding of the site centroid detects the country and first-level region (address.country_code, ISO3166-2-lvl4) and picks a constraint preset. A detected preset never overwrites envelope values the user has edited; offer it instead. Drop responses for a boundary that has since changed.
- AWS Terrain Tiles: Terrarium PNGs from s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png, drawn to a canvas (crossOrigin "anonymous") and decoded as metres = (R × 256 + G + B / 256) − 32768, wrapped as sampler(lng, lat) → metres. If the tiles don't load, the sampler is null and the app plans on flat terrain and says so.
- Overpass: the OpenStreetMap features near the site that the generator's rules need (roads at least; name the exact tags for this domain). If it fails, the generator uses a stated default.
- A keyless raster basemap.
Show attribution for every source (the basemap, OpenStreetMap for Nominatim and Overpass, the terrain tiles' sources) on the map, and print it in the proposal.
No station may block on a third-party service. Add app layers on the map's style.load event, never load, which waits for basemap tiles. Cap any wait on idle (for example 5 s for the proposal snapshot).

3. Stations. Six stations, in this order: Site → Constraints → Generate → Buildings (massing) → Financials → Proposal. Rename each in the words of the domain; keep the order. Columns: # | Station | User does | App computes | Unlocked when | Writes to state | Invalidates. Changing the boundary clears everything generated from it. Changing a constraint marks the layout stale with a "regenerate to apply" note; it never silently rewrites the user's edits.

4. Constraints as data. Two tables.
- Envelope: the numeric limits the generator and checks read (for example density ratio, max height, setbacks, minimum open space, max coverage). Columns: Field | Unit | Generic default | {{jurisdiction}} preset | Read by (the generator rule or check that uses it). Each preset value cites its register row id and status. Cut any field nothing reads.
- Register: the research trail, one row per rule: {id, field, name, value, status, source: {document, clause, url, quote}, checked_on, reviewed}. field is the envelope field the row sets; checked_on is the date the source was read; reviewed stays null until a person ticks the row. status is verified, assumed (a typical value so the POC runs) or check (must be confirmed with the named authority). verified needs the document, the clause and a short quote of the text that holds the value; otherwise use check. Give 6–10 rows for {{jurisdiction}}, plus a generic preset used when reverse geocoding fails or returns a place with no preset.

5. Generator. First the header comment for the generator file, verbatim: a "Layout rules:" list of 5–8 rules for this domain, each naming the envelope field or data input it reads. This list is the generator's spec; any rule change updates it in the same commit. Then the method:
- Deterministic: the same inputs and seed give the same output. Fetched features and the terrain grid are generator inputs: store them in state, so regenerating after import gives identical output.
- Do the layout maths in metres, in a local frame centred on the site and rotated to its long axis. Convert to WGS84 GeoJSON only at the end.
- Include an access rule (connect at the boundary point closest to an existing road, with a fallback edge when Overpass fails), a terrain rule (the steepest ground goes to the least demanding use or stays open) and a placement-order rule (which use sits nearest the access and which farthest).
- Per-use dimensions come from one per-use table (size, default height, coverage, cost and revenue rates, efficiency), never magic numbers.
- Reject a site too small to lay out, with a message giving the minimum size.
- Output: named GeoJSON layers plus a stats object (area by use, lengths, counts, cut and fill when elevation exists).

6. Buildings. What the user adjusts per item, and the rule that sizes it (footprint inset by the setback and capped by coverage; height capped by the envelope). Clamp to the envelope wherever values are read, not only in the UI. Show a live total against the permitted total, with the overshoot when over.

7. Financials. Columns: Line | Formula over state | Default rate (marked **Assumed**) | Proposal section it lands in. Every total, margin and cashflow figure is computed from these lines, never typed. Rates are editable.

8. Proposal. The sections of a print-ready document (browser print to PDF): summary, map snapshot (create the map with canvasContextAttributes: { preserveDrawingBuffer: true }, a top-level option before MapLibre 5, so the canvas can be read), the constraint register with each row's status and source, an area schedule, the financial case. The proposal shows verified rows as cited, not reviewed, until a person ticks them. A readiness checklist gates the button.

9. State and persistence. The state shape as JSON with a version field. Save debounced to localStorage inside try/catch, so private mode and full storage fail quietly. Load only a matching version, deep-merged over the defaults (objects recursively, arrays and GeoJSON replaced whole) so new fields get values. Import rejects a file of the wrong shape with a clear message and keeps the current project.

10. POC cut and brainstorm. "POC v0.1 ships": every station end to end, each in its simplest working form; thin across all six beats deep in one. "Brainstorm (not in the POC)": grouped by station, each item naming the seam it plugs into (a file, interface or state key), for example an optimisation loop behind the same generator signature.

11. Later: AI research agent. How a model with web search fills the same register rows for a drawn site, taking source.url, source.quote and checked_on from pages it opened. The agent may set verified only with that full citation; everything else is check. Its rows arrive with reviewed null, and a person accepts each one before its value changes the envelope. The generator stays deterministic and reads only the envelope.

12. Acceptance tests. Include: with each external host blocked in turn (block it with Playwright's page.route(pattern, r => r.abort()) or a ?block=host test hook), all six stations still complete and show a note; the same seed and inputs give identical GeoJSON; export then import restores an identical project; an over-limit design shows its overshoot.

If the brief is too thin for a section, fill it with assumptions marked **Assumed** rather than skip it. Return only the spec, sections 0 to 12, as Markdown.
```

## Example

**Input**:
- `domain`: campground layout: tent and caravan pitches, an amenity block, internal tracks and one entrance
- `users`: a small holiday-park operator's planners, on laptops, screening candidate fields
- `jurisdiction`: Spain (Andalusia)
- `brief`: none

**Output** (trimmed to three of the ten envelope rows and their register rows, four of the eight rules in the generator's header comment and three of the twenty acceptance tests):

````markdown
## 4. Constraints as data
…
| Field | Unit | Generic default | Spain (Andalusia) preset | Read by |
|---|---|---|---|---|
| campingAreaMax_share | % of field | 70 | 75 (AND-02 · verified) | G7 cap; C2 camping-area check |
| amenityMaxHeight_m | m | 6 | 6 (AND-08 · verified) | massing.js height clamp; C6 |
| boundarySetback_m | m | 6 | 5 (AND-10 · check) | G1 inset and feature buffers; G8 |
…
- D26 = Decreto 26/2018, de 23 de enero, de ordenación de los campamentos de turismo (BOJA nº 27, 07/02/2018), URL `https://cdn.juntadeandalucia.es/boja/2018/27/BOJA18-027-00030-1906-01_00129362.pdf`.
…
| id | field | name | value | status | source.document | source.clause | source.url | source.quote | checked_on | reviewed |
|---|---|---|---|---|---|---|---|---|---|---|
| AND-02 | campingAreaMax_share | Camping area cap | 0.75 | verified | D26 | Art. 28.1 | D26 URL | "La superficie de acampada no podrá exceder del setenta y cinco por ciento de la superficie total del camping." | 2026-11-06 | null |
| AND-08 | amenityMaxHeight_m | Communal buildings: ground floor only, max height | 6 | verified | D26 | Art. 15.1.a | D26 URL | "Contarán tan sólo con planta baja y una altura máxima de 6 metros" | 2026-11-06 | null |
| AND-10 | boundarySetback_m | Setback from the field boundary. D26 sets 5 m only for fixed accommodation units; confirm the setback for pitches and the amenity block with the Ayuntamiento (PGOU, suelo rústico) | 5 | check | D26 | Art. 30.4 | D26 URL | "una distancia mínima de tres metros entre aquellos y de cinco metros al perímetro del camping" | 2026-11-06 | null |
…
## 5. Generator

```js
/**
 * …
 * Pure: no fetch, no DOM, no Date, no Math.random (prng.js mulberry32(seed) only). Same input -> identical output.
 * …
 * Layout rules:
 * …
 * 2. Access: entrance E = entranceOverride, else the boundary point closest to a features.roads access road (primary…track), else the midpoint of the longest boundary edge; an entrance track envelope.entranceWidth_m wide runs from E, perpendicular to its edge, to the first internal track.
 * …
 * 4. Placement order: street sides are filled in order of their start's distance from E, each from the collector outward: the amenity plot (useTable.amenity) first, then caravan pitches up to the mix.caravanShare quota, then tent pitches; leftover slots stay open space.
 * …
 * 6. Terrain (terrain.grid): slot slope ≤ useTable.caravan.maxSlope_pct takes any use; ≤ useTable.tent.maxSlope_pct takes a tent pitch only; steeper stays open space; the amenity plot needs ≤ useTable.amenity.maxSlope_pct; terrain null = flat.
 * 7. Caps: stop adding pitches before pitch area exceeds envelope.campingAreaMax_share × field area or open space falls below envelope.openSpaceMin_share × field area; tracks + amenity over envelope.commonAndTracksMax_share are reported as overshoot, never trimmed; edits (slot id → caravan|tent|open) apply last and are never undone by a cap.
 * …
 */
```
…
## 12. Acceptance tests
…
| # | Test | How | Pass when |
|---|---|---|---|
| T3 | Overpass blocked | Route `/overpass-api\.de/` aborted | Entrance at the midpoint of the longest edge, `entrance.source` = "fallback"; note shown; C7 shows "not checked"; all six complete |
| T9 | Over-limit design | Set `commonAndTracksMax_share` to 5 %; set height 9 m on the ES-AN preset | Station 4 and R5 show "… m² over (x % vs 5 %)" in red; height reads 6 m with a "clamped (AND-08)" badge; F6 and checks use 6 m |
| T12 | Constraint change marks stale | Generate; toggle one pitch; change `boundarySetback_m` | Banner "Rules changed … regenerate to apply"; layers and edit unchanged until Generate; after Generate the edit is re-applied |
````

Each Andalusia preset value cites its register row and status: AND-02 and AND-08 are verified with the article and a quote of the decree text that holds the number, and AND-10 has a quote but stays check, naming the Ayuntamiento, because the decree's 5 m covers only fixed accommodation units. The tests expect the access rule's longest-edge fallback with Overpass aborted, the overshoot in red with the height clamped to AND-08, and the pitch edit kept after a constraint change.

## Why it works

- **Constraints are data with provenance.** The envelope's numbers drive the generator and the checks, and each preset value cites the register row it came from. Three statuses keep a prototype honest: verified needs a document, a clause and a quote of the text, anything less shows as check or assumed, and the proposal prints verified rows as cited, not reviewed, until a person ticks them. The row carries its field, citation and date checked from the start, so a later research agent fills the same rows: adding AI changes who fills them, not the register's shape or the generator.
- **The rules live in the generator's header comment.** Each rule names the field it reads, so a reviewer can check the layout against one list, and any field that no rule or check reads gets cut. A seeded, deterministic generator that stores its fetched data as inputs and works in a local metric frame gives repeatable output you can test, and avoids distorted geometry from doing distances in degrees. Clamping where values are read and marking the layout stale, never rewriting it, means a constraint change can't silently corrupt the user's edits or the totals.
- **Every free service has a timeout, a fallback and a swap.** Keyless public data gets a working map app in a day, but those services rate-limit, hang and go down. Named fallbacks (flat terrain, a default access edge, a generic preset) keep a demo moving, layers added on style.load still appear while basemap tiles hang, and a small interface such as `sampler(lng, lat)` lets production change provider without touching callers.
- **Thin across all six stations, with a brainstorm that names seams.** Going from site to proposal end to end proves the workflow, which is what a POC is for. Bigger ideas go in a list where each names the file or interface it would plug into, so they stay out of v0.1 but have a place to land.

## Variations

- **Other domains.** A logistics yard, a business park or an urban masterplan: change `domain` only. The stations rename and the rules change; the architecture doesn't.
- **Build it next.** In Claude Code, with the spec saved as `docs/SPEC.md`: "Build section 10's POC cut station by station. Write the section 12 tests as Playwright tests that abort each external host in turn, and run them after each station."
- **Switch on the research agent.** Use section 11 as the brief for a web-search model call, made from a small server-side function that holds the API key, that returns register rows as JSON; show each row with an accept button.
- Generalised from a masterplanning prototype.
