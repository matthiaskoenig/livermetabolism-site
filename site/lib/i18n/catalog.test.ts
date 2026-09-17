import { describe, expect, it } from 'vitest';
import { EN_FLAT, flatten, loadUi, uiFor } from './catalog';
import { en } from './ui.en';

describe('flatten', () => {
  it('joins nested keys with dots', () => {
    expect(flatten({ nav: { news: 'News' }, search: { open: 'Search' } })).toEqual({
      'nav.news': 'News',
      'search.open': 'Search',
    });
  });
});

describe('EN_FLAT', () => {
  it('flattens the English catalog', () => {
    expect(EN_FLAT['nav.publications']).toBe('Publications');
  });
  it('has no empty value', () => {
    for (const [key, value] of Object.entries(EN_FLAT)) expect(value, key).not.toBe('');
  });
});

describe('loadUi', () => {
  it('returns the English catalog for the default locale', () => {
    expect(loadUi('en')).toBe(EN_FLAT);
  });
  it('has exactly the English key set for German', () => {
    expect(Object.keys(loadUi('de')).sort()).toEqual(Object.keys(EN_FLAT).sort());
  });
});

describe('uiFor', () => {
  it('resolves a key', () => {
    expect(uiFor('en').t('nav.publications')).toBe('Publications');
  });
  it('interpolates', () => {
    expect(uiFor('en').t('search.empty', { query: 'x' })).toContain('x');
  });
  it('falls back to English when the German catalog has no text yet', () => {
    const de = uiFor('de');
    expect(de.t('nav.publications')).toBeTruthy();
  });
});

describe('the German catalog', () => {
  it('keeps every placeholder of its English source', () => {
    const de = loadUi('de');
    const placeholders = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort();
    for (const [key, english] of Object.entries(EN_FLAT)) {
      expect(placeholders(de[key] ?? english), key).toEqual(placeholders(english));
    }
  });
});
