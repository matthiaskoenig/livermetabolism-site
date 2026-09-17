import { beforeEach, describe, expect, it } from 'vitest';
import { applyStats, refreshRelativeDates } from './githubStats';
import { emptySnapshot } from './githubSchema';
import type { Snapshot } from './githubSchema';

const now = new Date('2026-09-12T00:00:00Z');

const snapshot: Snapshot = {
  fetchedAt: '2026-09-12T05:00:00.000Z',
  repos: {
    'matthiaskoenig/sbmlutils': {
      name: 'sbmlutils', owner: 'matthiaskoenig', fullName: 'matthiaskoenig/sbmlutils',
      description: null, htmlUrl: 'https://github.com/matthiaskoenig/sbmlutils', homepage: null,
      stars: 41, forks: 7, openIssues: 3, language: 'Python', license: null, topics: [],
      pushedAt: '2026-09-08T20:30:07Z', archived: false, defaultBranch: 'develop',
      latestCommit: null,
      latestRelease: { tag: '0.10.2', name: '0.10.2', publishedAt: '2026-09-08T20:30:07Z', htmlUrl: 'https://github.com/matthiaskoenig/sbmlutils/releases/tag/0.10.2' },
      commitActivity: [],
    },
    // keyed by the data/software.yml name; GitHub renamed it since
    'matthiaskoenig/libsbgn-python': {
      name: 'libsbgnpy', owner: 'matthiaskoenig', fullName: 'matthiaskoenig/libsbgnpy',
      description: null, htmlUrl: 'https://github.com/matthiaskoenig/libsbgnpy', homepage: null,
      stars: 12, forks: 2, openIssues: 11, language: 'JavaScript', license: 'MIT', topics: [],
      pushedAt: '2026-09-08T09:53:21Z', archived: false, defaultBranch: 'main',
      latestCommit: null,
      latestRelease: { tag: '0.6.1', name: '0.6.1', publishedAt: '2026-09-07T10:00:00Z', htmlUrl: 'https://github.com/matthiaskoenig/libsbgnpy/releases/tag/0.6.1' },
      commitActivity: [],
    },
  },
  releases: {},
};

const markup = `
  <p class="software-stats" data-repo="matthiaskoenig/sbmlutils">
    <a class="software-stat" href="https://github.com/x"><span data-field="release">0.9.0</span></a>
    <span class="software-stat"><span data-field="stars">1</span></span>
    <span class="software-stat"><span data-field="issues">0 open</span></span>
    <span class="software-stat"><span data-field="pushed" data-iso="2026-09-11T00:00:00Z">yesterday</span></span>
    <span class="software-stat"><span data-field="language">C</span></span>
    <span class="software-stat"><span data-field="license">MIT</span></span>
  </p>
  <p class="software-stats" data-repo="other/unknown"><span class="software-stat"><span data-field="stars">7</span></span></p>
  <p class="software-stats" data-repo="matthiaskoenig/libsbgn-python">
    <a class="software-stat" href="https://github.com/matthiaskoenig/libsbgn-python" hidden><span data-field="release"></span></a>
    <span class="software-stat" hidden><span data-field="stars"></span></span>
    <span class="software-stat" hidden><span data-field="pushed"></span></span>
    <span class="software-stat" hidden><span data-field="license"></span></span>
  </p>
  <p data-github-note data-release-template="Release {tag} · {date}" data-releases-label="Releases" data-issues-open-template="{count} open">updated <time data-field="updated" data-empty="never" data-iso="2026-09-01T05:00:00.000Z">2 weeks ago</time></p>`;

const el = (selector: string) => document.querySelector<HTMLElement>(selector)!;

beforeEach(() => { document.body.innerHTML = markup; });

describe('applyStats', () => {
  it('patches every field of a covered card', () => {
    applyStats(snapshot, document, now);
    const line = el('.software-stats[data-repo="matthiaskoenig/sbmlutils"]');
    expect(line.querySelector('[data-field="release"]')!.textContent).toBe('0.10.2');
    expect(line.querySelector('a')!.getAttribute('href')).toBe('https://github.com/matthiaskoenig/sbmlutils/releases/tag/0.10.2');
    expect(line.querySelector('[data-field="stars"]')!.textContent).toBe('41');
    expect(line.querySelector('[data-field="issues"]')!.textContent).toBe('3 open');
    expect(line.querySelector('[data-field="pushed"]')!.textContent).toBe('4 days ago');
    expect(line.querySelector('[data-field="language"]')!.textContent).toBe('Python');
    // absolute, because nothing re-renders a title attribute later
    expect(line.querySelector('a')!.title).toBe('Release 0.10.2 · 8 Sep 2026');
  });

  it('patches a card by its snapshot key, not by the name GitHub uses today', () => {
    // the snapshot keeps `matthiaskoenig/libsbgn-python` (data/software.yml)
    // while the repository is called `libsbgnpy` on GitHub now
    applyStats(snapshot, document, now);
    const line = el('.software-stats[data-repo="matthiaskoenig/libsbgn-python"]');
    expect(line.querySelector('[data-field="release"]')!.textContent).toBe('0.6.1');
    expect(line.querySelector('a')!.getAttribute('href')).toBe('https://github.com/matthiaskoenig/libsbgnpy/releases/tag/0.6.1');
  });

  it('fills in a line the build rendered empty (build without a snapshot)', () => {
    const line = el('.software-stats[data-repo="matthiaskoenig/libsbgn-python"]');
    for (const stat of line.querySelectorAll('.software-stat')) expect((stat as HTMLElement).hidden).toBe(true);
    applyStats(snapshot, document, now);
    expect(el('.software-stats[data-repo="matthiaskoenig/libsbgn-python"] [data-field="stars"]').textContent).toBe('12');
    for (const stat of line.querySelectorAll('.software-stat')) expect((stat as HTMLElement).hidden).toBe(false);
  });

  it('hides a field the snapshot does not have and keeps an unknown card untouched', () => {
    applyStats(snapshot, document, now);
    expect(el('[data-field="license"]').closest('.software-stat')!.hasAttribute('hidden')).toBe(true);
    expect(el('.software-stats[data-repo="other/unknown"] [data-field="stars"]').textContent).toBe('7');
  });

  it('updates the "updated" note', () => {
    applyStats(snapshot, document, now);
    const note = el('[data-github-note] [data-field="updated"]');
    expect(note.textContent).toBe('today');
    expect(note.dataset.iso).toBe(snapshot.fetchedAt);
  });

  it('calls the empty snapshot\'s epoch "never" rather than 56 years ago', () => {
    applyStats(emptySnapshot(), document, now);
    expect(el('[data-github-note] [data-field="updated"]').textContent).toBe('never');
  });

  it('inserts text, never markup', () => {
    const evil = structuredClone(snapshot);
    evil.repos['matthiaskoenig/sbmlutils']!.language = '<img src=x onerror=alert(1)>';
    applyStats(evil, document, now);
    const cell = el('[data-field="language"]');
    expect(cell.children.length).toBe(0);
    expect(cell.textContent).toBe('<img src=x onerror=alert(1)>');
  });
});

describe('refreshRelativeDates', () => {
  it('re-renders every timestamped field against the current date', () => {
    refreshRelativeDates(document, now);
    expect(el('[data-field="pushed"]').textContent).toBe('yesterday');
    expect(el('[data-field="updated"]').textContent).toBe('2 weeks ago');
    refreshRelativeDates(document, new Date('2026-10-12T00:00:00Z'));
    expect(el('[data-field="pushed"]').textContent).toBe('1 month ago');
  });

  it('renders the epoch as the field\'s data-empty text', () => {
    el('[data-field="updated"]').dataset.iso = new Date(0).toISOString();
    refreshRelativeDates(document, now);
    expect(el('[data-field="updated"]').textContent).toBe('never');
  });
});
