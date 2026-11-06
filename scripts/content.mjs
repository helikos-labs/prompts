// Load and validate every entry in content/<category>/<slug>.md and every skills/<slug>/SKILL.md.
// Used by validate.mjs (CI) and build.mjs (the site), so both enforce the same contract.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { parse as parseYaml } from 'yaml';

export const ROOT = new URL('..', import.meta.url).pathname;
export const config = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));

const CATEGORY_IDS = config.categories.map((c) => c.id);
const USE_AS = Object.keys(config.useAs);
const REQUIRED = ['title', 'summary', 'category', 'tags', 'model_tested', 'date_tested', 'difficulty', 'use_as'];
const OPTIONAL = ['credit'];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TAG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SECTIONS = { required: ['The prompt', 'Example', 'Why it works'], optional: ['Variations'] };
const PLACEHOLDER_RE = /\{\{([a-z][a-z0-9_]*)\}\}/g;

// Things that must never be published. A match fails the build.
const SECRET_PATTERNS = [
  [/sk-ant-[A-Za-z0-9_-]{12,}/, 'an Anthropic API key'],
  [/\bsk-[A-Za-z0-9]{32,}/, 'an API secret key'],
  [/AIza[0-9A-Za-z_-]{35}/, 'a Google API key'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/, 'a GitHub token'],
  [/github_pat_[A-Za-z0-9_]{30,}/, 'a GitHub token'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/, 'a Slack token'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'an AWS access key'],
  [/ca-pub-\d{10,}/, 'an AdSense publisher ID'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
  [/claude\.ai\/code\/session_[A-Za-z0-9]+/, 'a private Claude session link'],
];

export function splitFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return null;
  return { yaml: m[1], body: m[2] };
}

// H2 sections of a markdown body, ignoring headings inside fenced code blocks.
export function sections(body) {
  const out = [];
  let fence = null;
  let current = null;
  for (const line of body.split('\n')) {
    const f = /^(\s{0,3})(`{3,}|~{3,})/.exec(line);
    if (f) {
      const marker = f[2];
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length && line.trim() === marker) fence = null;
    }
    const h = !fence && !f && /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) {
      current = { title: h[1].trim(), lines: [] };
      out.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  return out.map((s) => ({ title: s.title, text: s.lines.join('\n').trim() }));
}

// The first fenced code block in a section: the text the Copy button copies.
export function firstFence(text) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const open = /^(\s{0,3})(`{3,}|~{3,})(.*)$/.exec(lines[i]);
    if (!open) continue;
    const marker = open[2];
    const body = [];
    for (let j = i + 1; j < lines.length; j++) {
      const t = lines[j].trim();
      if (t[0] === marker[0] && /^(`{3,}|~{3,})$/.test(t) && t.length >= marker.length) {
        return { lang: open[3].trim(), code: body.join('\n'), start: i, end: j };
      }
      body.push(lines[j]);
    }
    return null;
  }
  return null;
}

export function placeholders(code) {
  return [...new Set([...code.matchAll(PLACEHOLDER_RE)].map((m) => m[1]))];
}

function isValidDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function scanSecrets(text, file, errors) {
  for (const [re, what] of SECRET_PATTERNS) {
    if (re.test(text)) errors.push(`${file}: contains what looks like ${what}. Remove it.`);
  }
}

export function loadEntries({ today = new Date().toISOString().slice(0, 10) } = {}) {
  const errors = [];
  const warnings = [];
  const entries = [];
  const contentDir = join(ROOT, 'content');
  const seen = new Map();

  for (const path of walk(contentDir)) {
    const file = relative(ROOT, path);
    const parts = relative(contentDir, path).split('/');
    if (basename(path).startsWith('.')) continue;
    if (!path.endsWith('.md')) {
      errors.push(`${file}: only .md files belong under content/.`);
      continue;
    }
    if (parts.length !== 2) {
      errors.push(`${file}: entries live at content/<category>/<slug>.md.`);
      continue;
    }
    const [folder, name] = parts;
    const slug = name.replace(/\.md$/, '');
    const text = readFileSync(path, 'utf8');
    const errs = [];
    scanSecrets(text, file, errs);

    if (!SLUG_RE.test(slug)) errs.push(`${file}: file name must be a lowercase-hyphenated slug.`);
    if (seen.has(slug)) errs.push(`${file}: slug "${slug}" is already used by ${seen.get(slug)}.`);
    seen.set(slug, file);
    if (!CATEGORY_IDS.includes(folder)) errs.push(`${file}: folder "${folder}" is not a category. Use one of: ${CATEGORY_IDS.join(', ')}.`);

    const split = splitFrontmatter(text);
    if (!split) {
      errors.push(...errs, `${file}: missing YAML frontmatter between --- lines at the top.`);
      continue;
    }
    let fm;
    try {
      fm = parseYaml(split.yaml) ?? {};
    } catch (e) {
      errors.push(...errs, `${file}: frontmatter is not valid YAML (${e.message.split('\n')[0]}).`);
      continue;
    }
    if (typeof fm !== 'object' || Array.isArray(fm)) {
      errors.push(...errs, `${file}: frontmatter must be a YAML mapping.`);
      continue;
    }

    for (const k of REQUIRED) if (fm[k] === undefined || fm[k] === null || fm[k] === '') errs.push(`${file}: frontmatter needs "${k}".`);
    for (const k of Object.keys(fm)) if (!REQUIRED.includes(k) && !OPTIONAL.includes(k)) errs.push(`${file}: unknown frontmatter field "${k}". Allowed: ${[...REQUIRED, ...OPTIONAL].join(', ')}.`);

    const str = (k, min, max) => {
      if (fm[k] === undefined) return;
      if (typeof fm[k] !== 'string') errs.push(`${file}: "${k}" must be text.`);
      else if (fm[k].trim().length < min || fm[k].trim().length > max) errs.push(`${file}: "${k}" must be ${min}–${max} characters (is ${fm[k].trim().length}).`);
    };
    str('title', 3, 90);
    str('summary', 20, 200);
    str('model_tested', 8, 40);
    str('credit', 3, 200);
    if (typeof fm.model_tested === 'string' && !/^Claude\s\S/.test(fm.model_tested)) errs.push(`${file}: "model_tested" names a Claude model, e.g. "Claude Opus 5.5".`);
    if (fm.category !== undefined && fm.category !== folder) errs.push(`${file}: category "${fm.category}" must match its folder "${folder}".`);
    if (fm.difficulty !== undefined && !config.difficulty.includes(fm.difficulty)) errs.push(`${file}: difficulty must be one of ${config.difficulty.join(', ')}.`);
    if (fm.use_as !== undefined && !USE_AS.includes(fm.use_as)) errs.push(`${file}: use_as must be one of ${USE_AS.join(', ')}.`);
    if (fm.tags !== undefined) {
      if (!Array.isArray(fm.tags) || fm.tags.length < 1 || fm.tags.length > 6) errs.push(`${file}: "tags" must be a list of 1–6 tags.`);
      else for (const t of fm.tags) if (typeof t !== 'string' || !TAG_RE.test(t) || t.length > 24) errs.push(`${file}: tag "${t}" must be lowercase-hyphenated, 24 characters at most.`);
    }
    if (fm.date_tested !== undefined) {
      const d = String(fm.date_tested instanceof Date ? fm.date_tested.toISOString().slice(0, 10) : fm.date_tested);
      if (!isValidDate(d)) errs.push(`${file}: "date_tested" must be a date written YYYY-MM-DD.`);
      else if (d > today) errs.push(`${file}: "date_tested" ${d} is in the future.`);
      else if (d < '2023-01-01') errs.push(`${file}: "date_tested" ${d} is before 2023.`);
      fm.date_tested = d;
    }

    const secs = sections(split.body);
    const titles = secs.map((s) => s.title);
    const allowed = [...SECTIONS.required, ...SECTIONS.optional];
    for (const t of titles) if (!allowed.includes(t)) errs.push(`${file}: unexpected section "## ${t}". Sections are: ${allowed.map((a) => `## ${a}`).join(', ')}.`);
    const order = titles.filter((t) => SECTIONS.required.includes(t));
    if (order.join('|') !== SECTIONS.required.join('|')) errs.push(`${file}: needs the sections ${SECTIONS.required.map((a) => `"## ${a}"`).join(', ')}, once each and in that order.`);
    if (titles.includes('Variations') && titles.indexOf('Variations') < titles.indexOf('Why it works')) errs.push(`${file}: "## Variations" comes after "## Why it works".`);
    if (split.body.split('\n').some((l) => /^#\s/.test(l))) errs.push(`${file}: don't use a "# " heading in the body; the title comes from the frontmatter.`);

    const promptSec = secs.find((s) => s.title === 'The prompt');
    const fence = promptSec && firstFence(promptSec.text);
    if (promptSec && !fence) errs.push(`${file}: "## The prompt" needs the prompt in a fenced code block.`);
    if (fence && fence.code.trim().length < 40) errs.push(`${file}: the prompt block is too short to be useful.`);
    const why = secs.find((s) => s.title === 'Why it works');
    if (why && why.text.length < 40) errs.push(`${file}: "## Why it works" needs a few lines on the design choices.`);
    const ex = secs.find((s) => s.title === 'Example');
    if (ex && ex.text.length < 40) errs.push(`${file}: "## Example" needs a short input and output.`);

    if (fence) {
      const odd = fence.code.match(/(?<!\$)\{\{(?![a-z][a-z0-9_]*\}\})[^}\n]*\}\}/g);
      if (odd) warnings.push(`${file}: ${odd.slice(0, 3).join(', ')} isn't a {{snake_case}} placeholder, so it won't get an input box.`);
    }

    if (errs.length) {
      errors.push(...errs);
      continue;
    }
    entries.push({
      slug,
      file,
      ...fm,
      body: split.body,
      sections: secs,
      prompt: fence.code,
      promptLang: fence.lang,
      placeholders: placeholders(fence.code),
      skill: null,
    });
  }

  // skills/<slug>/SKILL.md: the installable version of an entry.
  const skillsDir = join(ROOT, 'skills');
  for (const path of walk(skillsDir)) {
    const file = relative(ROOT, path);
    const parts = relative(skillsDir, path).split('/');
    if (basename(path).startsWith('.')) continue;
    const slug = parts[0];
    const entry = entries.find((e) => e.slug === slug);
    if (!seen.has(slug)) {
      errors.push(`${file}: no entry content/<category>/${slug}.md for this skill.`);
      continue;
    }
    const text = readFileSync(path, 'utf8');
    scanSecrets(text, file, errors);
    if (parts.length === 2 && parts[1] === 'SKILL.md') {
      const split = splitFrontmatter(text);
      let fm = null;
      try {
        fm = split && parseYaml(split.yaml);
      } catch {
        fm = null;
      }
      if (!fm || typeof fm !== 'object') {
        errors.push(`${file}: needs YAML frontmatter with name and description.`);
        continue;
      }
      if (fm.name !== slug) errors.push(`${file}: frontmatter "name" must be "${slug}".`);
      if (typeof fm.description !== 'string' || fm.description.length < 20 || fm.description.length > 1024) errors.push(`${file}: "description" must be 20–1024 characters and say when to use the skill.`);
      if (entry) entry.skill = { path: `skills/${slug}/SKILL.md`, files: [] };
    }
  }
  for (const e of entries) {
    if (!e.skill) continue;
    e.skill.files = walk(join(skillsDir, e.slug)).map((p) => relative(join(skillsDir, e.slug), p)).sort();
  }
  for (const e of entries) {
    if (e.use_as === 'skill' && !e.skill) errors.push(`${e.file}: use_as is skill, so add skills/${e.slug}/SKILL.md.`);
  }

  entries.sort((a, b) => CATEGORY_IDS.indexOf(a.category) - CATEGORY_IDS.indexOf(b.category) || a.title.localeCompare(b.title));
  return { entries, errors, warnings };
}
