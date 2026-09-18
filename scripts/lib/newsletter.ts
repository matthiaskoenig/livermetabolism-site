/**
 * Builds the lab newsletter (issue #74) from already-gathered facts.
 *
 * Pure on purpose, like `transform.ts`: no network, no clock, no file system,
 * so what the issue says can be tested directly. `scripts/newsletter.ts` does
 * the gathering and hands the result here.
 *
 * The audience is the group itself, so the prose is dense: one line per
 * release, the summary as the snapshot recorded it, and a link to the release
 * page for the full notes. Images are embedded by linking the original
 * resource on the live site rather than copying anything into the file.
 */
import { load } from 'js-yaml';

export interface Range {
  /** inclusive, YYYY-MM-DD */
  from: string;
  /** inclusive, YYYY-MM-DD */
  to: string;
}

export interface RepoMeta {
  htmlUrl: string;
  description: string | null;
  stars: number;
  language: string | null;
}

export interface ReleaseRow {
  repo: string;
  tag: string;
  publishedAt: string;
  summary: string;
  htmlUrl: string;
  prerelease: boolean;
}

/** A release of this website, read from its own `release-notes/<version>.md`. */
export interface SiteReleaseRow {
  version: string;
  date: string;
  summary: string;
}

/** A row that appeared in `data/*.yml` inside the window. */
export interface EntryRow {
  table: string;
  id: string;
  /** the row's own date, or empty where it carries none (software, people) */
  date: string;
  title: string;
  /** absolute URL on the live site, or null where the row carries no image */
  imageUrl: string | null;
}

export interface ScholarReading {
  date: string;
  citations: number;
  hIndex: number;
  i10Index: number;
}

export interface NewsletterInput {
  /** when the GitHub snapshot the releases come from was taken */
  fetchedAt: string;
  repos: Record<string, RepoMeta>;
  releases: ReleaseRow[];
  siteReleases: SiteReleaseRow[];
  commits: number;
  entries: EntryRow[];
  /** the first and last readings inside the window, or null when there are none */
  scholar: { from: ScholarReading; to: ScholarReading } | null;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const day = (iso: string): string => iso.slice(0, 10);

export function inWindow(iso: string, range: Range): boolean {
  const d = day(iso);
  return d >= range.from && d <= range.to;
}

const SITE = 'https://livermetabolism.com';

/** Where each table's `image:` value lives under `public/assets/image/`. */
const IMAGE_DIR: Record<string, string> = {
  news: 'news', projects: 'projects', software: 'software',
  meetings: 'meetings', funding: 'funding', editors: 'editors', people: 'people',
};

/** One row of a `data/*.yml` table, as loaded. */
export type DataRow = Record<string, unknown>;

/** `- id: 'x'` at the top level of a table, which is where row ids live. */
const ROW_ID = /^-\s+id:\s*['"]?([^'"\s#]+)/;

/**
 * The ids of a table's rows, tolerantly.
 *
 * Only the baseline side of the diff uses this, and it only needs identity.
 * That matters because historical tables predate the indentation rule js-yaml
 * enforces (see CLAUDE.md): a multi-line quoted value whose continuation sits
 * flush with its key loaded fine under PyYAML and throws here. Falling back to
 * a line scan keeps a window that reaches back past such a file working,
 * instead of failing on prose written years ago.
 */
export function rowIds(text: string | null): string[] {
  if (!text) return [];
  try {
    const rows = load(text) as DataRow[] | null;
    if (Array.isArray(rows)) return rows.map((r) => String(r?.id ?? '')).filter(Boolean);
  } catch { /* fall through to the line scan */ }
  return text.split('\n').map((l) => ROW_ID.exec(l)?.[1]).filter((id): id is string => Boolean(id));
}

/**
 * The rows of one table that are genuinely new in the window: present at the
 * end, absent at the start, keyed by `id`. An edited row is not news.
 *
 * A row that carries its own date must have it inside the window, which keeps
 * a backfilled old entry out. A row with no date at all - software and people
 * carry none - is reported on the strength of the diff alone: it demonstrably
 * appeared during the window, which is the only evidence there is and the
 * right one.
 */
export function selectNewEntries(table: string, before: DataRow[] | string[], after: DataRow[], range: Range): EntryRow[] {
  const had = new Set(before.map((r) => (typeof r === 'string' ? r : String(r.id ?? ''))));
  const out: EntryRow[] = [];
  for (const row of after) {
    const id = String(row.id ?? '');
    if (!id || had.has(id)) continue;

    // A row's own date is what decides whether it is news, not the fact that
    // its id is new: 22 preprints were renamed `<id>` -> `<id>_preprint` in
    // September 2026, and an id-only diff calls every one of them a new
    // paper. `year` is the fallback because the bibliographic tables carry
    // that rather than a full date.
    const own = row.date ? String(row.date).slice(0, 10) : '';
    const dated = own || (row.year ? `${row.year}-01-01` : '');
    if (dated && !inWindow(dated, range)) continue;

    const image = row.image ? String(row.image) : null;
    const dir = IMAGE_DIR[table];
    out.push({
      table,
      id,
      date: own,
      title: String(row.title ?? row.name ?? id),
      imageUrl: image && dir ? `${SITE}/assets/image/${dir}/${image}` : null,
    });
  }
  return out;
}

/** This repository, which gets its own section rather than a release line. */
export const SITE_REPO = 'matthiaskoenig/livermetabolism-site';

/**
 * The lead-in every issue of the group's release-notes template opens with.
 * Matched after URLs are masked out: the template ends on
 * "... https://livermetabolism.com." and the dots inside that URL would
 * otherwise end the sentence early, leaving a stray "com." behind.
 */
const LEAD_IN = /^We are pleased to (?:release|announce).*?\.\s+/i;
// trailing punctuation is sentence, not URL: `\S+` would eat the period
// that ends the lead-in and there would be no sentence break left to find
const URL_RE = /https?:\/\/[^\s<>]*[^\s<>.,;:!?)]/g;

/**
 * The one-line summary of a release, from the lines of its release-notes file:
 * the first prose line, with the template lead-in removed when there is a real
 * sentence behind it. Kept whole when the lead-in is all there is, so a
 * release is never summarised as nothing.
 */
export function releaseSummary(lines: string[]): string {
  const prose = lines.find((l) => l.trim() && !l.trimStart().startsWith('#') && !l.trimStart().startsWith('-'));
  if (!prose) return '';
  const trimmed = prose.trim();
  const urls: string[] = [];
  const masked = trimmed.replace(URL_RE, (u) => {
    urls.push(u);
    return `\u0000${urls.length - 1}\u0000`;
  });
  const cut = masked.replace(LEAD_IN, '').trim();
  const restored = (cut || masked).replace(/\u0000(\d+)\u0000/g, (_, i) => urls[Number(i)] ?? '');
  return restored || trimmed;
}

/** "September 2026" from the range's start, which is the issue's month. */
function title(range: Range): string {
  const [year, month] = range.from.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/** `owner/name` -> `name`, which is what the group calls its tools. */
const shortName = (fullName: string): string => fullName.split('/').at(-1) ?? fullName;

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function releaseSection(input: NewsletterInput, range: Range): string[] {
  // the website has its own section below, built from its release notes
  const inRange = input.releases.filter((r) => r.repo !== SITE_REPO && inWindow(r.publishedAt, range));
  if (inRange.length === 0) return ['No software releases in this window.'];

  // newest first within a repository, and repositories by their most recent
  // release, so the section reads as "what moved, most recently"
  const byRepo = new Map<string, ReleaseRow[]>();
  for (const r of inRange) byRepo.set(r.repo, [...(byRepo.get(r.repo) ?? []), r]);
  for (const rows of byRepo.values()) rows.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const repos = [...byRepo.entries()].sort(
    (a, b) => (b[1][0]?.publishedAt ?? '').localeCompare(a[1][0]?.publishedAt ?? ''),
  );

  const out: string[] = [];
  for (const [fullName, rows] of repos) {
    const meta = input.repos[fullName];
    const heading = meta ? `### [${shortName(fullName)}](${meta.htmlUrl})` : `### ${shortName(fullName)}`;
    out.push(heading);
    if (meta) {
      const stars = `${meta.stars} ${meta.stars === 1 ? 'star' : 'stars'}`;
      const bits = [meta.description, meta.language, stars].filter(Boolean);
      out.push(`_${bits.join(' · ')}_`, '');
    }
    for (const r of rows) {
      const tag = r.prerelease ? `**${r.tag}** (pre-release)` : `**${r.tag}**`;
      out.push(`- ${tag} · ${day(r.publishedAt)} · ${r.summary} [notes](${r.htmlUrl})`);
    }
    out.push('');
  }
  return out;
}

/** 0.12.1 above 0.12.0 above 0.11.1, numerically rather than as strings. */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const d = (pb[i] ?? 0) - (pa[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

function siteSection(input: NewsletterInput, range: Range): string[] {
  const rows = input.siteReleases
    .filter((r) => inWindow(r.date, range))
    // several releases can share a day, so the version breaks the tie
    .sort((a, b) => b.date.localeCompare(a.date) || compareVersions(a.version, b.version));
  const out: string[] = [];
  if (input.commits > 0) {
    out.push(`${input.commits} commits on \`main\` in this window.`, '');
  }
  if (rows.length === 0) {
    out.push('No releases of the website in this window.');
    return out;
  }
  for (const r of rows) out.push(`- **${r.version}** · ${r.date} · ${r.summary}`);
  out.push('');
  return out;
}

function entriesSection(input: NewsletterInput, range: Range): string[] {
  // An undated row is kept: selectNewEntries already established that it
  // appeared inside the window, which is the only evidence such a row offers.
  const rows = input.entries
    .filter((e) => !e.date || inWindow(e.date, range))
    .sort((a, b) => b.date.localeCompare(a.date));
  if (rows.length === 0) return ['No new entries in the data tables in this window.'];

  const byTable = new Map<string, EntryRow[]>();
  for (const e of rows) byTable.set(e.table, [...(byTable.get(e.table) ?? []), e]);

  const out: string[] = [];
  for (const [table, items] of byTable) {
    out.push(`### ${table}`, '');
    for (const e of items) {
      // no date where the row has none: printing the window's end would say
      // it happened on a day it did not
      const when = e.date ? `${e.date} · ` : '';
      out.push(`- **${e.title}** · ${when}\`${e.id}\``);
      // linked, never copied: the image stays the original resource
      if (e.imageUrl) out.push('', `  ![${e.title}](${e.imageUrl})`, '');
    }
    out.push('');
  }
  return out;
}

function numbersSection(input: NewsletterInput): string[] {
  if (!input.scholar) {
    return ['Citation readings for this window are not available.'];
  }
  const { from, to } = input.scholar;
  const d = (a: number, b: number) => signed(b - a);
  // The dates are the readings' own, not the window's: the daily pipeline
  // started mid-September 2026, so an issue can legitimately cover less than
  // the month it is about. Printing the real span keeps the delta honest.
  return [
    `Google Scholar, ${from.date} to ${to.date}:`,
    '',
    `- citations ${from.citations} -> ${to.citations} (${d(from.citations, to.citations)})`,
    `- h-index ${from.hIndex} -> ${to.hIndex} (${d(from.hIndex, to.hIndex)})`,
    `- i10-index ${from.i10Index} -> ${to.i10Index} (${d(from.i10Index, to.i10Index)})`,
  ];
}

export function buildNewsletter(input: NewsletterInput, range: Range): string {
  const out: string[] = [
    `# König Lab · ${title(range)}`,
    '',
    `Covering ${range.from} to ${range.to}.`,
    '',
  ];

  // The snapshot is written once a day, so anything released after it was
  // taken is simply not here yet. Say it in the issue rather than letting a
  // reader assume the list is complete.
  if (day(input.fetchedAt) < range.to) {
    out.push(
      `> The GitHub snapshot these releases come from was taken on ${day(input.fetchedAt)},`,
      `> before the end of this window, so releases published after that date may be missing.`,
      `> Run \`npm run fetch:github\` and regenerate for a complete list.`,
      '',
    );
  }

  out.push('## Software releases', '', ...releaseSection(input, range));
  out.push('## The website', '', ...siteSection(input, range));
  out.push('## New on the site', '', ...entriesSection(input, range));
  out.push('## Numbers', '', ...numbersSection(input));

  return `${out.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}
