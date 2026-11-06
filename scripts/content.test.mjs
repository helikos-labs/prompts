// Tests for the parsing helpers the validator and the build share.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitFrontmatter, sections, firstFence, placeholders, loadEntries } from './content.mjs';

test('splitFrontmatter separates YAML from the body', () => {
  const r = splitFrontmatter('---\ntitle: X\n---\n\n## The prompt\n');
  assert.equal(r.yaml, 'title: X');
  assert.match(r.body, /## The prompt/);
  assert.equal(splitFrontmatter('no frontmatter'), null);
});

test('sections ignores headings inside fenced code', () => {
  const body = '## The prompt\n\n```text\n## not a section\n```\n\n## Example\n\nhi\n';
  assert.deepEqual(sections(body).map((s) => s.title), ['The prompt', 'Example']);
});

test('firstFence returns the first fenced block, including longer fences', () => {
  const f = firstFence('Intro\n\n````markdown\n```inner```\nline\n````\n\n```text\nsecond\n```');
  assert.equal(f.lang, 'markdown');
  assert.equal(f.code, '```inner```\nline');
});

test('placeholders are unique snake_case names', () => {
  assert.deepEqual(placeholders('{{a_b}} {{a_b}} {{c}} ${{ secrets.X }} {{Bad}}'), ['a_b', 'c']);
});

test('the library in this repo is valid', () => {
  const { errors, entries } = loadEntries();
  assert.deepEqual(errors, []);
  assert.ok(entries.length > 0);
  for (const e of entries) assert.ok(e.prompt.length >= 40, e.slug);
});
