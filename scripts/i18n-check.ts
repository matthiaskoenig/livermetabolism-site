#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { auditTable, CatalogParseError, formatIssues, type Issue } from './lib/i18n-check.ts';
import { TRANSLATABLE } from '../site/lib/i18n/fields.ts';
import { LOCALES, DEFAULT_LOCALE } from '../site/lib/i18n/locales.ts';
import type { Catalog } from '../site/lib/i18n/content.ts';

const root = process.cwd();

const readDataYaml = (file: string): Record<string, unknown>[] => {
  try {
    if (!fs.existsSync(file)) return [];
    const content = load(fs.readFileSync(file, 'utf8'));
    return (Array.isArray(content) ? content : []) as Record<string, unknown>[];
  } catch (err) {
    throw new CatalogParseError(file, err instanceof Error ? err : new Error(String(err)));
  }
};

// NOTE: site/lib/i18n/content.ts has loadCatalog(), but its module-level imports
// lack .ts extensions which break Node direct execution. Keep this inline reader
// in sync with loadCatalog semantics: missing files return {}, not an error.
const readCatalogYaml = (file: string): Catalog => {
  try {
    if (!fs.existsSync(file)) return {};
    const content = load(fs.readFileSync(file, 'utf8'));
    return (typeof content === 'object' && content !== null ? content : {}) as Catalog;
  } catch (err) {
    throw new CatalogParseError(file, err instanceof Error ? err : new Error(String(err)));
  }
};

const rowsFor = (table: string, rows: Record<string, unknown>[]) =>
  table === 'tags' ? rows.map((r) => ({ ...r, id: r.tag })) : rows;

const issues: Issue[] = [];
try {
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    for (const [table, fields] of Object.entries(TRANSLATABLE)) {
      const rows = readDataYaml(path.join(root, 'data', `${table}.yml`));
      const catalog = readCatalogYaml(path.join(root, 'i18n', locale, `${table}.yml`));
      issues.push(...auditTable(rowsFor(table, rows), catalog, fields, locale, table));
    }
  }
} catch (err) {
  if (err instanceof CatalogParseError) {
    console.error(err.message);
    process.exit(1);
  }
  throw err;
}

console.log(formatIssues(issues));
process.exit(issues.length === 0 ? 0 : 1);
