/**
 * Runtime read of the Google Scholar snapshot, so the publications page shows
 * metrics newer than its own build without a redeploy.
 *
 * One memoized `fetch` per page load: the strip updater (`ScholarStats.astro`)
 * and both chart islands share the same promise. The response is parsed with
 * `scholarSchema` like the build-time read, and any failure (offline, 404
 * before the snapshot exists, malformed file) resolves to `null` — callers
 * then keep what the build rendered. The only host contacted is
 * `raw.githubusercontent.com`; visitors' browsers never talk to Google.
 */
import { scholarSchema, SCHOLAR_URL, type Scholar } from './scholarSchema';

let pending: Promise<Scholar | null> | null = null;

/** The live snapshot, fetched at most once per page load; `null` on any failure. */
export function loadLiveScholar(fetchImpl: typeof fetch = globalThis.fetch, url: string = SCHOLAR_URL): Promise<Scholar | null> {
  pending ??= (async () => {
    try {
      // 'default' so the browser cache/304 handling applies: the snapshot
      // changes at most once a day and every reader asks for the same URL.
      const res = await fetchImpl(url, { cache: 'default' });
      if (!res.ok) return null;
      const parsed = scholarSchema.safeParse(await res.json());
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  })();
  return pending;
}

/** Drop the memoized fetch (tests only). */
export function resetLiveScholar(): void {
  pending = null;
}

/** True when `scholar` was fetched after the one the page was built from. */
export function isScholarFresherThan(scholar: Scholar | null, builtAt: string): scholar is Scholar {
  if (!scholar) return false;
  const live = Date.parse(scholar.fetchedAt);
  const built = Date.parse(builtAt);
  return Number.isFinite(live) && (!Number.isFinite(built) || live > built);
}
