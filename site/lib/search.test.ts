import { describe, expect, it } from 'vitest';
import { rankRecords } from './search';

const recs = [
  { type: 'Publication', title: 'Liver glucose model', text: 'hepatic metabolism', url: '/a' },
  { type: 'Person', title: 'Jane Doe', text: 'works on liver models', url: '/b' },
  { type: 'Project', title: 'Kidney twin', text: 'nothing here', url: '/c' },
];

describe('rankRecords', () => {
  // scoreRecord isn't exported (only rankRecords uses it), so its title-prefix
  // (15) / title-contains (10) / text-only (1) / missing-token (-1) scoring is
  // exercised here through the ranking and filtering it drives.
  it('ranks title-prefix above title-contains above text-only', () => {
    const items = [
      { type: 'A', title: 'zzz', text: 'mentions liver in the body', url: '/text' },
      { type: 'B', title: 'MetaLiver toolkit', text: '', url: '/contains' },
      { type: 'C', title: 'Liver glucose model', text: '', url: '/prefix' },
    ];
    expect(rankRecords(items, 'liver').map((r) => r.url)).toEqual(['/prefix', '/contains', '/text']);
  });

  it('excludes a record once any query token fails to match it at all', () => {
    expect(rankRecords(recs, 'liver kidney')).toEqual([]);
  });

  it('returns matching records best first, capped', () => {
    expect(rankRecords(recs, 'liver').map((r) => r.url)).toEqual(['/a', '/b']);
    expect(rankRecords(recs, '  ')).toEqual([]);
    expect(rankRecords(recs, 'liver', 1)).toHaveLength(1);
  });
});
