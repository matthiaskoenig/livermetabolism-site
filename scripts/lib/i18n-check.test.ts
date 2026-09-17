import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { sourceSha } from '../../site/lib/i18n/sha';
import { PAGE_SOURCE_LOCALE, PAGE_LOCALE_ONLY_FIELDS } from '../../site/lib/i18n/pageLocales';
import { DEFAULT_LOCALE, LOCALES } from '../../site/lib/i18n/locales';
import { auditTable, auditUi, auditPage, CatalogParseError, flatten, formatIssues } from './i18n-check';

const rows = [
  { id: 'a', description: 'English A' },
  { id: 'b', description: 'English B' },
];
const fields = ['description'] as const;

describe('auditTable', () => {
  it('reports nothing when every entry is current', () => {
    const catalog = {
      a: { description: { sha: sourceSha('English A'), text: 'Deutsch A' } },
      b: { description: { sha: sourceSha('English B'), text: 'Deutsch B' } },
    };
    expect(auditTable(rows, catalog, fields, 'de', 'people')).toEqual([]);
  });

  it('reports a missing entry', () => {
    const catalog = { a: { description: { sha: sourceSha('English A'), text: 'Deutsch A' } } };
    expect(auditTable(rows, catalog, fields, 'de', 'people')).toEqual([
      { kind: 'missing', locale: 'de', table: 'people', id: 'b', field: 'description' },
    ]);
  });

  it('reports an entry with empty text as missing, even when its sha matches the source (it renders English forever otherwise)', () => {
    const catalog = {
      a: { description: { sha: sourceSha('English A'), text: '' } },
      b: { description: { sha: sourceSha('English B'), text: 'Deutsch B' } },
    };
    expect(auditTable(rows, catalog, fields, 'de', 'people')).toEqual([
      { kind: 'missing', locale: 'de', table: 'people', id: 'a', field: 'description' },
    ]);
  });

  it('reports an empty-array entry (a string[] field) as missing too', () => {
    const roleRows = [{ id: 'a', role: ['Group Leader'] }];
    const catalog = { a: { role: { sha: sourceSha(['Group Leader']), text: [] } } };
    expect(auditTable(roleRows, catalog, ['role'], 'de', 'people')).toEqual([
      { kind: 'missing', locale: 'de', table: 'people', id: 'a', field: 'role' },
    ]);
  });

  it('reports a stale entry when the English source changed', () => {
    const catalog = {
      a: { description: { sha: sourceSha('something older'), text: 'Deutsch A' } },
      b: { description: { sha: sourceSha('English B'), text: 'Deutsch B' } },
    };
    expect(auditTable(rows, catalog, fields, 'de', 'people')).toEqual([
      { kind: 'stale', locale: 'de', table: 'people', id: 'a', field: 'description' },
    ]);
  });

  it('reports an orphaned entry whose row is gone', () => {
    const catalog = {
      a: { description: { sha: sourceSha('English A'), text: 'Deutsch A' } },
      b: { description: { sha: sourceSha('English B'), text: 'Deutsch B' } },
      gone: { description: { sha: 'deadbeefdeadbeef', text: 'Deutsch' } },
    };
    expect(auditTable(rows, catalog, fields, 'de', 'people')).toEqual([
      { kind: 'orphaned', locale: 'de', table: 'people', id: 'gone', field: 'description' },
    ]);
  });

  it('reports a catalog field outside the registry', () => {
    const catalog = {
      a: { description: { sha: sourceSha('English A'), text: 'Deutsch A' }, name: { sha: 'x', text: 'Nein' } },
      b: { description: { sha: sourceSha('English B'), text: 'Deutsch B' } },
    };
    expect(auditTable(rows, catalog, fields, 'de', 'people')).toEqual([
      { kind: 'unknown-field', locale: 'de', table: 'people', id: 'a', field: 'name' },
    ]);
  });

  it('skips a row whose English source is empty', () => {
    expect(auditTable([{ id: 'a', description: '' }], {}, fields, 'de', 'people')).toEqual([]);
  });

  describe('markup-bearing fields (v-html)', () => {
    // people.description is one of the markup-bearing fields (see
    // i18n/TRANSLATION.md's "Some data fields keep their HTML"), so the
    // generic `rows`/`fields`/'people' fixture above doubles as one here.
    const html = '<p>Hello <a href="https://example.org">world</a></p>';

    it('reports nothing for a translation that keeps the exact same tags, in order, with the same attributes', () => {
      const rows2 = [{ id: 'a', description: html }];
      const catalog = { a: { description: { sha: sourceSha(html), text: '<p>Hallo <a href="https://example.org">Welt</a></p>' } } };
      expect(auditTable(rows2, catalog, fields, 'de', 'people')).toEqual([]);
    });

    it('reports (as stale) a translation whose sha matches but dropped a tag', () => {
      const rows2 = [{ id: 'a', description: html }];
      const catalog = { a: { description: { sha: sourceSha(html), text: 'Hallo Welt' } } };
      expect(auditTable(rows2, catalog, fields, 'de', 'people')).toEqual([
        { kind: 'stale', locale: 'de', table: 'people', id: 'a', field: 'description' },
      ]);
    });

    it('reports (as stale) a translation whose sha matches but changed an attribute, e.g. the href', () => {
      const rows2 = [{ id: 'a', description: html }];
      const catalog = { a: { description: { sha: sourceSha(html), text: '<p>Hallo <a href="https://evil.test">Welt</a></p>' } } };
      expect(auditTable(rows2, catalog, fields, 'de', 'people')).toEqual([
        { kind: 'stale', locale: 'de', table: 'people', id: 'a', field: 'description' },
      ]);
    });

    it('reports (as stale) a translation whose sha matches but reordered two tags', () => {
      const src = '<b>one</b><i>two</i>';
      const rows2 = [{ id: 'a', description: src }];
      const catalog = { a: { description: { sha: sourceSha(src), text: '<i>zwei</i><b>eins</b>' } } };
      expect(auditTable(rows2, catalog, fields, 'de', 'people')).toEqual([
        { kind: 'stale', locale: 'de', table: 'people', id: 'a', field: 'description' },
      ]);
    });

    it('never checks tag sequence for a field outside MARKUP_FIELDS, e.g. tags.short_description', () => {
      const src = 'Plain <not-real-html> text that just happens to look tag-like';
      const rows2 = [{ id: 'a', short_description: src }];
      const catalog = { a: { short_description: { sha: sourceSha(src), text: 'Andere Interpunktion <ganz anders>' } } };
      expect(auditTable(rows2, catalog, ['short_description'], 'de', 'tags')).toEqual([]);
    });
  });

  it('handles malformed YAML gracefully', () => {
    const err = new Error('bad YAML');
    const parseErr = new CatalogParseError('i18n/de/people.yml', err);
    expect(parseErr.message).toContain('Failed to parse i18n/de/people.yml');
    expect(parseErr.message).toContain('bad YAML');
  });
});

describe('formatIssues', () => {
  it('says so when there is nothing to report', () => {
    expect(formatIssues([])).toContain('up to date');
  });
  it('names the locale, table, id and field of an issue', () => {
    const out = formatIssues([{ kind: 'stale', locale: 'de', table: 'people', id: 'koenig', field: 'description' }]);
    expect(out).toContain('de');
    expect(out).toContain('people');
    expect(out).toContain('koenig');
    expect(out).toContain('description');
  });
  it('prints a ui issue as its dotted key alone, with no synthetic id', () => {
    const out = formatIssues([{ kind: 'missing', locale: 'de', table: 'ui', id: '(ui.en.ts)', field: 'nav.publications' }]);
    expect(out).toContain('de/ui/nav.publications');
    expect(out).not.toContain('(ui.en.ts)');
  });
});

describe('flatten', () => {
  it('joins nested keys with dots', () => {
    expect(flatten({ nav: { publications: 'Publications' } })).toEqual({ 'nav.publications': 'Publications' });
  });
  it('flattens arbitrarily deep nesting', () => {
    expect(flatten({ tags: { label: { digitalTwins: 'Digital Twins' } } })).toEqual({
      'tags.label.digitalTwins': 'Digital Twins',
    });
  });
  it('flattens a realistic multi-branch tree the way ui.en.ts is shaped', () => {
    const tree = { nav: { publications: 'Publications', projects: 'Projects' }, footer: { tagline: 'Tagline' } };
    expect(flatten(tree)).toEqual({
      'nav.publications': 'Publications',
      'nav.projects': 'Projects',
      'footer.tagline': 'Tagline',
    });
  });
});

// The UI catalog (i18n/de/ui.yml) is flat - dotted key -> {sha, text} -
// with no per-row id the way a data table's catalog has. auditUi() is the
// adapter that lets auditTable() audit it anyway (see the comment above it
// in i18n-check.ts); these tests exercise that adapter directly, the same
// way the auditTable tests above exercise auditTable directly.
describe('auditUi', () => {
  const en = { 'nav.publications': 'Publications', 'nav.projects': 'Projects' };

  it('reports nothing when every ui entry is current', () => {
    const catalog = {
      'nav.publications': { sha: sourceSha('Publications'), text: 'Publikationen' },
      'nav.projects': { sha: sourceSha('Projects'), text: 'Projekte' },
    };
    expect(auditUi(en, catalog, 'de')).toEqual([]);
  });

  it('reports a missing ui entry', () => {
    const catalog = { 'nav.publications': { sha: sourceSha('Publications'), text: 'Publikationen' } };
    expect(auditUi(en, catalog, 'de')).toEqual([
      { kind: 'missing', locale: 'de', table: 'ui', id: '(ui.en.ts)', field: 'nav.projects' },
    ]);
  });

  it('reports a stale ui entry when the English string changed', () => {
    const catalog = {
      'nav.publications': { sha: sourceSha('Publications (old)'), text: 'Publikationen' },
      'nav.projects': { sha: sourceSha('Projects'), text: 'Projekte' },
    };
    expect(auditUi(en, catalog, 'de')).toEqual([
      { kind: 'stale', locale: 'de', table: 'ui', id: '(ui.en.ts)', field: 'nav.publications' },
    ]);
  });

  it('reports a stale ui entry for a placeholder sha, exactly like the ones written by hand in i18n/de/ui.yml', () => {
    const catalog = {
      'nav.publications': { sha: '0000000000000000', text: 'Publikationen' },
      'nav.projects': { sha: sourceSha('Projects'), text: 'Projekte' },
    };
    expect(auditUi(en, catalog, 'de')).toEqual([
      { kind: 'stale', locale: 'de', table: 'ui', id: '(ui.en.ts)', field: 'nav.publications' },
    ]);
  });

  it('reports a ui catalog key that no longer exists in ui.en.ts as unknown-field, not orphaned', () => {
    const catalog = {
      'nav.publications': { sha: sourceSha('Publications'), text: 'Publikationen' },
      'nav.projects': { sha: sourceSha('Projects'), text: 'Projekte' },
      'nav.retired': { sha: 'deadbeefdeadbeef', text: 'Alt' },
    };
    expect(auditUi(en, catalog, 'de')).toEqual([
      { kind: 'unknown-field', locale: 'de', table: 'ui', id: '(ui.en.ts)', field: 'nav.retired' },
    ]);
  });

  it('never reports orphaned - a stray ui.yml key is always unknown-field instead', () => {
    const catalog = { 'nav.publications': { sha: sourceSha('Publications'), text: 'Publikationen' }, bogus: { sha: 'x', text: 'y' } };
    const kinds = auditUi(en, catalog, 'de').map((i) => i.kind);
    expect(kinds).not.toContain('orphaned');
  });

  it('refuses a flattened UI key literally named "id" instead of silently colliding with the synthetic row id', () => {
    const enWithIdKey = { ...en, id: 'Some English value' };
    const catalog = { 'nav.publications': { sha: sourceSha('Publications'), text: 'Publikationen' } };
    expect(() => auditUi(enWithIdKey, catalog, 'de')).toThrow(/named "id"/);
  });
});

// auditPage() is auditUi()'s adapter for i18n/{de,en}/pages/<page>.yml
// (impressum, privacy): one flat map per page, wrapped as a single
// synthetic row, same shape as the UI catalog - except the source side can
// be either locale (PAGE_SOURCE_LOCALE inverts it for these two pages,
// since the binding text is German). These fixture-based tests exercise
// the adapter directly; the 'bites on the real catalogs' block below
// proves the wiring in scripts/i18n-check.ts actually catches a real edit.
describe('auditPage', () => {
  const sourceValues = { heading: 'Impressum', providerHeading: 'Angaben gemäß § 5 TMG' };

  it('reports nothing when every page entry is current', () => {
    const catalog = {
      heading: { sha: sourceSha('Impressum'), text: 'Legal Notice' },
      providerHeading: { sha: sourceSha('Angaben gemäß § 5 TMG'), text: 'Information pursuant to § 5' },
    };
    expect(auditPage(sourceValues, catalog, 'en', 'impressum')).toEqual([]);
  });

  it('reports a stale entry when the source value changed', () => {
    const catalog = {
      heading: { sha: sourceSha('Impressum (old)'), text: 'Legal Notice' },
      providerHeading: { sha: sourceSha('Angaben gemäß § 5 TMG'), text: 'Information pursuant to § 5' },
    };
    expect(auditPage(sourceValues, catalog, 'en', 'impressum')).toEqual([
      { kind: 'stale', locale: 'en', table: 'pages/impressum', id: '(pages/impressum)', field: 'heading' },
    ]);
  });

  it('reports a missing key', () => {
    const catalog = { heading: { sha: sourceSha('Impressum'), text: 'Legal Notice' } };
    expect(auditPage(sourceValues, catalog, 'en', 'impressum')).toEqual([
      { kind: 'missing', locale: 'en', table: 'pages/impressum', id: '(pages/impressum)', field: 'providerHeading' },
    ]);
  });

  it('reports an extra key not in the source as unknown-field', () => {
    const catalog = {
      heading: { sha: sourceSha('Impressum'), text: 'Legal Notice' },
      providerHeading: { sha: sourceSha('Angaben gemäß § 5 TMG'), text: 'Information pursuant to § 5' },
      staleLeftover: { sha: 'deadbeefdeadbeef', text: 'No longer a real field' },
    };
    expect(auditPage(sourceValues, catalog, 'en', 'impressum')).toEqual([
      { kind: 'unknown-field', locale: 'en', table: 'pages/impressum', id: '(pages/impressum)', field: 'staleLeftover' },
    ]);
  });

  it('never reports orphaned - like the UI catalog, a stray page key is always unknown-field instead', () => {
    const catalog = {
      heading: { sha: sourceSha('Impressum'), text: 'Legal Notice' },
      providerHeading: { sha: sourceSha('Angaben gemäß § 5 TMG'), text: 'Information pursuant to § 5' },
      bogus: { sha: 'x', text: 'y' },
    };
    const kinds = auditPage(sourceValues, catalog, 'en', 'impressum').map((i) => i.kind);
    expect(kinds).not.toContain('orphaned');
  });

  it('excludes a locale-only field (no source counterpart) from both missing/stale and unknown-field', () => {
    const catalog = {
      heading: { sha: sourceSha('Impressum'), text: 'Legal Notice' },
      providerHeading: { sha: sourceSha('Angaben gemäß § 5 TMG'), text: 'Information pursuant to § 5' },
      bindingNotice: { text: 'This is a translation for convenience. Only the German version is legally binding.' },
    };
    expect(auditPage(sourceValues, catalog, 'en', 'impressum', ['bindingNotice'])).toEqual([]);
  });

  it('flags a locale-only field as unknown-field once it is no longer declared locale-only', () => {
    const catalog = {
      heading: { sha: sourceSha('Impressum'), text: 'Legal Notice' },
      providerHeading: { sha: sourceSha('Angaben gemäß § 5 TMG'), text: 'Information pursuant to § 5' },
      bindingNotice: { text: 'This is a translation for convenience. Only the German version is legally binding.' },
    };
    expect(auditPage(sourceValues, catalog, 'en', 'impressum', [])).toEqual([
      { kind: 'unknown-field', locale: 'en', table: 'pages/impressum', id: '(pages/impressum)', field: 'bindingNotice' },
    ]);
  });
});

// These tests read the real i18n/{de,en}/pages/*.yml files (not fixtures)
// to prove the sha guard actually bites on the checked-in catalogs, the
// same way `PublicationsChart.vue` etc. are tested against the real YAML
// elsewhere in this repo - a fixture-only test suite could pass while the
// real catalogs (freshly given shas by this change) were still out of
// sync with each other.
describe('auditPage bites on the real page catalogs', () => {
  const root = path.join(__dirname, '../..');

  interface PageEntry { sha?: string; text: string }
  const readPage = (locale: string, page: string): Record<string, PageEntry> =>
    load(fs.readFileSync(path.join(root, 'i18n', locale, 'pages', `${page}.yml`), 'utf8')) as Record<string, PageEntry>;

  it('PAGE_SOURCE_LOCALE covers every page catalog that exists on disk', () => {
    for (const locale of LOCALES) {
      const dir = path.join(root, 'i18n', locale, 'pages');
      const pages = fs.readdirSync(dir).map((f) => f.replace(/\.yml$/, ''));
      for (const page of pages) expect(Object.keys(PAGE_SOURCE_LOCALE)).toContain(page);
    }
  });

  it('reports nothing today: the real generated catalogs are in sync with their real source', () => {
    for (const page of Object.keys(PAGE_SOURCE_LOCALE)) {
      const source = PAGE_SOURCE_LOCALE[page] ?? DEFAULT_LOCALE;
      const generated = LOCALES.find((l) => l !== source);
      if (!generated) continue;
      const sourceValues = Object.fromEntries(
        Object.entries(readPage(source, page)).map(([field, entry]) => [field, entry.text]),
      );
      const catalog = readPage(generated, page);
      expect(auditPage(sourceValues, catalog, generated, page, PAGE_LOCALE_ONLY_FIELDS[page] ?? [])).toEqual([]);
    }
  });

  it('catches a real, in-memory edit to the German source of impressum as stale in the generated English', () => {
    const source = PAGE_SOURCE_LOCALE.impressum ?? DEFAULT_LOCALE;
    const generated = LOCALES.find((l) => l !== source)!;
    const sourceRaw = readPage(source, 'impressum');
    const editedValues = Object.fromEntries(
      Object.entries(sourceRaw).map(([field, entry]) => [field, entry.text]),
    );
    // Mutate the in-memory value only - the file on disk is untouched -
    // simulating exactly the scenario the guard exists for: the owner
    // edits the binding German text and forgets to regenerate English.
    editedValues.heading = `${editedValues.heading} (edited)`;
    const catalog = readPage(generated, 'impressum');
    const issues = auditPage(editedValues, catalog, generated, 'impressum', PAGE_LOCALE_ONLY_FIELDS.impressum ?? []);
    expect(issues).toEqual([
      { kind: 'stale', locale: generated, table: 'pages/impressum', id: '(pages/impressum)', field: 'heading' },
    ]);
  });
});
