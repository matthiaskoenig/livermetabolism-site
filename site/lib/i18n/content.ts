import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { DEFAULT_LOCALE, type Locale } from './locales';
import type { TranslatableTable } from './fields';

export interface CatalogEntry { sha: string; text: string | string[] }
/** row id -> field name -> entry */
export type Catalog = Record<string, Record<string, CatalogEntry>>;

const cache = new Map<string, Catalog>();

/**
 * The translation catalog for one table. A missing file is an empty
 * catalog, not an error: translation lags English by design, and every
 * lookup falls back to the English source.
 */
export function loadCatalog(locale: Locale, table: TranslatableTable): Catalog {
  if (locale === DEFAULT_LOCALE) return {};
  const key = `${locale}/${table}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const file = path.join(process.cwd(), 'i18n', locale, `${table}.yml`);
  const catalog = fs.existsSync(file) ? ((load(fs.readFileSync(file, 'utf8')) ?? {}) as Catalog) : {};
  cache.set(key, catalog);
  return catalog;
}

/**
 * Overlay the translated fields onto the English rows. Returns new objects
 * in the original order; a row or field with no entry keeps its English
 * value, so a lagging translation degrades to English rather than to a
 * blank.
 */
export function localize<T extends { id: string }>(rows: T[], catalog: Catalog, fields: readonly string[]): T[] {
  return rows.map((row) => {
    const entries = catalog[row.id];
    if (!entries) return row;
    let out: T | undefined;
    for (const field of fields) {
      const entry = entries[field];
      if (!entry || entry.text === '' || entry.text == null) continue;
      out ??= { ...row };
      (out as Record<string, unknown>)[field] = entry.text;
    }
    return out ?? row;
  });
}
