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

import { createLiveSnapshot, isSnapshotFresher } from './liveSnapshot';

const reader = createLiveSnapshot<Snapshot>(snapshotSchema, SNAPSHOT_URL);

export const loadLiveSnapshot = reader.load;
/** Reset the page-local cache for tests. */
export const resetLiveSnapshot = reader.reset;
export const isFresherThan = isSnapshotFresher<Snapshot>;
