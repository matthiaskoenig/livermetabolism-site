import { fmt } from './i18n/format';
import type { Locale } from './i18n/locales';
import type { FundingData } from './schemas';

/** ISO 4217 code of every currency symbol `data/funding.yml` uses, so `Intl` places the symbol per locale. */
const CURRENCY_CODES: Record<string, string> = { '€': 'EUR', $: 'USD' };

/**
 * A whole-unit amount in the locale's style: `€3,825,000` in English,
 * `3.825.000 €` in German. A symbol missing from `CURRENCY_CODES` still
 * renders, as the locale-formatted number followed by the symbol.
 */
export function formatMoney(value: number, currency: string, locale: Locale): string {
  const code = CURRENCY_CODES[currency];
  if (!code) return `${new Intl.NumberFormat(locale).format(value)} ${currency}`;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(value);
}

/**
 * The amount line of a funding entry: the total, plus the group's share
 * (`shareTemplate`, placeholders `{total}` and `{share}`) when that share is
 * a real part of it - not when it is the whole grant, and not when it is 0
 * (a co-investigator without own budget). A zero total gives `null`, so the
 * line is left out rather than rendered as 0.
 */
export function fundingAmount(item: Pick<FundingData, 'amount' | 'personal_amount' | 'currency'>, locale: Locale, shareTemplate: string): string | null {
  if (item.amount <= 0) return null;
  const total = formatMoney(item.amount, item.currency, locale);
  if (item.personal_amount <= 0 || item.personal_amount >= item.amount) return total;
  return fmt(shareTemplate, { total, share: formatMoney(item.personal_amount, item.currency, locale) });
}
