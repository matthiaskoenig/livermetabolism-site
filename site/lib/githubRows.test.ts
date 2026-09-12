import { describe, expect, it } from 'vitest';
import { emptySnapshot, type Snapshot } from './githubSchema';
import { activityRows, hasData, latestReleases, relativeDate, releaseTimelineRows, releaseUrl, shortDate, starsRows, statsFor } from './githubRows';

const repo = (fullName: string, over: Partial<Snapshot['repos'][string]> = {}): Snapshot['repos'][string] => {
  const [owner, name] = fullName.split('/');
  return {
    name,
    owner,
    fullName,
    description: `${name} description`,
    htmlUrl: `https://github.com/${fullName}`,
    homepage: null,
    stars: 10,
    forks: 2,
    openIssues: 1,
    language: 'Python',
    license: 'MIT',
    topics: [],
    pushedAt: '2026-09-10T12:00:00Z',
    archived: false,
    defaultBranch: 'main',
    latestCommit: null,
    latestRelease: null,
    commitActivity: [],
    ...over,
  };
};

const release = (tag: string, publishedAt: string, over: Partial<Snapshot['releases'][string][number]> = {}) => ({
  tag,
  name: tag,
  publishedAt,
  htmlUrl: `https://github.com/x/y/releases/tag/${tag}`,
  prerelease: false,
  summary: `Notes for ${tag}`,
  ...over,
});

const now = new Date('2026-09-12T00:00:00Z');

const snapshot: Snapshot = {
  fetchedAt: '2026-09-12T05:00:00.000Z',
  repos: {
    'matthiaskoenig/sbmlutils': repo('matthiaskoenig/sbmlutils', {
      stars: 41,
      openIssues: 3,
      language: 'Python',
      license: 'MIT',
      pushedAt: '2026-09-08T20:30:07Z',
      latestRelease: { tag: '0.10.2', name: '0.10.2', publishedAt: '2026-09-08T20:30:07Z', htmlUrl: 'https://github.com/matthiaskoenig/sbmlutils/releases/tag/0.10.2' },
      commitActivity: [
        { week: '2026-08-30', total: 3 },
        { week: '2026-09-06', total: 12 },
      ],
    }),
    'opencobra/cobrapy': repo('opencobra/cobrapy', {
      stars: 586,
      language: null,
      license: 'GPL-2.0',
      commitActivity: [
        { week: '2026-09-06', total: 4 },
        { week: '2026-09-13', total: 1 },
      ],
    }),
    'matthiaskoenig/visfem': repo('matthiaskoenig/visfem', { stars: 0, commitActivity: [{ week: '2026-09-06', total: 0 }] }),
    // keyed by the data/software.yml name, renamed on GitHub since (fullName
    // and htmlUrl are what GitHub calls it today)
    'matthiaskoenig/libsbgn-python': repo('matthiaskoenig/libsbgn-python', {
      name: 'libsbgnpy',
      fullName: 'matthiaskoenig/libsbgnpy',
      htmlUrl: 'https://github.com/matthiaskoenig/libsbgnpy',
      stars: 12,
    }),
  },
  releases: {
    'matthiaskoenig/sbmlutils': [release('0.10.2', '2026-09-08T20:30:07Z'), release('0.10.1', '2026-05-01T10:00:00Z')],
    'opencobra/cobrapy': [release('0.32.1', '2025-06-10T10:00:00Z', { prerelease: true })],
    'matthiaskoenig/visfem': [],
    'matthiaskoenig/libsbgn-python': [release('0.6.1', '2026-09-07T10:00:00Z')],
  },
};

const repos = ['matthiaskoenig/sbmlutils', 'opencobra/cobrapy', 'matthiaskoenig/visfem', 'matthiaskoenig/libsbgn-python'];

describe('statsFor', () => {
  it('maps a repository to the fields the card stats line shows', () => {
    expect(statsFor(snapshot, 'matthiaskoenig/sbmlutils')).toEqual({
      fullName: 'matthiaskoenig/sbmlutils',
      htmlUrl: 'https://github.com/matthiaskoenig/sbmlutils',
      stars: 41,
      openIssues: 3,
      pushedAt: '2026-09-08T20:30:07Z',
      language: 'Python',
      license: 'MIT',
      release: { tag: '0.10.2', publishedAt: '2026-09-08T20:30:07Z', htmlUrl: 'https://github.com/matthiaskoenig/sbmlutils/releases/tag/0.10.2' },
    });
  });

  it('reports the key it was asked for, not the name GitHub uses today', () => {
    // the card's data-repo must be the key the browser refresh looks up again
    const stats = statsFor(snapshot, 'matthiaskoenig/libsbgn-python');
    expect(stats?.fullName).toBe('matthiaskoenig/libsbgn-python');
    expect(stats?.htmlUrl).toBe('https://github.com/matthiaskoenig/libsbgnpy');
    expect(statsFor(snapshot, 'matthiaskoenig/libsbgnpy')).toBeNull();
  });

  it('keeps a repository without a release, and returns null for an unknown one', () => {
    expect(statsFor(snapshot, 'matthiaskoenig/visfem')?.release).toBeNull();
    expect(statsFor(snapshot, 'nope/nope')).toBeNull();
    expect(statsFor(emptySnapshot(), 'matthiaskoenig/sbmlutils')).toBeNull();
  });
});

describe('latestReleases', () => {
  it('takes the newest release of each repository, newest first', () => {
    const rows = latestReleases(snapshot, repos, 730, now);
    expect(rows.map((r) => [r.repo, r.tag])).toEqual([
      ['matthiaskoenig/sbmlutils', '0.10.2'],
      ['matthiaskoenig/libsbgn-python', '0.6.1'],
      ['opencobra/cobrapy', '0.32.1'],
    ]);
    expect(rows[0]).toMatchObject({ name: 'sbmlutils', summary: 'Notes for 0.10.2', prerelease: false, htmlUrl: 'https://github.com/x/y/releases/tag/0.10.2' });
    expect(rows[2].prerelease).toBe(true);
  });

  it('drops releases older than the window and repositories without releases', () => {
    expect(latestReleases(snapshot, repos, 365, now).map((r) => r.repo)).toEqual(['matthiaskoenig/sbmlutils', 'matthiaskoenig/libsbgn-python']);
    expect(latestReleases(emptySnapshot(), repos, 730, now)).toEqual([]);
  });

  it('ignores repositories that are not in the list and duplicates in it', () => {
    const rows = latestReleases(snapshot, ['matthiaskoenig/sbmlutils', 'matthiaskoenig/sbmlutils', 'nope/nope'], 730, now);
    expect(rows.map((r) => r.repo)).toEqual(['matthiaskoenig/sbmlutils']);
  });
});

describe('releaseTimelineRows', () => {
  it('lists every release per repository oldest first, rows by most recent release', () => {
    const rows = releaseTimelineRows(snapshot, repos);
    expect(rows.map((r) => r.repo)).toEqual(['matthiaskoenig/sbmlutils', 'matthiaskoenig/libsbgn-python', 'opencobra/cobrapy']);
    expect(rows[0].name).toBe('sbmlutils');
    expect(rows[0].points.map((p) => p.tag)).toEqual(['0.10.1', '0.10.2']);
    expect(rows[0].points[0]).toEqual({ date: '2026-05-01T10:00:00Z', tag: '0.10.1' });
  });

  it('carries the repository URL once per lane, so releaseUrl can build the rest', () => {
    const rows = releaseTimelineRows(snapshot, repos);
    expect(rows[1].htmlUrl).toBe('https://github.com/matthiaskoenig/libsbgnpy');
    expect(releaseUrl(rows[1], '0.6.1')).toBe('https://github.com/matthiaskoenig/libsbgnpy/releases/tag/0.6.1');
  });
});

describe('starsRows', () => {
  it('sorts by stars, keeps only starred repositories', () => {
    const rows = starsRows(snapshot, repos);
    expect(rows.map((r) => [r.name, r.stars])).toEqual([
      ['cobrapy', 586],
      ['sbmlutils', 41],
      ['libsbgnpy', 12],
    ]);
    // keyed by the snapshot key, linked to where the repository lives now
    expect(rows[2]).toMatchObject({ repo: 'matthiaskoenig/libsbgn-python', url: 'https://github.com/matthiaskoenig/libsbgnpy' });
    expect(rows[0]).toMatchObject({ repo: 'opencobra/cobrapy', language: null, url: 'https://github.com/opencobra/cobrapy' });
  });
});

describe('activityRows', () => {
  it('aligns the weekly totals of every repository on the union of weeks', () => {
    const { weeks, series } = activityRows(snapshot, repos, 52);
    expect(weeks).toEqual(['2026-08-30', '2026-09-06', '2026-09-13']);
    expect(series.map((s) => [s.name, s.values])).toEqual([
      ['sbmlutils', [3, 12, 0]],
      ['cobrapy', [0, 4, 1]],
    ]);
  });

  it('keeps only the last `weeks` weeks and drops repositories without commits in them', () => {
    const { weeks, series } = activityRows(snapshot, repos, 1);
    expect(weeks).toEqual(['2026-09-13']);
    expect(series.map((s) => [s.repo, s.values])).toEqual([['opencobra/cobrapy', [1]]]);
  });

  it('is empty without data', () => {
    expect(activityRows(emptySnapshot(), repos)).toEqual({ weeks: [], series: [] });
  });
});

describe('relativeDate', () => {
  const at = (iso: string) => relativeDate(iso, now);
  it('formats the distance in the largest sensible unit', () => {
    expect(at('2026-09-12T00:00:00Z')).toBe('today');
    expect(at('2026-09-11T06:00:00Z')).toBe('yesterday');
    expect(at('2026-09-08T00:00:00Z')).toBe('4 days ago');
    expect(at('2026-09-01T00:00:00Z')).toBe('2 weeks ago');
    expect(at('2026-08-05T00:00:00Z')).toBe('1 month ago');
    expect(at('2026-04-12T00:00:00Z')).toBe('5 months ago');
    expect(at('2025-09-12T00:00:00Z')).toBe('1 year ago');
    expect(at('2023-01-05T10:00:00Z')).toBe('3 years ago');
  });

  it('returns an empty string for a date it cannot read', () => {
    expect(at('not a date')).toBe('');
  });
});

describe('hasData', () => {
  it('treats the empty snapshot\'s epoch timestamp as no data', () => {
    expect(hasData('2026-09-12T05:00:00.000Z')).toBe(true);
    expect(hasData(new Date(0).toISOString())).toBe(false);
    expect(hasData('nope')).toBe(false);
  });
});

describe('shortDate', () => {
  it('formats in UTC, independent of the locale', () => {
    expect(shortDate('2026-09-08T20:30:07Z')).toBe('8 Sep 2026');
    expect(shortDate('2025-01-31T23:59:59Z')).toBe('31 Jan 2025');
    expect(shortDate('nope')).toBe('');
  });
});
