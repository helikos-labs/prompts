---
title: Turn your design system into a reference-first Claude skill
summary: "Turn your tokens and brand notes into a Claude skill: a short SKILL.md that orients, one tokens file that holds every value, and component files that load on demand."
category: design
tags: [skills, design-tokens]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: intermediate
use_as: prompt
---

## The prompt

Run it in Claude Code from the repo that holds your tokens, or in a chat with your token file and brand notes attached. In the brand notes, list any component families your apps use beyond the core set (tables, dialogs, tabs…). In Claude Code, put file paths in the placeholders and add "Write the files to `.claude/skills/<brand>-design/`." at the end. In a chat, save the files it returns to that folder, or zip the folder and upload it in Claude's skill settings.

```text
Build a Claude skill that applies the {{brand}} design system to all frontend work: pages, components, dashboards, forms and artifacts. Make it reference-first: a short SKILL.md that Claude reads every time, plus reference files it loads only when the task needs them.

Sources (the only place brand values may come from):
<brand_notes>
{{brand_notes}}
</brand_notes>
<tokens>
{{tokens_source}}
</tokens>
Target stack: {{stack}}

Write these files.

1. SKILL.md: orientation, under 200 lines.
   - Frontmatter: `name` (the brand slug plus "-design") and a `description` under 1024 characters: what it applies, the stack, trigger phrases people actually say ("our design system", "{{brand}} style", "on-brand", "use our colours", "match the app"), and the sentence "Always read references/tokens.md before writing any CSS."
   - Identity: the aesthetic in one line, 4 to 6 tone words, and a "What this is NOT" list naming 3 to 5 generic looks Claude would otherwise drift to that are wrong for this brand.
   - Core values table: primary and surface colours, one font per role, default mode, base system.
   - File map, then a "When to load which file" table (task → file). tokens.md loads for every task. For component families with no file yet, say so and point to the principles.
   - Mandatory principles, each a rule plus its exact token names, without their values (tokens.md holds those): colour roles, not values (text on a fill uses that fill's on- pair); tonal elevation (move up the surface-container ladder first, the shadow only supports it; give the surface and shadow for card, hovered card, menu and dialog); type scale only; shape scale only; spacing and size tokens only; state layers (a currentColor overlay at fixed hover, focus, pressed and dragged opacities); motion tokens only, with reduced motion; one main action and one accent per view; dark mode with no component-level overrides.
   - Quick decision table, 20 to 30 rows of need → token, with no values: page background, alternate section, card, dialog, main action, secondary action, selected item, body text, muted text, divider, input border, status colours, heading and body steps, big figures, radius per component, card padding.
   - Pre-output checklist: yes/no checks Claude runs on its own output before replying. At least: a standalone output (an artifact or a single HTML file) includes the font link, :root block, dark block and base styles; no literal colour, font or length outside tokens.md; every text style is a type step plus its tracking; raised surfaces are a surface-container step plus a shadow; every control has hover, focus-visible, pressed and disabled states; transitions use motion tokens; text sits on its on- pair and muted text is never opacity; one filled button per group; the layout works at 360px wide with no horizontal scroll; icon-only buttons have aria-label, decorative SVGs have aria-hidden, and no state is shown by colour alone.

2. references/tokens.md: the single source of truth.
   - The font loading snippet.
   - One :root block, ready to paste: every colour role (primary, secondary, tertiary, error, plus success and warning if the brand uses them, each with on-, -container and on-…-container), the surface-container ladder from lowest to highest, outline and outline-variant, inverse roles, scrim; the type scale; elevation shadows; shape; spacing; component sizes; motion durations and easings; state-layer opacities; layout widths, including a measure for prose.
   - @media overrides in the same file: the compact window shrinks the gutter and display sizes, and reduced motion zeroes the durations.
   - A dark block that overrides every colour role and every shadow, and how to switch it: an attribute on <html>, set from the saved choice or the OS preference before first paint.
   - Base styles (body, links, focus ring, selection), the state-layer CSS, the breakpoints, short usage tables for roles, type steps, elevation levels, shape, spacing and motion, then a Do / Don't list. Name in it the defaults Claude drifts to that this brand rejects, such as Inter, Roboto or Arial and pure black or white body text.

3. references/components-core.md: buttons, cards, chips, badges, text fields, lists, dividers, top app bar, and page structure (container, section, card grid, plus a dashboard shell if the team builds dashboards). Add one components-<family>.md for each other family the brand notes list. For each component: CSS for every variant and state (hover, focus-visible, pressed, disabled, selected, error), a short HTML usage snippet, and an emphasis table wherever variants differ in emphasis (buttons, cards, chips, badges). Each file starts with "Load tokens.md first."

Rules:
- Name variables --md-sys-<group>-<name>: --md-sys-color-primary, --md-sys-typescale-body-large (a font shorthand) plus --md-sys-typescale-body-large-tracking, --md-sys-shape-corner-small, --md-sys-spacing-4, --md-sys-motion-duration-short, --md-sys-state-hover-opacity. Components set type with font, then letter-spacing, then anything the font shorthand resets, such as tabular-nums.
- Use Material 3 role names (primary, on-primary, primary-container, surface-container-high, outline-variant…) unless the source already names its tokens. In that case keep the team's names and map each one to its role in a table.
- Never invent a brand value. When the source lacks one (a container tone, a dark value, a shadow), derive it from the M3 tonal palette of the nearest brand colour (light: container tone 90, on-container tone 10 to 30; dark: role tone 80, on-role 20, container 30, on-container 90; surfaces from a neutral palette at the hue of the brand's surface colour, or of the primary if none is given). If you can run code, use @material/material-color-utilities. Mark each derived value /* derived */ in tokens.md (one comment may cover a block that is all derived), and list every derived value at the end of your reply.
- Check contrast for every on-X / X pair in both themes: at least 4.5:1 for text, 3:1 for outlines that carry meaning. Compute each ratio with the WCAG 2.x relative-luminance formula (run code if you can); don't estimate. Adjust derived values until they pass. If a brand value fails, keep it and flag it.
- If the notes and the tokens disagree (the notes say one accent, the tokens hold two), don't settle it silently: say in SKILL.md what each colour is for and list the conflict as an open question.
- Literal colours, font names and lengths appear only in tokens.md. Component CSS uses var() only; 1px and 2px borders and focus rings are the one exception. Translucency is color-mix() on a token, never an rgba() or #rrggbbaa literal: those break in dark mode.
- Custom properties don't work in @media conditions, so write breakpoints as literals and list them once in tokens.md.
- Fit {{stack}}: say where the :root block goes and how components consume the tokens there (plain classes, CSS modules, a Tailwind theme pointing at the same variables…).
- The decision table, the principles and the component code must give the same answer: one radius for buttons, one surface for cards. When you finish, re-read them against each other, check that every component has every state that applies to it, and fix every gap or mismatch.
- No padding: no component family the team doesn't use, no generic design advice the tokens don't enforce.

Return each file in full under its path, then the derived values, then a contrast table (pair, theme, ratio, pass or fail), then any open questions for the team.
```

## Example

The download is a worked example for Copperline, an invented brand. It was written to this prompt's structure from the inputs below, not generated by the prompt. The output here is the prompt's own reply to the same inputs.

**Input** (the prompt's placeholders):
- `brand`: Copperline
- `brand_notes`: "Scheduling tool for small field-service crews. Practical, calm, warm-industrial. Copper is the only accent, slate supports it, cool grey surfaces. Not glossy, not playful, light first. Big numbers matter: counts, totals, times."
- `tokens_source`: "primary #a4441c (copper), secondary #3d5263 (slate), tertiary #2b6a6e (teal), error #b3261e. Page #f7f8f9, cards #ffffff, text #171a1d. Fonts: Bricolage Grotesque (headings), Source Sans 3 (UI), IBM Plex Mono (data). Radii: 4px controls, 8px cards. 4-point spacing."
- `stack`: plain HTML and CSS, no build step

**Output** (trimmed: parts of SKILL.md and of the tokens.md `:root` block, then three of the reply's 74 contrast rows, its verdict and the first open question):

```markdown
## What each colour is for

- **Copper (primary):** the only accent. The main action, links, text buttons, the focus ring, the focused field border, text selection.
…
- **Teal (tertiary):** done and confirmed status only (`tertiary-container`). Never buttons, links, highlights or decoration. The notes say copper is the only accent but the tokens include teal, so teal stays off anything that reads as an accent until the team decides (open question 1).
…

## When to load which file

| Task | Load |
|---|---|
| Any frontend task (always, first) | `references/tokens.md` |
…
| Dashboard, KPI or stat tiles, app navigation | + `components-core.md`, Dashboard shell |
…
| Dialog, menu, snackbar | No file yet: principles 2, 4, 6 and 7 plus the decision table |
…

## Quick decision table

| Need | Use |
|---|---|
…
| Hovered card | `surface-container` + `elevation-level2` |
…
| Big figures | `figure-large` (one hero per view), `figure-medium` (stat tiles), `figure-small` (inside cards) |
…
```

```css
:root {
  …
  --md-sys-color-primary: #a4441c;
  --md-sys-color-on-primary: #ffffff;                  /* derived: P100 */
  --md-sys-color-primary-container: #ffdbcf;           /* derived: P90 */
  --md-sys-color-on-primary-container: #802a02;        /* derived: P30 */
  …
  --md-sys-color-surface: #f7f8f9;                     /* brand: page */
  --md-sys-color-on-surface: #171a1d;                  /* brand: text */
  --md-sys-color-on-surface-variant: #40484b;          /* derived: NV30 */
  --md-sys-color-surface-container-lowest: #ffffff;    /* derived: N100 */
  --md-sys-color-surface-container-low: #ffffff;       /* brand: cards */
  --md-sys-color-surface-container: #eceeef;           /* derived: N94 */
  …
}
```

> | Pair | Theme | Colours | Ratio | Needs | Result |
> |---|---|---|---|---|---|
> | on-primary / primary | light | #ffffff on #a4441c | 6.14:1 | 4.5:1 | pass |
> | outline / surface-container-high | light | #70787c on #e6e8ea | 3.66:1 | 3:1 | pass |
> | inverse-primary / inverse-surface | dark | #a4441c on #e1e3e4 | 4.77:1 | 4.5:1 | pass |
>
> Every pair passes in both themes, so no derived value needed adjusting and no brand value fails. …
>
> 1. **Teal is a second accent.** The notes say "copper is the only accent"; the tokens add teal (#2b6a6e) as tertiary.
>    - The skill restricts teal to done and confirmed status (`tertiary-container`) and bans it from actions and highlights.
>    - Is teal meant as an accent, as a status colour, or should it be dropped?

SKILL.md sends each task to a file, or to the principles where no file exists yet, and its decision table names tokens, not values. Every derived colour in tokens.md names the tonal-palette tone it came from, all 74 contrast ratios recompute to the same figures, and the clash over teal came back as a question rather than a silent choice.

## Why it works

- **Orientation always, detail on demand.** SKILL.md sits in context for every UI task, so it stays short and carries only what every task needs: identity, principles, decision table, checklist. tokens.md loads with every UI task too, and the long component files load only when the "when to load which file" table names them. A fixed core file plus one file per family the team names keeps out components nobody builds. Context stays small, and Claude doesn't have to guess which file matters.
- **Roles, not values, with literals in one file.** Components can only say `var(--md-sys-color-primary)`, and SKILL.md's principles and decision table name tokens without their values, so dark mode is an edit to tokens.md alone, and a rebrand changes tokens.md plus the SKILL.md lines that name the brand's colours and fonts. Claude can't drift to its default palette or fonts. Banning literal `rgba()` colours and limiting raw pixels to borders closes the two leaks that most often break dark mode and spacing. Material 3 role names and one naming scheme reuse what the model already knows about `primary-container` or `surface-container-high`, and give a Tailwind theme or a second brand fixed names to map onto.
- **"What this is NOT" and a decision table turn taste into lookups.** Left alone, Claude fills gaps with its house style: Inter, gradients, purple accents, soft shadows everywhere. Naming the wrong looks and fonts blocks them, and need → token rows answer the questions it would otherwise improvise. The checklist spells out the checks that are easiest to skip (the token block in a standalone file, every control state, 360px, labels on icon-only buttons), so Claude verifies them rather than just reading the rules.
- **Derived values computed, flagged and re-checked.** Real token sources have gaps. Claude may fill them, but from the M3 tonal palette, so runs agree on the tones. Every invented value is marked and listed, every contrast ratio is computed rather than guessed, and a clash between the notes and the tokens comes back as a question instead of a silent choice. Hand-written design-system skills often contradict themselves (the table says 6px buttons, the CSS says pill); the final cross-check, which includes every state of every component, stops the skill from teaching two answers.

## Variations

- **Tailwind or a component library.** Ask tokens.md to map the theme to the same CSS variables. In Tailwind v4 that is `@theme inline { --color-primary: var(--md-sys-color-primary); --radius-sm: var(--md-sys-shape-corner-small); }` in your CSS; in v3 it is `theme.extend` in `tailwind.config.js` (`colors: { primary: 'var(--md-sys-color-primary)' }`). Utility classes and raw CSS stay in sync, and dark mode still switches through the attribute.
- **Several brands.** Share the component files and give each brand its own tokens.md and Identity section. With the role names fixed, nothing else changes.
- **Audit an existing skill.** Replace the first paragraph with "Audit this design-system skill against the rules below and list every violation with file and section". It finds hard-coded colours, off-scale values and table-versus-CSS mismatches.
- **Lint it.** Add a CI step that fails when `grep -nP '#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?)\(|(?<![\d.])(?![12]px\b)\d+(\.\d+)?px\b' components-*.md | grep -v '@media'` prints anything. It lets through 1px and 2px borders and the literal breakpoints, and catches stray hex, `rgb()` and `hsl()` colours and pixel sizes, so the token rule survives human edits.
- **Forking the download.** It is named `design-system-skill` to match this page; rename the folder and `name`, and add your team's own trigger phrases to the description.
- Generalised from a brand design skill.
