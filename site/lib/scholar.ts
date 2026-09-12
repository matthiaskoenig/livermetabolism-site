/**
 * Build-time read of the Google Scholar snapshot: `astro build` fetches
 * `SCHOLAR_URL` once for the publications page and server-renders the summary
 * strip and the initial chart rows from it, so the page is complete without
 * JavaScript. The browser then refreshes the same content from a possibly
 * newer snapshot (`site/lib/scholarLive.ts`).
 *
 * Never throws: a network failure, a slow response (10 s timeout) or a file
 * that does not match `scholarSchema` yields `emptyScholar()` plus a warning,
 * so neither GitHub nor Google being unreachable can fail the build — the
 * strip then renders its labels with the values hidden until the runtime fetch
 * fills them in.
 */
import { emptyScholar, scholarSchema, SCHOLAR_URL, type Scholar } from './scholarSchema';

const TIMEOUT_MS = 10_000;

/** The snapshot, or `emptyScholar()` if it cannot be read or does not validate. */
export async function loadScholar(fetchImpl: typeof fetch = globalThis.fetch, url: string = SCHOLAR_URL): Promise<Scholar> {
  try {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return scholarSchema.parse(await res.json());
  } catch (e) {
    console.warn(`[scholar] no snapshot from ${url}: ${e instanceof Error ? e.message : String(e)} — building without live Scholar data`);
    return emptyScholar();
  }
}
