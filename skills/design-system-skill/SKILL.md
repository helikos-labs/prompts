---
name: design-system-skill
description: >-
  Apply the Copperline design system (Material 3 colour roles, copper and slate on cool grey,
  Bricolage Grotesque + Source Sans 3 + IBM Plex Mono, light and dark themes) to frontend
  output for Copperline: HTML and CSS, React or JSX, dashboards, forms, landing pages,
  components and artifacts. Triggers on: "Copperline style", "the Copperline app",
  "Copperline UI", or any request to build or restyle UI for Copperline. Covers colour
  roles, type scale, tonal elevation, shape, spacing, motion, state layers, dark mode and
  core components (buttons, cards, chips, badges, text fields, lists, app bar, page
  structure). A worked example to fork for your own brand. Always read
  references/tokens.md before writing any CSS.
---

# Copperline design system

Start here, then open only the reference files the task calls for. Every colour, font, size, radius, shadow and duration comes from a token in `references/tokens.md`; component CSS never contains a hex value, a font name or an ad-hoc pixel size.

## Identity

**Aesthetic:** practical, warm-industrial clarity. A tool people use all day: calm cool-grey surfaces, one warm copper accent, strong numbers, plenty of space.

**Tone:** practical, calm, direct, sturdy, legible.

**What this is NOT:**
- Not glossy SaaS: no gradients, glass effects, glows, or purple and neon accents.
- Not playful: no bouncy motion, emoji as UI, or filler illustrations.
- Not dark-first: light is the default; dark only when asked for or set by the OS.
- Not enterprise grey: space and one accent carry the hierarchy, not borders around everything.
- Not ornamental: no element without a job.

## Core values

| Property | Value |
|---|---|
| Primary | Copper `#a4441c` (`--md-sys-color-primary`) |
| Secondary | Slate `#3d5263` |
| Tertiary | Teal `#2b6a6e`: info and highlights |
| Surfaces | Cool grey `#f7f8f9` page, `#ffffff` cards |
| Display font | Bricolage Grotesque: display and headline steps |
| Body font | Source Sans 3: title, body and label steps |
| Mono font | IBM Plex Mono: code, IDs, timestamps, numeric columns |
| Modes | Light first, full dark theme |
| System | Material 3 colour roles and type scale |

## Files

```
design-system-skill/
├── SKILL.md                    orientation (this file)
└── references/
    ├── tokens.md               font link, CSS variables (light + dark), base styles, scales, state layers, do/don't
    └── components-core.md      buttons, cards, chips, badges, text fields, lists, dividers, app bar, page structure
```

### When to load which file

| Task | Load |
|---|---|
| Any frontend work | `references/tokens.md`, always, first |
| Buttons, cards, chips, badges, fields, lists, app bar, sections, card grids | `references/components-core.md` |
| Dialogs, menus, tables, tabs, toggles, sheets (not covered yet) | `tokens.md`, then build from the principles below and match the patterns in `components-core.md` |

## Principles (mandatory)

1. **Colour roles, not values.** Pick the role: `var(--md-sys-color-primary)`, never a hex value. Text on a fill uses that fill's pair: `on-primary` on `primary`, `on-secondary-container` on `secondary-container`. The pairs are contrast-checked; cross-pairings are not.
2. **Tonal elevation.** Raise a surface by moving it up the surface-container ladder; the shadow only supports it. Tone survives dark mode, where shadows nearly vanish.
   - Resting card: `surface-container-lowest` + `elevation-1`
   - Hovered card: `surface-container-low` + `elevation-2`
   - Menu, popover: `surface-container` + `elevation-3`
   - Dialog, sheet: `surface-container-high` + `elevation-4`
3. **Type scale only.** Set type with `font: var(--md-sys-typescale-<step>)` plus `letter-spacing: var(--md-sys-typescale-<step>-tracking)`. No other sizes. Steps: `display`, `headline`, `title`, `body`, `label`, each `-large`, `-medium`, `-small`.
4. **Shape scale only.** `corner-none`, `corner-extra-small`, `corner-small`, `corner-medium`, `corner-large`, `corner-extra-large`, `corner-full`. The decision table says which component gets which.
5. **Spacing and sizes from tokens.** Gaps and padding use `spacing-1` to `spacing-9`. Heights and icons use `size-*`; page widths use `layout-*`. Outside `tokens.md`, the only literal lengths are `1px` and `2px` for borders and focus rings.
6. **State layers.** Interactive elements get a `currentColor` overlay at `state-hover-opacity`, `state-focus-opacity`, `state-pressed-opacity` or `state-dragged-opacity` (the rule is in `tokens.md`). Never hand-pick a darker colour for hover. Disabled uses the `disabled-*` tokens.
7. **Motion tokens.** Durations `motion-duration-short`, `-medium`, `-long`, `-extra-long`. Easings `motion-easing-standard`, `-decelerate` (entering), `-accelerate` (leaving), `-emphasized`. Never a literal such as `0.3s ease`. Reduced motion zeroes the duration tokens, so token-based transitions stop on their own.
8. **One accent, one main action.** Copper marks the next thing to do: the main button, links, active indicators. One `btn-filled` per view or group; other actions are tonal, outlined or text. Never put copper on large backgrounds.
9. **Dark mode for free.** `data-theme="dark"` on `<html>` swaps every role and shadow. Components need no dark-specific CSS. If one does, a literal colour slipped in.

## Quick decision table

| Need | Token or rule |
|---|---|
| Page background | `surface` |
| Alternate section | `surface-container-low` |
| Card | `surface-container-lowest` + `elevation-1` |
| Inset panel, filled card | `surface-container-high`, no shadow |
| Menu, popover | `surface-container` + `elevation-3`, `corner-medium` |
| Dialog | `surface-container-high` + `elevation-4`, `corner-extra-large` |
| Snackbar, tooltip | `inverse-surface` / `inverse-on-surface` |
| Main action | `btn-filled`: `primary` / `on-primary` |
| Secondary action | `btn-tonal`: `secondary-container` / `on-secondary-container` |
| Selected chip, current list row | `secondary-container` / `on-secondary-container` |
| Selected card | `card.is-selected`: `primary` ring |
| Highlight or info callout | `tertiary-container` / `on-tertiary-container` |
| Body text | `on-surface` |
| Muted text | `on-surface-variant` |
| Divider, card border | `outline-variant` |
| Input border, outlined button | `outline` |
| Links | `primary`, underlined |
| Status | `error-*`, `success-*`, `warning-*` with their containers |
| Page title | `display-small` |
| Section title | `headline-large` |
| Card title | `headline-small` |
| UI text | `body-medium`; prose `body-large` |
| Button, chip, field label | `label-large` |
| Big figures (KPIs, totals) | `headline-large` + `tabular-nums` |
| Code, IDs, timestamps | `--md-sys-typescale-font-mono` on a body or label step |
| Card radius | `corner-medium` |
| Button, chip, field radius | `corner-small` |
| Badge, icon button, avatar | `corner-full` |
| Card padding, card grid gap | `spacing-5` |
| Section padding | `spacing-8` |

## Before you reply

Run every check. Fix, then reply.

1. `tokens.md` is loaded, and the output includes its font link, `:root` block, dark block and base styles (unless the project already has them).
2. Component CSS has no hex, `rgb()`, `hsl()` or named colours and no font names. Translucency uses `color-mix()` on a token.
3. Every text style is a type-scale step with its tracking; every radius, gap, padding and size is a token. `1px` and `2px` appear only on borders and focus rings.
4. Raised surfaces use a surface-container step plus a shadow, never a shadow alone.
5. Every interactive element has hover, `focus-visible`, pressed and disabled states through state layers.
6. Transitions use motion tokens.
7. Text sits on its paired role. Muted text is `on-surface-variant`, never `opacity`.
8. Flip `data-theme` to `dark` in your head: nothing should need extra CSS.
9. One filled button per group. Nothing from "What this is NOT".
10. The layout works at 360px wide with no horizontal scroll, and grids collapse to one column in the compact window.
11. Icon-only buttons have `aria-label`; decorative SVGs have `aria-hidden="true"`; state is never shown by colour alone.

## Maintaining this skill

- Change values in `references/tokens.md`; component files pick them up. The Core values table is the only other place that shows values: update it when the primary, the surface colours or a font changes.
- To fork it for another brand, replace the values and font link in `tokens.md`, the `name` and description, the Identity section and the Core values table. Keep the role and token names, so the principles, the decision table and the component files still hold.
- The description triggers only on Copperline phrases, so the example never restyles someone else's UI. When you fork it, add the phrases your team says, such as "our design system", "our brand", "on-brand", "use our colours", "use our tokens" or "match the app".
- When you add a component file, add a row to "When to load which file" and check its CSS against the checklist above.
