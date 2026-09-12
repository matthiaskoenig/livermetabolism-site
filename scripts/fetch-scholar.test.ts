import { describe, expect, it, vi } from 'vitest';
import { profileUrl } from './lib/scholar.ts';
import { fetchProfileHtmlWithRetry } from './fetch-scholar.ts';

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
