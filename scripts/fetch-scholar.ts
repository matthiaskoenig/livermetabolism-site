/**
 * Writes the Google Scholar snapshot (`scholar.json`) read by the publications
 * page: the citation metrics of the group leader's public profile, the
 * citations-per-year histogram, and a history point per day accumulated across
 * runs.
 *
 * Usage:
 *   npm run fetch:scholar -- scholar.json
 *
 * The path argument is both the previous snapshot (read for its history, if it
 * exists and validates) and the output. In the workflow it points into the
 * `github-data` worktree, so the history grows with every run; see
 * .github/workflows/github-data.yml, where the step is `continue-on-error`:
 * a run Google blocks must never fail the GitHub snapshot, and it writes
 * nothing, so the previous good file stays in place.
 *
 * The fetch itself is retried up to 3 attempts (30 s, then 60 s apart) when
 * Google answers with a transient "blocked" — GitHub-hosted runner IPs get an
 * occasional 403 that a plain retry clears. A `no stats table` (page layout
 * changed) or any other error is not transient and is never retried.
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { scholarSchema, SCHOLAR_USER_ID, type Scholar } from '../site/lib/scholarSchema.ts';
import { buildScholarSnapshot, fetchProfileHtml, parseProfile, profileUrl } from './lib/scholar.ts';

/** The previous snapshot, or null when there is none or it does not validate. */
export function readPrevious(path: string): Scholar | null {
  if (!existsSync(path)) return null;
  try {
    return scholarSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
  } catch (err) {
    console.warn(`Ignoring the previous snapshot at ${path}: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

/** Write to a temp file and rename, so a failed run never leaves a half-written snapshot. */
function writeJsonAtomic(path: string, data: unknown): number {
  const text = `${JSON.stringify(data)}\n`;
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, text);
  renameSync(tmp, path);
  return Buffer.byteLength(text);
}

/** The wait before each retry, in order (also the max number of retries). */
const RETRY_DELAYS_MS = [30_000, 60_000];

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries `fetchProfileHtml` up to 3 attempts total (1 + `RETRY_DELAYS_MS.length`)
 * when the failure is a transient "blocked" (see `fetchProfileHtml`'s docstring);
 * a `no stats table` or any other error is never transient and is rethrown
 * immediately. Logs one line per failed attempt; the last failure is rethrown
 * so `runFetch` still fails the step and writes nothing. `sleep` is injectable
 * so the unit test never actually waits.
 */
export async function fetchProfileHtmlWithRetry(
  userId: string,
  fetchImpl: typeof fetch,
  sleep: (ms: number) => Promise<void> = defaultSleep,
): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetchProfileHtml(userId, fetchImpl);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const delay = RETRY_DELAYS_MS[attempt - 1];
      if (!message.startsWith('blocked') || delay === undefined) throw err;
      console.warn(`Attempt ${attempt} failed: ${message} — retrying in ${delay / 1000} s`);
      await sleep(delay);
    }
  }
}

export async function runFetch(opts: {
  userId: string; outPath: string; now?: Date; fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void>;
}): Promise<Scholar> {
  const now = opts.now ?? new Date();
  console.log(`Fetching ${profileUrl(opts.userId)} as of ${now.toISOString()}`);

  const previous = readPrevious(opts.outPath);
  const html = await fetchProfileHtmlWithRetry(opts.userId, opts.fetchImpl ?? fetch, opts.sleep);
  const parsed = parseProfile(html);
  // Parsing our own output catches a drift between the writer and the site,
  // which reads the file through the very same schema.
  const snapshot = scholarSchema.parse(buildScholarSnapshot(parsed, previous, now, opts.userId));

  const bytes = writeJsonAtomic(opts.outPath, snapshot);
  console.log(
    `Wrote ${opts.outPath}: ${snapshot.profile.name} — ${snapshot.citations.all} citations (${snapshot.citations.since} since ${snapshot.sinceYear}), ` +
      `h-index ${snapshot.hIndex.all}/${snapshot.hIndex.since}, i10-index ${snapshot.i10Index.all}/${snapshot.i10Index.since}, ` +
      `${snapshot.citationsPerYear.length} years, ${snapshot.history.length} history points (${(bytes / 1024).toFixed(1)} kB)`,
  );
  return snapshot;
}

if (import.meta.main) {
  runFetch({ userId: SCHOLAR_USER_ID, outPath: process.argv[2] ?? './scholar.json' }).catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
