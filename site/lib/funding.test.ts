import { describe, expect, it } from 'vitest';
import { formatMoney, fundingAmount } from './funding';

const SHARE = '{total} (group share: {share})';
// Intl puts a no-break space between the German number and the symbol.
const nb = (s: string) => s.replace(/ (?=[€$])/g, '\u00a0');

describe('formatMoney', () => {
  it('formats euros and dollars per locale, without decimals', () => {
    expect(formatMoney(3825000, '€', 'en')).toBe('€3,825,000');
    expect(formatMoney(3825000, '€', 'de')).toBe(nb('3.825.000 €'));
    expect(formatMoney(50000, '$', 'en')).toBe('$50,000');
    expect(formatMoney(50000, '$', 'de')).toBe(nb('50.000 $'));
  });

  it('falls back to the plain number and the symbol for an unknown currency', () => {
    expect(formatMoney(1500, 'CHF', 'en')).toBe('1,500 CHF');
    expect(formatMoney(1500, 'CHF', 'de')).toBe('1.500 CHF');
  });
});

describe('fundingAmount', () => {
  it('shows the total alone when the whole grant is the group\'s', () => {
    expect(fundingAmount({ amount: 15000, personal_amount: 15000, currency: '€' }, 'en', SHARE)).toBe('€15,000');
  });

  it('adds the group share when it is part of the total', () => {
    expect(fundingAmount({ amount: 3825000, personal_amount: 425000, currency: '€' }, 'en', SHARE)).toBe('€3,825,000 (group share: €425,000)');
    expect(fundingAmount({ amount: 3825000, personal_amount: 425000, currency: '€' }, 'de', '{total} (Anteil der Gruppe: {share})')).toBe(
      nb('3.825.000 € (Anteil der Gruppe: 425.000 €)'),
    );
  });

  it('shows the total alone when the group share is zero', () => {
    expect(fundingAmount({ amount: 10000, personal_amount: 0, currency: '€' }, 'en', SHARE)).toBe('€10,000');
  });

  it('shows nothing for a zero total, never "€0"', () => {
    expect(fundingAmount({ amount: 0, personal_amount: 0, currency: '€' }, 'en', SHARE)).toBeNull();
  });
});
