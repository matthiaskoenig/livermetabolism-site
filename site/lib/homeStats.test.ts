import { describe, expect, it } from 'vitest';
import { countPeerReviewed, homeFigures, type HomeStatsInput } from './homeStats';
import { uiFor } from './i18n/catalog';

const { t } = uiFor('en');

const publications = [
  { status: 'publication' },
  { status: 'publication' },
  { status: 'review' },
  { status: 'proceeding' },
  { status: 'chapter' },
  { status: 'preprint' },
  { status: 'thesis' },
  { status: 'report' },
  { status: 'abstract' },
];

const people = [
  { status: 'current' },
  { status: 'current' },
  { status: 'current' },
  { status: 'alumni' },
  { status: 'alumni' },
];

const github = {
  fetchedAt: '2026-09-11T05:00:00.000Z',
  repos: { 'a/one': { stars: 12 }, 'a/two': { stars: 30 } },
};

const scholar = {
  fetchedAt: '2026-09-11T05:00:00.000Z',
  citations: { all: 3456 },
  hIndex: { all: 27 },
};

const input: HomeStatsInput = {
  publications,
  people,
  software: [{}, {}, {}, {}],
  funding: [{}, {}, {}],
  github,
  scholar,
};

const epoch = new Date(0).toISOString();

describe('countPeerReviewed', () => {
  it('counts publication, review, proceeding and chapter only', () => {
    expect(countPeerReviewed(publications)).toBe(5);
  });

  it('is 0 for no publications and for none that are peer-reviewed', () => {
    expect(countPeerReviewed([])).toBe(0);
    expect(countPeerReviewed([{ status: 'preprint' }, { status: 'thesis' }])).toBe(0);
  });
});

describe('homeFigures', () => {
  it('lists the six figures in the strip order', () => {
    expect(homeFigures(input, t).map((f) => f.id)).toEqual(['publications', 'citations', 'h-index', 'team', 'software', 'funding']);
  });

  it('takes every number from the data and the two snapshots', () => {
    const by = Object.fromEntries(homeFigures(input, t).map((f) => [f.id, f]));
    expect(by.publications!.value).toBe(5);
    expect(by.citations!.value).toBe(3456);
    expect(by['h-index']!.value).toBe(27);
    // current members, with the alumni on the second line
    expect(by.team!.value).toBe(3);
    expect(by.team!.sub).toBe('2 alumni');
    // one entry per software package, the stars summed over the snapshot
    expect(by.software!.value).toBe(4);
    expect(by.software!.sub).toBe('42 stars');
    expect(by.funding!.value).toBe(3);
  });

  it('labels the figures and links each one to its page', () => {
    // BASE_URL is "/" under Vitest (see url.test.ts)
    expect(homeFigures(input, t).map((f) => [f.label, f.href])).toEqual([
      ['Publications', '/publications/'],
      ['Citations', '/publications/#scholar'],
      ['h-index', '/publications/#scholar'],
      ['Team members', '/people/'],
      ['Software packages', '/research/#software'],
      ['Funded projects', '/research/#funding'],
    ]);
  });

  it('omits citations and the h-index when the Scholar snapshot is empty', () => {
    const figures = homeFigures({ ...input, scholar: { fetchedAt: epoch, citations: { all: 0 }, hIndex: { all: 0 } } }, t);
    expect(figures.map((f) => f.id)).toEqual(['publications', 'team', 'software', 'funding']);
  });

  it('omits the stars line (but not the figure) when the GitHub snapshot is empty', () => {
    const figures = homeFigures({ ...input, github: { fetchedAt: epoch, repos: {} } }, t);
    const software = figures.find((f) => f.id === 'software')!;
    expect(software.value).toBe(4);
    expect(software.sub).toBeUndefined();
    // the other five are unaffected
    expect(figures).toHaveLength(6);
  });

  it('sums the stars over every repository of the snapshot, and writes "1 star" singular', () => {
    const one = homeFigures({ ...input, github: { ...github, repos: { 'a/one': { stars: 1 } } } }, t);
    expect(one.find((f) => f.id === 'software')!.sub).toBe('1 star');
    const none = homeFigures({ ...input, github: { ...github, repos: {} } }, t);
    expect(none.find((f) => f.id === 'software')!.sub).toBe('0 stars');
  });

  it('omits no figure for empty data (a real 0 is a number, not a missing snapshot)', () => {
    const figures = homeFigures({ ...input, publications: [], people: [], software: [], funding: [] }, t);
    expect(figures.map((f) => [f.id, f.value])).toEqual([
      ['publications', 0], ['citations', 3456], ['h-index', 27], ['team', 0], ['software', 0], ['funding', 0],
    ]);
    expect(figures.find((f) => f.id === 'team')!.sub).toBe('0 alumni');
  });

  it('gives every figure a plain integer value', () => {
    for (const f of homeFigures(input, t)) expect(String(f.value)).toMatch(/^\d+$/);
  });
});
