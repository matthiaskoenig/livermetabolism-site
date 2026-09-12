/**
 * Runtime read of the GitHub snapshot, so the research page shows data newer
 * than its own build without a redeploy.
 *
 * One memoized `fetch` per page load: the stats-line updater
 * (`SoftwareLive.astro`) and every chart island share the same promise. The
 * response is parsed with `snapshotSchema` like the build-time read, and any
 * failure (offline, 404 before the data branch exists, malformed file)
 * resolves to `null` — callers then keep the rows rendered at build time.
 */
import { snapshotSchema, SNAPSHOT_URL, type Snapshot } from './githubSchema';

let pending: Promise<Snapshot | null> | null = null;

/** The live snapshot, fetched at most once per page load; `null` on any failure. */
export function loadLiveSnapshot(fetchImpl: typeof fetch = globalThis.fetch, url: string = SNAPSHOT_URL): Promise<Snapshot | null> {
  pending ??= (async () => {
    try {
      // 'default' so the browser cache/304 handling applies: the snapshot
      // changes at most once a day and every island asks for the same URL.
      const res = await fetchImpl(url, { cache: 'default' });
      if (!res.ok) return null;
      const parsed = snapshotSchema.safeParse(await res.json());
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  })();
  return pending;
}

/** Drop the memoized fetch (tests only). */
export function resetLiveSnapshot(): void {
  pending = null;
}

/** True when `snapshot` was fetched after the one the page was built from. */
export function isFresherThan(snapshot: Snapshot | null, builtAt: string): snapshot is Snapshot {
  if (!snapshot) return false;
  const live = Date.parse(snapshot.fetchedAt);
  const built = Date.parse(builtAt);
  return Number.isFinite(live) && (!Number.isFinite(built) || live > built);
}
