#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { auditTable, auditUi, auditPage, flatten, CatalogParseError, formatIssues, type Issue, type PageCatalogEntry } from './lib/i18n-check.ts';
import { TRANSLATABLE } from '../site/lib/i18n/fields.ts';
import { LOCALES, DEFAULT_LOCALE } from '../site/lib/i18n/locales.ts';
import { PAGE_SOURCE_LOCALE, PAGE_LOCALE_ONLY_FIELDS } from '../site/lib/i18n/pageLocales.ts';
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
//
// A data table's catalog (row id -> field -> {sha, text}) and the flat UI
// catalog (dotted key -> {sha, text}) are read the exact same way - parse
// the YAML, fall back to {} for a missing file or a non-object - and differ
// only in the shape TypeScript assigns the result, so one reader serves
// both instead of two body-identical copies (see the i18n review's finding
// on this: readCatalogYaml/readUiCatalogYaml were a byte-identical clone of
// each other with no cross-reference).
const readYamlCatalog = <T>(file: string): T => {
  try {
    if (!fs.existsSync(file)) return {} as T;
    const content = load(fs.readFileSync(file, 'utf8'));
    return (typeof content === 'object' && content !== null ? content : {}) as T;
  } catch (err) {
    throw new CatalogParseError(file, err instanceof Error ? err : new Error(String(err)));
  }
};
const readCatalogYaml = (file: string): Catalog => readYamlCatalog<Catalog>(file);
const readUiCatalogYaml = (file: string): Record<string, CatalogEntry> => readYamlCatalog<Record<string, CatalogEntry>>(file);

// i18n/{de,en}/pages/<page>.yml entries ({sha?, text}) - read the same way
// as the UI catalog (readUiCatalogYaml above), just from a different path.
// The *source*-locale file for a page never needs a `sha` (there is
// nothing upstream of it to hash against); the *generated* file's entries
// carry one, computed from the source value, same as every other catalog.
const readPageCatalogYaml = (file: string): Record<string, PageCatalogEntry> => readYamlCatalog<Record<string, PageCatalogEntry>>(file);

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

  // Page catalogs (i18n/{de,en}/pages/<page>.yml: impressum, privacy).
  // Unlike the data tables and the UI catalog, whose source is always
  // DEFAULT_LOCALE, a page's source locale is per-page - PAGE_SOURCE_LOCALE
  // inverts it for impressum/privacy, whose binding text is German (see
  // site/lib/i18n/pageLocales.ts and i18n/TRANSLATION.md's "The legal pages
  // invert the direction"). So this loop is separate from the one above,
  // and for each page audits whichever locale is NOT that page's source,
  // against the source locale's own values - never assuming English is the
  // source the way auditTable/auditUi's outer loop does.
  for (const page of Object.keys(PAGE_SOURCE_LOCALE)) {
    const source = PAGE_SOURCE_LOCALE[page] ?? DEFAULT_LOCALE;
    const generated = LOCALES.find((locale) => locale !== source);
    if (!generated) continue;
    const sourceCatalog = readPageCatalogYaml(path.join(root, 'i18n', source, 'pages', `${page}.yml`));
    const sourceValues = Object.fromEntries(
      Object.entries(sourceCatalog).map(([field, entry]) => [field, entry.text]),
    );
    const generatedCatalog = readPageCatalogYaml(path.join(root, 'i18n', generated, 'pages', `${page}.yml`));
    issues.push(...auditPage(sourceValues, generatedCatalog, generated, page, PAGE_LOCALE_ONLY_FIELDS[page] ?? []));
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
