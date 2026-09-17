import { describe, expect, it } from 'vitest';
import { PAGE_SOURCE_LOCALE, PAGE_LOCALE_ONLY_FIELDS } from './pageLocales';
import { isLocale } from './locales';

describe('PAGE_SOURCE_LOCALE', () => {
  it('inverts the direction for the two legal pages, since German is binding', () => {
    expect(PAGE_SOURCE_LOCALE.impressum).toBe('de');
    expect(PAGE_SOURCE_LOCALE.privacy).toBe('de');
  });
  it('every value is a real locale', () => {
    for (const locale of Object.values(PAGE_SOURCE_LOCALE)) expect(isLocale(locale)).toBe(true);
  });
});

describe('PAGE_LOCALE_ONLY_FIELDS', () => {
  it('names bindingNotice for both legal pages, since it only makes sense in a non-source locale', () => {
    expect(PAGE_LOCALE_ONLY_FIELDS.impressum).toEqual(['bindingNotice']);
    expect(PAGE_LOCALE_ONLY_FIELDS.privacy).toEqual(['bindingNotice']);
  });
  it('only lists pages that also appear in PAGE_SOURCE_LOCALE', () => {
    for (const page of Object.keys(PAGE_LOCALE_ONLY_FIELDS)) {
      expect(Object.keys(PAGE_SOURCE_LOCALE)).toContain(page);
    }
  });
});
