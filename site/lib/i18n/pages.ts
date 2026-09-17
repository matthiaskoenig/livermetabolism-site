import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { DEFAULT_LOCALE, type Locale } from './locales';

interface PageEntry { sha?: string; text: string }

const cache = new Map<string, Record<string, string>>();

/**
 * The locale each page is authored in. Every page defaults to
 * DEFAULT_LOCALE (English-sourced, i18n/en/pages/ is the source and
 * i18n/de/pages/ is generated) except impressum and privacy, which invert
 * the direction: they are authored in German (the legally binding text
 * under German law) and their i18n/en/pages/ rendering is the generated,
 * secondary one (see i18n/TRANSLATION.md's "The legal pages" section).
 * loadPage() falls back to a page's own source locale, not blindly to
 * DEFAULT_LOCALE, precisely so a missing key on one of these two pages
 * falls back to the binding German text rather than rendering blank - a
 * legal notice must never render empty, in any locale, at any point
 * (including after Task 18 fills the English catalogs in: a future key
 * could still go missing and this keeps the fallback safe).
 */
const PAGE_SOURCE_LOCALE: Record<string, Locale> = {
  impressum: 'de',
  privacy: 'de',
};

function sourceLocaleFor(page: string): Locale {
  return PAGE_SOURCE_LOCALE[page] ?? DEFAULT_LOCALE;
}

/**
 * Long-form page prose that lives in a page rather than in data/*.yml.
 * Reads i18n/<locale>/pages/<page>.yml and falls back, key by key, to the
 * page's own source locale (see PAGE_SOURCE_LOCALE) so a lagging or
 * missing translation still renders the page's full text instead of an
 * empty element. An unknown page returns {} rather than throwing.
 */
export function loadPage(locale: Locale, page: string): Record<string, string> {
  const key = `${locale}/${page}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const file = path.join(process.cwd(), 'i18n', locale, 'pages', `${page}.yml`);
  const raw = fs.existsSync(file) ? ((load(fs.readFileSync(file, 'utf8')) ?? {}) as Record<string, PageEntry>) : {};
  const flat: Record<string, string> = {};
  for (const [k, entry] of Object.entries(raw)) flat[k] = entry.text;
  const source = sourceLocaleFor(page);
  if (locale !== source) {
    const base = loadPage(source, page);
    for (const [k, v] of Object.entries(base)) flat[k] ??= v;
  }
  cache.set(key, flat);
  return flat;
}
