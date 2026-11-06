# Prompts

Tested Claude prompts for building, shipping and running small AI-powered web apps. Live at **https://prompts.helikos.dev**.

Each entry is one Markdown file: the prompt, a real example of its output, why it works, and variations. Reusable workflows also ship as an installable `SKILL.md`. Entries cover:

- app specs
- AI features that run inside your app
- Claude Code workflows
- design systems
- deploy and hosting
- QA and debugging
- geospatial data

The site is static HTML built from those files at build time: no backend, no accounts, and no analytics or tracking scripts. Cloudflare serves the pages and sees each request.

## Use a prompt

1. Open an entry on the site.
2. Fill in the blanks. Every `{{placeholder}}` gets an input box. Your values are saved in this browser until you clear them, and leave it only when you use the Open button, which puts the filled-in prompt in a claude.ai link.
3. Copy it, or open it in Claude or Claude Code. A prompt short enough for a link opens with the text filled in; nothing is sent until you press send. A longer one is copied and a new chat opens for you to paste it into.
4. For entries with a skill, download the `.zip` and unzip it into `.claude/skills/`, or upload it in the Claude apps under Customize → Skills.

Each entry shows the model and date it was last tested. Entries tested more than six months ago are flagged "may be dated".

## Contributing

Contributions are welcome through pull requests: one tested prompt per PR.

1. Copy [`TEMPLATE.md`](TEMPLATE.md) to `content/<category>/<slug>.md`.
2. Fill in the frontmatter: `title`, `summary`, `category`, `tags`, `model_tested`, `date_tested`, `difficulty`, `use_as`.
3. Fill in the sections: The prompt, Example, Why it works, and optionally Variations.
4. Run `npm ci && npm run validate`.
5. Open a PR. The template has a short checklist, and CI runs the same validation plus the build.

[CONTRIBUTING.md](CONTRIBUTING.md) has the full format, the quality bar and what must never go in a public prompt.

## Develop

```bash
npm ci
npm run validate   # check every entry's frontmatter and sections
npm test           # unit tests for the validator
npm run build      # write the site to dist/
npm run dev        # build, then serve it locally with wrangler
```

| Path | What it is |
|---|---|
| `content/<category>/<slug>.md` | One entry each |
| `skills/<slug>/SKILL.md` | The installable skill for an entry, plus any `references/` |
| `site.config.json` | Site title, categories, labels and the six-month staleness window |
| `scripts/content.mjs` | Loads and validates entries; shared by `validate` and `build` |
| `scripts/build.mjs` | Renders pages, the search index, skill zips, the sitemap and security headers |
| `site/` | The stylesheet and the one small script: search, filters, placeholders, copy |
| `public/` | Files served as-is |

## Deploy

Cloudflare Workers Builds runs `npm run build` and serves `dist/` as Worker static assets. A push to `main` deploys production. Other branches build a Preview, and its URL is posted on the pull request.

## Licences

- Prompt content (`content/`, `skills/`): [CC BY 4.0](LICENSE-CONTENT). Reuse it anywhere, with attribution.
- Everything else (code in `scripts/` and `site/`, `public/`, configuration, `.github/` and the docs): [MIT](LICENSE).

This project is not affiliated with Anthropic. Claude is a trademark of Anthropic.
