# Contributing a prompt

Prompts here help people build, ship and run small AI-powered web apps: specs, in-app AI features, Claude Code workflows, design systems, deployment, QA and data tooling. One strong, tested entry beats five sketches.

## Submit one

1. Fork the repo and create a branch.
2. Copy [`TEMPLATE.md`](TEMPLATE.md) to `content/<category>/<slug>.md`. The slug is the file name: lowercase words joined by hyphens, unique across the library.
3. Fill in the frontmatter and the four sections below.
4. If the entry is a reusable workflow, also add `skills/<slug>/SKILL.md` (see [Skills](#skills)).
5. Run `npm ci && npm run validate` and fix anything it reports. `npm run dev` builds the site and serves it locally.
6. Open a pull request. The PR template has a short checklist, and CI runs the same validation.

## Frontmatter

```yaml
---
title: Ask 2–4 clarifying questions with tappable options   # 3–90 characters
summary: One sentence for the card, 20–200 characters.
category: ai-features        # must match the folder
tags: [structured-output, ux] # 1–6, lowercase-hyphenated, 24 characters at most; reuse tags already on the site
model_tested: Claude Opus 5.5 # "Claude <model>", 8–40 characters: the model you ran this exact text on
date_tested: 2026-11-06       # YYYY-MM-DD, the UTC day you ran it; not in the future, not before 2023
difficulty: beginner          # beginner | intermediate | advanced
use_as: prompt                # prompt | skill | claude-code
credit: Optional, one line    # e.g. the idea or source you adapted
---
```

| Field | Meaning |
|---|---|
| `category` | One of `app-specs`, `ai-features`, `claude-code`, `design`, `deploy-hosting`, `qa-debugging`, `data-geospatial`. Propose a new one in your PR if none fits. |
| `use_as` | `prompt`: paste into a Claude chat or call it from code. `skill`: install it as a skill (needs a `SKILL.md`). `claude-code`: run it in a Claude Code session on a repository. |
| `model_tested`, `date_tested` | The model and day you last ran **this exact text** and got the output in your example. The site flags entries older than six months as "may be dated". |
| `difficulty` | How much context the reader needs to use it well, not how long the prompt is. |

No other fields are allowed; the validator says which one it doesn't know.

## Sections

Use exactly these `##` headings, in this order:

1. **`## The prompt`**: the prompt itself in a fenced code block. The site's Copy button copies the first fenced block in this section. Mark the parts a reader must fill in as `{{snake_case}}` placeholders; the site renders an input box for each one. A sentence before the block saying where to run it is welcome.
2. **`## Example`**: a short, real input and the output it produced, trimmed. Real means you ran it. Don't write the output yourself.
3. **`## Why it works`**: 2–4 points on the design choices: what each rule prevents or enables.
4. **`## Variations`** (optional): adaptations, and where the idea came from.

Don't add a `#` heading; the title comes from the frontmatter.

## Skills

If the entry is a workflow Claude should follow every time rather than a one-off prompt, add a skill:

```
skills/<slug>/SKILL.md          # required: frontmatter with name: <slug> and a description
skills/<slug>/references/*.md   # optional: files the skill loads on demand
```

The `description` says when Claude should use the skill, in 20–1024 characters. The entry page links to it, and readers download it into `.claude/skills/<slug>/` or upload it in the Claude apps under Customize → Skills.

## Quality bar

- **Tested.** You ran this text, on the model you name, and the example is real output.
- **General.** Replace anything specific to your project with a placeholder, unless it is the example.
- **Explained.** "Why it works" teaches the technique, so readers can adapt it rather than copy it blind.
- **Short enough.** Cut any rule you can't explain in "Why it works".

## Keep it clean

Pull requests are public. Don't include:

- API keys, tokens or passwords. The validator rejects common key formats.
- Links to private systems, private repositories or private chat or session links.
- Names or details of real people who aren't public figures, or of your employer, clients or their sites.
- Confidential business information.

Swap real details for neutral ones before you commit; git history is public too.

## Licences

By contributing you agree that your prompt content (`content/`, `skills/`) is published under [CC BY 4.0](LICENSE-CONTENT) and anything else under [MIT](LICENSE).
