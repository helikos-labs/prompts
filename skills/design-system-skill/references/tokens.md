# Copperline tokens

The single source of truth. Literal colours, font names and lengths live in this file and nowhere else. Component CSS uses `var(--md-sys-…)` only.

From the brand source: primary, secondary, tertiary and error, `surface`, `surface-container-lowest`, `on-surface`, the three fonts, the 4px and 8px radii and the 4-point spacing. Everything marked `derived` was not in the source: colours come from the Material 3 tonal palette of the nearest brand colour (surfaces from the cool grey of the page colour), scales and shadows extend the brand's radii and spacing or start from Material 3 defaults, and every on- pair was contrast-checked in both themes. Treat derived values as proposals until whoever owns the brand confirms them.

Contents: 1. Fonts · 2. CSS variables block · 3. Dark mode · 4. Base styles · 5. Colour roles · 6. Type scale · 7. Elevation · 8. Shape, spacing, sizes · 9. Motion and state layers · 10. Breakpoints · 11. Do / Don't

---

## 1. Fonts

Put this in `<head>`, before the stylesheet:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&family=IBM+Plex+Mono:wght@400;500&family=Source+Sans+3:ital,wght@0,400..700;1,400&display=swap">
```

| Role | Family | Use for |
|---|---|---|
| Display | Bricolage Grotesque | `display-*` and `headline-*` steps |
| Body | Source Sans 3 | `title-*`, `body-*`, `label-*` steps: all UI text |
| Mono | IBM Plex Mono | code, IDs, timestamps, numeric table columns |

---

## 2. CSS variables block

Paste into the page's stylesheet once. Put `data-theme` on `<html>` only (see section 3).

```css
:root {
  color-scheme: light;

  /* ── Colour: primary (copper) ── */
  --md-sys-color-primary:                 #a4441c;
  --md-sys-color-on-primary:              #ffffff;  /* derived */
  --md-sys-color-primary-container:       #ffdbcc;  /* derived */
  --md-sys-color-on-primary-container:    #3d1300;  /* derived */

  /* ── Colour: secondary (slate) ── */
  --md-sys-color-secondary:               #3d5263;
  --md-sys-color-on-secondary:            #ffffff;  /* derived */
  --md-sys-color-secondary-container:     #d7e3ee;  /* derived */
  --md-sys-color-on-secondary-container:  #1c2e3c;  /* derived */

  /* ── Colour: tertiary (teal: info, highlights) ── */
  --md-sys-color-tertiary:                #2b6a6e;
  --md-sys-color-on-tertiary:             #ffffff;  /* derived */
  --md-sys-color-tertiary-container:      #c9ebec;  /* derived */
  --md-sys-color-on-tertiary-container:   #002f32;  /* derived */

  /* ── Colour: status ── */
  --md-sys-color-error:                   #b3261e;
  --md-sys-color-on-error:                #ffffff;  /* derived */
  --md-sys-color-error-container:         #f9dedc;  /* derived */
  --md-sys-color-on-error-container:      #410e0b;  /* derived */
  --md-sys-color-success:                 #2a6b36;  /* derived; custom role, not in M3 */
  --md-sys-color-on-success:              #ffffff;  /* derived */
  --md-sys-color-success-container:       #cdeccf;  /* derived */
  --md-sys-color-on-success-container:    #0a3513;  /* derived */
  --md-sys-color-warning:                 #855400;  /* derived; custom role, not in M3 */
  --md-sys-color-on-warning:              #ffffff;  /* derived */
  --md-sys-color-warning-container:       #ffddb3;  /* derived */
  --md-sys-color-on-warning-container:    #2a1800;  /* derived */

  /* ── Colour: surfaces (cool grey ladder, low → high) ── */
  --md-sys-color-surface:                   #f7f8f9;
  --md-sys-color-on-surface:                #171a1d;
  --md-sys-color-on-surface-variant:        #4c5560;  /* derived */
  --md-sys-color-surface-container-lowest:  #ffffff;
  --md-sys-color-surface-container-low:     #f1f3f5;  /* derived */
  --md-sys-color-surface-container:         #ebeef1;  /* derived */
  --md-sys-color-surface-container-high:    #e5e8ec;  /* derived */
  --md-sys-color-surface-container-highest: #dee2e6;  /* derived */

  /* ── Colour: outline, inverse, scrim. All derived ── */
  --md-sys-color-outline:                 #737d87;  /* borders that carry meaning: 3.9:1 */
  --md-sys-color-outline-variant:         #c3cad1;  /* decorative dividers only */
  --md-sys-color-inverse-surface:         #2c3136;  /* snackbars, tooltips */
  --md-sys-color-inverse-on-surface:      #eef1f4;
  --md-sys-color-inverse-primary:         #ffb595;
  --md-sys-color-scrim:                   #000000;

  /* ── Colour: computed from roles (resolve per theme, never override) ── */
  --md-sys-color-disabled-container: color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
  --md-sys-color-disabled-content:   color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  --md-sys-color-scrim-overlay:      color-mix(in srgb, var(--md-sys-color-scrim) 40%, transparent);

  /* ── Type: families ── */
  --md-sys-typescale-font-display: 'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif;
  --md-sys-typescale-font-body:    'Source Sans 3', 'Segoe UI', system-ui, sans-serif;
  --md-sys-typescale-font-mono:    'IBM Plex Mono', ui-monospace, 'SFMono-Regular', monospace;

  /* ── Type: scale, all derived. Use as  font: var(--step); letter-spacing: var(--step-tracking); ── */
  --md-sys-typescale-display-large:            600 57px/64px var(--md-sys-typescale-font-display);
  --md-sys-typescale-display-large-tracking:   -0.25px;
  --md-sys-typescale-display-medium:           600 45px/52px var(--md-sys-typescale-font-display);
  --md-sys-typescale-display-medium-tracking:  0;
  --md-sys-typescale-display-small:            600 36px/44px var(--md-sys-typescale-font-display);
  --md-sys-typescale-display-small-tracking:   0;
  --md-sys-typescale-headline-large:           600 32px/40px var(--md-sys-typescale-font-display);
  --md-sys-typescale-headline-large-tracking:  0;
  --md-sys-typescale-headline-medium:          600 28px/36px var(--md-sys-typescale-font-display);
  --md-sys-typescale-headline-medium-tracking: 0;
  --md-sys-typescale-headline-small:           600 24px/32px var(--md-sys-typescale-font-display);
  --md-sys-typescale-headline-small-tracking:  0;
  --md-sys-typescale-title-large:              600 22px/28px var(--md-sys-typescale-font-body);
  --md-sys-typescale-title-large-tracking:     0;
  --md-sys-typescale-title-medium:             600 16px/24px var(--md-sys-typescale-font-body);
  --md-sys-typescale-title-medium-tracking:    0.15px;
  --md-sys-typescale-title-small:              600 14px/20px var(--md-sys-typescale-font-body);
  --md-sys-typescale-title-small-tracking:     0.1px;
  --md-sys-typescale-body-large:               400 16px/24px var(--md-sys-typescale-font-body);
  --md-sys-typescale-body-large-tracking:      0.15px;
  --md-sys-typescale-body-medium:              400 14px/20px var(--md-sys-typescale-font-body);
  --md-sys-typescale-body-medium-tracking:     0.25px;
  --md-sys-typescale-body-small:               400 12px/16px var(--md-sys-typescale-font-body);
  --md-sys-typescale-body-small-tracking:      0.4px;
  --md-sys-typescale-label-large:              600 14px/20px var(--md-sys-typescale-font-body);
  --md-sys-typescale-label-large-tracking:     0.1px;
  --md-sys-typescale-label-medium:             600 12px/16px var(--md-sys-typescale-font-body);
  --md-sys-typescale-label-medium-tracking:    0.5px;
  --md-sys-typescale-label-small:              600 11px/16px var(--md-sys-typescale-font-body);
  --md-sys-typescale-label-small-tracking:     0.5px;

  /* ── Elevation (supplementary to tonal surfaces). All derived ── */
  --md-sys-elevation-0: none;
  --md-sys-elevation-1: 0 1px 2px rgb(16 24 32 / 0.08), 0 1px 3px rgb(16 24 32 / 0.06);
  --md-sys-elevation-2: 0 1px 2px rgb(16 24 32 / 0.08), 0 3px 8px rgb(16 24 32 / 0.08);
  --md-sys-elevation-3: 0 2px 4px rgb(16 24 32 / 0.08), 0 8px 20px rgb(16 24 32 / 0.10);
  --md-sys-elevation-4: 0 4px 8px rgb(16 24 32 / 0.10), 0 14px 32px rgb(16 24 32 / 0.12);
  --md-sys-elevation-5: 0 6px 12px rgb(16 24 32 / 0.12), 0 20px 44px rgb(16 24 32 / 0.14);

  /* ── Shape ── */
  --md-sys-shape-corner-none:        0;
  --md-sys-shape-corner-extra-small: 2px;     /* derived */
  --md-sys-shape-corner-small:       4px;
  --md-sys-shape-corner-medium:      8px;
  --md-sys-shape-corner-large:       12px;    /* derived */
  --md-sys-shape-corner-extra-large: 16px;    /* derived */
  --md-sys-shape-corner-full:        9999px;  /* derived */

  /* ── Spacing (4-point) ── */
  --md-sys-spacing-1: 4px;
  --md-sys-spacing-2: 8px;
  --md-sys-spacing-3: 12px;
  --md-sys-spacing-4: 16px;
  --md-sys-spacing-5: 24px;
  --md-sys-spacing-6: 32px;
  --md-sys-spacing-7: 48px;
  --md-sys-spacing-8: 64px;
  --md-sys-spacing-9: 96px;

  /* ── Component sizes. All derived ── */
  --md-sys-size-control-sm: 32px;   /* chips, small buttons */
  --md-sys-size-control:    40px;   /* buttons, icon buttons */
  --md-sys-size-control-lg: 48px;   /* text fields, list rows, large buttons */
  --md-sys-size-icon:       20px;
  --md-sys-size-icon-lg:    24px;
  --md-sys-size-app-bar:    64px;
  --md-sys-size-card-min:   280px;  /* min column width in card grids */

  /* ── Motion. All derived ── */
  --md-sys-motion-duration-short:      120ms;  /* colour, opacity, state layers */
  --md-sys-motion-duration-medium:     200ms;  /* elevation, small moves */
  --md-sys-motion-duration-long:       320ms;  /* panels, page sections */
  --md-sys-motion-duration-extra-long: 480ms;  /* large reveals */
  --md-sys-motion-easing-standard:     cubic-bezier(0.2, 0, 0, 1);
  --md-sys-motion-easing-decelerate:   cubic-bezier(0, 0, 0, 1);       /* entering */
  --md-sys-motion-easing-accelerate:   cubic-bezier(0.3, 0, 1, 1);     /* leaving */
  --md-sys-motion-easing-emphasized:   cubic-bezier(0.05, 0.7, 0.1, 1);

  /* ── State layers (opacity of currentColor overlay). All derived ── */
  --md-sys-state-hover-opacity:   0.08;
  --md-sys-state-focus-opacity:   0.10;
  --md-sys-state-pressed-opacity: 0.10;
  --md-sys-state-dragged-opacity: 0.16;

  /* ── Layout. All derived ── */
  --md-sys-layout-max-width: 1120px;
  --md-sys-layout-gutter:    24px;
  --md-sys-layout-measure:   68ch;    /* max line length for prose */
}

/* Compact windows: smaller gutter and display sizes, all derived. Components need no changes. */
@media (max-width: 599px) {
  :root {
    --md-sys-layout-gutter: 16px;
    --md-sys-typescale-display-large:  600 40px/48px var(--md-sys-typescale-font-display);
    --md-sys-typescale-display-medium: 600 36px/44px var(--md-sys-typescale-font-display);
    --md-sys-typescale-display-small:  600 32px/40px var(--md-sys-typescale-font-display);
  }
}

/* Reduced motion: zero the durations, so every token-based transition stops. */
@media (prefers-reduced-motion: reduce) {
  :root {
    --md-sys-motion-duration-short: 0ms;
    --md-sys-motion-duration-medium: 0ms;
    --md-sys-motion-duration-long: 0ms;
    --md-sys-motion-duration-extra-long: 0ms;
  }
}
```

---

## 3. Dark mode

Paste after the `:root` block. The selector has higher specificity than `:root`, so order mistakes can't break it.

```css
:root[data-theme="dark"] {
  color-scheme: dark;
  /* Every value in this block is derived. */

  --md-sys-color-primary:                 #ffb595;
  --md-sys-color-on-primary:              #571e00;
  --md-sys-color-primary-container:       #7f300c;
  --md-sys-color-on-primary-container:    #ffdbcc;

  --md-sys-color-secondary:               #b2c7d9;
  --md-sys-color-on-secondary:            #1b3242;
  --md-sys-color-secondary-container:     #33485a;
  --md-sys-color-on-secondary-container:  #d7e3ee;

  --md-sys-color-tertiary:                #93d2d6;
  --md-sys-color-on-tertiary:             #003739;
  --md-sys-color-tertiary-container:      #0f5054;
  --md-sys-color-on-tertiary-container:   #c9ebec;

  --md-sys-color-error:                   #f2b8b5;
  --md-sys-color-on-error:                #601410;
  --md-sys-color-error-container:         #8c1d18;
  --md-sys-color-on-error-container:      #f9dedc;
  --md-sys-color-success:                 #9ad5a0;
  --md-sys-color-on-success:              #00390e;
  --md-sys-color-success-container:       #105220;
  --md-sys-color-on-success-container:    #cdeccf;
  --md-sys-color-warning:                 #ffb951;
  --md-sys-color-on-warning:              #462a00;
  --md-sys-color-warning-container:       #653f00;
  --md-sys-color-on-warning-container:    #ffddb3;

  --md-sys-color-surface:                   #121518;
  --md-sys-color-on-surface:                #e1e4e8;
  --md-sys-color-on-surface-variant:        #bcc4cc;
  --md-sys-color-surface-container-lowest:  #0d1013;
  --md-sys-color-surface-container-low:     #1a1d21;
  --md-sys-color-surface-container:         #1e2226;
  --md-sys-color-surface-container-high:    #282c31;
  --md-sys-color-surface-container-highest: #33373c;

  --md-sys-color-outline:                 #868f98;
  --md-sys-color-outline-variant:         #40474f;
  --md-sys-color-inverse-surface:         #e1e4e8;
  --md-sys-color-inverse-on-surface:      #2c3136;
  --md-sys-color-inverse-primary:         #a4441c;

  --md-sys-elevation-1: 0 1px 2px rgb(0 0 0 / 0.30), 0 1px 3px rgb(0 0 0 / 0.20);
  --md-sys-elevation-2: 0 1px 2px rgb(0 0 0 / 0.30), 0 3px 8px rgb(0 0 0 / 0.25);
  --md-sys-elevation-3: 0 2px 4px rgb(0 0 0 / 0.30), 0 8px 20px rgb(0 0 0 / 0.30);
  --md-sys-elevation-4: 0 4px 8px rgb(0 0 0 / 0.35), 0 14px 32px rgb(0 0 0 / 0.35);
  --md-sys-elevation-5: 0 6px 12px rgb(0 0 0 / 0.40), 0 20px 44px rgb(0 0 0 / 0.40);
}
```

Why `<html>` only: the computed tokens (`color-mix(…)`) resolve on the element that declares them. With the attribute on `<html>`, they pick up the dark values. On `<body>`, they would stay light.

Set the theme before first paint, in `<head>`: a saved choice wins, otherwise the OS preference.

```html
<script>
  (function () {
    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) {}
    var dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  })();
</script>
```

A toggle sets `document.documentElement.dataset.theme` and saves `'light'` or `'dark'` under the same key, inside `try`.

---

## 4. Base styles

```css
*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  font: var(--md-sys-typescale-body-large);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);
  -webkit-font-smoothing: antialiased;
}

a { color: var(--md-sys-color-primary); text-underline-offset: 0.2em; }

:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

::selection {
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

code, kbd, samp { font-family: var(--md-sys-typescale-font-mono); }
```

---

## 5. Colour roles

| Role | Use for |
|---|---|
| `primary` / `on-primary` | The main action, links, active indicators, focus rings |
| `primary-container` / `on-primary-container` | Selection highlight, low-emphasis brand areas |
| `secondary` / `on-secondary` | Rare: strong supporting elements |
| `secondary-container` / `on-secondary-container` | Tonal buttons, selected chips, selected list rows |
| `tertiary-container` / `on-tertiary-container` | Info callouts, "new" and highlight badges |
| `error`, `success`, `warning` (+ containers) | Status only: never decoration |
| `surface` | Page background |
| `surface-container-lowest` … `highest` | Raised surfaces, by elevation level (section 7) |
| `on-surface` | Body text, icons |
| `on-surface-variant` | Secondary text, captions, inactive icons |
| `outline` | Input borders, outlined buttons: borders that must be seen |
| `outline-variant` | Dividers and card borders: decoration only |
| `inverse-*` | Snackbars and tooltips |

Rules:
- Text on a coloured fill always uses that fill's `on-` pair. The pairs are checked for at least 4.5:1 contrast in both themes.
- `primary` text on `surface` or `surface-container-lowest` passes (5.8:1); on other containers, check before using it.
- Muted text is `on-surface-variant`, never `opacity` or a lighter hex.

---

## 6. Type scale

Set type with both tokens of a step, nothing else:

```css
.example { font: var(--md-sys-typescale-title-medium); letter-spacing: var(--md-sys-typescale-title-medium-tracking); }
```

`font` resets `font-variant-numeric`, so set `tabular-nums` after it.

| Step | Size / line | Use for |
|---|---|---|
| `display-large` | 57/64 | Landing hero only, once per page |
| `display-medium` | 45/52 | Large feature headings |
| `display-small` | 36/44 | Page titles |
| `headline-large` | 32/40 | Section titles; KPI and price figures |
| `headline-medium` | 28/36 | Sub-section titles |
| `headline-small` | 24/32 | Card titles |
| `title-large` | 22/28 | Dialog titles, app bar title |
| `title-medium` | 16/24 | List headers, form section titles |
| `title-small` | 14/20 | Table headers, dense card titles |
| `body-large` | 16/24 | Prose, descriptions |
| `body-medium` | 14/20 | UI text, card body, list supporting text |
| `body-small` | 12/16 | Captions, helper text, footnotes |
| `label-large` | 14/20 | Buttons, chips, tabs, field labels |
| `label-medium` | 12/16 | Badges, metadata |
| `label-small` | 11/16 | Tiny counters only |

Numbers that line up (tables, prices, counts): add `font-variant-numeric: tabular-nums`. IDs, codes and timestamps: keep the step, swap the family to `--md-sys-typescale-font-mono`.

---

## 7. Elevation

Raise a surface by its tone first; the shadow supports it. In dark mode the tone does almost all the work.

| Level | Surface | Shadow | Use for |
|---|---|---|---|
| 0 | `surface` | `elevation-0` | Page, flat sections |
| 1 | `surface-container-lowest` | `elevation-1` | Resting elevated card |
| 2 | `surface-container-low` | `elevation-2` | Hovered card, sticky app bar on scroll |
| 3 | `surface-container` | `elevation-3` | Menus, popovers |
| 4 | `surface-container-high` | `elevation-4` | Dialogs, side and bottom sheets |
| 5 | `surface-container-highest` | `elevation-5` | Rare: dragged items |

Filled cards and inset panels use `surface-container-high` with no shadow.

---

## 8. Shape, spacing, sizes

| Shape token | Value | Use for |
|---|---|---|
| `corner-none` | 0 | Full-bleed sections, table cells |
| `corner-extra-small` | 2px | Tooltips, tiny tags |
| `corner-small` | 4px | Buttons, chips, text fields |
| `corner-medium` | 8px | Cards, list containers, menus |
| `corner-large` | 12px | Sheets, large panels |
| `corner-extra-large` | 16px | Dialogs |
| `corner-full` | 9999px | Badges, avatars, icon buttons, switches |

| Spacing | Value | Use for |
|---|---|---|
| `spacing-1` | 4px | Icon-to-text in badges, tight stacks |
| `spacing-2` | 8px | Button groups, chip gaps, label-to-field |
| `spacing-3` | 12px | Inside cards between related lines |
| `spacing-4` | 16px | Default padding, grid gap on compact |
| `spacing-5` | 24px | Card padding, card grid gap |
| `spacing-6` | 32px | Between groups inside a section |
| `spacing-7` | 48px | Section heading to content |
| `spacing-8` | 64px | Section padding |
| `spacing-9` | 96px | Hero padding |

Only lengths from these tables, the size tokens and the layout tokens appear in components. The exceptions are `1px` and `2px` for borders, outlines and focus rings.

---

## 9. Motion and state layers

| Token | Value | Use for |
|---|---|---|
| `duration-short` + `easing-standard` | 120ms | Colour, opacity, state layers |
| `duration-medium` + `easing-standard` | 200ms | Elevation and border changes |
| `duration-long` + `easing-decelerate` | 320ms | Panels and sections entering |
| `duration-medium` + `easing-accelerate` | 200ms | Anything leaving |
| `duration-extra-long` + `easing-emphasized` | 480ms | One large reveal per view, at most |

Interactive elements get an overlay of their own text colour. Hover, focus and press change only its opacity, so the same rule works on every fill, in both themes:

```css
.interactive, .btn, .chip-filter { position: relative; isolation: isolate; }
.interactive::before, .btn::before, .chip-filter::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;                 /* above the fill, below the label */
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard);
}
:is(.interactive, .btn, .chip-filter):hover::before         { opacity: var(--md-sys-state-hover-opacity); }
:is(.interactive, .btn, .chip-filter):focus-visible::before { opacity: var(--md-sys-state-focus-opacity); }
:is(.interactive, .btn, .chip-filter):active::before        { opacity: var(--md-sys-state-pressed-opacity); }
```

Disabled: fill `--md-sys-color-disabled-container`, text `--md-sys-color-disabled-content`, no shadow, no state layer.

---

## 10. Breakpoints

Custom properties don't work inside `@media` conditions, so breakpoints are written as literals. Use only these:

| Window | Width | Layout |
|---|---|---|
| Compact | up to 599px | One column, 16px gutter, stacked actions |
| Medium | 600px to 839px | Two columns |
| Expanded | 840px and up | Up to four columns, max width 1120px |

```css
@media (max-width: 599px) { … }
@media (min-width: 600px) and (max-width: 839px) { … }
@media (min-width: 840px) { … }
```

Every layout must work at 360px wide with no horizontal scroll.

---

## 11. Do / Don't

Do:
- Use a token for every colour, font, size, radius, gap, shadow and duration.
- Raise surfaces with the surface-container ladder plus a shadow.
- Use state layers for hover, focus and press.
- Use `color-mix(in srgb, var(--token) N%, transparent)` for any translucency.
- Give icon-only buttons an `aria-label` and decorative SVGs `aria-hidden="true"`.
- Keep prose under `--md-sys-layout-measure`.

Don't:
- Type a hex, `rgb()`, `hsl()` or named colour outside this file. `rgba(0,0,0,.5)` in a component breaks dark mode.
- Use font sizes, radii, gaps or durations that aren't tokens.
- Use a shadow alone to show elevation.
- Use gradients, glows, glass effects, or purple and neon accents.
- Swap Inter, Roboto, Arial or any other family in for the three in section 1.
- Set `on-surface` to pure black or white when editing this file: body text stays a tinted near-black, or near-white in dark mode.
- Make muted text with `opacity`.
- Put copper on large backgrounds: it marks the main action, links and active indicators.
