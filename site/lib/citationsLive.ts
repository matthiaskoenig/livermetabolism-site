/**
 * Runtime read of the OpenAlex citation snapshot, so the publications page
 * shows counts newer than its own build without a redeploy.
 *
 * One memoized `fetch` per page load, parsed with `citationsSchema` like the
 * build-time read; any failure (offline, 404 before the snapshot exists,
 * malformed file) resolves to `null` and the page keeps what the build
 * rendered. The only host contacted is `raw.githubusercontent.com`; visitors'
 * browsers never talk to OpenAlex.
 */
import { citationsSchema, CITATIONS_URL, type Citations } from './citationsSchema';

let pending: Promise<Citations | null> | null = null;

/** The live snapshot, fetched at most once per page load; `null` on any failure. */
export function loadLiveCitations(fetchImpl: typeof fetch = globalThis.fetch, url: string = CITATIONS_URL): Promise<Citations | null> {
  pending ??= (async () => {
    try {
      // 'default' so the browser cache/304 handling applies: the snapshot
      // changes at most once a day and every reader asks for the same URL.
      const res = await fetchImpl(url, { cache: 'default' });
      if (!res.ok) return null;
      const parsed = citationsSchema.safeParse(await res.json());
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  })();
  return pending;
}

/** Drop the memoized fetch (tests only). */
export function resetLiveCitations(): void {
  pending = null;
}

/** True when `citations` was fetched after the one the page was built from. */
export function isCitationsFresherThan(citations: Citations | null, builtAt: string): citations is Citations {
  if (!citations) return false;
  const live = Date.parse(citations.fetchedAt);
  const built = Date.parse(builtAt);
  return Number.isFinite(live) && (!Number.isFinite(built) || live > built);
}
