import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { DEFAULT_LOCALE, type Locale } from './locales';

interface PageEntry { sha?: string; text: string }

const cache = new Map<string, Record<string, string>>();

/**
 * Long-form page prose that lives in a page rather than in data/*.yml.
 * Most pages are English-sourced, with i18n/en/pages/ as the source and
 * i18n/de/pages/ generated; impressum and privacy are the exception and
 * are authored in German (the legally binding text), with the English
 * side generated in the opposite direction (see i18n/TRANSLATION.md).
 */
export function loadPage(locale: Locale, page: string): Record<string, string> {
  const key = `${locale}/${page}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const file = path.join(process.cwd(), 'i18n', locale, 'pages', `${page}.yml`);
  const raw = fs.existsSync(file) ? ((load(fs.readFileSync(file, 'utf8')) ?? {}) as Record<string, PageEntry>) : {};
  const flat: Record<string, string> = {};
  for (const [k, entry] of Object.entries(raw)) flat[k] = entry.text;
  // Fall back to the default locale so a page whose translation lags still
  // renders its full text.
  if (locale !== DEFAULT_LOCALE) {
    const base = loadPage(DEFAULT_LOCALE, page);
    for (const [k, v] of Object.entries(base)) flat[k] ??= v;
  }
  cache.set(key, flat);
  return flat;
}
