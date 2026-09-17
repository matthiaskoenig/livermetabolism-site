import { describe, expect, it } from 'vitest';
import { loadPage } from './pages';

describe('loadPage', () => {
  it('loads the German legal source', () => {
    expect(loadPage('de', 'impressum').heading).toBeTruthy();
  });
  it('loads the generated English rendering', () => {
    expect(loadPage('en', 'impressum').heading).toBeTruthy();
  });
  it('carries the binding-version notice in English', () => {
    expect(loadPage('en', 'impressum').bindingNotice).toContain('German');
  });
  it('returns an empty record for an unknown page rather than throwing', () => {
    expect(loadPage('en', 'nope')).toEqual({});
  });

  // A legal notice must never render blank: the worst acceptable failure is
  // showing the binding German text to an English reader, never showing
  // nothing. impressum and privacy are authored in German, so every key an
  // English reader might hit must resolve - either the generated English
  // text (once Task 18 fills it in) or, failing that, the German source -
  // but never undefined/empty. Driven from the real German catalogs (the
  // authoritative, complete key set for each page) rather than a fixture,
  // so this keeps guarding as i18n/en/pages/*.yml is filled in over time.
  describe.each(['impressum', 'privacy'] as const)('%s', (page) => {
    const sourceKeys = Object.keys(loadPage('de', page));

    it('the German source is non-trivial', () => {
      expect(sourceKeys.length).toBeGreaterThan(10);
    });

    it.each(['en', 'de'] as const)('every key resolves to a non-empty string for locale %s', (locale) => {
      const resolved = loadPage(locale, page);
      for (const key of sourceKeys) {
        expect(resolved[key], `${page}.${key} for locale "${locale}"`).toBeTruthy();
        expect(typeof resolved[key]).toBe('string');
      }
    });
  });
});
