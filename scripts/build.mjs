// Build the static site into dist/ from content/ and skills/. No framework, no client-side rendering:
// every page is plain HTML, and site/app.js adds search, filters, copy and placeholder filling on top.
import { rmSync, mkdirSync, writeFileSync, readFileSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { crc32 } from 'node:zlib';
import { createHash } from 'node:crypto';
import { Marked } from 'marked';
import { loadEntries, config, ROOT, firstFence } from './content.mjs';

const DIST = join(ROOT, 'dist');
const BUILD_DATE = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);

const { entries, errors, warnings } = loadEntries({ today: BUILD_DATE });
for (const w of warnings) console.log(`warning  ${w}`);
if (errors.length) {
  for (const e of errors) console.log(`error    ${e}`);
  console.log(`\nBuild stopped: ${errors.length} content problem${errors.length === 1 ? '' : 's'}. Run npm run validate.`);
  process.exit(1);
}

// ── helpers ──────────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const cats = Object.fromEntries(config.categories.map((c) => [c.id, c]));
const useAsLabel = { prompt: 'Prompt', skill: 'Skill', 'claude-code': 'Claude Code' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (d) => `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
function isStale(date, today = BUILD_DATE) {
  const t = new Date(`${today}T00:00:00Z`);
  t.setUTCMonth(t.getUTCMonth() - config.staleAfterMonths);
  return new Date(`${date}T00:00:00Z`) < t;
}
const write = (rel, data) => {
  const p = join(DIST, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, data);
};
const ASSET_V = createHash('sha1').update(readFileSync(join(ROOT, 'site', 'site.css'))).update(readFileSync(join(ROOT, 'site', 'app.js'))).digest('hex').slice(0, 10);
// Runs before first paint so a saved theme never flashes. Its hash goes in the CSP below.
const THEME_SNIPPET = "try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}";

// Markdown: raw HTML in content is shown as text, never rendered, so a contribution can't inject markup.
const md = new Marked({ gfm: true });
md.use({
  renderer: {
    html: ({ text }) => esc(text),
    link({ href, title, tokens }) {
      const label = this.parser.parseInline(tokens);
      const safe = /^(https?:|mailto:|\/|#)/i.test(href) ? href : '#';
      const ext = /^https?:/i.test(safe);
      return `<a href="${esc(safe)}"${title ? ` title="${esc(title)}"` : ''}${ext ? ' rel="noopener"' : ''}>${label}</a>`;
    },
    image: ({ text }) => esc(text),
  },
});
const render = (src) => md.parse(src);

const icon = {
  prompt: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  skill: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2.5h7l3 3v8H3z M10 2.5v3h3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M5.5 9h5M5.5 11h3.5" stroke="currentColor" stroke-width="1.3"/></svg>',
  'claude-code': '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5l3.5 3.5L3 11.5M8 11.5h5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  copy: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M3 10.5V3.8C3 3.1 3.6 2.5 4.3 2.5H10.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  open: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9 2.5h4.5V7M13.5 2.5L7.5 8.5M11.5 9.5v3.5a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5h3.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  download: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.5 7.5L8 11l3.5-3.5M3 13.5h10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  github: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 .2a8 8 0 0 0-2.5 15.6c.4 0 .5-.2.5-.4v-1.5c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.4.7 0-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.5 7.5 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.8-3.6 4 .3.3.6.8.6 1.5v2.2c0 .2.1.5.6.4A8 8 0 0 0 8 .2z"/></svg>',
  theme: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor"/></svg>',
};

const openTarget = (e) =>
  e.use_as === 'claude-code'
    ? { label: 'Open in Claude Code', paste: 'Copy & open Claude Code', base: 'https://claude.ai/code?prompt=', blank: 'https://claude.ai/code' }
    : { label: 'Open in Claude', paste: 'Copy & open Claude', base: 'https://claude.ai/new?q=', blank: 'https://claude.ai/new' };
const MAX_OPEN_URL = 6000;

// ── layout ───────────────────────────────────────────────────────────────────
function page({ title, description, path, body, bodyClass = '' }) {
  const url = `${config.url}${path}`;
  const full = title ? `${title} · ${config.title}` : `${config.title} · tested Claude prompts, skills and Claude Code workflows`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title || config.title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#fbfaf7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#141413" media="(prefers-color-scheme: dark)">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/site.css?v=${ASSET_V}">
<script>${THEME_SNIPPET}</script>
<script src="/app.js?v=${ASSET_V}" defer></script>
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-row">
    <a class="brand" href="/" aria-label="${esc(config.title)} home"><span class="brand-mark" aria-hidden="true">›_</span><span class="brand-name">${esc(config.title)}</span></a>
    <nav class="nav" aria-label="Site">
      <a href="/">Browse</a>
      <a href="/contribute/">Contribute</a>
      <a class="nav-icon" href="${esc(config.repo)}" rel="noopener" aria-label="Source on GitHub">${icon.github}</a>
      <button class="nav-icon theme-toggle" type="button" aria-label="Colour theme: system" title="Colour theme: system">${icon.theme}</button>
    </nav>
  </div>
</header>
<main id="main" class="wrap">
${body}
</main>
<footer class="site-footer">
  <div class="wrap footer-row">
    <p>Prompt content <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener license">CC BY 4.0</a> · code <a href="${esc(config.repo)}/blob/${config.branch}/LICENSE" rel="noopener">MIT</a>. Not affiliated with Anthropic.</p>
    <p><a href="/contribute/">Submit a prompt</a> · <a href="${esc(config.repo)}" rel="noopener">GitHub</a></p>
  </div>
</footer>
</body>
</html>
`;
}

const badgeUse = (e) => `<span class="badge use use-${e.use_as}" title="${esc(config.useAs[e.use_as])}">${icon[e.use_as]}${useAsLabel[e.use_as]}</span>`;
const dots = (d) => {
  const n = config.difficulty.indexOf(d) + 1;
  return `<span class="level" title="Difficulty: ${esc(d)}"><span class="dots" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span><span class="level-label">${esc(d)}</span></span>`;
};
const tested = (e) =>
  `<span class="tested${isStale(e.date_tested) ? ' stale' : ''}" data-tested="${e.date_tested}" title="Last run on ${esc(e.model_tested)} on ${fmtDate(e.date_tested)}">` +
  `<span class="tested-label">Tested</span> ${esc(e.model_tested.replace(/^Claude\s+/, ''))} · ${fmtDate(e.date_tested).replace(/^\d+ /, '')}` +
  `<span class="stale-flag">May be dated</span></span>`;

// ── home ─────────────────────────────────────────────────────────────────────
function card(e) {
  const c = cats[e.category];
  return `<li class="card" data-slug="${e.slug}" data-category="${e.category}" data-tags="${esc(e.tags.join(' '))}" data-use="${e.use_as}">
  <a class="card-link" href="/p/${e.slug}/">
    <span class="card-top"><span class="card-cat">${esc(c.label)}</span>${badgeUse(e)}</span>
    <span class="card-title">${esc(e.title)}</span>
    <span class="card-summary">${esc(e.summary)}</span>
    <span class="card-foot">${dots(e.difficulty)}${e.skill ? '<span class="badge skill-file" title="Comes with a SKILL.md">SKILL.md</span>' : ''}<span class="card-tags">${e.tags.slice(0, 3).map((t) => `<span class="tag">#${esc(t)}</span>`).join('')}</span></span>
  </a>
</li>`;
}

const tagCounts = new Map();
for (const e of entries) for (const t of e.tags) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
const allTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
const catCount = (id) => entries.filter((e) => e.category === id).length;

const home = page({
  title: '',
  description: `${config.tagline} ${entries.length} tested prompts, skills and Claude Code workflows.`,
  path: '/',
  bodyClass: 'home',
  body: `<section class="hero">
  <h1>Tested prompts for building with Claude</h1>
  <p class="lede">${esc(config.tagline)} Each one is tested, explained and free to reuse with credit. Copy it, fill in the blanks, run it.</p>
  <div class="search-row">
    <label class="visually-hidden" for="q">Search prompts</label>
    <div class="search"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg><input id="q" type="search" placeholder="Search prompts and tags" autocomplete="off" spellcheck="false"><kbd aria-hidden="true">/</kbd></div>
    <p class="stats"><strong>${entries.length}</strong> prompts · <strong>${entries.filter((e) => e.skill).length}</strong> with a SKILL.md · <a href="/contribute/">add yours</a></p>
  </div>
</section>
<section class="filters" aria-label="Filters">
  <div class="chips" role="group" aria-label="Category">
    <button type="button" class="chip" data-cat="" aria-pressed="true">All <span class="n">${entries.length}</span></button>
    ${config.categories.filter((c) => catCount(c.id)).map((c) => `<button type="button" class="chip" data-cat="${c.id}" data-blurb="${esc(c.blurb)}" aria-pressed="false" title="${esc(c.blurb)}">${esc(c.label)} <span class="n">${catCount(c.id)}</span></button>`).join('\n    ')}
  </div>
  <div class="selects">
    <label class="select"><span class="visually-hidden">Tag</span><select id="tag"><option value="">All tags</option>${allTags.map(([t, n]) => `<option value="${esc(t)}">#${esc(t)} (${n})</option>`).join('')}</select></label>
    <label class="select"><span class="visually-hidden">Use as</span><select id="use"><option value="">Any type</option>${Object.keys(config.useAs).map((u) => `<option value="${u}">${useAsLabel[u]}</option>`).join('')}</select></label>
  </div>
</section>
<p class="result-line" id="result-line" aria-live="polite"></p>
<ul class="grid" id="grid">
${entries.map(card).join('\n')}
</ul>
<div class="empty" id="empty" hidden><p>No prompts match.</p><button type="button" class="btn" id="clear">Clear filters</button></div>`,
});
write('index.html', home);

// Search index, fetched on first search so the home page stays light.
write(
  'search.json',
  JSON.stringify(
    entries.map((e) => ({
      slug: e.slug,
      title: e.title,
      summary: e.summary,
      category: cats[e.category].label,
      tags: e.tags,
      use: e.use_as,
      text: [e.prompt, ...e.sections.filter((s) => s.title !== 'The prompt').map((s) => s.text)].join('\n').replace(/\s+/g, ' ').slice(0, 20000),
    })),
  ),
);

// ── entry pages ──────────────────────────────────────────────────────────────
function promptHtml(code) {
  return esc(code).replace(/\{\{([a-z][a-z0-9_]*)\}\}/g, (_, n) => `<mark class="ph" data-ph="${n}">{{${n}}}</mark>`);
}
const longField = /(brief|text|copy|diff|list|notes|source|context|idea|findings|summary|description|request|content|material|output|input|defects?|spec)/;

function entryPage(e, i) {
  const c = cats[e.category];
  const promptSec = e.sections.find((s) => s.title === 'The prompt');
  const fence = firstFence(promptSec.text);
  const lines = promptSec.text.split('\n');
  const before = lines.slice(0, fence.start).join('\n').trim();
  const after = lines.slice(fence.end + 1).join('\n').trim();
  const rest = e.sections.filter((s) => s.title !== 'The prompt');
  const target = openTarget(e);
  const openable = target.base.length + encodeURIComponent(e.prompt).length <= MAX_OPEN_URL;
  const nLines = e.prompt.split('\n').length;
  const prev = entries[(i - 1 + entries.length) % entries.length];
  const next = entries[(i + 1) % entries.length];
  const skillZip = e.skill ? `/skills/${e.slug}.zip` : '';

  const fields = e.placeholders.length
    ? `<details class="fill" open>
  <summary><span>Fill in the blanks</span><span class="fill-hint">${e.placeholders.length} placeholder${e.placeholders.length === 1 ? '' : 's'} · empty ones stay as <code>{{…}}</code></span></summary>
  <div class="fill-grid">
    ${e.placeholders.map((p) => `<label class="field"><span class="field-name">${esc(p.replace(/_/g, ' '))}</span><textarea data-fill="${p}" rows="${longField.test(p) ? 2 : 1}" spellcheck="false" placeholder="{{${p}}}"></textarea></label>`).join('\n    ')}
  </div>
  <button type="button" class="link-btn" data-action="reset">Clear all</button>
</details>`
    : '';

  return page({
    title: e.title,
    description: e.summary,
    path: `/p/${e.slug}/`,
    bodyClass: 'entry',
    body: `<article class="entry-article" data-slug="${e.slug}">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">All prompts</a><span aria-hidden="true">/</span><a href="/?c=${e.category}">${esc(c.label)}</a></nav>
  <header class="entry-head">
    <h1>${esc(e.title)}</h1>
    <p class="entry-summary">${esc(e.summary)}</p>
    <div class="meta">
      ${badgeUse(e)}
      ${dots(e.difficulty)}
      ${tested(e)}
    </div>
    <ul class="tags">${e.tags.map((t) => `<li><a class="tag" href="/?t=${encodeURIComponent(t)}">#${esc(t)}</a></li>`).join('')}</ul>
  </header>

  <section class="prompt-section" aria-labelledby="the-prompt">
    <h2 id="the-prompt">The prompt</h2>
    ${before ? `<div class="prose lead-in">${render(before)}</div>` : ''}
    ${fields}
    <div class="prompt-card${nLines > 40 ? ' collapsible collapsed' : ''}">
      <div class="prompt-bar">
        <span class="prompt-meta">${nLines} line${nLines === 1 ? '' : 's'}${e.placeholders.length ? ` · ${e.placeholders.length} to fill` : ''}</span>
        <span class="prompt-actions">
          <button type="button" class="btn primary" data-action="copy">${icon.copy}<span>Copy</span></button>
          <a class="btn" data-action="open" data-base="${esc(target.base)}" data-blank="${esc(target.blank)}" href="${esc(openable ? target.base + encodeURIComponent(e.prompt) : target.blank)}" target="_blank" rel="noopener" title="${openable ? 'Opens a new chat with the prompt filled in; nothing is sent until you press send' : 'Too long to pass in a link: copies the prompt, then opens a new chat to paste it into'}">${icon.open}<span>${openable ? target.label : target.paste}</span></a>
          ${skillZip ? `<a class="btn" href="${skillZip}" download>${icon.download}<span>Skill .zip</span></a>` : ''}
        </span>
      </div>
      <pre class="prompt" id="prompt-text" tabindex="0"><code>${promptHtml(e.prompt)}</code></pre>
      ${nLines > 40 ? `<button type="button" class="expand" data-action="expand" aria-expanded="false">Show all ${nLines} lines</button>` : ''}
      <script type="application/json" id="prompt-raw">${JSON.stringify(e.prompt).replace(/</g, '\\u003c')}</script>
    </div>
    <p class="copy-status" role="status" aria-live="polite"></p>
    ${after ? `<div class="prose">${render(after)}</div>` : ''}
  </section>

  ${rest.map((s) => `<section class="prose-section" aria-labelledby="s-${s.title.toLowerCase().replace(/[^a-z]+/g, '-')}">
    <h2 id="s-${s.title.toLowerCase().replace(/[^a-z]+/g, '-')}">${esc(s.title)}</h2>
    <div class="prose">${render(s.text)}</div>
  </section>`).join('\n  ')}

  ${e.skill ? `<section class="prose-section skill-box" aria-labelledby="s-skill">
    <h2 id="s-skill">Install as a skill</h2>
    <div class="prose">
      <p>This entry comes with a <code>SKILL.md</code>${e.skill.files.length > 1 ? ` and ${e.skill.files.length - 1} reference file${e.skill.files.length > 2 ? 's' : ''}` : ''}. Claude loads it whenever a request matches its description.</p>
      <ul>
        <li><strong>Claude Code:</strong> unzip into <code>.claude/skills/</code> in your project, or <code>~/.claude/skills/</code> for every project.</li>
        <li><strong>Claude apps:</strong> upload the .zip under Customize → Skills → + → Create skill → Upload a skill. Skills need code execution, which is under Settings → Capabilities.</li>
      </ul>
      <p class="skill-links"><a class="btn" href="${skillZip}" download>${icon.download}<span>Download ${e.slug}.zip</span></a> ${e.skill.files.map((f) => `<a href="/skills/${e.slug}/${f}">${esc(f)}</a>`).join(' · ')}</p>
    </div>
  </section>` : ''}

  <footer class="entry-foot">
    ${e.credit ? `<p class="credit">Credit: ${esc(e.credit)}</p>` : ''}
    <p><a href="${esc(config.repo)}/blob/${config.branch}/${e.file}" rel="noopener">Edit on GitHub</a> · <a href="${esc(config.repo)}/issues/new?title=${encodeURIComponent(`[${e.slug}] `)}" rel="noopener">Report a problem</a></p>
    <nav class="pager" aria-label="More prompts">
      <a href="/p/${prev.slug}/" rel="prev"><span>Previous</span>${esc(prev.title)}</a>
      <a href="/p/${next.slug}/" rel="next"><span>Next</span>${esc(next.title)}</a>
    </nav>
  </footer>
</article>`,
  });
}
entries.forEach((e, i) => write(`p/${e.slug}/index.html`, entryPage(e, i)));

// ── skills: raw files and a .zip per skill ───────────────────────────────────
function zip(files) {
  // Minimal zip writer (stored, no compression): enough for a few small text files.
  const chunks = [];
  const central = [];
  let offset = 0;
  const dosTime = 0;
  const dosDate = ((2026 - 1980) << 9) | (1 << 5) | 1;
  for (const { name, data } of files) {
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data) >>> 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, data);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(0, 10);
    cen.writeUInt16LE(dosTime, 12);
    cen.writeUInt16LE(dosDate, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(data.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(nameBuf.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const cenBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cenBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, cenBuf, end]);
}
for (const e of entries.filter((x) => x.skill)) {
  const files = e.skill.files.map((f) => ({ name: `${e.slug}/${f}`, data: readFileSync(join(ROOT, 'skills', e.slug, f)) }));
  for (const f of files) write(`skills/${f.name}`, f.data);
  write(`skills/${e.slug}.zip`, zip(files));
}

// ── contribute, 404, sitemap ─────────────────────────────────────────────────
const contributing = readFileSync(join(ROOT, 'CONTRIBUTING.md'), 'utf8')
  .replace(/^# .*\n/, '')
  .replace(/\]\((TEMPLATE\.md|LICENSE-CONTENT|LICENSE)\)/g, (_, f) => `](${config.repo}/blob/${config.branch}/${f})`);
write(
  'contribute/index.html',
  page({
    title: 'Contribute a prompt',
    description: 'How to submit a tested prompt to the library through a pull request.',
    path: '/contribute/',
    bodyClass: 'doc',
    body: `<article class="doc-article"><h1>Contribute a prompt</h1>
<p class="entry-summary">Open a pull request with one Markdown file. CI checks the format; a maintainer checks that it is tested and useful.</p>
<p><a class="btn primary" href="${esc(config.repo)}/blob/${config.branch}/TEMPLATE.md" rel="noopener">Start from the template</a> <a class="btn" href="${esc(config.repo)}" rel="noopener">${icon.github}<span>Repository</span></a></p>
<div class="prose">${render(contributing)}</div></article>`,
  }),
);
write(
  '404.html',
  page({
    title: 'Not found',
    description: 'This page does not exist.',
    path: '/404.html',
    bodyClass: 'doc',
    body: `<article class="doc-article"><h1>Not found</h1><p class="entry-summary">That page isn't here. It may have been renamed.</p><p><a class="btn primary" href="/">Browse all prompts</a></p></article>`,
  }),
);
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['/', '/contribute/', ...entries.map((e) => `/p/${e.slug}/`)].map((p) => `  <url><loc>${config.url}${p}</loc></url>`).join('\n')}\n</urlset>\n`,
);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${config.url}/sitemap.xml\n`);

// Static assets: public/ as-is, plus the stylesheet and script from site/.
if (existsSync(join(ROOT, 'public'))) cpSync(join(ROOT, 'public'), DIST, { recursive: true });
cpSync(join(ROOT, 'site'), DIST, { recursive: true });
const themeHash = createHash('sha256').update(THEME_SNIPPET).digest('base64');
write(
  '_headers',
  `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-${themeHash}'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'\n/skills/*/*\n  Content-Type: text/plain; charset=utf-8\n`,
);

console.log(`built ${entries.length} entries, ${entries.filter((e) => e.skill).length} skills → dist/ (${BUILD_DATE})`);
