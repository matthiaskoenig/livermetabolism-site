/**
 * The locale names, in one leaf module with no dependencies: the
 * browser-side chrome (the detail router, the search dialog) needs them,
 * and importing them from catalog.ts would drag js-yaml and the build-time
 * catalogs into the site chrome bundle. Same reasoning as detailTypes.ts.
 */
export type Locale = 'en' | 'de';

/** Display order of the language switch; the default locale comes first. */
export const LOCALES = ['en', 'de'] as const satisfies readonly Locale[];

/** US English. Rendered unprefixed, at the root of the site. */
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
