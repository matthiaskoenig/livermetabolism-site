import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSnapshot } from './github';
import { isFresherThan, loadLiveSnapshot, resetLiveSnapshot } from './githubLive';
import { emptySnapshot, type Snapshot } from './githubSchema';

const snapshot: Snapshot = {
  fetchedAt: '2026-09-12T05:00:00.000Z',
  repos: {},
  releases: {},
};

/** A `fetch` stand-in that answers with `body` (or the given status). */
const stub = (body: unknown, ok = true, status = 200) =>
  vi.fn(async () => ({ ok, status, json: async () => body }) as unknown as Response) as unknown as typeof fetch;

const failing = () => vi.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch;

beforeEach(() => resetLiveSnapshot());
afterEach(() => vi.restoreAllMocks());

describe('loadSnapshot (build time)', () => {
  it('returns the parsed snapshot', async () => {
    expect(await loadSnapshot(stub(snapshot), 'https://example.test/github.json')).toEqual(snapshot);
  });

  it('falls back to the empty snapshot and warns on a failed request', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await loadSnapshot(failing(), 'https://example.test/github.json')).toEqual(emptySnapshot());
    expect(await loadSnapshot(stub(snapshot, false, 404), 'https://example.test/github.json')).toEqual(emptySnapshot());
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[1][0]).toContain('HTTP 404');
  });

  it('falls back to the empty snapshot when the file does not match the schema', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await loadSnapshot(stub({ fetchedAt: 1 }), 'https://example.test/github.json')).toEqual(emptySnapshot());
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('loadLiveSnapshot (browser)', () => {
  it('fetches once per page load and shares the result', async () => {
    const fetchImpl = stub(snapshot);
    const [a, b] = await Promise.all([loadLiveSnapshot(fetchImpl, 'u'), loadLiveSnapshot(fetchImpl, 'u')]);
    expect(a).toEqual(snapshot);
    expect(b).toBe(a);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('returns null on a failure instead of throwing', async () => {
    expect(await loadLiveSnapshot(failing(), 'u')).toBeNull();
    resetLiveSnapshot();
    expect(await loadLiveSnapshot(stub(snapshot, false, 404), 'u')).toBeNull();
    resetLiveSnapshot();
    expect(await loadLiveSnapshot(stub({ nope: true }), 'u')).toBeNull();
  });
});

describe('isFresherThan', () => {
  it('only accepts a snapshot fetched after the build', () => {
    expect(isFresherThan(snapshot, '2026-09-11T05:00:00.000Z')).toBe(true);
    expect(isFresherThan(snapshot, '2026-09-12T05:00:00.000Z')).toBe(false);
    expect(isFresherThan(snapshot, '2026-09-13T05:00:00.000Z')).toBe(false);
    expect(isFresherThan(null, '2026-09-11T05:00:00.000Z')).toBe(false);
    // an unreadable build timestamp must not block a refresh
    expect(isFresherThan(snapshot, 'nonsense')).toBe(true);
  });
});
