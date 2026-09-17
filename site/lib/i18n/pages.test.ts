import path from 'node:path';
import { dump } from 'js-yaml';
import { describe, expect, it, vi } from 'vitest';
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

  it('falls back to the German source when the English entry text is empty, not merely missing', async () => {
    // Build an English catalog with an explicit but empty `text` for
    // `heading`, and a German source with a real value for it - so this
    // fails if the merge is `flat[k] ??= v` (an empty string is not
    // null/undefined, so it would "win" and render blank) and only passes
    // when an empty/whitespace-only value is treated as missing.
    const enFixture = { heading: { sha: '0000000000000000', text: '' } };
    const deFixture = { heading: { sha: '0000000000000000', text: 'Impressum' } };

    // loadPage() caches per locale/page at module scope, so a plain
    // re-call would just hit the cache already populated from the real
    // catalogs by the tests above. Reset the module registry and mock
    // node:fs for a fresh import of pages.ts, which gets its own empty
    // cache and reads the fixtures above instead of the real files.
    vi.resetModules();
    vi.doMock('node:fs', () => ({
      default: {
        existsSync: () => true,
        readFileSync: (filePath: string) =>
          dump(filePath.includes(`${path.sep}en${path.sep}`) ? enFixture : deFixture),
      },
    }));
    try {
      const { loadPage: freshLoadPage } = await import('./pages');
      expect(freshLoadPage('en', 'impressum').heading).toBe('Impressum');
    } finally {
      vi.doUnmock('node:fs');
      vi.resetModules();
    }
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
