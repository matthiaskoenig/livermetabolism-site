import type { Locale } from './locales';

/**
 * The one month list. It previously existed twice, in githubRows.ts and
 * chartOptions.ts; two copies would have become two independently
 * translated key sets that could drift apart in German.
 */
const MONTHS: Record<Locale, readonly string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
};

export const monthsFor = (locale: Locale): readonly string[] => MONTHS[locale];

/** `2026-03-09` -> `Mar 9, 2026` (en) or `9. Mär 2026` (de). */
export function shortDate(iso: string, locale: Locale): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const month = monthsFor(locale)[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return locale === 'de' ? `${day}. ${month} ${year}` : `${month} ${day}, ${year}`;
}
