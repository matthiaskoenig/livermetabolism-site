import { describe, expect, it } from 'vitest';
import { sourceSha } from '../../site/lib/i18n/sha';
import { auditTable, formatIssues } from './i18n-check';

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
    expect(auditTable(rows, catalog, fields, 'people')).toEqual([]);
  });

  it('reports a missing entry', () => {
    const catalog = { a: { description: { sha: sourceSha('English A'), text: 'Deutsch A' } } };
    expect(auditTable(rows, catalog, fields, 'people')).toEqual([
      { kind: 'missing', table: 'people', id: 'b', field: 'description' },
    ]);
  });

  it('reports a stale entry when the English source changed', () => {
    const catalog = {
      a: { description: { sha: sourceSha('something older'), text: 'Deutsch A' } },
      b: { description: { sha: sourceSha('English B'), text: 'Deutsch B' } },
    };
    expect(auditTable(rows, catalog, fields, 'people')).toEqual([
      { kind: 'stale', table: 'people', id: 'a', field: 'description' },
    ]);
  });

  it('reports an orphaned entry whose row is gone', () => {
    const catalog = {
      a: { description: { sha: sourceSha('English A'), text: 'Deutsch A' } },
      b: { description: { sha: sourceSha('English B'), text: 'Deutsch B' } },
      gone: { description: { sha: 'deadbeefdeadbeef', text: 'Deutsch' } },
    };
    expect(auditTable(rows, catalog, fields, 'people')).toContainEqual({
      kind: 'orphaned', table: 'people', id: 'gone', field: 'description',
    });
  });

  it('reports a catalog field outside the registry', () => {
    const catalog = {
      a: { description: { sha: sourceSha('English A'), text: 'Deutsch A' }, name: { sha: 'x', text: 'Nein' } },
      b: { description: { sha: sourceSha('English B'), text: 'Deutsch B' } },
    };
    expect(auditTable(rows, catalog, fields, 'people')).toContainEqual({
      kind: 'unknown-field', table: 'people', id: 'a', field: 'name',
    });
  });

  it('skips a row whose English source is empty', () => {
    expect(auditTable([{ id: 'a', description: '' }], {}, fields, 'people')).toEqual([]);
  });
});

describe('formatIssues', () => {
  it('says so when there is nothing to report', () => {
    expect(formatIssues([])).toContain('up to date');
  });
  it('names the table, id and field of an issue', () => {
    const out = formatIssues([{ kind: 'stale', table: 'people', id: 'koenig', field: 'description' }]);
    expect(out).toContain('people');
    expect(out).toContain('koenig');
    expect(out).toContain('description');
  });
});
