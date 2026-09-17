#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { auditTable, formatIssues, type Issue } from './lib/i18n-check.ts';
import { TRANSLATABLE } from '../site/lib/i18n/fields.ts';
import { LOCALES, DEFAULT_LOCALE } from '../site/lib/i18n/locales.ts';
import type { Catalog } from '../site/lib/i18n/content.ts';

const root = process.cwd();
const readYaml = (file: string): unknown => (fs.existsSync(file) ? load(fs.readFileSync(file, 'utf8')) : null);

const rowsFor = (table: string, rows: Record<string, unknown>[]) =>
  table === 'tags' ? rows.map((r) => ({ ...r, id: r.tag })) : rows;

const issues: Issue[] = [];
for (const locale of LOCALES) {
  if (locale === DEFAULT_LOCALE) continue;
  for (const [table, fields] of Object.entries(TRANSLATABLE)) {
    const rows = (readYaml(path.join(root, 'data', `${table}.yml`)) ?? []) as Record<string, unknown>[];
    const catalog = (readYaml(path.join(root, 'i18n', locale, `${table}.yml`)) ?? {}) as Catalog;
    issues.push(...auditTable(rowsFor(table, rows), catalog, fields, `${locale}/${table}`));
  }
}

console.log(formatIssues(issues));
process.exit(issues.length === 0 ? 0 : 1);
