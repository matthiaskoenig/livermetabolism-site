/**
 * The zod instance of the snapshot schemas (`githubSchema.ts`,
 * `scholarSchema.ts`, `citationsSchema.ts`, `snapshotUrl.ts`), the only zod
 * code that ships to the browser.
 *
 * Zod compiles object parsers with `new Function` and, to find out whether it
 * may, probes for `eval` when the first `z.object()` is built. The site's CSP
 * forbids `eval` (see `astro.config.mjs`), so the probe throws and zod falls
 * back to the interpreted parser - but the browser still reports a
 * Content-Security-Policy violation on every page that loads a snapshot
 * schema. `jitless` skips the probe and the compiled parser; the snapshots
 * are small enough that the compiled fast path buys nothing.
 *
 * Import `z` from here, never from `astro/zod`, in any module the browser
 * loads: the config must run before the first schema is built, which an
 * import of this module guarantees.
 */
import { z } from 'astro/zod';

z.config({ jitless: true });

export { z };
