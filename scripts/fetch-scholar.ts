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
 * a failed run must never fail the GitHub snapshot, and it writes nothing, so
 * the previous good file stays in place. A profile that parses but whose
 * citations, h-index or i10-index fell sharply since the previous snapshot is
 * such a failure too (`scripts/lib/snapshot.ts`): written, it would also have
 * entered the history for good.
 *
 * The fetch itself is retried up to 3 attempts (30 s, then 60 s apart) when
 * Google answers with a transient "blocked" — GitHub-hosted runner IPs get an
 * occasional 403 that a plain retry clears. A `no stats table` (page layout
 * changed) or any other error is not transient and is never retried.
 */
import { scholarSchema, SCHOLAR_USER_ID, type Scholar } from '../site/lib/scholarSchema.ts';
import { buildScholarSnapshot, fetchProfileHtml, parseProfile, profileUrl, scholarFigures } from './lib/scholar.ts';
import { assertPlausible, readPrevious, writeJsonAtomic } from './lib/snapshot.ts';

/**
 * The exit code of a run Google blocked (EX_TEMPFAIL), which the workflow
 * reports as a warning: a block is routine on GitHub-hosted runners, while any
 * other failure (a changed layout, an implausible drop) fails the run.
 */
export const EXIT_BLOCKED = 75;

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

  const previous = readPrevious(opts.outPath, scholarSchema);
  const html = await fetchProfileHtmlWithRetry(opts.userId, opts.fetchImpl ?? fetch, opts.sleep);
  const parsed = parseProfile(html);
  // Parsing our own output catches a drift between the writer and the site,
  // which reads the file through the very same schema.
  const snapshot = scholarSchema.parse(buildScholarSnapshot(parsed, previous, now, opts.userId));
  // Before the write: a zero or a sharp fall would also enter the history for good.
  assertPlausible(scholarFigures(previous, snapshot));

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
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exit(message.startsWith('blocked') ? EXIT_BLOCKED : 1);
  });
}
