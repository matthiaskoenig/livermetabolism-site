import { describe, expect, it } from 'vitest';
import { emptySnapshot, releaseEntrySchema, repoEntrySchema, snapshotSchema, SNAPSHOT_URL, type Snapshot } from './githubSchema';

const repo = {
  name: 'sbmlutils',
  owner: 'matthiaskoenig',
  fullName: 'matthiaskoenig/sbmlutils',
  description: 'Python utilities for SBML',
  htmlUrl: 'https://github.com/matthiaskoenig/sbmlutils',
  homepage: null,
  stars: 42,
  forks: 7,
  openIssues: 3,
  language: 'Python',
  license: 'MIT',
  topics: ['sbml'],
  pushedAt: '2026-09-08T20:30:07Z',
  archived: false,
  defaultBranch: 'develop',
  latestCommit: { sha: 'a2809f1', date: '2026-09-08T20:26:03Z', message: 'Release 0.10.2', htmlUrl: 'https://github.com/x/y/commit/a2809f1' },
  latestRelease: { tag: '0.10.2', name: '0.10.2', publishedAt: '2026-09-08T20:30:07Z', htmlUrl: 'https://github.com/x/y/releases/tag/0.10.2' },
  commitActivity: [{ week: '2026-09-06', total: 12 }],
};

const snapshot: Snapshot = {
  fetchedAt: '2026-09-12T05:00:00.000Z',
  repos: { 'matthiaskoenig/sbmlutils': repo },
  releases: {
    'matthiaskoenig/sbmlutils': [
      { tag: '0.10.2', name: '0.10.2', publishedAt: '2026-09-08T20:30:07Z', htmlUrl: 'https://github.com/x/y/releases/tag/0.10.2', prerelease: false, summary: 'antimony is excluded on Windows.' },
    ],
  },
};

describe('snapshotSchema', () => {
  it('parses a complete snapshot', () => {
    expect(snapshotSchema.parse(snapshot)).toEqual(snapshot);
  });

  it('accepts null latestCommit / latestRelease and an empty activity list', () => {
    const parsed = repoEntrySchema.parse({ ...repo, latestCommit: null, latestRelease: null, commitActivity: [] });
    expect(parsed.latestRelease).toBeNull();
    expect(parsed.commitActivity).toEqual([]);
  });

  it('rejects an unknown top-level key', () => {
    expect(() => snapshotSchema.parse({ ...snapshot, contributions: {} })).toThrow();
  });

  it('rejects an unknown key inside a repo or release entry', () => {
    expect(() => repoEntrySchema.parse({ ...repo, watchers: 3 })).toThrow();
    expect(() => releaseEntrySchema.parse({ ...snapshot.releases['matthiaskoenig/sbmlutils'][0], body: '<b>html</b>' })).toThrow();
  });

  it('rejects a missing or mistyped field', () => {
    const { stars: _stars, ...withoutStars } = repo;
    expect(() => repoEntrySchema.parse(withoutStars)).toThrow();
    expect(() => repoEntrySchema.parse({ ...repo, stars: '42' })).toThrow();
  });

  it('parses emptySnapshot(), which is older than any real snapshot', () => {
    const empty = emptySnapshot();
    expect(snapshotSchema.parse(empty)).toEqual(empty);
    expect(empty.fetchedAt < snapshot.fetchedAt).toBe(true);
    expect(Object.keys(empty.repos)).toEqual([]);
  });

  it('points at the github-data branch of this repository', () => {
    expect(SNAPSHOT_URL).toBe('https://raw.githubusercontent.com/matthiaskoenig/livermetabolism-site/github-data/github.json');
  });
});
