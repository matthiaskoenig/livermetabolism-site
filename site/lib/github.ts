/**
 * Build-time read of the GitHub snapshot: `astro build` fetches
 * `SNAPSHOT_URL` once per page that needs it and server-renders the stats
 * lines, the release feed and the initial chart rows from it, so the page is
 * complete without JavaScript. The browser then refreshes the same content
 * from a possibly newer snapshot (`site/lib/githubLive.ts`).
 *
 * Never throws: a network failure, a slow response (10 s timeout) or a file
 * that does not match `snapshotSchema` yields `emptySnapshot()` plus a
 * warning, so a GitHub outage cannot fail the build — the page then simply
 * renders without the GitHub parts until the runtime fetch fills them in.
 */
import { emptySnapshot, snapshotSchema, SNAPSHOT_URL, type Snapshot } from './githubSchema';

const TIMEOUT_MS = 10_000;

/** The snapshot, or `emptySnapshot()` if it cannot be read or does not validate. */
export async function loadSnapshot(fetchImpl: typeof fetch = globalThis.fetch, url: string = SNAPSHOT_URL): Promise<Snapshot> {
  try {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return snapshotSchema.parse(await res.json());
  } catch (e) {
    console.warn(`[github] no snapshot from ${url}: ${e instanceof Error ? e.message : String(e)} — building without live GitHub data`);
    return emptySnapshot();
  }
}
