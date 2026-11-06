---
title: "One-screen mobile layout: no page scroll, proven by a Playwright walk"
summary: Fit every screen of a flow into one viewport (top bar, scaling middle, bottom action bar), then walk it at several sizes and get a table of anything that scrolls, overflows or gets clipped.
category: design
tags: [ux, mobile, playwright, testing]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: intermediate
use_as: claude-code
---

## The prompt

Run it in a Claude Code session on the repository. Install Playwright if needed (`npm i -D playwright && npx playwright install chromium`). In `app`, say where the code lives, how to run it (dev server, preview URL or a local file) and what is wrong today. If unsure of `viewports`, use 375x548, 390x664, 412x780, 1280x800.

```text
Make every screen of the app below fit one viewport with no page scrolling, then prove it with a script that walks every screen at each viewport size.

App: {{app}}

Screens, in flow order, and how to reach each one:
{{screens}}

Viewports to prove, in CSS pixels (width x height, the area the browser leaves after its toolbars):
{{viewports}}

Read the current layout before changing anything. Change layout, sizing and spacing; keep the copy, content and behaviour unless a rule below says otherwise.

LAYOUT
1. Shell. The app root is exactly one screen high: `height: 100vh; height: 100svh;`. Use svh, not dvh: svh is the height with the mobile toolbars showing, so the screen fits in the worst case, and it stays put while the address bar moves, so nothing resizes under the user's thumb. Set `overscroll-behavior: none` on html and body.
2. Safe areas. Use `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` and pad the root with `max(8px, env(safe-area-inset-top))` at the top, `max(10px, env(safe-area-inset-bottom))` at the bottom, and the left and right insets, so a notch or home indicator never covers a bar.
3. Every screen is a flex column of three parts: top bar, middle, action bar. Every flex item between the root and the middle gets `flex: 1; min-height: 0; display: flex; flex-direction: column`. Without `min-height: 0` a flex item is at least as tall as its content, and the page grows instead of the content shrinking. In a grid, give the row `grid-template-rows: minmax(0, 1fr)` for the same reason.
4. Top bar: the only header on the screen, `flex-shrink: 0`. Title on the left; position ("2 of 5") and any timer or exit control on the right; under them a progress bar with one segment per step. If the flow already numbers its steps, keep its numbering. The title truncates first, with `min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis` (the one allowed use of `overflow: hidden`); the position never truncates.
5. Middle: `flex: 1` with a floor (`min-height: 120px` or so), its content centred with `margin: auto`, so it sits in the middle when there is room and starts at the top when there isn't. You may give it `overflow-y: auto` as a safety net for sizes you don't test; the walk must still find it not scrolling.
6. Media scales to the height that is left, not only the width. Make the media area a size container (`container-type: size`) and cap images, illustrations, charts and grids at `min(<max>px, 100cqh)`; a square is `width: min(100%, 100cqh); aspect-ratio: 1`. A size container ignores its content when it sizes itself, so it must take its height from the column: it is a flex item (`flex: 1`, or a flex-basis) with a `min-height` floor, and it never grows to fit its content. Where a container doesn't fit, cap from the viewport height instead (`min(<max>px, 34svh)`). Option tiles get `width: min(var(--cap), calc((100% - <total gap>px) / <columns>))`, with `--cap` stepped down in height queries (e.g. 104px, 90px under 740px tall, 78px under 620px), so width and height both bound every tile. Pick column counts that keep a tile grid to two rows (6 tiles: 3x2; 8 tiles: 4x2), and put short text options in two columns.
7. Action bar: the primary action lives in a bottom bar that is part of the column (`flex-shrink: 0`, a top border), never `position: fixed` over the content. Buttons stay at least 44px tall. A screen with no action (a spinner that moves on by itself) has no action bar. Remove `scrollTo` calls between screens: nothing scrolls.
8. States: lines that come and go (feedback, errors, status, a low-time warning) keep their space, with a fixed `min-height` or `visibility: hidden` when empty, so a state change never moves the action bar.
9. Short screens: one height breakpoint for spacing and hidden copy, `@media (max-height: 640px)` (a small phone in a browser with its toolbars showing is about 375x548). Tighten padding and gaps, take headlines down a step, and hide what is secondary on that screen (a caption, a repeated instruction, a worked example). Text stays at least 14px, form inputs 16px.
10. Phones held sideways (`(orientation: landscape) and (max-height: 500px) and (pointer: coarse)`) get a full-screen "Turn your phone upright" note, unless the flow has a real landscape layout. Desktop keeps the same column, centred with a max width, or two columns where that helps; the no-scroll rule still applies.
11. Chart and figure labels (SVG or canvas) stay at least 11px on screen. Set their font size in drawing units from the actual drawing scale (CSS px per unit): `max(base, 11 / scale)`, and shrink the plot to make room, not the type. For an SVG, `scale` is `getScreenCTM().a`, which is right even when the chart is limited by its height rather than its width.
12. Never fix a spill with `overflow: hidden`, by dropping the primary action, or by going below the text sizes above. Hidden overflow clips content for the user and hides it from the walk.

PROOF: THE WALK
Write a Node script (e.g. `tools/walk.mjs`) with Playwright that takes the page URL from an argument or a `BASE` environment variable and, for each viewport:
- Opens a fresh page at that size with `reducedMotion: 'reduce'` (plus `isMobile` and `hasTouch` for widths under 600). Before loading, it installs a fake clock and pauses it: `page.clock.install({ time: t0 })`, then `page.clock.pauseAt(t0 + 1000)`, with `t0` a fixed timestamp in ms; install alone keeps time running. After loading and after every action, it advances the clock with `page.clock.runFor(ms)` so timers and `requestAnimationFrame` callbacks run, and it moves through countdowns and auto-advancing screens the same way.
- Injects a style that cuts every animation and transition to 0.01ms with one iteration. The fake clock drives timers and `requestAnimationFrame` but not CSS transitions or animations, so before each measurement it calls `finish()` on every `document.getAnimations()` (in try/catch: an infinite animation throws), then awaits `document.fonts.ready`. That also resolves when web fonts fail, so if the app uses them, it checks that each one is in `document.fonts` with status `loaded` and fails if not (or serves them locally); a fallback font changes every measurement.
- Moves through the flow the way a user does: clicks real controls by role and name (`getByRole('button', { name: 'Next' })`), takes the same path at every size, and names each screen it reaches. It visits every screen in the list, plus any dialog or sheet a screen opens, and measures each screen in every state the user can put it in: on arrival, after choosing an option, and with any error, feedback, warning or sheet showing.
- On every screen and state, checks:
  a. The page doesn't scroll: `scrollingElement.scrollHeight <= innerHeight` and `scrollWidth <= innerWidth`.
  b. No element scrolls: every element whose computed overflow is `auto` or `scroll` has `scrollHeight <= clientHeight + 1` and `scrollWidth <= clientWidth + 1`.
  c. Nothing spills: every visible element (non-zero size, not `visibility: hidden`, not a 1px screen-reader-only box) lies inside the viewport, within 1px. Report the selector, the side and the overshoot in px.
  d. Nothing is clipped: an element with `overflow: hidden` whose content is bigger than its box fails, except one-line ellipsis text.
  e. The primary action is fully on screen and not covered: `document.elementFromPoint` at its centre returns the button or something inside it. A screen with no action skips this.
  f. Labels: SVG `<text>` and canvas labels stay inside their figure, are at least 11px on screen, and don't overlap each other (an intersection over 12% of the smaller box counts). Measure size by font size, not box height (ink boxes run small, SVG boxes run large): for SVG, the computed `font-size` times the vertical scale of the text's `getScreenCTM()` (`Math.hypot(c, d)`); for canvas, the px size in `ctx.font` times the vertical scale of `getTransform()`, divided by `canvas.width / canvas.clientWidth`. Use boxes only for the inside and overlap tests: SVG `getBoundingClientRect()`; for canvas, patch `CanvasRenderingContext2D.prototype.fillText` in an init script to record each label's box from `measureText` (the `actualBoundingBox*` values) and `getTransform()`, converted to CSS px by dividing by `canvas.width / canvas.clientWidth`. Keep one settled frame only (start a new record when the whole canvas is cleared), skip labels drawn with `globalAlpha` under about 0.35, compare labels that share a rotation by their unrotated boxes, and ignore the same text drawn twice in the same place.
  g. Sizes: visible text outside SVG and canvas is at least 14px (the computed font-size of each text node's parent), form inputs at least 16px, and the action bar's buttons at least 44px tall.
  h. Media keeps its room: every size container has a `min-height` floor, and every size container and every rendered (`checkVisibility()`) `img`, `svg`, `canvas` and `video` has a non-zero width and height.
- Saves a screenshot per screen and size.
- Prints a table with one row per screen and one column per viewport, each cell `ok` or its first problem (e.g. `spill bottom +14px .actions`), then the full list of problems, and exits non-zero if any cell fails.

Write the walk and run it against the current layout before you change anything; keep that table. Then fix the layout and run the walk again until every cell is `ok`. Don't weaken a check or skip a screen to get there. If a screen can't fit at the smallest size without losing something the user needs, stop and say which screen and what you would cut.

Finish with: the table from the first run and from the last run, what changed on each screen, what the short-screen query hides, and the command to re-run the walk.
```

## Example

**Input**:
- `app`: the plant-care onboarding quiz in `quiz/`: one `index.html` that swaps five screens, plain CSS and JS, no framework. Today each screen is `min-height: 100vh` with a fixed button bar over the content, and every screen scrolls on a small phone.
- `screens`:
  1. welcome: illustration, headline, two-sentence intro, Start. Loads at `/`.
  2. room: "Where does your plant live?", six picture tiles in a grid, Back and Next (enabled once a tile is picked).
  3. light: "How much light does it get?", four text options with a one-line description each, Back and "See my plan".
  4. saving: spinner and "Building your care plan…"; moves on by itself after 3 seconds.
  5. result: care profile as an SVG bar chart with four labelled bars (Light, Water, Humidity, Temperature), two tips, "Start over" and "Get my care plan".
- `viewports`: 390x664, 375x548, 412x780, 1280x800

**Output** (trimmed to the walk's first and last tables, a few of its problem lines, and part of the closing report):

```text
| screen  | 390x664             | 375x548             | 412x780             | 1280x800            |
|---------|---------------------|---------------------|---------------------|---------------------|
| welcome | page scrolls +73px  | page scrolls +178px | page scrolls +57px  | page scrolls +57px  |
| room    | page scrolls +288px | page scrolls +414px | page scrolls +205px | page scrolls +527px |
| light   | page scrolls +133px | page scrolls +281px | page scrolls +57px  | page scrolls +57px  |
| saving  | page scrolls +57px  | page scrolls +57px  | page scrolls +57px  | page scrolls +57px  |
| result  | page scrolls +57px  | page scrolls +57px  | page scrolls +57px  | page scrolls +57px  |

Problems (130):
…
  375x548   room (tile picked)                 spill top +84px header.site-header
…
  375x548   result (on arrival)                label "Light" 10.3px < 11px in svg.chart
…
  375x548   result (on arrival)                text 13.6px < 14px p.step "Step 3 of 3"
…
```

```text
| screen  | 390x664 | 375x548 | 412x780 | 1280x800 |
|---------|---------|---------|---------|----------|
| welcome | ok      | ok      | ok      | ok       |
| room    | ok      | ok      | ok      | ok       |
| light   | ok      | ok      | ok      | ok       |
| saving  | ok      | ok      | ok      | ok       |
| result  | ok      | ok      | ok      | ok       |

Problems: none
```

> Every screen now fits on one screen at all four sizes, and the walk shows it: before the change all 20 cells failed, after it all 20 are `ok`. Nothing had to be cut. The smallest phone size (375x548) still has 15 to 54px to spare on every screen.
>
> …
>
> - **result:** the chart now fills its box (at most 480x240), and `app.js` redraws it whenever it is shown or resized:
>   - label size is the larger of 12 drawing units and 11 divided by the chart's scale (`getScreenCTM().a`), so labels never go below 11px on screen;
>   - the bars get shorter to make room for bigger labels, rather than the labels shrinking.
>
> **What the short-screen query (`max-height: 640px`) hides:** only the light screen's instruction, "Think of the brightest hour of a normal day." It would fit at 375x548 with 20px to spare. Hiding it leaves 54px, so a description that wraps to an extra line on a wider phone font still fits. …
>
> - **Below the tested sizes:** at 320x480 the light screen overflows by 23px and the middle scrolls. That size isn't on the list; say if it should be.
>
> (trimmed)

The original layout failed all 20 cells, desktop included, and behind the scroll the walk also caught 13.6px step labels, chart labels under 11px at the two smallest sizes and a header pushed off the top after a tile was picked; after the changes every cell is `ok`. The report names the one line the short-screen query hides and what that bought, and flags a size below the tested list where the light screen still overflows.

## Why it works

- **`min-height: 0` and a size container do the fitting.** A flex item defaults to `min-height: auto` (a grid row to `minmax(auto, 1fr)`), so tall content pushes the page down instead of shrinking. With `min-height: 0` the middle gets exactly what the two bars leave, and media capped at `100cqh` scales into it. A size container ignores its content, so unless it is a flex item with a floor it collapses to 0px, which check h catches. A bottom bar inside the column can't cover the last option the way a fixed bar does, and lines with reserved space can't push it when a state changes.
- **svh, and viewports measured inside the browser.** `svh` is the height with the toolbars showing and doesn't change while the address bar moves, so the layout fits the worst case and never resizes mid-gesture. Testing 375x548, a small phone in a browser, rather than the device's 375x667 is what catches the real failures.
- **A walk, not a screenshot.** With the clock paused, timers fire the same way on every run, and finishing running animations means the walk measures the final frame, not a transition halfway through. Clicking through by role, in every state, covers result screens, error lines and sheets that a page-by-page check never loads. Numeric checks (scroll sizes, bounds, `elementFromPoint`, font sizes, label boxes) turn "looks fine on my phone" into a table you can re-run after every change.
- **No escape hatches.** Banning `overflow: hidden`, dropped actions and weakened checks stops the agent passing the walk by hiding the problem, and checks g and h stop it shrinking the type or collapsing the media instead. Chart labels grow in drawing units as the chart shrinks (`11 / scale`), so the plot gives up room, not the type; inputs stay at 16px because iOS Safari zooms into smaller ones. The short-height query cuts secondary copy on purpose, and the report says what went, so you can veto it.

## Variations

- **Long, flowing pages.** For a deck or article, let a section grow past one screen on phones (`min-height: 100svh`, `scroll-snap-type: y proximity`), give each figure a minimum size at which its labels fit, and run the label check at many sizes, landscape phones included.
- **Run it in CI.** Point the walk at a preview URL through `BASE` and fail the pull request on any non-`ok` cell; attach the screenshots as an artifact.
- Generalised from a quiz app and a slide deck.
