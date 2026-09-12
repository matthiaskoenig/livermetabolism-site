/**
 * Pure projections of the Google Scholar snapshot into the rows the
 * publications page renders: the summary strip, the citations-per-year bars
 * and the citations-over-time line.
 *
 * Free of DOM, Vue and ECharts imports, exactly like `githubRows.ts` (whose
 * date helpers are reused here): the same functions run at build time
 * (`site/lib/scholar.ts` -> `publications.astro` props) and again in the
 * browser when an island or the strip updater refreshes itself from a newer
 * snapshot (`site/lib/scholarLive.ts`), so server-rendered and refreshed
 * values can never be computed differently.
 *
 * Everything here is numbers plus two strings — the profile name (rendered as
 * text) and the profile URL (guarded by `profileHref`, see below).
 */
import { hasData, shortDate } from './githubRows';
import { scholarProfileUrl, type Scholar } from './scholarSchema';

/** One bar of the citations-per-year chart. */
export interface PerYearRow { year: number; count: number }

/** One point of the citations-over-time line (one daily snapshot reading). */
export interface HistoryRow { date: string; citations: number; hIndex: number; i10Index: number }

/** What the summary strip shows; `known` is false for `emptyScholar()`. */
export interface StripValues {
  known: boolean;
  citations: number;
  citationsSince: number;
  hIndex: number;
  hIndexSince: number;
  i10Index: number;
  i10IndexSince: number;
  sinceYear: number;
  name: string;
  href: string;
  fetchedAt: string;
}

/** Scholar's citation histogram, ascending by year (defensive re-sort). */
export function perYearRows(scholar: Scholar): PerYearRow[] {
  return [...scholar.citationsPerYear].sort((a, b) => a.year - b.year).map(({ year, count }) => ({ year, count }));
}

/**
 * The accumulated daily readings, ascending by date and at most one per date
 * (the last reading of a date wins, as `mergeHistory` in the fetch script
 * already guarantees).
 */
export function historyRows(scholar: Scholar): HistoryRow[] {
  const byDate = new Map<string, HistoryRow>();
  for (const p of scholar.history) byDate.set(p.date, { date: p.date, citations: p.citations, hIndex: p.hIndex, i10Index: p.i10Index });
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * The profile link target. The snapshot is our own file on the `github-data`
 * branch, but it is the one place where a string from it becomes an `href`, so
 * anything that is not a Scholar profile URL falls back to the URL derived
 * from the user id — a `javascript:` href can then never reach the page.
 */
export function profileHref(scholar: Scholar): string {
  const url = scholar.profile.htmlUrl;
  return url.startsWith('https://scholar.google.com/') ? url : scholarProfileUrl(scholar.profile.userId || undefined);
}

/** The numbers and strings of the summary strip. */
export function stripValues(scholar: Scholar): StripValues {
  return {
    known: hasData(scholar.fetchedAt),
    citations: scholar.citations.all,
    citationsSince: scholar.citations.since,
    hIndex: scholar.hIndex.all,
    hIndexSince: scholar.hIndex.since,
    i10Index: scholar.i10Index.all,
    i10IndexSince: scholar.i10Index.since,
    sinceYear: scholar.sinceYear,
    name: scholar.profile.name,
    href: profileHref(scholar),
    fetchedAt: scholar.fetchedAt,
  };
}

/**
 * The caption addition of the history chart. The series starts on the day the
 * first snapshot was taken, so with one or two points the chart would look
 * broken without saying why.
 */
export function historyNote(rows: HistoryRow[]): string {
  return rows.length === 1 ? `history starts ${shortDate(`${rows[0]!.date}T00:00:00Z`)}` : '';
}
