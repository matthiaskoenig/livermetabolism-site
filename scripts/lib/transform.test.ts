import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { snapshotSchema } from '../../site/lib/githubSchema.ts';
import { apiCommitActivitySchema, apiCommitSchema, apiReleaseSchema, apiRepoSchema } from './github-client.ts';
import { buildSnapshot, latestRelease, summarize, toReleaseEntries, toRepoEntry, weeksFromParticipation } from './transform.ts';
import { z } from 'astro/zod';

const fixture = (name: string) => JSON.parse(readFileSync(`tests/fixtures/github/${name}.json`, 'utf8'));

const repoApi = apiRepoSchema.parse(fixture('repo'));
const releasesApi = z.array(apiReleaseSchema).parse(fixture('releases'));
const commitApi = apiCommitSchema.parse(fixture('commits')[0]);
const activityApi = z.array(apiCommitActivitySchema).parse(fixture('commit-activity'));

const FULL_NAME = 'matthiaskoenig/sbmlutils';

describe('toRepoEntry', () => {
  const releases = toReleaseEntries(FULL_NAME, releasesApi);
  const entry = toRepoEntry(repoApi, commitApi, latestRelease(releases), activityApi);

  it('maps the repository metadata', () => {
    expect(entry.fullName).toBe(FULL_NAME);
    expect(entry.name).toBe('sbmlutils');
    expect(entry.owner).toBe('matthiaskoenig');
    expect(entry.htmlUrl).toBe('https://github.com/matthiaskoenig/sbmlutils');
    expect(entry.license).toBe('MIT');
    expect(entry.language).toBe('HTML');
    expect(entry.stars).toBeGreaterThan(0);
    expect(entry.archived).toBe(false);
    expect(entry.defaultBranch).toBe('develop');
  });

  it('turns an empty homepage into null and keeps an unset license null', () => {
    expect(toRepoEntry({ ...repoApi, homepage: '' }, null, null, []).homepage).toBeNull();
    expect(toRepoEntry({ ...repoApi, license: null }, null, null, []).license).toBeNull();
    expect(toRepoEntry({ ...repoApi, license: { spdx_id: 'NOASSERTION' } }, null, null, []).license).toBeNull();
  });

  it('takes the latest commit with its author date and first message line', () => {
    expect(entry.latestCommit).toEqual({
      sha: commitApi.sha,
      date: '2026-09-08T20:26:03Z',
      message: 'Release 0.10.2 (#468)',
      htmlUrl: commitApi.html_url,
    });
  });

  it('reduces the latest stable release to tag, name, date and link, skipping the newer prerelease', () => {
    expect(entry.latestRelease).toEqual({
      tag: '0.10.2',
      name: '0.10.2',
      publishedAt: '2026-09-08T20:30:07Z',
      htmlUrl: 'https://github.com/matthiaskoenig/sbmlutils/releases/tag/0.10.2',
    });
  });

  it('converts the weekly commit activity to ISO dates, oldest first', () => {
    expect(entry.commitActivity).toHaveLength(52);
    expect(entry.commitActivity[0]).toEqual({ week: '2025-09-14', total: 0 });
    expect(entry.commitActivity.some((w) => w.total > 0)).toBe(true);
    const weeks = entry.commitActivity.map((w) => w.week);
    expect([...weeks].sort()).toEqual(weeks);
  });

  it('accepts a repository with no commit, release or activity', () => {
    const bare = toRepoEntry(repoApi, null, null, []);
    expect(bare.latestCommit).toBeNull();
    expect(bare.latestRelease).toBeNull();
    expect(bare.commitActivity).toEqual([]);
  });
});

describe('toReleaseEntries', () => {
  const entries = toReleaseEntries(FULL_NAME, releasesApi);

  it('drops drafts and unpublished releases', () => {
    expect(entries.map((r) => r.tag)).not.toContain('0.11.0');
    expect(toReleaseEntries(FULL_NAME, [{ ...releasesApi[0], draft: true, published_at: null }])).toEqual([]);
  });

  it('keeps prereleases and flags them', () => {
    const pre = entries.find((r) => r.tag === '0.10.3a1');
    expect(pre?.prerelease).toBe(true);
    expect(entries.filter((r) => !r.prerelease).length).toBeGreaterThan(0);
  });

  it('sorts newest first and honours the limit', () => {
    const dates = entries.map((r) => r.publishedAt);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(toReleaseEntries(FULL_NAME, releasesApi, 2)).toHaveLength(2);
  });

  it('falls back to the tag when a release has no name', () => {
    const [only] = toReleaseEntries(FULL_NAME, [{ ...releasesApi[1], name: '   ' }]);
    expect(only.name).toBe('0.10.3a1');
  });

  it('carries a plain-text summary instead of the markdown body', () => {
    const pre = entries.find((r) => r.tag === '0.10.3a1');
    expect(pre?.summary).toBe('Pre-release for testing the new annotation pipeline; create_model gains a validate flag.');
    expect(Object.keys(entries[0]).sort()).toEqual(['htmlUrl', 'name', 'prerelease', 'publishedAt', 'summary', 'tag']);
  });
});

describe('summarize', () => {
  it('returns an empty string for an empty body', () => {
    expect(summarize(null)).toBe('');
    expect(summarize('   \n\n')).toBe('');
  });

  it('skips headings, images, badges, rules and HTML', () => {
    const body = ['# Release notes for x 1.0', '![logo](https://example.org/logo.png)', '[![docs](https://img.shields.io/b.svg)](https://example.org)', '<!-- comment -->', '---', '', 'The actual change.'].join('\n');
    expect(summarize(body)).toBe('The actual change.');
  });

  it('skips the "we are pleased to release" lead-in of the house template', () => {
    const body = '# Release notes for sbmlutils 0.10.2\n\nWe are pleased to release the next version of sbmlutils including the following changes.\n\nThe unit parser now understands dimensionless units.\n';
    expect(summarize(body)).toBe('The unit parser now understands dimensionless units.');
  });

  it('strips inline markdown and collapses whitespace', () => {
    expect(summarize('A **bold** [link](https://example.org) with `code` and _emphasis_.\n\nSecond paragraph.')).toBe('A bold link with code and emphasis.');
  });

  it('joins the items when the first block is a list', () => {
    expect(summarize('## Fixes\n- fixed units\n- fixed annotations\n')).toBe('fixed units · fixed annotations');
  });

  it('cuts at a word boundary after 300 characters', () => {
    const long = `${'word '.repeat(100)}end.`;
    const short = summarize(long);
    expect(short.length).toBeLessThanOrEqual(300);
    expect(short.endsWith('…')).toBe(true);
    expect(short).not.toMatch(/ …$/);
  });
});

describe('buildSnapshot', () => {
  const snapshot = buildSnapshot(
    [
      { fullName: FULL_NAME, repo: repoApi, releases: releasesApi, latestCommit: commitApi, commitActivity: activityApi },
      { fullName: 'matthiaskoenig/visfem', repo: { ...repoApi, name: 'visfem', full_name: 'matthiaskoenig/visfem' }, releases: [], latestCommit: null, commitActivity: [] },
    ],
    '2026-09-12T05:00:00.000Z',
  );

  it('keys repos and releases by the repository name from software.yml', () => {
    expect(Object.keys(snapshot.repos)).toEqual([FULL_NAME, 'matthiaskoenig/visfem']);
    expect(Object.keys(snapshot.releases)).toEqual([FULL_NAME, 'matthiaskoenig/visfem']);
    expect(snapshot.repos[FULL_NAME].fullName).toBe(FULL_NAME);
    expect(snapshot.releases['matthiaskoenig/visfem']).toEqual([]);
    expect(snapshot.fetchedAt).toBe('2026-09-12T05:00:00.000Z');
  });

  it('produces a snapshot that parses with the shared schema', () => {
    expect(snapshotSchema.parse(snapshot)).toEqual(snapshot);
  });

  it('carries no HTML or raw markdown body', () => {
    const json = JSON.stringify(snapshot);
    expect(json).not.toContain('<img');
    expect(json).not.toContain('![');
  });
});

describe('weeksFromParticipation', () => {
  it('dates the totals back from the Sunday of the current week', () => {
    // 2026-09-12 is a Saturday; its statistics week starts on 2026-09-06.
    const weeks = weeksFromParticipation([1, 2, 3], new Date('2026-09-12T10:00:00Z'));
    const entry = toRepoEntry(repoApi, null, null, weeks);
    expect(entry.commitActivity).toEqual([
      { week: '2026-08-23', total: 1 },
      { week: '2026-08-30', total: 2 },
      { week: '2026-09-06', total: 3 },
    ]);
  });

  it('matches the weeks of the commit-activity endpoint for the same repository', () => {
    // Both fixtures were recorded on 2026-09-12 from the same repository.
    const totals = activityApi.map((w) => w.total);
    expect(weeksFromParticipation(totals, new Date('2026-09-12T10:00:00Z')).map((w) => w.week)).toEqual(activityApi.map((w) => w.week));
  });

  it('returns nothing for an empty list', () => {
    expect(weeksFromParticipation([], new Date('2026-09-12T10:00:00Z'))).toEqual([]);
  });
});
