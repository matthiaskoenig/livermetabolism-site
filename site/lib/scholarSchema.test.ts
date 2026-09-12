import { describe, expect, it } from 'vitest';
import {
  emptyScholar,
  historyPointSchema,
  metricSchema,
  scholarProfileUrl,
  scholarSchema,
  SCHOLAR_URL,
  SCHOLAR_USER_ID,
  type Scholar,
} from './scholarSchema';

const snapshot: Scholar = {
  fetchedAt: '2026-09-12T05:00:00.000Z',
  profile: { userId: SCHOLAR_USER_ID, name: 'Matthias König', htmlUrl: scholarProfileUrl() },
  sinceYear: 2021,
  citations: { all: 3827, since: 2659 },
  hIndex: { all: 26, since: 23 },
  i10Index: { all: 36, since: 33 },
  citationsPerYear: [
    { year: 2011, count: 25 },
    { year: 2012, count: 46 },
  ],
  history: [{ date: '2026-09-12', citations: 3827, hIndex: 26, i10Index: 36 }],
};

describe('scholarSchema', () => {
  it('parses a complete snapshot', () => {
    expect(scholarSchema.parse(snapshot)).toEqual(snapshot);
  });

  it('rejects an unknown top-level key', () => {
    expect(() => scholarSchema.parse({ ...snapshot, coauthors: [] })).toThrow();
  });

  it('rejects an unknown key inside a nested object', () => {
    expect(() => metricSchema.parse({ all: 1, since: 1, last5: 1 })).toThrow();
    expect(() => historyPointSchema.parse({ ...snapshot.history[0], citationsSince: 10 })).toThrow();
    expect(() => scholarSchema.parse({ ...snapshot, profile: { ...snapshot.profile, affiliation: 'HU Berlin' } })).toThrow();
  });

  it('rejects a missing or mistyped field', () => {
    const { sinceYear: _sinceYear, ...withoutSinceYear } = snapshot;
    expect(() => scholarSchema.parse(withoutSinceYear)).toThrow();
    expect(() => scholarSchema.parse({ ...snapshot, citations: { all: '3827', since: 2659 } })).toThrow();
  });

  it('parses emptyScholar(), which is older than any real snapshot', () => {
    const empty = emptyScholar();
    expect(scholarSchema.parse(empty)).toEqual(empty);
    expect(empty.fetchedAt < snapshot.fetchedAt).toBe(true);
    expect(empty.fetchedAt).toBe('1970-01-01T00:00:00.000Z');
    expect(empty.citationsPerYear).toEqual([]);
    expect(empty.history).toEqual([]);
    expect(empty.profile).toEqual({ userId: SCHOLAR_USER_ID, name: '', htmlUrl: scholarProfileUrl(SCHOLAR_USER_ID) });
  });

  it('points at the github-data branch of this repository and at the profile page', () => {
    expect(SCHOLAR_URL).toBe('https://raw.githubusercontent.com/matthiaskoenig/livermetabolism-site/github-data/scholar.json');
    expect(scholarProfileUrl()).toBe('https://scholar.google.com/citations?user=xD9IjnYAAAAJ&hl=en');
  });
});
