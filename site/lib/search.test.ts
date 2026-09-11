import { describe, expect, it } from 'vitest';
import { rankRecords, scoreRecord } from './search';

const recs = [
  { type: 'Publication', title: 'Liver glucose model', text: 'hepatic metabolism', url: '/a' },
  { type: 'Person', title: 'Jane Doe', text: 'works on liver models', url: '/b' },
  { type: 'Project', title: 'Kidney twin', text: 'nothing here', url: '/c' },
];

describe('scoreRecord', () => {
  it('scores title-prefix 15, title 10, text 1, and -1 when a token is missing', () => {
    expect(scoreRecord(recs[0], ['liver'])).toBe(15);
    expect(scoreRecord(recs[0], ['glucose'])).toBe(10);
    expect(scoreRecord(recs[1], ['liver'])).toBe(1);
    expect(scoreRecord(recs[0], ['liver', 'kidney'])).toBe(-1);
  });
});

describe('rankRecords', () => {
  it('returns matching records best first, capped', () => {
    expect(rankRecords(recs, 'liver').map((r) => r.url)).toEqual(['/a', '/b']);
    expect(rankRecords(recs, '  ')).toEqual([]);
    expect(rankRecords(recs, 'liver', 1)).toHaveLength(1);
  });
});
