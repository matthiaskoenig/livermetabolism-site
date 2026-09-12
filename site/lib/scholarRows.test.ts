import { describe, expect, it } from 'vitest';
import { emptyScholar, type Scholar } from './scholarSchema';
import { historyNote, historyRows, perYearRows, profileHref, stripValues } from './scholarRows';

/** The snapshot as recorded on 2026-09-12, trimmed to three histogram years. */
const scholar: Scholar = {
  fetchedAt: '2026-09-12T12:08:55.725Z',
  profile: { userId: 'xD9IjnYAAAAJ', name: 'Matthias König', htmlUrl: 'https://scholar.google.com/citations?user=xD9IjnYAAAAJ&hl=en' },
  sinceYear: 2021,
  citations: { all: 3827, since: 2659 },
  hIndex: { all: 26, since: 23 },
  i10Index: { all: 36, since: 33 },
  citationsPerYear: [
    { year: 2013, count: 93 },
    { year: 2011, count: 25 },
    { year: 2012, count: 46 },
  ],
  history: [{ date: '2026-09-12', citations: 3827, hIndex: 26, i10Index: 36 }],
};

const point = (date: string, citations: number) => ({ date, citations, hIndex: 26, i10Index: 36 });

describe('perYearRows', () => {
  it('returns the histogram ascending by year', () => {
    expect(perYearRows(scholar)).toEqual([
      { year: 2011, count: 25 },
      { year: 2012, count: 46 },
      { year: 2013, count: 93 },
    ]);
  });

  it('is empty for a snapshot without data', () => {
    expect(perYearRows(emptyScholar())).toEqual([]);
  });
});

describe('historyRows', () => {
  it('prepends year-end totals from the histogram, with the undated remainder as baseline', () => {
    // 3827 total - (25 + 46 + 93) dated = 3663 undated citations
    expect(historyRows(scholar)).toEqual([
      { date: '2011-12-31', citations: 3663 + 25, source: 'year' },
      { date: '2012-12-31', citations: 3663 + 71, source: 'year' },
      { date: '2013-12-31', citations: 3663 + 164, source: 'year' },
      { date: '2026-09-12', citations: 3827, source: 'day' },
    ]);
  });

  it('drops year ends on or after the first daily reading', () => {
    const early: Scholar = { ...scholar, history: [point('2012-06-01', 100)] };
    expect(historyRows(early).map((r) => [r.date, r.source])).toEqual([['2011-12-31', 'year'], ['2012-06-01', 'day']]);
  });

  it('sorts the daily readings ascending and keeps the last reading of a repeated date', () => {
    const many: Scholar = { ...scholar, citationsPerYear: [], history: [point('2026-09-12', 3827), point('2026-09-10', 3800), point('2026-09-12', 3830)] };
    expect(historyRows(many).map((r) => [r.date, r.citations])).toEqual([['2026-09-10', 3800], ['2026-09-12', 3830]]);
  });

  it('never lets the baseline go negative', () => {
    const odd: Scholar = { ...scholar, citations: { all: 100, since: 50 }, history: [point('2026-09-12', 100)] };
    expect(historyRows(odd)[0]).toEqual({ date: '2011-12-31', citations: 25, source: 'year' });
  });

  it('uses fetchedAt as the cut-off when there is no daily reading', () => {
    const noDays: Scholar = { ...scholar, history: [], citationsPerYear: [...scholar.citationsPerYear, { year: 2026, count: 10 }] };
    expect(historyRows(noDays).map((r) => r.date)).toEqual(['2011-12-31', '2012-12-31', '2013-12-31']);
  });

  it('is empty for a snapshot without data', () => {
    expect(historyRows(emptyScholar())).toEqual([]);
  });
});

describe('stripValues', () => {
  it('flattens the metrics of a real snapshot', () => {
    expect(stripValues(scholar)).toEqual({
      known: true,
      citations: 3827,
      citationsSince: 2659,
      hIndex: 26,
      hIndexSince: 23,
      i10Index: 36,
      i10IndexSince: 33,
      sinceYear: 2021,
      name: 'Matthias König',
      href: 'https://scholar.google.com/citations?user=xD9IjnYAAAAJ&hl=en',
      fetchedAt: '2026-09-12T12:08:55.725Z',
    });
  });

  it('reports the epoch snapshot as unknown, with zeros and the derived profile URL', () => {
    const empty = stripValues(emptyScholar());
    expect(empty.known).toBe(false);
    expect(empty.citations).toBe(0);
    expect(empty.name).toBe('');
    expect(empty.href).toBe('https://scholar.google.com/citations?user=xD9IjnYAAAAJ&hl=en');
  });
});

describe('profileHref', () => {
  it('keeps a Scholar profile URL', () => {
    expect(profileHref(scholar)).toBe(scholar.profile.htmlUrl);
  });

  it('falls back to the URL derived from the user id for anything else', () => {
    for (const htmlUrl of ['javascript:alert(1)', 'http://scholar.google.com/x', 'https://evil.test/']) {
      const tampered: Scholar = { ...scholar, profile: { ...scholar.profile, htmlUrl } };
      expect(profileHref(tampered)).toBe('https://scholar.google.com/citations?user=xD9IjnYAAAAJ&hl=en');
    }
  });
});

describe('historyNote', () => {
  it('names both sources when year totals and daily readings are present', () => {
    expect(historyNote(historyRows(scholar))).toBe('yearly totals from the citation histogram up to 2013, daily readings from 12 Sep 2026');
  });

  it('names only the histogram without daily readings', () => {
    expect(historyNote([{ date: '2011-12-31', citations: 25, source: 'year' }])).toBe('yearly totals from the citation histogram up to 2011');
  });

  it('explains a one-point history', () => {
    expect(historyNote(historyRows({ ...scholar, citationsPerYear: [] }))).toBe('history starts 12 Sep 2026');
  });

  it('says nothing once the series has two points or none', () => {
    expect(historyNote([{ ...point('2026-09-11', 3800), source: 'day' }, { ...point('2026-09-12', 3827), source: 'day' }])).toBe('');
    expect(historyNote([])).toBe('');
  });
});
