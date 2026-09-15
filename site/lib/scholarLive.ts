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

import { createLiveSnapshot, isSnapshotFresher } from './liveSnapshot';

const reader = createLiveSnapshot<Scholar>(scholarSchema, SCHOLAR_URL);

export const loadLiveScholar = reader.load;
/** Reset the page-local cache for tests. */
export const resetLiveScholar = reader.reset;
export const isScholarFresherThan = isSnapshotFresher<Scholar>;
