#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { auditTable, auditUi, flatten, CatalogParseError, formatIssues, type Issue } from './lib/i18n-check.ts';
import { TRANSLATABLE } from '../site/lib/i18n/fields.ts';
import { LOCALES, DEFAULT_LOCALE } from '../site/lib/i18n/locales.ts';
import type { Catalog, CatalogEntry } from '../site/lib/i18n/content.ts';

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

// i18n/de/ui.yml is flat (dotted key -> {sha, text}), unlike a data table's
// catalog - no per-row id nesting - so it gets its own reader. Kept in sync
// with auditUi()'s expectations by hand, same as readCatalogYaml above.
const readUiCatalogYaml = (file: string): Record<string, CatalogEntry> => {
  try {
    if (!fs.existsSync(file)) return {};
    const content = load(fs.readFileSync(file, 'utf8'));
    return (typeof content === 'object' && content !== null ? content : {}) as Record<string, CatalogEntry>;
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

    // The UI catalog is not a data/*.yml table: its English source is
    // site/lib/i18n/ui.en.ts, and its German catalog (i18n/de/ui.yml) is a
    // flat map rather than one keyed by row id - see auditUi().
    const uiEnModule = await import(path.join(root, 'site/lib/i18n/ui.en.ts'));
    const uiEn = flatten(uiEnModule.en);
    const uiCatalog = readUiCatalogYaml(path.join(root, 'i18n', locale, 'ui.yml'));
    issues.push(...auditUi(uiEn, uiCatalog, locale));
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
