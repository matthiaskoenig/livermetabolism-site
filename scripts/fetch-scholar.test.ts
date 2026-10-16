import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildScholarSnapshot, parseProfile, profileUrl } from './lib/scholar.ts';
import { fetchProfileHtmlWithRetry, runFetch } from './fetch-scholar.ts';

/** A response like the one `fetch` returns, with only what `fetchProfileHtml` reads. */
function response(opts: { status?: number; body?: string }): Response {
  return {
    status: opts.status ?? 200,
    url: profileUrl('xD9IjnYAAAAJ'),
    text: async () => opts.body ?? '<div id="gsc_prf_in">x</div><table id="gsc_rsb_st"></table>',
  } as unknown as Response;
}

describe('fetchProfileHtmlWithRetry', () => {
  it('retries a transient "blocked" failure and succeeds, waiting between attempts', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response({ status: 403 }))
      .mockResolvedValueOnce(response({ status: 403 }))
      .mockResolvedValueOnce(response({ status: 200 }));
    const waits: number[] = [];
    const sleep = vi.fn(async (ms: number) => { waits.push(ms); });

    const html = await fetchProfileHtmlWithRetry('u', fetchImpl, sleep);

    expect(html).toContain('id="gsc_rsb_st"');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(waits).toEqual([30_000, 60_000]);
  });

  it('throws "blocked" after three attempts, none skipped', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ status: 403 }));
    const sleep = vi.fn(async () => {});

    await expect(fetchProfileHtmlWithRetry('u', fetchImpl, sleep)).rejects.toThrow(/^blocked/);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('never retries a non-"blocked" failure, such as a changed page layout', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ status: 200, body: '<html>no stats here</html>' }));
    const sleep = vi.fn(async () => {});

    await expect(fetchProfileHtmlWithRetry('u', fetchImpl, sleep)).rejects.toThrow(/^no stats table/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});

describe('runFetch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  const html = readFileSync('tests/fixtures/scholar/profile.html', 'utf8');
  const fetchImpl = vi.fn().mockResolvedValue(response({ body: html }));
  const now = new Date('2026-09-12T05:00:00.000Z');
  const log = () => vi.spyOn(console, 'log').mockImplementation(() => {});

  it('writes nothing when the citations fell sharply since the previous snapshot', async () => {
    log();
    const path = join(mkdtempSync(join(tmpdir(), 'scholar-')), 'scholar.json');
    const previous = buildScholarSnapshot(parseProfile(html), null, new Date('2026-09-11T05:00:00.000Z'), 'u');
    const text = `${JSON.stringify({ ...previous, citations: { ...previous.citations, all: 5000 } })}\n`;
    writeFileSync(path, text);

    await expect(runFetch({ userId: 'u', outPath: path, now, fetchImpl })).rejects.toThrow(/^implausible: citations fell from 5000 to 3827/);
    expect(readFileSync(path, 'utf8')).toBe(text);
  });

  it('writes the first snapshot, which has nothing to compare with', async () => {
    log();
    const path = join(mkdtempSync(join(tmpdir(), 'scholar-')), 'scholar.json');
    const snapshot = await runFetch({ userId: 'u', outPath: path, now, fetchImpl });
    expect(snapshot.citations.all).toBe(3827);
    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(snapshot);
  });
});
