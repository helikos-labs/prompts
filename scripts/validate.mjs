// Check every entry's frontmatter and sections. Run by CI on every pull request and by the build.
//   node scripts/validate.mjs            all entries
//   node scripts/validate.mjs <file>...  report only on these files (the whole set is still loaded)
import { relative, resolve } from 'node:path';
import { loadEntries, ROOT } from './content.mjs';

const only = process.argv.slice(2).map((p) => relative(ROOT, resolve(p)));
const pick = (msgs) => (only.length ? msgs.filter((m) => only.some((f) => m.startsWith(f))) : msgs);

const { entries, errors, warnings } = loadEntries();
for (const w of pick(warnings)) console.log(`warning  ${w}`);
for (const e of pick(errors)) console.log(`error    ${e}`);

const errs = pick(errors);
if (errs.length) {
  console.log(`\n${errs.length} problem${errs.length === 1 ? '' : 's'}. See CONTRIBUTING.md for the entry format.`);
  process.exit(1);
}
const skills = entries.filter((e) => e.skill).length;
console.log(`ok  ${entries.length} entries, ${skills} with a SKILL.md`);
