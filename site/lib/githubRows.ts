/**
 * Pure projections of the GitHub snapshot into the rows the research page
 * renders: the per-card stats line, the release feed, the release timeline,
 * the stars bars and the commit-activity histogram.
 *
 * Free of DOM, Vue and ECharts imports on purpose: the same helpers run at
 * build time (`site/lib/github.ts` -> `research.astro` props) and again in the
 * browser when an island refreshes itself from a newer snapshot
 * (`site/lib/githubLive.ts`), so build-rendered and refreshed rows can never
 * be computed differently. Everything here is text or numbers — release
 * summaries are plain text and are inserted with textContent / Vue
 * interpolation, never as HTML.
 */
import type { Snapshot } from './githubSchema';

/** What a software card's `.software-stats` line shows. */
export interface RepoStats {
  fullName: string;
  htmlUrl: string;
  stars: number;
  openIssues: number;
  pushedAt: string;
  language: string | null;
  license: string | null;
  release: { tag: string; publishedAt: string; htmlUrl: string } | null;
}

/** One row of the release feed: the newest release of one repository. */
export interface ReleaseRow {
  repo: string;
  name: string;
  tag: string;
  title: string;
  publishedAt: string;
  htmlUrl: string;
  prerelease: boolean;
  summary: string;
}

export interface TimelinePoint { date: string; tag: string; url: string }
/** One lane of the release timeline: every release of one repository. */
export interface TimelineRow { repo: string; name: string; points: TimelinePoint[] }

/** One bar of the stars chart. */
export interface StarRow { repo: string; name: string; stars: number; language: string | null; url: string }

/** Weekly commit counts of one repository, aligned to `ActivityRows.weeks`. */
export interface ActivitySeries { repo: string; name: string; values: number[] }
export interface ActivityRows { weeks: string[]; series: ActivitySeries[] }

const DAY_MS = 86_400_000;

/** `repos` in the given order, without repeats and without unknown repositories. */
function known(snapshot: Snapshot, repos: string[]): string[] {
  const seen = new Set<string>();
  return repos.filter((r) => snapshot.repos[r] && !seen.has(r) && seen.add(r));
}

const displayName = (snapshot: Snapshot, fullName: string) => snapshot.repos[fullName]?.name ?? fullName;

/** The stats of one repository, or null when the snapshot does not cover it. */
export function statsFor(snapshot: Snapshot, fullName: string): RepoStats | null {
  const repo = snapshot.repos[fullName];
  if (!repo) return null;
  return {
    fullName: repo.fullName,
    htmlUrl: repo.htmlUrl,
    stars: repo.stars,
    openIssues: repo.openIssues,
    pushedAt: repo.pushedAt,
    language: repo.language,
    license: repo.license,
    release: repo.latestRelease
      ? { tag: repo.latestRelease.tag, publishedAt: repo.latestRelease.publishedAt, htmlUrl: repo.latestRelease.htmlUrl }
      : null,
  };
}

/**
 * The newest release of every repository that published one within the last
 * `sinceDays`, newest first.
 */
export function latestReleases(snapshot: Snapshot, repos: string[], sinceDays = 730, now: Date = new Date()): ReleaseRow[] {
  const since = new Date(now.getTime() - sinceDays * DAY_MS).toISOString();
  const rows: ReleaseRow[] = [];
  for (const repo of known(snapshot, repos)) {
    const latest = [...(snapshot.releases[repo] ?? [])].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
    if (!latest || latest.publishedAt < since) continue;
    rows.push({
      repo,
      name: displayName(snapshot, repo),
      tag: latest.tag,
      title: latest.name,
      publishedAt: latest.publishedAt,
      htmlUrl: latest.htmlUrl,
      prerelease: latest.prerelease,
      summary: latest.summary,
    });
  }
  return rows.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/**
 * One lane per repository that has releases, its points oldest first; lanes
 * ordered by their most recent release, newest at the top.
 */
export function releaseTimelineRows(snapshot: Snapshot, repos: string[]): TimelineRow[] {
  const rows: TimelineRow[] = [];
  for (const repo of known(snapshot, repos)) {
    const list = snapshot.releases[repo] ?? [];
    if (list.length === 0) continue;
    rows.push({
      repo,
      name: displayName(snapshot, repo),
      points: [...list]
        .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))
        .map((r) => ({ date: r.publishedAt, tag: r.tag, url: r.htmlUrl })),
    });
  }
  return rows.sort((a, b) => b.points[b.points.length - 1].date.localeCompare(a.points[a.points.length - 1].date));
}

/** Starred repositories, most stars first. */
export function starsRows(snapshot: Snapshot, repos: string[]): StarRow[] {
  return known(snapshot, repos)
    .map((repo) => snapshot.repos[repo]!)
    .filter((r) => r.stars > 0)
    .sort((a, b) => b.stars - a.stars || a.fullName.localeCompare(b.fullName))
    .map((r) => ({ repo: r.fullName, name: r.name, stars: r.stars, language: r.language, url: r.htmlUrl }));
}

/**
 * Weekly commit counts over the last `weeks` weeks, one series per repository
 * that has any, all aligned to the union of the weeks present in the
 * snapshot; busiest repository first.
 */
export function activityRows(snapshot: Snapshot, repos: string[], weeks = 52): ActivityRows {
  const names = known(snapshot, repos);
  const all = new Set<string>();
  for (const repo of names) for (const w of snapshot.repos[repo]!.commitActivity) all.add(w.week);
  const axis = [...all].sort().slice(-weeks);
  const index = new Map(axis.map((w, i) => [w, i]));
  const series: ActivitySeries[] = [];
  for (const repo of names) {
    const values = new Array<number>(axis.length).fill(0);
    let total = 0;
    for (const w of snapshot.repos[repo]!.commitActivity) {
      const i = index.get(w.week);
      if (i === undefined) continue;
      values[i] += w.total;
      total += w.total;
    }
    if (total > 0) series.push({ repo, name: displayName(snapshot, repo), values });
  }
  series.sort((a, b) => b.values.reduce((s, v) => s + v, 0) - a.values.reduce((s, v) => s + v, 0));
  return { weeks: axis, series };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "8 Sep 2026", in UTC and without `toLocaleDateString`, so the row rendered
 * by the build and the one re-rendered in the browser always read the same.
 */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;
const utcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

/**
 * A calendar-day-based "3 days ago" / "5 months ago" for the stats lines and
 * the "updated" note; an empty string for an unparsable date.
 */
export function relativeDate(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const days = Math.round((utcDay(now) - utcDay(then)) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return plural(days, 'day');
  if (days < 30) return plural(Math.round(days / 7), 'week');
  if (days < 365) return plural(Math.max(1, Math.floor(days / 30.44)), 'month');
  return plural(Math.max(1, Math.floor(days / 365.25)), 'year');
}
