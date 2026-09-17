import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { emptyCitations, type Citations } from './citationsSchema';
import { buildRelations, detailIds, detailModel, listAnchor, type DetailContext } from './details';
import { emptySnapshot, type Snapshot } from './githubSchema';
import { uiFor } from './i18n/catalog';
import { emptyScholar } from './scholarSchema';
import type { PeopleMap } from './people';
import * as s from './schemas';
import { toTagInfo } from './views';
import type { Entry, TagInfo } from './views';

const { t } = uiFor('en');

const BASE = '/livermetabolism-site/';

const tagInfo: TagInfo[] = [
  { tag: 'AI', slug: 'ai', icon: 'fa-cogs', short_description: 'AI', description: 'AI', vision: 'AI' },
  { tag: 'Digital Twins', slug: 'digital-twins', icon: 'fa-cube', short_description: 'DT', description: 'DT', vision: 'DT' },
];

const people: Entry<s.PersonData>[] = [
  {
    id: 'ada', status: 'current', tenure: '2020-2026', name: 'Ada Lovelace', role: ['Group Leader', 'PI'],
    image: 'ada.webp', orcid: '0000-0001-0000-0001', repository: 'https://github.com/ada', homepage: 'https://ada.example',
    affiliation: 'University of Lübeck', description: '<p>Works on livers.</p>',
  },
  { id: 'bob', status: 'alumni', tenure: '2018-2021', name: 'Bob Brown', role: ['PhD Student'], image: null, end_year: 2021 },
];

const publications: Entry<s.PublicationData>[] = [
  {
    id: 'Ada2026_ai', tags: ['AI'], people: ['ada', 'bob'], year: 2026, date: '2026-01-15', authors: 'Ada Lovelace, Bob Brown',
    title: 'Deep liver', journal: 'Journal of Hepatology', journal_short: 'J Hepatol', status: 'publication',
    position: 'first', keywords: ['liver', 'ai'], doi: '10.1000/ai', pmid: 12345, pdf: 'publication/Ada2026_ai.pdf',
    homepage: 'https://deepliver.example', repository: 'https://github.com/ada/deepliver', abstract: '<p>An abstract.</p>',
  },
  {
    id: 'Bob2025_twin', tags: ['Digital Twins'], people: ['bob'], year: 2025, date: null, authors: 'Bob Brown',
    title: 'A twin', journal: 'Nature', status: 'preprint', position: 'last', keywords: [],
  },
];

const projects: Entry<s.ProjectData>[] = [
  {
    id: 'atlas', tags: ['AI'], people: ['ada'], title: 'ATLAS', status: 'current', publications: ['Ada2026_ai', 'missing_pub'],
    homepage: 'https://atlas.example', repository: 'https://github.com/ada/atlas', cooperation_partners: 'Charité, EMBL',
    images: ['atlas.webp'], abstract: '<p>Decision support.</p>',
  },
];

const software: Entry<s.SoftwareData>[] = [
  {
    id: 'sbmlutils', tags: ['Digital Twins'], people: ['ada'], type: 'software', name: 'sbmlutils', title: 'SBML tools',
    description: 'Utilities for SBML.', image: 'sbmlutils.webp', publications: ['Bob2025_twin'],
    homepage: 'https://sbmlutils.example', repository: 'https://github.com/matthiaskoenig/sbmlutils', doi: '10.5281/zenodo.1',
  },
];

const news: Entry<s.NewsData>[] = [
  {
    id: 'award', tags: ['AI'], people: ['ada'], status: 'current', title: 'Award', date: '2026-02-01',
    image: 'award.webp', link: '/assets/pdf/publication/Ada2026_ai.pdf', short: 'Short text.', abstract: '<p>Long text.</p>',
  },
];

const presentations: Entry<s.PresentationData>[] = [
  {
    id: 'talk1', tags: ['AI'], people: ['ada'], type: 'invited_talk', title: 'A talk', authors: 'Ada Lovelace',
    image: 'presentation/talk1.webp', event: 'COMBINE 2026', date: '2026-03-01', publications: ['Ada2026_ai'], keywords: [],
  },
];

const posters: Entry<s.PosterData>[] = [
  {
    id: 'poster1', tags: ['AI'], people: ['bob'], year: 2025, date: '2025-06-01', pdf: 'poster/poster1.pdf',
    image: 'poster/poster1.webp', authors: 'Bob Brown', affiliations: 'HU', title: 'A poster', event: 'ICSB 2025',
    keywords: [], abstract: 'Poster abstract.',
  },
];

const peopleMap: PeopleMap = { ada: { id: 'ada', name: 'Ada Lovelace', image: 'ada.webp' }, bob: { id: 'bob', name: 'Bob Brown', image: null } };

const citations: Citations = {
  fetchedAt: '2026-09-12T00:00:00.000Z',
  works: { '10.1000/ai': { openalexId: 'W1', citedByCount: 17, isOa: true, oaStatus: 'gold', countsByYear: [] } },
};

const snapshot: Snapshot = {
  fetchedAt: '2026-09-12T00:00:00.000Z',
  repos: {
    'matthiaskoenig/sbmlutils': {
      name: 'sbmlutils', owner: 'matthiaskoenig', fullName: 'matthiaskoenig/sbmlutils',
      description: null, htmlUrl: 'https://github.com/matthiaskoenig/sbmlutils', homepage: null,
      stars: 42, forks: 7, openIssues: 3, language: 'Python', license: 'LGPL-3.0', topics: [],
      pushedAt: '2026-09-08T00:00:00Z', archived: false, defaultBranch: 'develop', latestCommit: null,
      latestRelease: { tag: '0.9.1', name: '0.9.1', publishedAt: '2026-09-01T00:00:00Z', htmlUrl: 'https://github.com/matthiaskoenig/sbmlutils/releases/tag/0.9.1' },
      commitActivity: [],
    },
  },
  releases: {},
};

function ctx(over: Partial<DetailContext> = {}): DetailContext {
  return {
    people, publications, projects, software, news, presentations, posters,
    tags: tagInfo, peopleMap, github: snapshot, scholar: emptyScholar(), citations, base: BASE, assetBase: BASE, t,
    ...over,
  };
}

describe('listAnchor', () => {
  it('points at the card or row of every type, with the base path', () => {
    expect(listAnchor('person', 'ada', BASE)).toBe(`${BASE}people/#person-ada`);
    expect(listAnchor('publication', 'Ada2026_ai', BASE)).toBe(`${BASE}publications/#pub-Ada2026_ai`);
    expect(listAnchor('project', 'atlas', BASE)).toBe(`${BASE}projects/#project-atlas`);
    expect(listAnchor('software', 'sbmlutils', BASE)).toBe(`${BASE}research/#software-sbmlutils`);
    expect(listAnchor('news', 'award', BASE)).toBe(`${BASE}news/#news-award`);
    expect(listAnchor('presentation', 'talk1', BASE)).toBe(`${BASE}publications/#presentation-talk1`);
    expect(listAnchor('poster', 'poster1', BASE)).toBe(`${BASE}publications/#poster-poster1`);
    expect(listAnchor('person', 'ada', '/')).toBe('/people/#person-ada');
  });
});

describe('buildRelations', () => {
  const rel = buildRelations(ctx());

  it('indexes every row of the five detail tables', () => {
    expect([...rel.person.keys()]).toEqual(['ada', 'bob']);
    expect([...rel.publication.keys()]).toEqual(['Ada2026_ai', 'Bob2025_twin']);
    expect([...rel.project.keys()]).toEqual(['atlas']);
    expect([...rel.software.keys()]).toEqual(['sbmlutils']);
    expect([...rel.news.keys()]).toEqual(['award']);
  });

  it('relates a person to everything that lists them, symmetrically', () => {
    expect(rel.person.get('ada')).toEqual({
      publications: ['Ada2026_ai'], projects: ['atlas'], software: ['sbmlutils'], news: ['award'],
      presentations: ['talk1'], posters: [],
    });
    expect(rel.person.get('bob')).toEqual({
      publications: ['Ada2026_ai', 'Bob2025_twin'], projects: [], software: [], news: [], presentations: [], posters: ['poster1'],
    });
    expect(rel.publication.get('Ada2026_ai')?.people).toEqual(['ada', 'bob']);
    expect(rel.project.get('atlas')?.people).toEqual(['ada']);
    expect(rel.software.get('sbmlutils')?.people).toEqual(['ada']);
    expect(rel.news.get('award')?.people).toEqual(['ada']);
  });

  it('relates a publication to the projects, software and presentations that list it', () => {
    expect(rel.publication.get('Ada2026_ai')?.projects).toEqual(['atlas']);
    expect(rel.publication.get('Ada2026_ai')?.presentations).toEqual(['talk1']);
    expect(rel.publication.get('Bob2025_twin')?.software).toEqual(['sbmlutils']);
    expect(rel.project.get('atlas')?.publications).toEqual(['Ada2026_ai']);
    expect(rel.software.get('sbmlutils')?.publications).toEqual(['Bob2025_twin']);
  });

  it('drops references to rows that do not exist', () => {
    // projects.atlas lists `missing_pub`
    expect(rel.project.get('atlas')?.publications).not.toContain('missing_pub');
    const withGhost = buildRelations(ctx({ publications: [{ ...publications[0], people: ['ada', 'ghost'] }, publications[1]] }));
    expect(withGhost.publication.get('Ada2026_ai')?.people).toEqual(['ada']);
  });

  it('never repeats a relation', () => {
    const dup = buildRelations(ctx({ projects: [{ ...projects[0], people: ['ada', 'ada'], publications: ['Ada2026_ai', 'Ada2026_ai'] }] }));
    expect(dup.project.get('atlas')?.people).toEqual(['ada']);
    expect(dup.project.get('atlas')?.publications).toEqual(['Ada2026_ai']);
    expect(dup.person.get('ada')?.projects).toEqual(['atlas']);
  });
});

describe('detailIds', () => {
  it('lists every row of the five detail tables once', () => {
    const ids = detailIds(ctx());
    const count = (type: string) => ids.filter((i) => i.type === type).length;
    expect(count('person')).toBe(people.length);
    expect(count('publication')).toBe(publications.length);
    expect(count('project')).toBe(projects.length);
    expect(count('software')).toBe(software.length);
    expect(count('news')).toBe(news.length);
    expect(ids).toHaveLength(people.length + publications.length + projects.length + software.length + news.length);
    expect(new Set(ids.map((i) => `${i.type}/${i.id}`)).size).toBe(ids.length);
  });
});

describe('detailModel: person', () => {
  const model = detailModel('person', 'ada', ctx());

  it('renders the header from the person row', () => {
    expect(model).toMatchObject({
      type: 'person', id: 'ada', title: 'Ada Lovelace',
      subtitle: 'Group Leader · PI · 2020-2026 · University of Lübeck',
      image: `${BASE}assets/image/people/128/ada.webp`, imageShape: 'round',
      body: '<p>Works on livers.</p>', keywords: [],
      listHref: `${BASE}people/#person-ada`,
    });
    expect(model.badge).toBeUndefined();
    expect(model.authors).toBeUndefined();
  });

  it('collects the research areas of everything the person is credited on', () => {
    expect(model.tags).toEqual(['AI', 'Digital Twins']);
    expect(detailModel('person', 'bob', ctx()).tags).toEqual(['AI', 'Digital Twins']);
  });

  it('links homepage, ORCID and repository', () => {
    expect(model.links).toEqual([
      { label: 'Homepage', href: 'https://ada.example', icon: 'home', external: true },
      { label: 'ORCID', href: 'https://orcid.org/0000-0001-0000-0001', icon: 'orcid', external: true },
      { label: 'Repository', href: 'https://github.com/ada', icon: 'github', external: true },
    ]);
    expect(detailModel('person', 'bob', ctx()).links).toEqual([]);
  });

  it('counts the publications and sums their citations', () => {
    expect(model.figures).toEqual([
      { label: 'Publications', value: '1' },
      { label: 'Citations', value: '17' },
    ]);
    // no snapshot: the citation figure disappears, the count stays
    expect(detailModel('person', 'ada', ctx({ citations: emptyCitations() })).figures).toEqual([{ label: 'Publications', value: '1' }]);
  });

  it('shows publications, projects, software, news, presentations and posters, in that order', () => {
    expect(model.related.map((r) => r.label)).toEqual(['Publications', 'Projects', 'Software', 'News', 'Presentations']);
    expect(detailModel('person', 'bob', ctx()).related.map((r) => r.label)).toEqual(['Publications', 'Posters']);
    expect(model.related[0].rows).toEqual([
      { type: 'publication', id: 'Ada2026_ai', title: 'Deep liver', line: '2026 · J Hepatol', image: null, href: `${BASE}publications/#pub-Ada2026_ai` },
    ]);
    expect(model.related[1].rows[0]).toMatchObject({ type: 'project', id: 'atlas', title: 'ATLAS', line: 'Current', image: `${BASE}assets/image/projects/atlas.webp` });
    expect(model.related[2].rows[0]).toMatchObject({ type: 'software', id: 'sbmlutils', title: 'sbmlutils', line: 'SBML tools', image: `${BASE}assets/image/software/sbmlutils.webp` });
    expect(model.related[3].rows[0]).toMatchObject({ type: 'news', id: 'award', title: 'Award', line: '2026-02-01', image: `${BASE}assets/image/news/award.webp` });
    expect(model.related[4].rows[0]).toMatchObject({ type: 'presentation', id: 'talk1', href: `${BASE}publications/#presentation-talk1`, image: `${BASE}assets/pdf/presentation/talk1.webp` });
    expect(detailModel('person', 'bob', ctx()).related[1].rows[0]).toMatchObject({ type: 'poster', id: 'poster1', href: `${BASE}publications/#poster-poster1` });
  });
});

describe('detailModel: publication', () => {
  const model = detailModel('publication', 'Ada2026_ai', ctx());

  it('renders the header, the badge and the author line', () => {
    expect(model).toMatchObject({
      type: 'publication', id: 'Ada2026_ai', title: 'Deep liver', subtitle: 'Journal of Hepatology · 2026',
      image: null, imageShape: 'thumb', badge: { text: 'Publication', cls: 'status-publication' },
      tags: ['AI'], body: '<p>An abstract.</p>', keywords: ['liver', 'ai'],
      listHref: `${BASE}publications/#pub-Ada2026_ai`,
    });
    expect(model.authors).toEqual({ text: 'Ada Lovelace, Bob Brown', people: ['ada', 'bob'] });
  });

  it('links DOI, PubMed, PDF, homepage and repository', () => {
    expect(model.links.map((l) => l.label)).toEqual(['DOI', 'PubMed', 'PDF', 'Homepage', 'Repository']);
    expect(model.links[0].href).toBe('https://doi.org/10.1000/ai');
    expect(model.links[1].href).toBe('https://pubmed.ncbi.nlm.nih.gov/12345');
    expect(model.links[2]).toEqual({ label: 'PDF', href: `${BASE}assets/pdf/publication/Ada2026_ai.pdf`, icon: 'file-pdf-o', external: false });
    expect(detailModel('publication', 'Bob2025_twin', ctx()).links).toEqual([]);
  });

  it('shows the citation count and the open-access status of the snapshot', () => {
    expect(model.figures).toEqual([
      { label: 'Citations', value: '17', href: 'https://openalex.org/W1' },
      { label: 'Open access', value: 'gold' },
    ]);
    expect(detailModel('publication', 'Bob2025_twin', ctx()).figures).toEqual([]);
  });

  it('shows people, projects, software and presentations, in that order', () => {
    expect(model.related.map((r) => r.label)).toEqual(['People', 'Projects', 'Presentations']);
    expect(model.related[0].rows).toEqual([
      { type: 'person', id: 'ada', title: 'Ada Lovelace', line: 'Group Leader · PI', image: `${BASE}assets/image/people/128/ada.webp`, href: `${BASE}people/#person-ada` },
      { type: 'person', id: 'bob', title: 'Bob Brown', line: 'PhD Student', image: null, href: `${BASE}people/#person-bob` },
    ]);
    expect(detailModel('publication', 'Bob2025_twin', ctx()).related.map((r) => r.label)).toEqual(['People', 'Software']);
  });
});

describe('detailModel: project', () => {
  const model = detailModel('project', 'atlas', ctx());

  it('renders title, status and cooperation partners', () => {
    expect(model).toMatchObject({
      type: 'project', id: 'atlas', title: 'ATLAS', subtitle: 'Current · Charité, EMBL',
      // no header thumbnail: the gallery below already shows every image
      image: null, imageShape: 'thumb', tags: ['AI'],
      body: '<p>Decision support.</p>', figures: [], keywords: [], listHref: `${BASE}projects/#project-atlas`,
    });
    expect(model.links.map((l) => l.label)).toEqual(['Homepage', 'Repository']);
  });

  it('shows people and publications, in that order', () => {
    expect(model.related.map((r) => r.label)).toEqual(['People', 'Publications']);
    expect(model.related[1].rows.map((r) => r.id)).toEqual(['Ada2026_ai']);
  });
});

describe('detailModel: software', () => {
  const model = detailModel('software', 'sbmlutils', ctx());

  it('renders name, title and links', () => {
    expect(model).toMatchObject({
      type: 'software', id: 'sbmlutils', title: 'sbmlutils', subtitle: 'SBML tools',
      image: `${BASE}assets/image/software/sbmlutils.webp`, imageShape: 'logo',
      body: 'Utilities for SBML.', keywords: [], listHref: `${BASE}research/#software-sbmlutils`,
    });
    expect(model.links.map((l) => l.label)).toEqual(['Homepage', 'Repository', 'DOI']);
    expect(model.links[2].href).toBe('https://doi.org/10.5281/zenodo.1');
  });

  it('shows the GitHub figures of its repository', () => {
    expect(model.figures).toEqual([
      { label: 'Stars', value: '42', href: 'https://github.com/matthiaskoenig/sbmlutils' },
      { label: 'Latest release', value: '0.9.1', href: 'https://github.com/matthiaskoenig/sbmlutils/releases/tag/0.9.1' },
      { label: 'Open issues', value: '3', href: 'https://github.com/matthiaskoenig/sbmlutils' },
      { label: 'Last push', value: '8 Sep 2026' },
    ]);
    expect(detailModel('software', 'sbmlutils', ctx({ github: emptySnapshot() })).figures).toEqual([]);
  });

  it('shows people and publications, in that order', () => {
    expect(model.related.map((r) => r.label)).toEqual(['People', 'Publications']);
  });
});

describe('detailModel: news', () => {
  const model = detailModel('news', 'award', ctx());

  it('renders title, date, body and the read-more link', () => {
    expect(model).toMatchObject({
      type: 'news', id: 'award', title: 'Award', subtitle: '2026-02-01',
      image: `${BASE}assets/image/news/award.webp`, imageShape: 'thumb', tags: ['AI'],
      body: '<p>Long text.</p>', figures: [], keywords: [], listHref: `${BASE}news/#news-award`,
    });
    // a root-absolute data link carries the base path, like link() does
    expect(model.links).toEqual([{ label: 'Read more', href: `${BASE}assets/pdf/publication/Ada2026_ai.pdf`, icon: 'globe', external: true }]);
  });

  it('falls back to the short text and shows the people', () => {
    const withoutAbstract = detailModel('news', 'award', ctx({ news: [{ ...news[0], abstract: null }] }));
    expect(withoutAbstract.body).toBe('Short text.');
    expect(model.related.map((r) => r.label)).toEqual(['People']);
    expect(model.related[0].rows[0].id).toBe('ada');
  });
});

describe('detailModel: media', () => {
  it('embeds a news item’s video, and nothing when it has none', () => {
    const video = 'https://www.youtube.com/embed/Mu9oXKLtTGI';
    const withVideo = detailModel('news', 'award', ctx({ news: [{ ...news[0], image: null, video }] }));
    expect(withVideo.media).toEqual({ kind: 'video', src: video, title: 'Award' });
    // the player carries the video, so the header does not repeat its still
    expect(withVideo.image).toBeNull();
    expect(detailModel('news', 'award', ctx()).media).toBeNull();
  });

  it('shows every image of a project with its caption', () => {
    const gallery = detailModel('project', 'atlas', ctx({ projects: [{ ...projects[0], images: ['one.webp', 'two.webp'], image_title: 'Two views' }] }));
    expect(gallery.media).toEqual({
      kind: 'gallery',
      images: [`${BASE}assets/image/projects/one.webp`, `${BASE}assets/image/projects/two.webp`],
      caption: 'Two views',
    });
    // the gallery replaces the header thumbnail, and a missing image_title is no caption
    expect(gallery.image).toBeNull();
    expect(detailModel('project', 'atlas', ctx()).media).toEqual({ kind: 'gallery', images: [`${BASE}assets/image/projects/atlas.webp`], caption: null });
    expect(detailModel('project', 'atlas', ctx({ projects: [{ ...projects[0], images: [] }] })).media).toBeNull();
  });

  it('gives a person, a publication and a software entry no media at all', () => {
    expect(detailModel('person', 'ada', ctx()).media).toBeNull();
    expect(detailModel('publication', 'Ada2026_ai', ctx()).media).toBeNull();
    expect(detailModel('software', 'sbmlutils', ctx()).media).toBeNull();
  });
});

describe('detailModel: failure', () => {
  it('throws on an id no table has', () => {
    expect(() => detailModel('person', 'nobody', ctx())).toThrow(/person/);
  });
});

describe('detailModel: base vs. assetBase', () => {
  // `base` carries a locale prefix (a German page); `assetBase` never does -
  // an image, PDF or a data field's own root-absolute link must not gain one.
  const localeCtx = ctx({ base: `${BASE}de/`, assetBase: BASE });

  it('prefixes page hrefs with the locale base, and images/PDFs with the asset base only', () => {
    const person = detailModel('person', 'ada', localeCtx);
    expect(person.image).toBe(`${BASE}assets/image/people/128/ada.webp`);
    expect(person.listHref).toBe(`${BASE}de/people/#person-ada`);
    expect(person.related[0].rows[0].href).toBe(`${BASE}de/publications/#pub-Ada2026_ai`);

    const pub = detailModel('publication', 'Ada2026_ai', localeCtx);
    expect(pub.links.find((l) => l.label === 'PDF')?.href).toBe(`${BASE}assets/pdf/publication/Ada2026_ai.pdf`);
    expect(pub.listHref).toBe(`${BASE}de/publications/#pub-Ada2026_ai`);

    const project = detailModel('project', 'atlas', localeCtx);
    expect(project.media).toEqual({ kind: 'gallery', images: [`${BASE}assets/image/projects/atlas.webp`], caption: null });
    expect(project.listHref).toBe(`${BASE}de/projects/#project-atlas`);

    const news = detailModel('news', 'award', localeCtx);
    expect(news.image).toBe(`${BASE}assets/image/news/award.webp`);
    // news.link is a root-absolute leftover asset path (see fixture above) -
    // the same convention `link()` in lib/url.ts treats as an asset, not a page
    expect(news.links[0]).toEqual({ label: 'Read more', href: `${BASE}assets/pdf/publication/Ada2026_ai.pdf`, icon: 'globe', external: true });
    expect(news.listHref).toBe(`${BASE}de/news/#news-award`);
  });
});

describe('the real data', () => {
  const rows = (name: string) => load(readFileSync(`data/${name}.yml`, 'utf8')) as Record<string, unknown>[];
  const parse = <T>(name: string, schema: { array: () => { parse: (v: unknown) => T[] } }): T[] => schema.array().parse(rows(name));
  const withIds = <T extends { id?: string }>(items: T[]): (T & { id: string })[] => items.map((i) => ({ ...i, id: i.id as string }));

  const real = {
    people: withIds(parse('people', s.personSchema)),
    publications: withIds(parse('publications', s.publicationSchema)),
    projects: withIds(parse('projects', s.projectSchema)),
    software: withIds(parse('software', s.softwareSchema)),
    news: withIds(parse('news', s.newsSchema)),
    presentations: withIds(parse('presentations', s.presentationSchema)),
    posters: withIds(parse('posters', s.posterSchema)),
  };
  const realCtx: DetailContext = {
    ...real,
    tags: toTagInfo(parse('tags', s.tagSchema)),
    peopleMap: Object.fromEntries(real.people.map((p) => [p.id, { id: p.id, name: p.name, image: p.image ?? null }])),
    github: emptySnapshot(), scholar: emptyScholar(), citations: emptyCitations(), base: '/', assetBase: '/', t,
  };
  const rel = buildRelations(realCtx);

  it('gives every row of the five detail tables a fragment', () => {
    const ids = detailIds(realCtx);
    const count = (type: string) => ids.filter((i) => i.type === type).length;
    expect(count('person')).toBe(real.people.length);
    expect(count('publication')).toBe(real.publications.length);
    expect(count('project')).toBe(real.projects.length);
    expect(count('software')).toBe(real.software.length);
    expect(count('news')).toBe(real.news.length);
    expect(ids).toHaveLength(real.people.length + real.publications.length + real.projects.length + real.software.length + real.news.length);
  });

  it('relates people and publications symmetrically', () => {
    for (const pub of real.publications) {
      for (const pid of pub.people) expect(rel.person.get(pid)?.publications, `${pid} <- ${pub.id}`).toContain(pub.id);
    }
    for (const [pid, r] of rel.person) {
      for (const pubId of r.publications) expect(rel.publication.get(pubId)?.people, `${pubId} <- ${pid}`).toContain(pid);
    }
  });

  it('relates publications to the projects, software and presentations that list them', () => {
    for (const project of real.projects) {
      for (const pubId of project.publications) expect(rel.publication.get(pubId)?.projects).toContain(project.id);
    }
    for (const entry of real.software) {
      for (const pubId of entry.publications) expect(rel.publication.get(pubId)?.software).toContain(entry.id);
    }
    for (const talk of real.presentations) {
      for (const pubId of talk.publications) expect(rel.publication.get(pubId)?.presentations).toContain(talk.id);
    }
  });

  it('builds a model for every fragment, with a title and base-relative hrefs', () => {
    for (const { type, id } of detailIds(realCtx)) {
      const model = detailModel(type, id, realCtx);
      expect(model.title, `${type}/${id}`).not.toBe('');
      expect(model.listHref.startsWith('/'), `${type}/${id}`).toBe(true);
      for (const section of model.related) {
        expect(section.rows.length).toBeGreaterThan(0);
        for (const row of section.rows) expect(row.href.startsWith('/'), `${type}/${id} -> ${row.id}`).toBe(true);
      }
      for (const link of model.links) expect(link.href, `${type}/${id}`).not.toBe('');
    }
  });
});
