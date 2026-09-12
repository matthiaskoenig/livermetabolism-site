import { beforeEach, describe, expect, it } from 'vitest';
import { applyStats, refreshRelativeDates } from './githubStats';
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
  <p data-github-note>updated <time data-field="updated" data-iso="2026-09-01T05:00:00.000Z">2 weeks ago</time></p>`;

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
});
