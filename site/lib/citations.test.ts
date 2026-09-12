import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { citationFor, loadCitations } from './citations';
import { isCitationsFresherThan, loadLiveCitations, resetLiveCitations } from './citationsLive';
import { emptyCitations, type Citations } from './citationsSchema';

const citations: Citations = {
  fetchedAt: '2026-09-12T14:08:46.378Z',
  works: {
    '10.3389/fphar.2021.752826': { openalexId: 'W4226455100', citedByCount: 101, isOa: true, oaStatus: 'gold', countsByYear: [{ year: 2022, count: 7 }] },
  },
};

/** A `fetch` stand-in that answers with `body` (or the given status). */
const stub = (body: unknown, ok = true, status = 200) =>
  vi.fn(async () => ({ ok, status, json: async () => body }) as unknown as Response) as unknown as typeof fetch;

const failing = () => vi.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch;

beforeEach(() => resetLiveCitations());
afterEach(() => vi.restoreAllMocks());

describe('loadCitations (build time)', () => {
  it('returns the parsed snapshot', async () => {
    expect(await loadCitations(stub(citations), 'https://example.test/citations.json')).toEqual(citations);
  });

  it('falls back to the empty snapshot and warns on a failed request', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await loadCitations(failing(), 'https://example.test/citations.json')).toEqual(emptyCitations());
    expect(await loadCitations(stub(citations, false, 404), 'https://example.test/citations.json')).toEqual(emptyCitations());
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[1][0]).toContain('HTTP 404');
  });

  it('falls back to the empty snapshot when the file does not match the schema', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // an extra key means writer and reader have drifted apart (.strict())
    expect(await loadCitations(stub({ ...citations, extra: 1 }), 'u')).toEqual(emptyCitations());
    // an openalexId that is not a work id would end up in a link
    expect(await loadCitations(stub({ fetchedAt: 'x', works: { '10.1/x': { openalexId: 'javascript:alert(1)', citedByCount: 1, isOa: false, oaStatus: 'closed', countsByYear: [] } } }), 'u')).toEqual(emptyCitations());
    expect(warn).toHaveBeenCalledTimes(2);
  });
});

describe('citationFor', () => {
  it('looks an entry up by the normalised DOI', () => {
    expect(citationFor(citations, '10.3389/fphar.2021.752826')?.citedByCount).toBe(101);
    expect(citationFor(citations, 'https://doi.org/10.3389/FPHAR.2021.752826')?.citedByCount).toBe(101);
    expect(citationFor(citations, ' doi:10.3389/fphar.2021.752826 ')?.citedByCount).toBe(101);
  });

  it('returns null for no DOI, an unparseable DOI and a DOI OpenAlex does not know', () => {
    expect(citationFor(citations, null)).toBeNull();
    expect(citationFor(citations, undefined)).toBeNull();
    expect(citationFor(citations, 'in press')).toBeNull();
    expect(citationFor(citations, '10.1234/unknown')).toBeNull();
    expect(citationFor(emptyCitations(), '10.3389/fphar.2021.752826')).toBeNull();
  });
});

describe('loadLiveCitations (browser)', () => {
  it('fetches once per page load and shares the result', async () => {
    const fetchImpl = stub(citations);
    const [a, b] = await Promise.all([loadLiveCitations(fetchImpl, 'u'), loadLiveCitations(fetchImpl, 'u')]);
    expect(a).toEqual(citations);
    expect(b).toBe(a);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('returns null on a failure instead of throwing', async () => {
    expect(await loadLiveCitations(failing(), 'u')).toBeNull();
    resetLiveCitations();
    expect(await loadLiveCitations(stub(citations, false, 404), 'u')).toBeNull();
    resetLiveCitations();
    expect(await loadLiveCitations(stub({ nope: true }), 'u')).toBeNull();
  });
});

describe('isCitationsFresherThan', () => {
  it('only accepts a snapshot fetched after the build', () => {
    expect(isCitationsFresherThan(citations, '2026-09-11T05:00:00.000Z')).toBe(true);
    expect(isCitationsFresherThan(citations, citations.fetchedAt)).toBe(false);
    expect(isCitationsFresherThan(citations, '2026-09-13T05:00:00.000Z')).toBe(false);
    expect(isCitationsFresherThan(null, '2026-09-11T05:00:00.000Z')).toBe(false);
    // an unreadable build timestamp must not block a refresh
    expect(isCitationsFresherThan(citations, 'nonsense')).toBe(true);
  });
});
