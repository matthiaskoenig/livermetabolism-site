/**
 * Pure transformations from GitHub API responses to the snapshot shape in
 * `site/lib/githubSchema.ts`. No network, no clock: everything the fetch
 * script has to get right is unit-tested here against recorded responses in
 * `tests/fixtures/github/`.
 */
import type { ReleaseEntry, RepoEntry, Snapshot } from '../../site/lib/githubSchema.ts';
import type { ApiCommit, ApiCommitActivity, ApiRelease, ApiRepo } from './github-client.ts';

/** Everything fetched for one repository, keyed by its name in `data/software.yml`. */
export interface RepoFetch {
  fullName: string;
  repo: ApiRepo;
  releases: ApiRelease[];
  latestCommit: ApiCommit | null;
  commitActivity: ApiCommitActivity[];
}

const SUMMARY_MAX = 300;

// Lines that carry no prose: headings, horizontal rules, HTML (comments and
// tags, e.g. the <img> logos of the release template), and lines that are
// nothing but an image or a badge.
const SKIP_LINE = /^\s*(#{1,6}\s|[-*_]{3,}\s*$|<)|^\s*\[?!\[[^\]]*\]\([^)]*\)\]?(\([^)]*\))?\s*$/;
// Lead-in and sign-off of the group's release-notes template: true of every
// release, so it would drown out the actual news in the feed.
const BOILERPLATE = /we are pleased to (release|announce)|^your \S+ team\b/i;
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+/;

/** Markdown inline syntax to plain text: images out, link text kept, markers dropped. */
function stripInline(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/`+/g, '')
    // Emphasis markers only where markdown would treat them as such, so that
    // identifiers like `create_model` survive intact.
    .replace(/~~/g, '')
    .replace(/(^|[\s([{"'])(\*\*|__|[*_])(?=\S)/g, '$1')
    .replace(/(?<=\S)(\*\*|__|[*_])(?=[\s)\]}"'.,;:!?]|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A plain-text summary of release notes: the first paragraph of the body with
 * markdown stripped, cut at a word boundary after 300 characters. Headings,
 * images, badges and the "We are pleased to release ..." lead-in of the house
 * template are skipped; a leading bullet list is joined with " · ".
 */
export function summarize(body: string | null): string {
  if (!body) return '';
  const blocks = body.replace(/\r\n/g, '\n').split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split('\n').filter((line) => line.trim() && !SKIP_LINE.test(line));
    if (!lines.length) continue;
    const isList = lines.every((line) => LIST_ITEM.test(line));
    const parts = isList
      ? lines.map((line) => stripInline(line.replace(LIST_ITEM, ''))).filter(Boolean)
      : [stripInline(lines.join(' '))].filter(Boolean);
    const joined = parts.join(' · ');
    if (!joined || BOILERPLATE.test(joined)) continue;
    if (joined.length <= SUMMARY_MAX) return joined;
    const cut = joined.slice(0, SUMMARY_MAX - 1);
    const at = cut.lastIndexOf(' ');
    return `${(at > SUMMARY_MAX / 2 ? cut.slice(0, at) : cut).replace(/[\s·,;:]+$/, '')}…`;
  }
  return '';
}

/** Published, non-draft releases of one repository, newest first, at most `limit`. */
export function toReleaseEntries(fullName: string, api: ApiRelease[], limit = 20): ReleaseEntry[] {
  void fullName; // the snapshot keys releases by repository, so the name is not repeated on every entry
  return api
    .filter((r) => !r.draft && r.published_at)
    .map((r) => ({
      tag: r.tag_name,
      name: r.name?.trim() || r.tag_name,
      publishedAt: r.published_at as string,
      htmlUrl: r.html_url,
      prerelease: r.prerelease,
      summary: summarize(r.body),
    }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

const WEEK_MS = 7 * 24 * 3600 * 1000;

/**
 * Turns the dateless weekly totals of `/stats/participation` into the same
 * shape `/stats/commit_activity` returns: the list ends with the week `now`
 * falls into, and GitHub's statistics weeks start on Sunday, 00:00 UTC. The
 * two endpoints are cached separately, so this is the fallback for a
 * repository whose commit activity is still being computed.
 */
export function weeksFromParticipation(totals: number[], now: Date): ApiCommitActivity[] {
  const sunday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - now.getUTCDay() * 24 * 3600 * 1000;
  const last = totals.length - 1;
  return totals.map((total, i) => ({ week: (sunday - (last - i) * WEEK_MS) / 1000, total, days: [] }));
}

/**
 * GitHub's own "latest release" semantics: the newest stable release — with
 * the newest prerelease as a fallback for a repository that has only those.
 */
export function latestRelease(entries: ReleaseEntry[]): ReleaseEntry | null {
  return entries.find((r) => !r.prerelease) ?? entries[0] ?? null;
}

/** One repository of the snapshot: metadata plus its latest commit, latest release and weekly activity. */
export function toRepoEntry(
  api: ApiRepo,
  latestCommit: ApiCommit | null,
  latestRelease: Pick<ReleaseEntry, 'tag' | 'name' | 'publishedAt' | 'htmlUrl'> | null | undefined,
  activity: ApiCommitActivity[],
): RepoEntry {
  const commitDate = latestCommit?.commit.author?.date ?? latestCommit?.commit.committer?.date ?? null;
  return {
    name: api.name,
    owner: api.owner.login,
    fullName: api.full_name,
    description: api.description,
    htmlUrl: api.html_url,
    homepage: api.homepage || null,
    stars: api.stargazers_count,
    forks: api.forks_count,
    openIssues: api.open_issues_count,
    language: api.language,
    license: api.license?.spdx_id && api.license.spdx_id !== 'NOASSERTION' ? api.license.spdx_id : null,
    topics: api.topics,
    pushedAt: api.pushed_at,
    archived: api.archived,
    defaultBranch: api.default_branch,
    latestCommit:
      latestCommit && commitDate
        ? {
            sha: latestCommit.sha,
            date: commitDate,
            message: latestCommit.commit.message.split('\n')[0].trim(),
            htmlUrl: latestCommit.html_url,
          }
        : null,
    latestRelease: latestRelease
      ? { tag: latestRelease.tag, name: latestRelease.name, publishedAt: latestRelease.publishedAt, htmlUrl: latestRelease.htmlUrl }
      : null,
    commitActivity: [...activity]
      .sort((a, b) => a.week - b.week)
      .map((w) => ({ week: new Date(w.week * 1000).toISOString().slice(0, 10), total: w.total })),
  };
}

/**
 * The complete snapshot. Repositories and releases are keyed by the name as
 * written in `data/software.yml`, not by the canonical `full_name` GitHub
 * returns: the two differ after a rename or in capitalisation, and the site
 * looks entries up by the YAML spelling.
 */
export function buildSnapshot(fetches: RepoFetch[], fetchedAt: string): Snapshot {
  const repos: Snapshot['repos'] = {};
  const releases: Snapshot['releases'] = {};
  for (const f of fetches) {
    const entries = toReleaseEntries(f.fullName, f.releases);
    repos[f.fullName] = toRepoEntry(f.repo, f.latestCommit, latestRelease(entries), f.commitActivity);
    releases[f.fullName] = entries;
  }
  return { fetchedAt, repos, releases };
}
