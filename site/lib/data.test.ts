// @vitest-environment node
//
// astro:content is a server-only virtual module (getCollection() throws
// "ServerOnlyModule" under happy-dom, the suite's default environment,
// because Astro's content plugin only registers it for the SSR/node
// environment) - data.ts is build-time only by design (see CLAUDE.md), so
// this file overrides the environment rather than relaxing that boundary.
import path from 'node:path';
import { dump } from 'js-yaml';
import { describe, expect, it, vi } from 'vitest';
import { getNews, getPublications } from './data';

describe('the locale-aware getters', () => {
  it('returns English rows for the default locale', async () => {
    const news = await getNews('en');
    expect(news.length).toBeGreaterThan(0);
  });
  it('returns the same number of rows for German', async () => {
    const [en, de] = await Promise.all([getNews('en'), getNews('de')]);
    expect(de).toHaveLength(en.length);
  });
  it('keeps row order between locales', async () => {
    const [en, de] = await Promise.all([getNews('en'), getNews('de')]);
    expect(de.map((r) => r.id)).toEqual(en.map((r) => r.id));
  });
  it('leaves a bibliographic title in English on the German tree', async () => {
    const [en, de] = await Promise.all([getPublications('en'), getPublications('de')]);
    expect(de.map((p) => p.title)).toEqual(en.map((p) => p.title));
  });
});

// The tests above hold no matter how `all()`/`getTags()` are wired, because
// no i18n/de/*.yml catalog exists yet (Task 16): every localize() call sees
// an empty catalog and is a no-op, so these tests only prove the getters
// don't crash and preserve shape - not that the overlay itself works. The
// suite below exercises the real overlay end-to-end with fixture catalogs
// for two different real tables plus tags, so it fails if `all()` ever
// looks up the wrong table's catalog or `localize()` gets the wrong field
// list - the actual wiring this task delivers.
//
// Real row ids from data/people.yml, data/news.yml and data/tags.yml, so the
// fixtures exercise the real content collections rather than invented rows.
const PEOPLE_DE_TEXT = 'Deutsche Testbeschreibung fuer Matthias.';
const NEWS_DE_TEXT = 'Deutscher Testtitel fuer die Luebeck-Meldung.';
const TAGS_DE_TEXT = 'Deutsche Testbeschreibung fuer digitale Zwillinge.';

const PEOPLE_CATALOG = { matthias_koenig: { description: { sha: 'aaaa000000000000', text: PEOPLE_DE_TEXT } } };
const NEWS_CATALOG = { Koenig2026_Luebeck_Welcome: { title: { sha: 'bbbb000000000000', text: NEWS_DE_TEXT } } };
const TAGS_CATALOG = { 'Digital Twins': { description: { sha: 'cccc000000000000', text: TAGS_DE_TEXT } } };

/**
 * `loadCatalog()` memoises per `locale/table` at module scope, so a fixture
 * written after a previous load in the same process is never picked up
 * (see site/lib/i18n/catalog.test.ts's identical pattern for the UI
 * catalog). Reset the module registry and mock `node:fs` so a fresh import
 * of data.ts gets its own empty cache and reads these fixtures instead of
 * (non-existent) real i18n/de/*.yml files - nothing is ever written to
 * disk, so no stray fixture file can leak into i18n/de/.
 *
 * The mock must pass every other path straight through to the real
 * `node:fs`, not just `ui.yml` - both named and default exports, and
 * matching the fixture catalogs' exact paths rather than a bare
 * `endsWith('people.yml')` suffix (which used to also match the real
 * `data/people.yml`). Astro's own content-layer cache
 * (`.astro/data-store.json`, see vitest.global-setup.ts) is unaffected by
 * this either way: it is read once, by Astro's Vite plugin, via a
 * `node:fs` reference bound before any test file - let alone this mock -
 * ever runs, so it is not this mock's job to account for it; it only ever
 * has to behave correctly for the three `i18n/de/<table>.yml` paths it
 * fakes.
 */
async function withGermanFixtures<T>(run: (mod: typeof import('./data')) => Promise<T>): Promise<T> {
  vi.resetModules();
  const actualFs = await vi.importActual<typeof import('node:fs')>('node:fs');
  const catalogPath = (table: string) => path.join(process.cwd(), 'i18n', 'de', `${table}.yml`);
  const fixtures = new Map<string, unknown>([
    [catalogPath('people'), PEOPLE_CATALOG],
    [catalogPath('news'), NEWS_CATALOG],
    [catalogPath('tags'), TAGS_CATALOG],
  ]);
  const existsSync = (file: string) => (fixtures.has(file) ? true : actualFs.existsSync(file));
  const readFileSync = (file: string, ...args: unknown[]) => {
    const fixture = fixtures.get(file);
    return fixture ? dump(fixture) : actualFs.readFileSync(file, ...(args as []));
  };
  vi.doMock('node:fs', () => ({
    ...actualFs,
    existsSync,
    readFileSync,
    default: { ...actualFs, existsSync, readFileSync },
  }));
  try {
    const mod = await import('./data');
    return await run(mod);
  } finally {
    vi.doUnmock('node:fs');
    vi.resetModules();
  }
}

describe('the overlay, exercised end-to-end with fixture catalogs', () => {
  it('overlays a real people.yml row and leaves an untranslated sibling in English', async () => {
    await withGermanFixtures(async (mod) => {
      const [en, de] = await Promise.all([mod.getPeople('en'), mod.getPeople('de')]);
      const enKoenig = en.find((p) => p.id === 'matthias_koenig');
      const deKoenig = de.find((p) => p.id === 'matthias_koenig');
      expect(enKoenig?.description).toBeTruthy();
      expect(deKoenig?.description).toBe(PEOPLE_DE_TEXT);
      expect(deKoenig?.description).not.toBe(enKoenig?.description);

      // 'mariia_myshkina' has no entry in PEOPLE_CATALOG - must fall back to English.
      const enSibling = en.find((p) => p.id === 'mariia_myshkina');
      const deSibling = de.find((p) => p.id === 'mariia_myshkina');
      expect(enSibling?.description).toBeTruthy();
      expect(deSibling?.description).toBe(enSibling?.description);
    });
  });

  it('threads the table name correctly - each getter reads only its own catalog', async () => {
    await withGermanFixtures(async (mod) => {
      const [dePeople, deNews] = await Promise.all([mod.getPeople('de'), mod.getNews('de')]);
      const koenig = dePeople.find((p) => p.id === 'matthias_koenig');
      const welcome = deNews.find((n) => n.id === 'Koenig2026_Luebeck_Welcome');
      expect(koenig?.description).toBe(PEOPLE_DE_TEXT);
      expect(welcome?.title).toBe(NEWS_DE_TEXT);
      // If all('people', ...) had loaded news.yml's catalog (or vice versa),
      // the id would not be found there and the row would stay English -
      // this fails on that swap because the fixture texts are distinct.
      expect(koenig?.description).not.toBe(NEWS_DE_TEXT);
      expect(welcome?.title).not.toBe(PEOPLE_DE_TEXT);
    });
  });

  it('overlays a tag description while leaving tag and slug untranslated', async () => {
    await withGermanFixtures(async (mod) => {
      const [en, de] = await Promise.all([mod.getTags('en'), mod.getTags('de')]);
      const enTag = en.find((t) => t.tag === 'Digital Twins');
      const deTag = de.find((t) => t.tag === 'Digital Twins');
      expect(enTag?.description).toBeTruthy();
      expect(deTag?.description).toBe(TAGS_DE_TEXT);
      expect(deTag?.description).not.toBe(enTag?.description);
      // The highest-consequence invariant: tag/slug must never come from
      // the catalog, since they are the reference key and the URL anchor.
      expect(deTag?.tag).toBe('Digital Twins');
      expect(deTag?.slug).toBe(enTag?.slug);
    });
  });
});
