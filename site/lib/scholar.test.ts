import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadScholar } from './scholar';
import { isScholarFresherThan, loadLiveScholar, resetLiveScholar } from './scholarLive';
import { emptyScholar, type Scholar } from './scholarSchema';

const scholar: Scholar = {
  ...emptyScholar(),
  fetchedAt: '2026-09-12T12:08:55.725Z',
  profile: { userId: 'xD9IjnYAAAAJ', name: 'Matthias König', htmlUrl: 'https://scholar.google.com/citations?user=xD9IjnYAAAAJ&hl=en' },
  sinceYear: 2021,
  citations: { all: 3827, since: 2659 },
};

/** A `fetch` stand-in that answers with `body` (or the given status). */
const stub = (body: unknown, ok = true, status = 200) =>
  vi.fn(async () => ({ ok, status, json: async () => body }) as unknown as Response) as unknown as typeof fetch;

const failing = () => vi.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch;

beforeEach(() => resetLiveScholar());
afterEach(() => vi.restoreAllMocks());

describe('loadScholar (build time)', () => {
  it('returns the parsed snapshot', async () => {
    expect(await loadScholar(stub(scholar), 'https://example.test/scholar.json')).toEqual(scholar);
  });

  it('falls back to the empty snapshot and warns on a failed request', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await loadScholar(failing(), 'https://example.test/scholar.json')).toEqual(emptyScholar());
    expect(await loadScholar(stub(scholar, false, 404), 'https://example.test/scholar.json')).toEqual(emptyScholar());
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[1][0]).toContain('HTTP 404');
  });

  it('falls back to the empty snapshot when the file does not match the schema', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // an extra key means writer and reader have drifted apart (.strict())
    expect(await loadScholar(stub({ ...scholar, extra: 1 }), 'https://example.test/scholar.json')).toEqual(emptyScholar());
    expect(await loadScholar(stub({ fetchedAt: 1 }), 'https://example.test/scholar.json')).toEqual(emptyScholar());
    expect(warn).toHaveBeenCalledTimes(2);
  });
});

describe('loadLiveScholar (browser)', () => {
  it('fetches once per page load and shares the result', async () => {
    const fetchImpl = stub(scholar);
    const [a, b] = await Promise.all([loadLiveScholar(fetchImpl, 'u'), loadLiveScholar(fetchImpl, 'u')]);
    expect(a).toEqual(scholar);
    expect(b).toBe(a);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('returns null on a failure instead of throwing', async () => {
    expect(await loadLiveScholar(failing(), 'u')).toBeNull();
    resetLiveScholar();
    expect(await loadLiveScholar(stub(scholar, false, 404), 'u')).toBeNull();
    resetLiveScholar();
    expect(await loadLiveScholar(stub({ nope: true }), 'u')).toBeNull();
  });
});

describe('isScholarFresherThan', () => {
  it('only accepts a snapshot fetched after the build', () => {
    expect(isScholarFresherThan(scholar, '2026-09-11T05:00:00.000Z')).toBe(true);
    expect(isScholarFresherThan(scholar, scholar.fetchedAt)).toBe(false);
    expect(isScholarFresherThan(scholar, '2026-09-13T05:00:00.000Z')).toBe(false);
    expect(isScholarFresherThan(null, '2026-09-11T05:00:00.000Z')).toBe(false);
    // an unreadable build timestamp must not block a refresh
    expect(isScholarFresherThan(scholar, 'nonsense')).toBe(true);
  });
});
