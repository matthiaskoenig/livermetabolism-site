import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, isLocale, LOCALES } from './locales';

describe('locales', () => {
  it('lists English first and German second', () => {
    expect(LOCALES).toEqual(['en', 'de']);
  });
  it('defaults to English', () => {
    expect(DEFAULT_LOCALE).toBe('en');
  });
  it('accepts a known locale', () => {
    expect(isLocale('de')).toBe(true);
  });
  it('rejects an unknown locale', () => {
    expect(isLocale('fr')).toBe(false);
  });
  it('rejects a non-string', () => {
    expect(isLocale(undefined)).toBe(false);
  });
});
