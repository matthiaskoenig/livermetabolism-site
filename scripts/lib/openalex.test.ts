import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { citationsSchema } from '../../site/lib/citationsSchema.ts';
import {
  apiWorkSchema,
  buildCitations,
  chunk,
  doisFromPublications,
  fetchWorks,
  normalizeDoi,
  OpenAlexHttpError,
  OpenAlexNetworkError,
  toCitationEntry,
  type ApiWork,
} from './openalex.ts';

/**
 * The recorded response of the verified request for four DOIs of
 * data/publications.yml — two older, well-cited papers, one 2026 paper, and
 * `10.1515/jib-2026-0006`, which OpenAlex does not know: it is simply absent
 * from `results`, which is how a missing DOI reaches the transform.
 */
const fixture = JSON.parse(readFileSync('tests/fixtures/openalex/works.json', 'utf8')) as { results: unknown[] };
const works = fixture.results.map((w) => apiWorkSchema.parse(w));

const noSleep = async () => {};

type Reply = { status: number; body?: unknown; text?: string; headers?: Record<string, string>; throws?: unknown };

/** A fetch stub replying with the given responses in order (500 once exhausted). */
function stubFetch(replies: Reply[]) {
  const calls: string[] = [];
  const inits: RequestInit[] = [];
  const impl = (async (url: string | URL | Request, init: RequestInit) => {
    calls.push(String(url));
    inits.push(init);
    const r = replies.shift() ?? { status: 500 };
    if (r.throws) throw r.throws;
    const body = r.text ?? (r.body === undefined ? '' : JSON.stringify(r.body));
    return new Response(body || null, { status: r.status, headers: { 'content-type': 'application/json', ...(r.headers ?? {}) } });
  }) as typeof fetch;
  return { impl, calls, inits };
}

describe('normalizeDoi', () => {
  it('lowercases and strips the resolver prefixes and surrounding whitespace', () => {
    expect(normalizeDoi('10.1515/JIB-2026-0006')).toBe('10.1515/jib-2026-0006');
    expect(normalizeDoi('https://doi.org/10.1/x')).toBe('10.1/x');
    expect(normalizeDoi('http://dx.doi.org/10.1/X')).toBe('10.1/x');
    expect(normalizeDoi('doi:10.1/x')).toBe('10.1/x');
    expect(normalizeDoi('DOI: 10.1/x')).toBe('10.1/x');
    expect(normalizeDoi(' 10.1/x ')).toBe('10.1/x');
    expect(normalizeDoi('10.1038/msb.2010.62')).toBe('10.1038/msb.2010.62');
  });

  it('returns null for anything that is not a DOI', () => {
    expect(normalizeDoi('')).toBeNull();
    expect(normalizeDoi('   ')).toBeNull();
    expect(normalizeDoi('in preparation')).toBeNull();
    expect(normalizeDoi('https://doi.org/')).toBeNull();
    expect(normalizeDoi('10.1515')).toBeNull();
    expect(normalizeDoi('1234/x')).toBeNull();
  });
});

describe('doisFromPublications', () => {
  const yamlText = readFileSync('data/publications.yml', 'utf8');
  const dois = doisFromPublications(yamlText);

  /**
   * The real file has 110 entries, 87 of which carry a `doi:` value; one DOI
   * (`10.24407/kxp:1902121317`, a thesis published twice) appears on two
   * entries, so 86 DOIs are asked of OpenAlex.
   */
  it('collects every DOI of the real publications.yml, unique and in file order', () => {
    expect(dois).toHaveLength(86);
    expect(new Set(dois).size).toBe(86);
    expect(dois[0]).toBe('10.1515/jib-2026-0006');
    expect(dois.at(-1)).toBe('10.1038/msb.2010.62');
    expect(dois).toContain('10.1371/journal.pcbi.1002577');
    expect(dois.every((doi) => doi === doi.toLowerCase() && doi.startsWith('10.'))).toBe(true);
  });

  it('skips entries without a DOI and keeps the first occurrence of a repeated one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const text = [
      "- id: 'a'",
      '  doi:',
      "- id: 'b'",
      "  doi: '10.1/B'",
      "- id: 'c'",
      '  doi: https://doi.org/10.1/b',
      "- id: 'd'",
      "  doi: 'not a doi'",
      "- id: 'e'",
      "  doi: '10.2/e'",
      '',
    ].join('\n');
    expect(doisFromPublications(text)).toEqual(['10.1/b', '10.2/e']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not a DOI, skipped: not a doi'));
    warn.mockRestore();
  });
});

describe('chunk', () => {
  it('splits a list into batches of at most `size`, in order', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
    expect(chunk([], 50)).toEqual([]);
    expect(chunk(Array.from({ length: 110 }, (_, i) => i), 50).map((b) => b.length)).toEqual([50, 50, 10]);
  });
});

describe('fetchWorks', () => {
  const okBody = { meta: { count: 1 }, results: [fixture.results[0]] };

  it('asks for the batch as one filter, with the selected fields and a polite User-Agent', async () => {
    const f = stubFetch([{ status: 200, body: okBody }]);
    await fetchWorks(['10.1/a', '10.2/b'], f.impl, undefined, noSleep);

    expect(f.calls).toEqual([
      'https://api.openalex.org/works?filter=doi:10.1/a|10.2/b' +
        '&select=id,doi,cited_by_count,open_access,counts_by_year&per-page=200',
    ]);
    expect((f.inits[0].headers as Record<string, string>)['user-agent']).toBe('livermetabolism-site data workflow');
  });

  it('asks for a page four times the batch size, since a DOI can match two works', async () => {
    const f = stubFetch([{ status: 200, body: okBody }]);
    await fetchWorks(Array.from({ length: 50 }, (_, i) => `10.1/${i}`), f.impl, undefined, noSleep);
    expect(f.calls[0]).toContain('per-page=200');
  });

  it('warns when the page is truncated, so a dropped DOI cannot go unnoticed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const f = stubFetch([{ status: 200, body: { meta: { count: 3 }, results: [fixture.results[0]] } }]);
    await expect(fetchWorks(['10.1/a'], f.impl, undefined, noSleep)).resolves.toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('truncated'));
    warn.mockRestore();
  });

  it('adds mailto only when a contact address is configured', async () => {
    const f = stubFetch([{ status: 200, body: okBody }]);
    await fetchWorks(['10.1/a'], f.impl, 'data@example.org', noSleep);
    expect(f.calls[0]).toBe(
      'https://api.openalex.org/works?filter=doi:10.1/a' +
        '&select=id,doi,cited_by_count,open_access,counts_by_year&per-page=200&mailto=data%40example.org',
    );

    const empty = stubFetch([{ status: 200, body: okBody }]);
    await fetchWorks(['10.1/a'], empty.impl, '  ', noSleep);
    expect(empty.calls[0]).not.toContain('mailto');
  });

  it('parses the recorded response into the API shape', async () => {
    const f = stubFetch([{ status: 200, body: fixture }]);
    const parsed = await fetchWorks(['10.1/a'], f.impl, undefined, noSleep);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].cited_by_count).toBe(293);
  });

  it('rejects a response that does not match the expected API shape', async () => {
    const f = stubFetch([{ status: 200, body: { results: [{ id: 'x' }] } }]);
    await expect(fetchWorks(['10.1/a'], f.impl, undefined, noSleep)).rejects.toThrow();
  });

  it('retries a 429, honouring retry-after, and then succeeds', async () => {
    const f = stubFetch([{ status: 429, headers: { 'retry-after': '2' } }, { status: 200, body: okBody }]);
    const waits: number[] = [];
    const sleep = vi.fn(async (ms: number) => { waits.push(ms); });

    await expect(fetchWorks(['10.1/a'], f.impl, undefined, sleep)).resolves.toHaveLength(1);
    expect(f.calls).toHaveLength(2);
    expect(waits).toEqual([2000]);
  });

  it('gives up after three attempts on repeated server errors', async () => {
    const f = stubFetch([{ status: 500 }, { status: 502 }, { status: 503 }]);
    await expect(fetchWorks(['10.1/a'], f.impl, undefined, noSleep)).rejects.toBeInstanceOf(OpenAlexHttpError);
    expect(f.calls).toHaveLength(3);
  });

  it('retries a network failure and reports it after three attempts', async () => {
    const f = stubFetch([{ status: 0, throws: new TypeError('fetch failed') }, { status: 200, body: okBody }]);
    await expect(fetchWorks(['10.1/a'], f.impl, undefined, noSleep)).resolves.toHaveLength(1);

    const failing = stubFetch(Array.from({ length: 3 }, () => ({ status: 0, throws: new TypeError('x') })));
    await expect(fetchWorks(['10.1/a'], failing.impl, undefined, noSleep)).rejects.toBeInstanceOf(OpenAlexNetworkError);
  });

  it('does not retry a 400 (a malformed filter is not transient)', async () => {
    const f = stubFetch([{ status: 400, text: 'bad filter' }]);
    await expect(fetchWorks(['10.1/a'], f.impl, undefined, noSleep)).rejects.toBeInstanceOf(OpenAlexHttpError);
    expect(f.calls).toHaveLength(1);
  });

  it('returns nothing without a request for an empty batch', async () => {
    const f = stubFetch([]);
    await expect(fetchWorks([], f.impl, undefined, noSleep)).resolves.toEqual([]);
    expect(f.calls).toEqual([]);
  });
});

describe('toCitationEntry', () => {
  it('maps the recorded works, normalising the DOI and the work id', () => {
    expect(toCitationEntry(works[0])).toEqual([
      '10.1038/msb.2010.62',
      {
        openalexId: 'W1969067437',
        citedByCount: 293,
        isOa: true,
        oaStatus: 'gold',
        countsByYear: expect.arrayContaining([{ year: 2012, count: 30 }]),
      },
    ]);
    expect(toCitationEntry(works[1])?.[0]).toBe('10.1371/journal.pcbi.1002577');
    expect(toCitationEntry(works[1])?.[1].citedByCount).toBe(207);
    expect(toCitationEntry(works[2])).toEqual([
      '10.1038/s41540-026-00651-0',
      { openalexId: 'W7141579262', citedByCount: 3, isOa: true, oaStatus: 'gold', countsByYear: [{ year: 2025, count: 1 }, { year: 2026, count: 2 }] },
    ]);
  });

  it('orders counts_by_year ascending and renames cited_by_count to count', () => {
    const entry = toCitationEntry(works[0])![1];
    expect(entry.countsByYear.map((c) => c.year)).toEqual([...entry.countsByYear.map((c) => c.year)].sort((a, b) => a - b));
    expect(entry.countsByYear[0]).toEqual({ year: 2012, count: 30 });
    expect(entry.countsByYear.at(-1)).toEqual({ year: 2026, count: 1 });
    // OpenAlex reports the recent years only (15 here, 2012-2026), so the
    // histogram sums to less than the 293 lifetime citations of this 2010 paper.
    expect(entry.countsByYear).toHaveLength(15);
    expect(entry.countsByYear.reduce((sum, c) => sum + c.count, 0)).toBe(268);
  });

  it('drops a work without a usable DOI or work id', () => {
    expect(toCitationEntry({ ...works[0], doi: null })).toBeNull();
    expect(toCitationEntry({ ...works[0], doi: 'https://doi.org/' })).toBeNull();
    expect(toCitationEntry({ ...works[0], id: 'https://openalex.org/A5023888391' })).toBeNull();
  });
});

describe('buildCitations', () => {
  const now = new Date('2026-09-12T06:00:00.000Z');

  it('keys the recorded works by their normalised DOI', () => {
    const citations = buildCitations(works, now);
    expect(citations.fetchedAt).toBe('2026-09-12T06:00:00.000Z');
    expect(Object.keys(citations.works).sort()).toEqual([
      '10.1038/msb.2010.62',
      '10.1038/s41540-026-00651-0',
      '10.1371/journal.pcbi.1002577',
    ]);
    expect(citations.works['10.1038/msb.2010.62'].citedByCount).toBe(293);
    // A DOI OpenAlex does not know is simply absent (no badge on the page).
    expect(citations.works['10.1515/jib-2026-0006']).toBeUndefined();
    expect(citationsSchema.parse(citations)).toEqual(citations);
  });

  it('keeps the more-cited record when OpenAlex has two works for one DOI', () => {
    const low: ApiWork = { ...works[2], id: 'https://openalex.org/W7159800683', cited_by_count: 0, open_access: { ...works[2].open_access, oa_status: 'green' } };
    const high: ApiWork = { ...works[2], cited_by_count: 3 };
    expect(buildCitations([low, high], now).works['10.1038/s41540-026-00651-0']).toMatchObject({ openalexId: 'W7141579262', citedByCount: 3 });
    expect(buildCitations([high, low], now).works['10.1038/s41540-026-00651-0']).toMatchObject({ openalexId: 'W7141579262', citedByCount: 3 });
  });

  it('builds an empty but valid snapshot from no works', () => {
    const citations = buildCitations([], now);
    expect(citations.works).toEqual({});
    expect(citationsSchema.parse(citations)).toEqual(citations);
  });
});
