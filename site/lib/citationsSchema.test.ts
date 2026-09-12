import { describe, expect, it } from 'vitest';
import { citationEntrySchema, citationsSchema, CITATIONS_URL, emptyCitations, type Citations } from './citationsSchema';

const snapshot: Citations = {
  fetchedAt: '2026-09-12T06:00:00.000Z',
  works: {
    '10.1038/msb.2010.62': {
      openalexId: 'W1969067437',
      citedByCount: 293,
      isOa: true,
      oaStatus: 'gold',
      countsByYear: [
        { year: 2012, count: 30 },
        { year: 2013, count: 34 },
      ],
    },
    '10.1515/jib-2026-0004': {
      openalexId: 'W7202343643',
      citedByCount: 0,
      isOa: true,
      oaStatus: 'gold',
      countsByYear: [],
    },
  },
};

describe('citationsSchema', () => {
  it('parses a complete snapshot unchanged', () => {
    expect(citationsSchema.parse(snapshot)).toEqual(snapshot);
  });

  it('rejects an unknown key, at the top level and inside an entry', () => {
    expect(() => citationsSchema.parse({ ...snapshot, meta: {} })).toThrow();
    expect(() => citationEntrySchema.parse({ ...snapshot.works['10.1038/msb.2010.62'], oaUrl: 'https://example.org' })).toThrow();
    expect(() => citationEntrySchema.parse({ ...snapshot.works['10.1038/msb.2010.62'], countsByYear: [{ year: 2012, count: 30, extra: 1 }] })).toThrow();
  });

  it('rejects a work id that is not an OpenAlex work id', () => {
    for (const openalexId of ['A5023888391', 'https://openalex.org/W1969067437', 'W', 'w1969067437', '1969067437', 'W12 34']) {
      expect(() => citationEntrySchema.parse({ ...snapshot.works['10.1515/jib-2026-0004'], openalexId })).toThrow();
    }
    expect(citationEntrySchema.parse({ ...snapshot.works['10.1515/jib-2026-0004'], openalexId: 'W1' }).openalexId).toBe('W1');
  });

  it('rejects a missing or mistyped field', () => {
    const { fetchedAt: _fetchedAt, ...withoutFetchedAt } = snapshot;
    expect(() => citationsSchema.parse(withoutFetchedAt)).toThrow();
    expect(() => citationsSchema.parse({ ...snapshot, works: [] })).toThrow();
    expect(() => citationEntrySchema.parse({ ...snapshot.works['10.1515/jib-2026-0004'], citedByCount: '3' })).toThrow();
    expect(() => citationEntrySchema.parse({ ...snapshot.works['10.1515/jib-2026-0004'], isOa: 'yes' })).toThrow();
  });

  it('parses emptyCitations(), which is older than any real snapshot', () => {
    const empty = emptyCitations();
    expect(citationsSchema.parse(empty)).toEqual(empty);
    expect(empty.fetchedAt).toBe('1970-01-01T00:00:00.000Z');
    expect(empty.fetchedAt < snapshot.fetchedAt).toBe(true);
    expect(empty.works).toEqual({});
  });

  it('points at the citations snapshot on the github-data branch', () => {
    expect(CITATIONS_URL).toBe('https://raw.githubusercontent.com/matthiaskoenig/livermetabolism-site/github-data/citations.json');
  });
});
