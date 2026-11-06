# Copperline components: core

Buttons, cards, chips, badges, text fields, lists, dividers, app bar and page structure.

Load `tokens.md` first: it holds the variables, the base styles and the state-layer rule these components rely on. Every value below is a token. The only literal lengths are `1px` and `2px` for borders and focus rings.

Contents: 1. Buttons · 2. Cards · 3. Chips · 4. Badges · 5. Text fields · 6. Lists · 7. Dividers · 8. Top app bar · 9. Page structure

---

## 1. Buttons

One `btn-filled` per view or group. Everything else is tonal, outlined or text.

| Variant | Emphasis | Use for |
|---|---|---|
| `btn-filled` | Highest | The one main action: Save, Book, Continue |
| `btn-tonal` | Medium | Secondary actions next to a filled button |
| `btn-outlined` | Medium-low | Alternatives that need a visible edge |
| `btn-text` | Low | Cancel, Learn more, inline actions |
| `btn-danger` | High, destructive | Delete, Remove: confirm first |

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md-sys-spacing-2);
  min-height: var(--md-sys-size-control);
  padding: 0 var(--md-sys-spacing-5);
  font: var(--md-sys-typescale-label-large);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  border: 1px solid transparent;          /* keeps every variant the same size */
  border-radius: var(--md-sys-shape-corner-small);
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard);
}
.btn svg { width: var(--md-sys-size-icon); height: var(--md-sys-size-icon); flex: none; }

.btn-filled  { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
.btn-filled:hover { box-shadow: var(--md-sys-elevation-1); }

.btn-tonal   { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }

.btn-outlined {
  background: transparent;
  color: var(--md-sys-color-primary);
  border-color: var(--md-sys-color-outline);
}

.btn-text    { background: transparent; color: var(--md-sys-color-primary); padding: 0 var(--md-sys-spacing-3); }

.btn-danger  { background: var(--md-sys-color-error); color: var(--md-sys-color-on-error); }

/* Sizes and width */
.btn-sm    { min-height: var(--md-sys-size-control-sm); padding: 0 var(--md-sys-spacing-4); }
.btn-lg    { min-height: var(--md-sys-size-control-lg); padding: 0 var(--md-sys-spacing-6); }
.btn-block { display: flex; width: 100%; }

/* Icon-only: always add aria-label */
.btn-icon {
  width: var(--md-sys-size-control);
  padding: 0;
  border-radius: var(--md-sys-shape-corner-full);
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
}

/* Disabled */
.btn:disabled,
.btn[aria-disabled="true"] {
  background: var(--md-sys-color-disabled-container);
  color: var(--md-sys-color-disabled-content);
  border-color: transparent;
  box-shadow: none;
  cursor: not-allowed;
  pointer-events: none;
}
.btn-outlined:disabled, .btn-text:disabled, .btn-icon:disabled { background: transparent; }
.btn-outlined:disabled { border-color: var(--md-sys-color-disabled-container); }
```

```html
<div class="btn-row">
  <button class="btn btn-filled" type="submit">Save schedule</button>
  <button class="btn btn-text" type="button">Cancel</button>
</div>
<button class="btn btn-icon" type="button" aria-label="More options">
  <svg viewBox="0 0 24 24" aria-hidden="true">…</svg>
</button>
```

```css
.btn-row { display: flex; flex-wrap: wrap; gap: var(--md-sys-spacing-2); align-items: center; }
@media (max-width: 599px) { .btn-row { flex-direction: column; align-items: stretch; } }
```

On compact windows the row stacks full width, main action first. Put it first in the HTML too, so focus order matches.

---

## 2. Cards

Three variants. Pick by how much the card should stand off the page.

| Variant | Surface | Edge | Use for |
|---|---|---|---|
| `card-elevated` | `surface-container-lowest` + `elevation-1` | Shadow | Default content cards on `surface` |
| `card-outlined` | `surface-container-lowest` | `outline-variant` border | Cards in dense grids or on `surface-container-low` sections |
| `card-filled` | `surface-container-high` | None | Inset panels, summaries, secondary groups |

```css
.card {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-3);
  padding: var(--md-sys-spacing-5);
  border: 1px solid transparent;
  border-radius: var(--md-sys-shape-corner-medium);
  color: var(--md-sys-color-on-surface);
  text-decoration: none;
  transition:
    background-color var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard),
    box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard),
    border-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard);
}

.card-elevated { background: var(--md-sys-color-surface-container-lowest); box-shadow: var(--md-sys-elevation-1); }
.card-outlined { background: var(--md-sys-color-surface-container-lowest); border-color: var(--md-sys-color-outline-variant); }
.card-filled   { background: var(--md-sys-color-surface-container-high); }

/* Whole card clickable: <a class="card card-elevated interactive" href="…"> */
.card-elevated.interactive:hover { background: var(--md-sys-color-surface-container-low); box-shadow: var(--md-sys-elevation-2); }
.card-outlined.interactive:hover { border-color: var(--md-sys-color-outline); }

/* Selected (a chosen option in a set). A ring, not a thicker border, so nothing shifts. */
.card.is-selected {
  border-color: var(--md-sys-color-primary);
  box-shadow: var(--md-sys-elevation-1), 0 0 0 1px var(--md-sys-color-primary);
}

/* Parts */
.card-title {
  margin: 0;
  font: var(--md-sys-typescale-headline-small);
  letter-spacing: var(--md-sys-typescale-headline-small-tracking);
}
.card-subtitle,
.card-body {
  margin: 0;
  font: var(--md-sys-typescale-body-medium);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
  color: var(--md-sys-color-on-surface-variant);
}
.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-sys-spacing-2);
  margin-top: auto;                       /* pins actions to the bottom in equal-height grids */
  padding-top: var(--md-sys-spacing-4);
}
```

```html
<article class="card card-elevated">
  <h3 class="card-title">Weekly crew plan</h3>
  <p class="card-body">Assign jobs to crews and see conflicts before Monday.</p>
  <div class="card-actions">
    <a class="btn btn-tonal" href="#">Open plan</a>
  </div>
</article>
```

Selected state needs a non-colour signal too: a check icon, a badge, or `aria-checked`/`aria-current` on the control.

---

## 3. Chips

Compact choices and filters. A filter chip is a toggle button.

| Variant | Emphasis | Use for |
|---|---|---|
| `chip` | Low | A static tag or a summary of a choice; not clickable |
| `chip-filter` | Low | Filters and view switches that toggle on and off |
| `chip-filter[aria-pressed="true"]` | Medium | The selected filter: `secondary-container`, plus a check icon so selection isn't colour alone |

```css
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--md-sys-spacing-2);
  min-height: var(--md-sys-size-control-sm);
  padding: 0 var(--md-sys-spacing-3);
  font: var(--md-sys-typescale-label-large);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  white-space: nowrap;
}
.chip svg { width: var(--md-sys-size-icon); height: var(--md-sys-size-icon); }

.chip-filter { cursor: pointer; }
.chip-filter[aria-pressed="true"] {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  border-color: transparent;
}
.chip-filter:disabled {
  background: transparent;
  color: var(--md-sys-color-disabled-content);
  border-color: var(--md-sys-color-disabled-container);
  cursor: not-allowed;
  pointer-events: none;
}

.chip-group { display: flex; flex-wrap: wrap; gap: var(--md-sys-spacing-2); }
```

```html
<div class="chip-group" role="group" aria-label="Filter by status">
  <button class="chip chip-filter" type="button" aria-pressed="true">
    <svg viewBox="0 0 24 24" aria-hidden="true">…</svg>Scheduled
  </button>
  <button class="chip chip-filter" type="button" aria-pressed="false">Unassigned</button>
</div>
```

---

## 4. Badges

Short status or metadata labels. Not clickable.

| Variant | Emphasis | Use for |
|---|---|---|
| `badge-neutral` | Low | Counts and metadata |
| `badge-info` | Medium | Info, "New" and highlight labels |
| `badge-primary` | Medium | One brand label per view, such as "Recommended" |
| `badge-success`, `badge-warning`, `badge-error` | Status | Status only, never decoration |

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--md-sys-spacing-1);
  padding: var(--md-sys-spacing-1) var(--md-sys-spacing-3);
  font: var(--md-sys-typescale-label-medium);
  letter-spacing: var(--md-sys-typescale-label-medium-tracking);
  border-radius: var(--md-sys-shape-corner-full);
  white-space: nowrap;
}
.badge-neutral { background: var(--md-sys-color-surface-container-high); color: var(--md-sys-color-on-surface-variant); }
.badge-primary { background: var(--md-sys-color-primary-container);      color: var(--md-sys-color-on-primary-container); }
.badge-info    { background: var(--md-sys-color-tertiary-container);     color: var(--md-sys-color-on-tertiary-container); }
.badge-success { background: var(--md-sys-color-success-container);      color: var(--md-sys-color-on-success-container); }
.badge-warning { background: var(--md-sys-color-warning-container);      color: var(--md-sys-color-on-warning-container); }
.badge-error   { background: var(--md-sys-color-error-container);        color: var(--md-sys-color-on-error-container); }
```

Status badges carry a word ("Overdue"), not just a colour.

---

## 5. Text fields

Outlined fields. Errors hook on `aria-invalid`, so the visual state and the accessible state can't drift apart.

```css
.field { display: flex; flex-direction: column; gap: var(--md-sys-spacing-1); }

.field-label {
  font: var(--md-sys-typescale-label-large);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  color: var(--md-sys-color-on-surface);
}

.field-input {
  width: 100%;
  min-height: var(--md-sys-size-control-lg);
  padding: 0 var(--md-sys-spacing-4);
  font: var(--md-sys-typescale-body-large);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface-container-lowest);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-small);
  transition: border-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard);
}
.field-input:hover { border-color: var(--md-sys-color-on-surface); }
.field-input:focus-visible {
  border-color: var(--md-sys-color-primary);
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: -1px;                   /* a 2px ring over the 1px border, no shift */
}
.field-input::placeholder { color: var(--md-sys-color-on-surface-variant); }
textarea.field-input {
  padding: var(--md-sys-spacing-3) var(--md-sys-spacing-4);
  min-height: calc(var(--md-sys-size-control-lg) * 2);
  resize: vertical;
}

.field-support {
  font: var(--md-sys-typescale-body-small);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
  color: var(--md-sys-color-on-surface-variant);
}

.field-input[aria-invalid="true"] { border-color: var(--md-sys-color-error); }
.field-input[aria-invalid="true"]:focus-visible { outline-color: var(--md-sys-color-error); }
.field:has(.field-input[aria-invalid="true"]) .field-support { color: var(--md-sys-color-error); }

.field-input:disabled {
  background: transparent;
  color: var(--md-sys-color-disabled-content);
  border-color: var(--md-sys-color-disabled-container);
}
```

```html
<div class="field">
  <label class="field-label" for="crew">Crew name</label>
  <input class="field-input" id="crew" aria-describedby="crew-help">
  <span class="field-support" id="crew-help">Shown on every job card.</span>
</div>
```

---

## 6. Lists

```css
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.list-item {
  display: flex;
  align-items: center;
  gap: var(--md-sys-spacing-4);
  min-height: var(--md-sys-size-control-lg);
  padding: var(--md-sys-spacing-2) var(--md-sys-spacing-4);
  font: var(--md-sys-typescale-body-large);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);
  color: var(--md-sys-color-on-surface);
  text-decoration: none;
}
.list-divided > .list-item + .list-item { border-top: 1px solid var(--md-sys-color-outline-variant); }

.list-item-icon     { width: var(--md-sys-size-icon-lg); height: var(--md-sys-size-icon-lg); flex: none; color: var(--md-sys-color-on-surface-variant); }
.list-item-text     { flex: 1; min-width: 0; }
.list-item-supporting {
  display: block;
  font: var(--md-sys-typescale-body-medium);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
  color: var(--md-sys-color-on-surface-variant);
}
.list-item-trailing {
  flex: none;
  font: var(--md-sys-typescale-label-medium);
  letter-spacing: var(--md-sys-typescale-label-medium-tracking);
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;
}

/* Clickable rows: <a class="list-item interactive"> */
.list-item[aria-current="true"] {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

/* Inside a card or panel */
.list-contained {
  background: var(--md-sys-color-surface-container-lowest);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  overflow: hidden;
}
```

---

## 7. Dividers

```css
.divider { border: 0; border-top: 1px solid var(--md-sys-color-outline-variant); margin: var(--md-sys-spacing-4) 0; }
.divider-flush { margin: 0; }
```

Prefer spacing over dividers. Use one only where two groups would otherwise read as one.

---

## 8. Top app bar

```css
.top-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  min-height: var(--md-sys-size-app-bar);
  display: flex;
  align-items: center;
  gap: var(--md-sys-spacing-4);
  padding: 0 var(--md-sys-layout-gutter);
  background: var(--md-sys-color-surface);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  transition:
    background-color var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard),
    box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard);
}
.top-bar.is-scrolled { background: var(--md-sys-color-surface-container-low); box-shadow: var(--md-sys-elevation-2); }
.top-bar-title {
  margin: 0;
  flex: 1;
  font: var(--md-sys-typescale-title-large);
  letter-spacing: var(--md-sys-typescale-title-large-tracking);
}
```

---

## 9. Page structure

```css
.container {
  width: 100%;
  max-width: var(--md-sys-layout-max-width);
  margin-inline: auto;
  padding-inline: var(--md-sys-layout-gutter);
}
.section     { padding-block: var(--md-sys-spacing-8); }
.section-alt { background: var(--md-sys-color-surface-container-low); }

.section-header { margin-bottom: var(--md-sys-spacing-7); max-width: var(--md-sys-layout-measure); }
.eyebrow {
  margin: 0 0 var(--md-sys-spacing-2);
  font: var(--md-sys-typescale-label-large);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  color: var(--md-sys-color-primary);
}
.section-title {
  margin: 0 0 var(--md-sys-spacing-3);
  font: var(--md-sys-typescale-headline-large);
  letter-spacing: var(--md-sys-typescale-headline-large-tracking);
  text-wrap: balance;
}
.section-lede {
  margin: 0;
  font: var(--md-sys-typescale-body-large);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);
  color: var(--md-sys-color-on-surface-variant);
}

/* Card grid: as many columns as fit, one on compact */
.card-grid {
  display: grid;
  gap: var(--md-sys-spacing-5);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--md-sys-size-card-min)), 1fr));
  align-items: stretch;
}
@media (max-width: 599px) { .card-grid { gap: var(--md-sys-spacing-4); } }
```

Sections on one page alternate `section` and `section-alt`; don't add borders between them.
