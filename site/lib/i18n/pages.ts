import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { DEFAULT_LOCALE, type Locale } from './locales';
import { PAGE_SOURCE_LOCALE } from './pageLocales';

interface PageEntry { sha?: string; text: string }

const cache = new Map<string, Record<string, string>>();

/**
 * loadPage() falls back to a page's own source locale (PAGE_SOURCE_LOCALE
 * in pageLocales.ts - the single source of truth for this, also read by
 * scripts/i18n-check.ts's auditPage()), not blindly to DEFAULT_LOCALE,
 * precisely so a missing key on impressum/privacy falls back to the
 * binding German text rather than rendering blank - a legal notice must
 * never render empty, in any locale, at any point (a future key could
 * still go missing even with the page catalogs now under the sha guard,
 * and this keeps the fallback safe).
 */
function sourceLocaleFor(page: string) {
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
  // An entry that exists but is empty (or whitespace-only) is treated as
  // untranslated, not as an explicit value: it falls through to the
  // page's source locale below exactly like a missing key would. Without
  // this, a catalog value written as `text: ''` would render blank rather
  // than falling back to the binding German text (see the ??= fallback
  // below and i18n/TRANSLATION.md's "The legal pages invert the direction").
  for (const [k, entry] of Object.entries(raw)) {
    if (entry.text != null && entry.text.trim() !== '') flat[k] = entry.text;
  }
  const source = sourceLocaleFor(page);
  if (locale !== source) {
    const base = loadPage(source, page);
    for (const [k, v] of Object.entries(base)) flat[k] ??= v;
  }
  cache.set(key, flat);
  return flat;
}
