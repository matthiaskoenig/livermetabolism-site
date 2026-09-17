import { DEFAULT_LOCALE, LOCALES, type Locale } from './locales';
import { localeUrl, stripLocale } from './routes';

/** BCP 47 tags for the hreflang attribute; en is explicitly US English. */
const HREFLANG: Record<Locale, string> = { en: 'en-US', de: 'de-DE' };

/**
 * The rel="alternate" set for the page at `pathname`, plus x-default
 * pointing at the default locale. hreflang requires absolute URLs, so
 * without Astro.site (only the case in an unconfigured build) this yields
 * nothing rather than emitting relative hrefs search engines would ignore.
 */
export function alternates(pathname: string, site: URL | undefined): { hreflang: string; href: string }[] {
  if (!site) return [];
  const { path } = stripLocale(pathname);
  const abs = (locale: Locale) => new URL(localeUrl(locale, path), site).href;
  return [
    ...LOCALES.map((locale) => ({ hreflang: HREFLANG[locale], href: abs(locale) })),
    { hreflang: 'x-default', href: abs(DEFAULT_LOCALE) },
  ];
}
