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

import { createLiveSnapshot, isSnapshotFresher } from './liveSnapshot';

const reader = createLiveSnapshot<Citations>(citationsSchema, CITATIONS_URL);

export const loadLiveCitations = reader.load;
/** Reset the page-local cache for tests. */
export const resetLiveCitations = reader.reset;
export const isCitationsFresherThan = isSnapshotFresher<Citations>;
