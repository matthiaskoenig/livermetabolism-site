/**
 * Writes one issue of the lab newsletter (issue #74): a condensed overview of
 * what happened in a date window, from the software releases, this repository's
 * own history and the data tables.
 *
 * Usage:
 *   npm run newsletter -- 2026-09-01 2026-09-30
 *   npm run newsletter -- 2026-09-01 2026-09-30 newsletter/2026-09.md
 *
 * The snapshots come from the `github-data` branch by default, which the
 * workflow refreshes once a day. For an issue that has to include something
 * released today, fetch a current one first and point at it:
 *
 *   GITHUB_TOKEN=$(gh auth token) npm run fetch:github -- /tmp/github.json
 *   npm run newsletter -- 2026-09-01 2026-09-30 newsletter/2026-09.md --github=/tmp/github.json
 *
 * The output is a Markdown file under `newsletter/`, which sits beside
 * `release-notes/` and `science_communication/`: plain files nothing in the
 * Astro build reads, so the newsletter is deliberately not part of the website.
 *
 * Sources, all already in the repository:
 *   - `github.json` / `scholar.json` on the orphan `github-data` branch, the
 *     same daily snapshots the site itself reads
 *   - `git log` for the commit count and the release-notes dates
 *   - `release-notes/<version>.md` for what each site release gave the site
 *   - `data/*.yml`, diffed across the window, for rows that are new
 *
 * The snapshot is written once a day, so a run can legitimately miss a release
 * published the same morning. That is reported in the issue itself rather than
 * silently dropped - see `buildNewsletter`.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import {
  buildNewsletter, inWindow, releaseSummary, rowIds, selectNewEntries,
  type DataRow, type NewsletterInput, type Range, type ReleaseRow,
  type ScholarReading, type SiteReleaseRow,
} from './lib/newsletter.ts';

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
}

/**
 * A file as it stood at a revision, or null where it did not exist yet.
 * stderr is swallowed: a missing path is an expected answer here (the tables
 * were renamed in September 2026), not a failure worth printing.
 */
function showAt(rev: string, path: string): string | null {
  try {
    return execFileSync('git', ['show', `${rev}:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }).trim();
  } catch { return null; }
}

/** The last commit on or before a date, which is the window's "before" state. */
function revBefore(date: string): string {
  const sha = git('rev-list', '-1', `--before=${date}T00:00:00`, 'HEAD');
  if (!sha) throw new Error(`no commit before ${date}; cannot diff the window`);
  return sha;
}

/**
 * A table's text at a revision. The Jekyll-to-Astro migration on 2026-09-12
 * moved these files from `app/_data/` to `data/`, so a window reaching back
 * past it has to follow the rename - otherwise the table looks brand new and
 * every row in it is reported as an addition.
 */
function tableTextAt(rev: string, table: string): string | null {
  for (const path of [`data/${table}.yml`, `app/_data/${table}.yml`]) {
    const text = showAt(rev, path);
    if (text !== null) return text;
  }
  return null;
}

/** The current table, which is schema-validated and always parses. */
function tableNow(table: string): DataRow[] {
  const text = tableTextAt('HEAD', table);
  return text ? (load(text) as DataRow[] | null) ?? [] : [];
}

/** Each release-notes file added in the window, with its first prose line. */
function siteReleases(range: Range): SiteReleaseRow[] {
  const out: SiteReleaseRow[] = [];
  const listed = git('ls-tree', '--name-only', 'HEAD', 'release-notes/').split('\n').filter(Boolean);
  for (const path of listed) {
    const version = path.replace(/^release-notes\//, '').replace(/\.md$/, '');
    const date = git('log', '--diff-filter=A', '--format=%ad', '--date=short', '-1', '--', path);
    if (!date || !inWindow(date, range)) continue;
    out.push({ version, date, summary: releaseSummary(readFileSync(path, 'utf8').split('\n')) });
  }
  return out;
}

export function collect(range: Range, snapshots: { github: string; scholar: string }): NewsletterInput {
  const gh = JSON.parse(snapshots.github) as {
    fetchedAt: string;
    repos: Record<string, { htmlUrl: string; description: string | null; stars: number; language: string | null }>;
    releases: Record<string, { tag: string; publishedAt: string; summary: string; htmlUrl: string; prerelease: boolean }[]>;
  };
  const releases: ReleaseRow[] = [];
  for (const [repo, rows] of Object.entries(gh.releases ?? {})) {
    for (const r of rows) releases.push({ repo, ...r });
  }

  const sc = JSON.parse(snapshots.scholar) as { history?: ScholarReading[] };
  const readings = (sc.history ?? []).filter((h) => inWindow(h.date, range));
  const scholar = readings.length >= 2
    ? { from: readings[0]!, to: readings.at(-1)! }
    : null;

  const before = revBefore(range.from);
  const tables = ['news', 'publications', 'projects', 'software', 'presentations', 'posters', 'abstracts', 'funding', 'meetings', 'people'];
  const entries = tables.flatMap((t) => selectNewEntries(t, rowIds(tableTextAt(before, t)), tableNow(t), range));

  const commits = Number(git('rev-list', '--count', `--since=${range.from}T00:00:00`, `--until=${range.to}T23:59:59`, 'HEAD'));

  return {
    fetchedAt: gh.fetchedAt,
    repos: gh.repos ?? {},
    releases,
    siteReleases: siteReleases(range),
    commits,
    entries,
    scholar,
  };
}

function snapshot(name: string, override?: string): string {
  if (override) return readFileSync(override, 'utf8');
  // the orphan branch the daily workflow commits to; fetched on demand so a
  // fresh clone works without a manual step
  try { git('fetch', '-q', 'origin', 'github-data'); } catch { /* offline: fall back to whatever is local */ }
  const text = showAt('origin/github-data', name) ?? showAt('github-data', name);
  if (!text) throw new Error(`${name} not found on the github-data branch; run npm run fetch:github first`);
  return text;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** `--name=value` out of the argv tail. */
function flag(argv: string[], name: string): string | undefined {
  return argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
}

export function main(argv: string[]): void {
  const [from, to, out] = argv.filter((a) => !a.startsWith('--'));
  if (!from || !to || !ISO_DAY.test(from) || !ISO_DAY.test(to)) {
    throw new Error('usage: npm run newsletter -- <from YYYY-MM-DD> <to YYYY-MM-DD> [outfile]');
  }
  if (from > to) throw new Error(`the window ends (${to}) before it starts (${from})`);

  const range: Range = { from, to };
  const input = collect(range, {
    github: snapshot('github.json', flag(argv, 'github')),
    scholar: snapshot('scholar.json', flag(argv, 'scholar')),
  });
  const markdown = buildNewsletter(input, range);

  const path = out ?? `newsletter/${from.slice(0, 7)}.md`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, markdown);
  console.log(`wrote ${path} (${Buffer.byteLength(markdown)} bytes)`);
  if (input.fetchedAt.slice(0, 10) < to) {
    console.warn(`warning: the GitHub snapshot is from ${input.fetchedAt.slice(0, 10)}, before ${to};`);
    console.warn('         releases published after that are missing. Run npm run fetch:github to refresh.');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
