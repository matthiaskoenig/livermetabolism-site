import { dump } from 'js-yaml';
import { describe, expect, it, vi } from 'vitest';
import { EN_FLAT, flatten, loadUi, uiFor } from './catalog';

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
  it('falls back to English when the German entry text is empty, not merely missing', async () => {
    // Build a German file with every key the parity check requires, but an
    // empty `text` for the one key under test - so this fails if t()'s
    // fallback is `??` (empty string is not null/undefined) or is removed
    // entirely, and only passes for the real `flat[key] || EN_FLAT[key]`.
    const fixture: Record<string, { sha: string; text: string }> = {};
    for (const key of Object.keys(EN_FLAT)) {
      fixture[key] = { sha: '0000000000000000', text: key === 'nav.publications' ? '' : `stub:${key}` };
    }

    // loadUi() caches per locale at module scope, so a plain re-call would
    // just hit the cache already populated from the real i18n/de/ui.yml by
    // the tests above. Reset the module registry and mock node:fs for a
    // fresh import of catalog.ts, which gets its own empty cache and reads
    // the fixture above instead of the real file.
    vi.resetModules();
    vi.doMock('node:fs', () => ({ default: { readFileSync: () => dump(fixture) } }));
    try {
      const { uiFor: freshUiFor } = await import('./catalog');
      expect(freshUiFor('de').t('nav.publications')).toBe('Publications');
    } finally {
      vi.doUnmock('node:fs');
      vi.resetModules();
    }
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
