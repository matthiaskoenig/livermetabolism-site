#!/usr/bin/env node
/**
 * Look up one English source field and print the sha the translate-de skill
 * must write beside its German translation, plus the exact value that sha
 * covers (so the translator can see precisely what YAML's scalar folding
 * produced - a multi-line quoted string collapses to single-spaced text -
 * without retyping it and risking a mismatch).
 *
 * Reads data/<table>.yml the same way scripts/i18n-check.ts does (tags rows
 * keyed by `tag`, ui keys read from site/lib/i18n/ui.en.ts instead of a
 * data file), so this can never disagree with what `npm run i18n:check`
 * expects.
 *
 * Usage:
 *   node scripts/i18n-sha.ts <table> <id> <field>
 *   node scripts/i18n-sha.ts ui <dotted.key>
 */
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { sourceSha } from '../site/lib/i18n/sha.ts';

const root = process.cwd();
const [table, a, b] = process.argv.slice(2);

if (!table || !a || (table !== 'ui' && !b)) {
  console.error('Usage: node scripts/i18n-sha.ts <table> <id> <field>');
  console.error('       node scripts/i18n-sha.ts ui <dotted.key>');
  process.exit(1);
}

let value: unknown;

if (table === 'ui') {
  const key = a;
  const mod = await import(path.join(root, 'site/lib/i18n/ui.en.ts'));
  const en = mod.en ?? mod.default;
  value = key.split('.').reduce((o: any, k: string) => (o == null ? undefined : o[k]), en);
  if (value === undefined) {
    console.error(`No UI key "${key}" in site/lib/i18n/ui.en.ts`);
    process.exit(1);
  }
} else {
  const id = a;
  const field = b;
  const file = path.join(root, 'data', `${table}.yml`);
  if (!fs.existsSync(file)) {
    console.error(`No such table: ${file}`);
    process.exit(1);
  }
  const rows = load(fs.readFileSync(file, 'utf8')) as Record<string, unknown>[];
  const idKey = table === 'tags' ? 'tag' : 'id';
  const row = rows.find((r) => String(r[idKey]) === id);
  if (!row) {
    console.error(`No row "${id}" in ${table} (matched by "${idKey}")`);
    process.exit(1);
  }
  value = row[field];
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
    console.error(`Field "${field}" on ${table}/${id} is empty - nothing to translate`);
    process.exit(1);
  }
}

console.log(`sha:   ${sourceSha(value as string | string[])}`);
console.log(`value: ${JSON.stringify(value)}`);
