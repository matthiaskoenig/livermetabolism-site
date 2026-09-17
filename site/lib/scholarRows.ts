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
import { fmt } from './i18n/format';
import { scholarProfileUrl, type Scholar } from './scholarSchema';

/** One bar of the citations-per-year chart. */
export interface PerYearRow { year: number; count: number }

/**
 * One point of the citations-over-time line: a `'year'` point is a year-end
 * total accumulated from Scholar's per-year histogram, a `'day'` point is a
 * daily snapshot reading.
 */
export interface HistoryRow { date: string; citations: number; source: 'year' | 'day' }

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
 * The citations-over-time points: year-end totals derived from the histogram
 * for every year that ended before the first daily reading, followed by the
 * daily readings (ascending, at most one per date — the last reading of a
 * date wins, as `mergeHistory` in the fetch script already guarantees).
 *
 * The histogram does not date every citation (Scholar's total is a little
 * larger than its sum), so the undated remainder is added as a constant
 * baseline and the yearly curve meets today's total. Without a daily reading
 * (a snapshot without history) the year points run up to the last year that
 * ended before `fetchedAt`.
 */
export function historyRows(scholar: Scholar): HistoryRow[] {
  const byDate = new Map<string, HistoryRow>();
  for (const p of scholar.history) byDate.set(p.date, { date: p.date, citations: p.citations, source: 'day' });
  const days = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  const cutoff = days[0]?.date ?? (hasData(scholar.fetchedAt) ? scholar.fetchedAt.slice(0, 10) : '');
  const years = [...scholar.citationsPerYear].sort((a, b) => a.year - b.year);
  const dated = years.reduce((sum, y) => sum + y.count, 0);
  const baseline = Math.max(0, scholar.citations.all - dated);
  const yearRows: HistoryRow[] = [];
  let total = baseline;
  for (const y of years) {
    total += y.count;
    const date = `${y.year}-12-31`;
    if (cutoff && date < cutoff) yearRows.push({ date, citations: total, source: 'year' });
  }
  return [...yearRows, ...days];
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
 * The caption addition of the history chart, describing where its points come
 * from: the year-end totals derived from the histogram (up to their last
 * year) and the daily readings (from their first date). A single daily point
 * without year points keeps the "history starts <date>" wording.
 */
/**
 * The three `historyNote` templates ({year}/{date} placeholders), a narrow
 * serialisable bundle (see `slices.ts`'s `historyNote`) rather than a `TFn`:
 * `CitationHistoryChart.vue` is a hydrated island and recomputes the caption
 * in the browser when the live snapshot is newer, so its props - and
 * therefore what this function takes - must serialise into `astro-island`.
 */
export interface HistoryNoteStrings {
  yearly: string;
  daily: string;
  starts: string;
}

export function historyNote(rows: HistoryRow[], strings: HistoryNoteStrings): string {
  const years = rows.filter((r) => r.source === 'year');
  const days = rows.filter((r) => r.source === 'day');
  const parts: string[] = [];
  if (years.length) parts.push(fmt(strings.yearly, { year: years[years.length - 1]!.date.slice(0, 4) }));
  if (days.length && years.length) parts.push(fmt(strings.daily, { date: shortDate(`${days[0]!.date}T00:00:00Z`) }));
  else if (days.length === 1) parts.push(fmt(strings.starts, { date: shortDate(`${days[0]!.date}T00:00:00Z`) }));
  return parts.join(', ');
}
