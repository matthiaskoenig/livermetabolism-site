import { describe, expect, it } from 'vitest';
import { sourceSha } from '../../site/lib/i18n/sha';
import { auditTable, auditUi, CatalogParseError, flatten, formatIssues } from './i18n-check';

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
