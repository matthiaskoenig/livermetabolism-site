import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { fmt } from './format';
import { DEFAULT_LOCALE, type Locale } from './locales';
import { en, type UiKey } from './ui.en';

/**
 * NOTE: scripts/lib/i18n-check.ts has a copy of this function (also named
 * `flatten`) that must be kept in sync with this one. It cannot import this
 * module instead: catalog.ts's own `./format`/`./locales` imports are bare
 * (no ".ts") specifiers, which Vite resolves but Node's direct execution of
 * that script cannot. If you change this transform (how nesting is walked,
 * what counts as a leaf), change the copy there too.
 */
export function flatten(tree: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree as Record<string, unknown>)) {
    const dotted = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[dotted] = value;
    else Object.assign(out, flatten(value, dotted));
  }
  return out;
}

export const EN_FLAT = flatten(en) as Record<UiKey, string>;

/** One catalog entry: the German text plus the sha of its English source. */
interface UiEntry { sha: string; text: string }

const cache = new Map<Locale, Record<string, string>>();

/**
 * The flat catalog for a locale. The German file must carry exactly the
 * English key set: a missing or unknown key throws here, which fails the
 * build with a precise message rather than leaking English into a German
 * page or rendering a raw key. A key present but empty is treated as
 * untranslated and falls back to English at lookup time.
 */
export function loadUi(locale: Locale): Record<string, string> {
  if (locale === DEFAULT_LOCALE) return EN_FLAT;
  const hit = cache.get(locale);
  if (hit) return hit;

  const file = path.join(process.cwd(), 'i18n', locale, 'ui.yml');
  const raw = (load(fs.readFileSync(file, 'utf8')) ?? {}) as Record<string, UiEntry>;

  const expected = Object.keys(EN_FLAT).sort();
  const actual = Object.keys(raw).sort();
  const missing = expected.filter((k) => !actual.includes(k));
  const unknown = actual.filter((k) => !expected.includes(k));
  if (missing.length || unknown.length) {
    throw new Error(
      `i18n/${locale}/ui.yml is out of sync with ui.en.ts.\n` +
        (missing.length ? `  missing: ${missing.join(', ')}\n` : '') +
        (unknown.length ? `  unknown: ${unknown.join(', ')}\n` : '') +
        `  Regenerate it with the translate-de skill.`,
    );
  }

  const flat: Record<string, string> = {};
  for (const [key, entry] of Object.entries(raw)) flat[key] = entry.text;
  cache.set(locale, flat);
  return flat;
}

export type TFn = (key: UiKey, vars?: Record<string, string | number>) => string;

/** The translator for one locale, built once per page. */
export function uiFor(locale: Locale): { locale: Locale; t: TFn } {
  const flat = loadUi(locale);
  // An entry that exists but is still empty falls back to English: a
  // lagging translation degrades to English, never to a blank.
  const t: TFn = (key, vars) => fmt(flat[key] || EN_FLAT[key], vars);
  return { locale, t };
}
