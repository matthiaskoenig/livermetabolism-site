import type { Locale } from './locales';

/**
 * The locale each `i18n/{en,de}/pages/<page>.yml` catalog is authored in.
 * Every page defaults to DEFAULT_LOCALE (English-sourced, `i18n/en/pages/`
 * is the source and `i18n/de/pages/` is generated) except `impressum` and
 * `privacy`, which invert the direction: they are authored in German (the
 * legally binding text under German law) and their `i18n/en/pages/`
 * rendering is the generated, secondary one (see i18n/TRANSLATION.md's
 * "The legal pages" section).
 *
 * Leaf module with no runtime imports (the `Locale` import is `import
 * type`, erased at compile time) so it can be imported both by the
 * Vite-bundled site (`pages.ts`) and by `scripts/i18n-check.ts`'s direct
 * Node execution, which cannot resolve a bare (extensionless) relative
 * import the way Vite does - see content.ts's NOTE on why a module with
 * real runtime imports can't be reused there. Same reasoning as
 * `locales.ts`/`detailTypes.ts`.
 */
export const PAGE_SOURCE_LOCALE: Record<string, Locale> = {
  impressum: 'de',
  privacy: 'de',
};

/**
 * Fields of a page catalog that exist only in one locale by design, with
 * no counterpart in the other - not "not yet translated", but never
 * translated at all, because the content itself is locale-specific (e.g.
 * `bindingNotice`, the "this is a translation for convenience, only the
 * German version is legally binding" notice rendered on impressum/privacy
 * for every locale other than German - see `site/pages/[...locale]/
 * impressum.astro`/`privacy.astro`). Keyed by page, listing the field
 * names that must be excluded from both the missing/stale comparison
 * against the source locale and the unknown-field check, in
 * `scripts/lib/i18n-check.ts`'s `auditPage()` and from `loadPage()`'s
 * source-locale fallback in `pages.ts` (a locale-only field has nothing to
 * fall back to).
 */
export const PAGE_LOCALE_ONLY_FIELDS: Record<string, readonly string[]> = {
  impressum: ['bindingNotice'],
  privacy: ['bindingNotice'],
};
