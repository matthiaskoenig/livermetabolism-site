import { url } from '../url';
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from './locales';

// Same derivation as url.ts: "/" locally, "/livermetabolism-site/" on the
// interim GitHub Pages URL. Stripped of its trailing slash so it can be
// sliced off a pathname.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * getStaticPaths for every page under site/pages/[...locale]/. The default
 * locale maps to an undefined rest param, which Astro renders at the root
 * ("/publications/"); every other locale renders under its own prefix
 * ("/de/publications/"). Verified against Astro 7.3.2.
 */
export function localePaths(): { params: { locale: string | undefined } }[] {
  return LOCALES.map((locale) => ({ params: { locale: locale === DEFAULT_LOCALE ? undefined : locale } }));
}

/** The locale of the page being rendered; anything unknown is the default. */
export function localeFromParams(params: { locale?: string }): Locale {
  return isLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
}

/** `localeUrl('de', '/people/')` -> `/de/people/` (+ base). */
export function localeUrl(locale: Locale, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? url(p) : url(`/${locale}${p}`);
}

/**
 * Split a pathname (which may carry the deploy's base) into its locale and
 * the locale-free path. A path is only treated as prefixed when the segment
 * matches exactly, so a page called "/design/" is not read as German.
 */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  let p = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  if (!p.startsWith('/')) p = `/${p}`;
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    if (p === `/${locale}` || p.startsWith(`/${locale}/`)) {
      return { locale, path: p.slice(locale.length + 1) || '/' };
    }
  }
  return { locale: DEFAULT_LOCALE, path: p };
}

/** The same page in another language, for the language switch. */
export function switchPath(locale: Locale, pathname: string): string {
  return localeUrl(locale, stripLocale(pathname).path);
}

/** A locale-bound `url()`, built once per page. */
export function urlFor(locale: Locale): (path: string) => string {
  return (path: string) => localeUrl(locale, path);
}
