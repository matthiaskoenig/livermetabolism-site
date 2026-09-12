import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { emptyScholar, type HistoryPoint, type Scholar } from '../../site/lib/scholarSchema.ts';
import { buildScholarSnapshot, fetchProfileHtml, mergeHistory, parseProfile, profileUrl } from './scholar.ts';

const html = readFileSync('tests/fixtures/scholar/profile.html', 'utf8');

/** A response like the one `fetch` returns, with only what fetchProfileHtml reads. */
function response(opts: { status?: number; url?: string; body?: string }): Response {
  return {
    status: opts.status ?? 200,
    url: opts.url ?? profileUrl('xD9IjnYAAAAJ'),
    text: async () => opts.body ?? html,
  } as unknown as Response;
}

describe('profileUrl', () => {
  it('is the public English profile page of the user', () => {
    expect(profileUrl('xD9IjnYAAAAJ')).toBe('https://scholar.google.com/citations?user=xD9IjnYAAAAJ&hl=en');
  });
});

describe('parseProfile', () => {
  const parsed = parseProfile(html);

  it('reads the profile name', () => {
    expect(parsed.name).toBe('Matthias König');
  });

  it('reads the metrics of both columns and the "Since" year', () => {
    expect(parsed.sinceYear).toBe(2021);
    expect(parsed.citations).toEqual({ all: 3827, since: 2659 });
    expect(parsed.hIndex).toEqual({ all: 26, since: 23 });
    expect(parsed.i10Index).toEqual({ all: 36, since: 33 });
  });

  it('reads the citations-per-year histogram in ascending years', () => {
    expect(parsed.citationsPerYear).toHaveLength(16);
    expect(parsed.citationsPerYear[0]).toEqual({ year: 2011, count: 25 });
    expect(parsed.citationsPerYear.at(-1)).toEqual({ year: 2026, count: 382 });
    expect(parsed.citationsPerYear.map((p) => p.count)).toEqual([25, 46, 93, 78, 88, 102, 104, 145, 184, 249, 449, 393, 492, 482, 454, 382]);
    expect(parsed.citationsPerYear.map((p) => p.year)).toEqual([2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]);
  });

  it('pairs bars by their position when one year has no bar and the order differs', () => {
    const bars = [...html.matchAll(/<a [^>]*class="gsc_g_a"[\s\S]*?<\/a>/g)].map((m) => m[0]);
    // Drop 2013's bar (Scholar omits the element for a year without citations)
    // and reverse the rest, so pairing by index would be wrong twice over.
    const shuffled = bars.filter((bar) => !bar.includes('>93<')).reverse();
    const mangled = html.replace(bars.join(''), shuffled.join(''));

    const perYear = parseProfile(mangled).citationsPerYear;
    expect(perYear).toHaveLength(16);
    expect(perYear.find((p) => p.year === 2013)).toEqual({ year: 2013, count: 0 });
    expect(perYear.find((p) => p.year === 2011)).toEqual({ year: 2011, count: 25 });
    expect(perYear.find((p) => p.year === 2021)).toEqual({ year: 2021, count: 449 });
    expect(perYear.at(-1)).toEqual({ year: 2026, count: 382 });
  });

  it('throws when the stats table is gone', () => {
    expect(() => parseProfile(html.replace('id="gsc_rsb_st"', 'id="gsc_rsb_xx"'))).toThrow(/no stats table/);
  });

  it('throws when a metric row is gone', () => {
    expect(() => parseProfile(html.replace('>i10-index<', '>i20-index<'))).toThrow(/i10-index/);
  });

  it('throws when the histogram is gone', () => {
    expect(() => parseProfile(html.replace(/class="gsc_g_t"/g, 'class="gsc_g_z"'))).toThrow(/histogram/);
  });
});

describe('fetchProfileHtml', () => {
  it('requests the profile page with a browser-like User-Agent', async () => {
    const calls: Array<[string, RequestInit | undefined]> = [];
    const body = await fetchProfileHtml('xD9IjnYAAAAJ', (async (url: string, init?: RequestInit) => {
      calls.push([url, init]);
      return response({});
    }) as unknown as typeof fetch);

    expect(body).toBe(html);
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe('https://scholar.google.com/citations?user=xD9IjnYAAAAJ&hl=en');
    const headers = calls[0][1]?.headers as Record<string, string>;
    expect(headers['user-agent']).toMatch(/Mozilla\/5\.0/);
    expect(headers['accept-language']).toBe('en');
  });

  it('throws "blocked" on a non-200 status', async () => {
    const fetchImpl = (async () => response({ status: 429, body: 'too many requests' })) as unknown as typeof fetch;
    await expect(fetchProfileHtml('u', fetchImpl)).rejects.toThrow(/^blocked.*429/);
  });

  it('throws "blocked" when Google redirects to /sorry/', async () => {
    const fetchImpl = (async () => response({ url: 'https://scholar.google.com/sorry/index?continue=...' })) as unknown as typeof fetch;
    await expect(fetchProfileHtml('u', fetchImpl)).rejects.toThrow(/^blocked/);
  });

  it('throws "blocked" on the CAPTCHA page', async () => {
    const fetchImpl = (async () => response({ body: '<html><body><form id="gs_captcha_f"></form></body></html>' })) as unknown as typeof fetch;
    await expect(fetchProfileHtml('u', fetchImpl)).rejects.toThrow(/^blocked/);
  });

  it('throws when the page has no stats table', async () => {
    const fetchImpl = (async () => response({ body: '<html><body>Not the profile</body></html>' })) as unknown as typeof fetch;
    await expect(fetchProfileHtml('u', fetchImpl)).rejects.toThrow(/no stats table/);
  });
});

describe('mergeHistory', () => {
  const point = (date: string, citations: number): HistoryPoint => ({ date, citations, hIndex: 26, i10Index: 36 });

  it('starts a history from nothing', () => {
    expect(mergeHistory([], point('2026-09-12', 3827))).toEqual([point('2026-09-12', 3827)]);
  });

  it('appends a new day and keeps the older points', () => {
    const previous = [point('2026-09-10', 3800), point('2026-09-11', 3820)];
    expect(mergeHistory(previous, point('2026-09-12', 3827))).toEqual([...previous, point('2026-09-12', 3827)]);
  });

  it('replaces the point of the same day instead of adding a second one', () => {
    const previous = [point('2026-09-11', 3820), point('2026-09-12', 3825)];
    const merged = mergeHistory(previous, point('2026-09-12', 3827));
    expect(merged).toHaveLength(2);
    expect(merged.at(-1)).toEqual(point('2026-09-12', 3827));
  });

  it('returns the points in ascending date order and does not mutate the input', () => {
    const previous = [point('2026-09-12', 3827), point('2026-09-10', 3800)];
    const merged = mergeHistory(previous, point('2026-09-11', 3820));
    expect(merged.map((p) => p.date)).toEqual(['2026-09-10', '2026-09-11', '2026-09-12']);
    expect(previous).toHaveLength(2);
  });
});

describe('buildScholarSnapshot', () => {
  const parsed = parseProfile(html);
  const now = new Date('2026-09-12T05:00:00.000Z');

  it('builds a snapshot with a one-point history when there is no previous one', () => {
    const snapshot = buildScholarSnapshot(parsed, null, now, 'xD9IjnYAAAAJ');
    expect(snapshot.fetchedAt).toBe('2026-09-12T05:00:00.000Z');
    expect(snapshot.profile).toEqual({
      userId: 'xD9IjnYAAAAJ',
      name: 'Matthias König',
      htmlUrl: 'https://scholar.google.com/citations?user=xD9IjnYAAAAJ&hl=en',
    });
    expect(snapshot.sinceYear).toBe(2021);
    expect(snapshot.citations).toEqual({ all: 3827, since: 2659 });
    expect(snapshot.citationsPerYear).toHaveLength(16);
    expect(snapshot.history).toEqual([{ date: '2026-09-12', citations: 3827, hIndex: 26, i10Index: 36 }]);
  });

  it('carries the history of a previous snapshot forward', () => {
    const previous: Scholar = {
      ...emptyScholar(),
      fetchedAt: '2026-09-11T05:00:00.000Z',
      history: [
        { date: '2026-09-10', citations: 3800, hIndex: 26, i10Index: 36 },
        { date: '2026-09-11', citations: 3820, hIndex: 26, i10Index: 36 },
      ],
    };
    const snapshot = buildScholarSnapshot(parsed, previous, now, 'xD9IjnYAAAAJ');
    expect(snapshot.history.map((p) => p.date)).toEqual(['2026-09-10', '2026-09-11', '2026-09-12']);
    expect(snapshot.history.at(-1)?.citations).toBe(3827);
  });

  it('replaces today’s point when it runs twice on the same day', () => {
    const first = buildScholarSnapshot(parsed, null, now, 'xD9IjnYAAAAJ');
    const second = buildScholarSnapshot(parsed, first, new Date('2026-09-12T17:00:00.000Z'), 'xD9IjnYAAAAJ');
    expect(second.history).toHaveLength(1);
    expect(second.fetchedAt).toBe('2026-09-12T17:00:00.000Z');
  });
});
