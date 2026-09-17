import { describe, expect, it } from 'vitest';
import { monthsFor, shortDate } from './dates';

describe('monthsFor', () => {
  it('gives the English abbreviations', () => {
    expect(monthsFor('en')[0]).toBe('Jan');
    expect(monthsFor('en')).toHaveLength(12);
  });
  it('gives the German abbreviations', () => {
    expect(monthsFor('de')[11]).toBe('Dez');
    expect(monthsFor('de')).toHaveLength(12);
  });
});

describe('shortDate', () => {
  it('formats an ISO date in English', () => {
    expect(shortDate('2026-03-09', 'en')).toBe('Mar 9, 2026');
  });
  it('formats an ISO date in German', () => {
    expect(shortDate('2026-03-09', 'de')).toBe('9. Mär 2026');
  });
});
