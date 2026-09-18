import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { buildNewsletter, inWindow, releaseSummary, rowIds, selectNewEntries, type NewsletterInput } from './newsletter.ts';

const RANGE = { from: '2026-09-01', to: '2026-09-30' };

/** A small stand-in for one month, with one of everything the builder renders. */
function input(over: Partial<NewsletterInput> = {}): NewsletterInput {
  return {
    fetchedAt: '2026-09-30T05:00:00.000Z',
    repos: {
      'matthiaskoenig/sbmlsim': {
        htmlUrl: 'https://github.com/matthiaskoenig/sbmlsim',
        description: 'sbmlsim: SBML simulation made easy',
        stars: 8,
        language: 'Python',
      },
    },
    releases: [
      { repo: 'matthiaskoenig/sbmlsim', tag: '0.7.2', publishedAt: '2026-09-14T00:00:00Z', summary: 'A patch release of the plotting.', htmlUrl: 'https://github.com/matthiaskoenig/sbmlsim/releases/tag/0.7.2', prerelease: false },
      { repo: 'matthiaskoenig/sbmlsim', tag: '0.6.1', publishedAt: '2026-08-10T00:00:00Z', summary: 'Older, outside the window.', htmlUrl: 'https://example.invalid/old', prerelease: false },
    ],
    siteReleases: [
      { version: '0.12.0', date: '2026-09-18', summary: 'One site-wide research-area filter.' },
    ],
    commits: 72,
    entries: [
      { table: 'news', id: 'Koenig2026_Luebeck_Welcome', date: '2026-09-01', title: 'Welcomed at Lübeck', imageUrl: 'https://livermetabolism.com/assets/image/news/Koenig2026_Luebeck_Welcome.webp' },
      { table: 'publications', id: 'Balaur2026_fairification', date: '2026-09-05', title: 'FAIR assessment of computational models', imageUrl: null },
    ],
    scholar: { from: { date: '2026-09-12', citations: 3827, hIndex: 26, i10Index: 36 }, to: { date: '2026-09-18', citations: 3833, hIndex: 26, i10Index: 36 } },
    ...over,
  };
}

describe('inWindow', () => {
  it('accepts a date inside the range, inclusive at both ends', () => {
    expect(inWindow('2026-09-01T23:00:00Z', RANGE)).toBe(true);
    expect(inWindow('2026-09-30T00:00:00Z', RANGE)).toBe(true);
    expect(inWindow('2026-09-14', RANGE)).toBe(true);
  });

  it('rejects a date outside it', () => {
    expect(inWindow('2026-08-31T23:59:59Z', RANGE)).toBe(false);
    expect(inWindow('2026-10-01T00:00:00Z', RANGE)).toBe(false);
  });
});

describe('buildNewsletter', () => {
  it('titles the issue with the range it actually covers', () => {
    const md = buildNewsletter(input(), RANGE);
    expect(md).toContain('# König Lab · September 2026');
    expect(md).toContain('2026-09-01');
    expect(md).toContain('2026-09-30');
  });

  it('lists a release inside the window and drops one outside it', () => {
    const md = buildNewsletter(input(), RANGE);
    expect(md).toContain('0.7.2');
    expect(md).toContain('A patch release of the plotting.');
    expect(md).toContain('https://github.com/matthiaskoenig/sbmlsim/releases/tag/0.7.2');
    expect(md).not.toContain('Older, outside the window');
  });

  it('orders releases newest first', () => {
    const md = buildNewsletter(input({
      releases: [
        { repo: 'matthiaskoenig/sbmlsim', tag: 'old', publishedAt: '2026-09-02T00:00:00Z', summary: 'a', htmlUrl: 'https://e.invalid/a', prerelease: false },
        { repo: 'matthiaskoenig/sbmlsim', tag: 'new', publishedAt: '2026-09-20T00:00:00Z', summary: 'b', htmlUrl: 'https://e.invalid/b', prerelease: false },
      ],
    }), RANGE);
    expect(md.indexOf('new')).toBeLessThan(md.indexOf('old'));
  });

  it('marks a pre-release as one, so it is not read as a shipped version', () => {
    const md = buildNewsletter(input({
      releases: [{ repo: 'matthiaskoenig/sbmlsim', tag: '1.0.0rc1', publishedAt: '2026-09-09T00:00:00Z', summary: 'candidate', htmlUrl: 'https://e.invalid/rc', prerelease: true }],
    }), RANGE);
    expect(md).toMatch(/1\.0\.0rc1.*pre-release/s);
  });

  it('embeds an entry image as an absolute link to the original resource', () => {
    const md = buildNewsletter(input(), RANGE);
    expect(md).toContain('![Welcomed at Lübeck](https://livermetabolism.com/assets/image/news/Koenig2026_Luebeck_Welcome.webp)');
  });

  it('prints no date for an undated entry, rather than a date it did not have', () => {
    const md = buildNewsletter(input({
      entries: [{ table: 'software', id: 'x', date: '', title: 'A tool', imageUrl: null }],
    }), RANGE);
    expect(md).toContain('**A tool**');
    expect(md).not.toMatch(/\*\*A tool\*\* · 2026-09-30/);
  });

  it('renders an entry without an image as text, with no empty image tag', () => {
    const md = buildNewsletter(input(), RANGE);
    expect(md).toContain('FAIR assessment of computational models');
    expect(md).not.toContain('![FAIR assessment');
  });

  it('reports the citation change over the window the readings actually cover', () => {
    const md = buildNewsletter(input(), RANGE);
    expect(md).toContain('+6');
    // the readings start on the 12th, not on the 1st: say so rather than
    // letting the number look like a full-month figure
    expect(md).toContain('2026-09-12');
    expect(md).toContain('2026-09-18');
  });

  it('says so plainly when there are no citation readings at all', () => {
    const md = buildNewsletter(input({ scholar: null }), RANGE);
    expect(md).toContain('not available');
    expect(md).not.toContain('NaN');
  });

  it('warns when the snapshot is older than the end of the window', () => {
    const md = buildNewsletter(input({ fetchedAt: '2026-09-14T05:00:00.000Z' }), RANGE);
    expect(md).toMatch(/snapshot.*2026-09-14/i);
    expect(md).toMatch(/may be missing|incomplete/i);
  });

  it('does not warn when the snapshot covers the whole window', () => {
    const md = buildNewsletter(input(), RANGE);
    expect(md).not.toMatch(/may be missing|incomplete/i);
  });

  it('groups releases under their repository, with its description and link', () => {
    const md = buildNewsletter(input(), RANGE);
    expect(md).toContain('sbmlsim');
    expect(md).toContain('sbmlsim: SBML simulation made easy');
    expect(md).toContain('https://github.com/matthiaskoenig/sbmlsim');
  });

  it('says "1 star", not "1 stars"', () => {
    const one = buildNewsletter(input({
      repos: { 'matthiaskoenig/sbmlsim': { htmlUrl: 'https://e.invalid/r', description: 'd', stars: 1, language: 'Python' } },
    }), RANGE);
    expect(one).toContain('1 star');
    expect(one).not.toContain('1 stars');
  });

  it('orders same-day site releases by version, newest first', () => {
    const md = buildNewsletter(input({
      siteReleases: [
        { version: '0.11.1', date: '2026-09-18', summary: 'a' },
        { version: '0.12.1', date: '2026-09-18', summary: 'b' },
        { version: '0.12.0', date: '2026-09-18', summary: 'c' },
      ],
    }), RANGE);
    const order = ['0.12.1', '0.12.0', '0.11.1'].map((v) => md.indexOf(`**${v}**`));
    expect(order).toEqual([...order].sort((x, y) => x - y));
  });

  // the website is one of the tracked repositories, but it has its own
  // section built from its release notes; listing it twice is noise
  it('keeps the website out of the software releases, where it has its own section', () => {
    const md = buildNewsletter(input({
      repos: { 'matthiaskoenig/livermetabolism-site': { htmlUrl: 'https://github.com/matthiaskoenig/livermetabolism-site', description: 'König Lab Homepage', stars: 2, language: 'TypeScript' } },
      releases: [{ repo: 'matthiaskoenig/livermetabolism-site', tag: '0.12.0', publishedAt: '2026-09-18T00:00:00Z', summary: 'the filter', htmlUrl: 'https://e.invalid/site', prerelease: false }],
    }), RANGE);
    expect(md).toContain('No software releases');
    expect(md).not.toContain('https://e.invalid/site');
  });

  it('is honest about an empty month rather than printing empty sections', () => {
    const md = buildNewsletter(input({ releases: [], siteReleases: [], entries: [], commits: 0 }), RANGE);
    expect(md).toContain('No software releases');
    expect(md).not.toContain('undefined');
  });

  it('never emits an em dash, which the project forbids', () => {
    expect(buildNewsletter(input(), RANGE)).not.toContain('—');
  });
});

describe('selectNewEntries', () => {
  const range = { from: '2026-09-01', to: '2026-09-30' };
  const news = (id: string, date: string) => ({ id, date, title: `T ${id}` });

  it('reports a row that was not there before', () => {
    const got = selectNewEntries('news', [news('a', '2026-08-01')], [news('a', '2026-08-01'), news('b', '2026-09-05')], range);
    expect(got.map((e) => e.id)).toEqual(['b']);
  });

  it('ignores a row that only changed, since an edit is not news', () => {
    const got = selectNewEntries('news', [news('a', '2026-09-05')], [{ ...news('a', '2026-09-05'), title: 'edited' }], range);
    expect(got).toEqual([]);
  });

  it('ignores a backfilled entry whose own date is outside the window', () => {
    const got = selectNewEntries('news', [], [news('old', '2019-04-01')], range);
    expect(got).toEqual([]);
  });

  // software and people rows carry no date at all: they are new because they
  // appeared during the window, which is exactly what the diff establishes
  it('reports an undated row, which is how software and people entries arrive', () => {
    const got = selectNewEntries('software', [], [{ id: 'sbml2cellml', name: 'sbml2cellml', title: 'Conversion between SBML and CellML' }], range);
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({ table: 'software', id: 'sbml2cellml', title: 'Conversion between SBML and CellML' });
  });

  it('leaves the date empty for an undated row rather than inventing one', () => {
    const got = selectNewEntries('software', [], [{ id: 'x', name: 'X' }], range);
    expect(got[0]!.date).toBe('');
  });

  it('builds an absolute image URL on the live site from the stored path', () => {
    const got = selectNewEntries('news', [], [{ ...news('x', '2026-09-02'), image: 'x.webp' }], range);
    expect(got[0]!.imageUrl).toBe('https://livermetabolism.com/assets/image/news/x.webp');
  });

  it('leaves the image null for a table whose rows carry none', () => {
    const got = selectNewEntries('publications', [], [news('p', '2026-09-02')], range);
    expect(got[0]!.imageUrl).toBeNull();
  });

  // 22 preprints were renamed <id> -> <id>_preprint on 2026-09-06. An id-only
  // diff calls every one of them new; their year says otherwise.
  it('ignores a row whose year is outside the window, however its id changed', () => {
    const got = selectNewEntries('publications', [], [
      { id: 'Koenig2016_cy3sabiork_preprint', year: 2016, title: 'An old paper, renamed' },
      { id: 'Schwaiger2026_hctz_preprint', year: 2026, title: 'This year, but not this month' },
    ], range);
    expect(got).toEqual([]);
  });

  it('keeps a row whose own date is in the window even when it also has a year', () => {
    const got = selectNewEntries('publications', [], [
      { id: 'Balaur2026_fairification', year: 2026, date: '2026-09-05', title: 'Accepted this month' },
    ], range);
    expect(got.map((e) => e.id)).toEqual(['Balaur2026_fairification']);
  });

  it('falls back to the row name when it has no title', () => {
    const got = selectNewEntries('people', [], [{ id: 'jane_doe', name: 'Jane Doe' }], range);
    expect(got[0]!.title).toBe('Jane Doe');
  });
});

describe('releaseSummary', () => {
  it('keeps a summary that is already a sentence about the release', () => {
    expect(releaseSummary(['# Release notes for x 0.11.1', '', 'A patch release fixing the icons.', '']))
      .toBe('A patch release fixing the icons.');
  });

  // every issue of the group's release-notes template opens with this, so it
  // says nothing; the sentence after it is the actual summary
  it('drops the template lead-in and keeps what follows it', () => {
    const body = ['# Release notes for x 0.12.0', '', 'We are pleased to release the next version of the König Lab website, https://livermetabolism.com. This release replaces six separate tag filters with one.', ''];
    expect(releaseSummary(body)).toBe('This release replaces six separate tag filters with one.');
  });

  it('falls back to the lead-in when it is the only prose there is', () => {
    expect(releaseSummary(['# Release notes', '', 'We are pleased to release version 2.', '']))
      .toBe('We are pleased to release version 2.');
  });

  it('is empty for a file with no prose at all', () => {
    expect(releaseSummary(['# Release notes', '', '## Features', '- a thing'])).toBe('');
  });
});

describe('rowIds', () => {
  it('reads the ids of a well-formed table', () => {
    expect(rowIds("- id: 'a'\n  title: A\n- id: b\n  title: B\n")).toEqual(['a', 'b']);
  });

  it('is empty for an empty or missing file', () => {
    expect(rowIds('')).toEqual([]);
    expect(rowIds(null)).toEqual([]);
  });

  // Historical tables predate the js-yaml indentation rule (CLAUDE.md): a
  // continuation line flush with its key parses under PyYAML and throws here.
  // The baseline side of the diff only needs identity, so it must survive it.
  it('still reads the ids when the file does not parse as YAML', () => {
    const deficient = [
      "- id: 'first'",
      "  abstract: 'Digital twins are emerging",
      "  Many thanks to the organizers.'",
      '',
      "- id: 'second'",
      '  title: Second',
    ].join('\n');
    expect(() => load(deficient)).toThrow();
    expect(rowIds(deficient)).toEqual(['first', 'second']);
  });

  it('does not mistake a nested id for a row id', () => {
    expect(rowIds("- id: 'row'\n  nested:\n    - id: 'inner'\n")).toEqual(['row']);
  });
});
