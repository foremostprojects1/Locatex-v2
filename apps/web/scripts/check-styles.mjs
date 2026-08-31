/**
 * Fails the build when a component uses a class nothing styles.
 *
 *   pnpm --filter @locatex/web check:styles
 *
 * This exists because it has happened twice. A component ships, its stylesheet does not
 * follow, and the page renders as unstyled markup — the account menu arrived as the user's
 * initials run into their name and a dropdown of bare links over the page. Nothing catches
 * that: the build succeeds, the tests pass, the types are fine, and the only signal is
 * somebody looking at it.
 *
 * Only our own `lx-` prefix is checked. The template's classes are defined in a stylesheet
 * we did not write and do not want to audit, and Bootstrap's are a moving target.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(import.meta.dirname, '../src');
/*
 * Matches the whole name in one go — `lx-centred-page` and `lx-account__toggle` and
 * `lx-loader--page` alike. An earlier version stopped at the first hyphen and reported
 * three classes as missing that were simply truncated, which is the sort of false alarm
 * that gets a check switched off.
 */
const PREFIX = /lx-[a-z0-9]+(?:[-_]+[a-z0-9]+)*/g;

/**
 * Names completed at runtime, e.g. `lx-tag is-${role}` or `lx-loader--${size}`.
 *
 * The stem is checked; the suffix cannot be, because it is a value rather than a literal.
 * Listing them here is deliberate — an unexplained exclusion list is how a real gap gets
 * waved through later.
 */
const DYNAMIC_STEMS = ['lx-loader--', 'lx-tag', 'lx-card__badge', 'lx-quota__fill'];

/**
 * Wrappers that carry no styling of their own: their children are laid out, and the
 * element exists only to group them. Each one is a deliberate decision, not an oversight.
 */
const UNSTYLED_WRAPPERS = new Set([
  'lx-admin',
  'lx-checkgrid',
  'lx-detail__aside',
  'lx-detail__main',
  'lx-docs',
  'lx-enquiries',
  'lx-images',
  'lx-listings__results',
  'lx-loader__label',
  'lx-password',
  'lx-side__group',
  'lx-wizard',
]);

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const full = path.join(directory, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk(SRC);

const used = new Map();
for (const file of files.filter((f) => f.endsWith('.jsx') || f.endsWith('.js'))) {
  const source = readFileSync(file, 'utf8');
  // Only inside a className, so a class named in a comment does not count as used.
  for (const match of source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\})/g)) {
    const value = match[1] ?? match[2] ?? match[3] ?? '';
    for (const cls of value.match(PREFIX) ?? []) {
      if (!used.has(cls)) used.set(cls, path.relative(SRC, file));
    }
  }
}

const css = files
  .filter((f) => f.endsWith('.css'))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');
const defined = new Set([...css.matchAll(/\.(lx-[a-z0-9_-]+)/g)].map((m) => m[1]));

const missing = [...used.entries()].filter(
  ([cls]) =>
    !defined.has(cls) &&
    !UNSTYLED_WRAPPERS.has(cls) &&
    !DYNAMIC_STEMS.some((stem) => cls.startsWith(stem)),
);

if (missing.length === 0) {
  console.warn(`styles: ${used.size} lx- classes used, all accounted for`);
  process.exit(0);
}

console.error('\nThese classes are used but nothing styles them:\n');
for (const [cls, file] of missing.sort()) {
  console.error(`  .${cls.padEnd(32)} used in ${file}`);
}
console.error(
  '\nEither add the rules, or add the name to UNSTYLED_WRAPPERS in this script if the\n' +
    'element genuinely carries no styling of its own.\n',
);
process.exit(1);
