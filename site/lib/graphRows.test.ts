import { readFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { emptyCitations, type Citations } from './citationsSchema';
import { graphRows, type GraphPerson, type GraphProject, type GraphPublication, type GraphRowsInput, type GraphSoftware, type GraphTopic } from './graphRows';
import { filterRows } from './networkOptions';
import * as s from './schemas';
import { toTagInfo } from './views';

const BASE = '/livermetabolism-site/';

const tags: GraphTopic[] = [
  { tag: 'AI', slug: 'ai' },
  { tag: 'Digital Twins', slug: 'digital-twins' },
];

const people: GraphPerson[] = [
  { id: 'ada', name: 'Ada L.', role: ['Group Leader'], status: 'current', tags: [] },
  { id: 'bob', name: 'Bob B.', role: [], status: 'alumni', tags: [] },
];

const publications: GraphPublication[] = [
  { id: 'Ada2026_ai', title: 'Deep liver', year: 2026, journal: 'Journal of Hepatology', journal_short: 'J Hepatol', people: ['ada', 'bob'], tags: ['AI'], doi: '10.1000/ai' },
  { id: 'Bob2025_twin', title: 'A twin', year: 2025, journal: 'Nature', journal_short: null, people: ['bob', 'ghost'], tags: ['Digital Twins', 'AI'], doi: null },
];

const projects: GraphProject[] = [
  { id: 'atlas', title: 'ATLAS decision support', people: ['ada'], publications: ['Ada2026_ai', 'missing_pub'], tags: ['AI'], images: ['atlas.webp'] },
];

const software: GraphSoftware[] = [
  { id: 'sbmlutils', name: 'sbmlutils', title: 'SBML tools', people: ['ada'], publications: ['Bob2025_twin'], tags: ['Digital Twins'], image: 'sbmlutils.webp' },
];

const citations: Citations = {
  fetchedAt: '2026-09-12T00:00:00.000Z',
  works: { '10.1000/ai': { openalexId: 'W1', citedByCount: 17, isOa: true, oaStatus: 'gold', countsByYear: [] } },
};

function input(over: Partial<GraphRowsInput> = {}): GraphRowsInput {
  return {
    tags, people, publications, projects, software, citations, base: BASE, assetBase: BASE,
    thumbs: new Set(['assets/image/graph/people/ada.webp']),
    ...over,
  };
}

describe('graphRows', () => {
  const rows = graphRows(input());
  const byId = new Map(rows.nodes.map((n) => [n.id, n]));
  const linkKeys = new Set(rows.links.map((l) => `${l.source}->${l.target}:${l.kind}`));

  it('makes one node per person, publication, project and software entry, and none per research area', () => {
    const count = (type: string) => rows.nodes.filter((n) => n.type === type).length;
    expect(count('person')).toBe(2);
    expect(count('publication')).toBe(2);
    expect(count('project')).toBe(1);
    expect(count('software')).toBe(1);
    expect(rows.nodes).toHaveLength(6);
    // the five research areas filter the graph, they are not in it
    expect(rows.nodes.some((n) => n.id.startsWith('topic:'))).toBe(false);
  });

  it('prefixes ids with the node type and keeps them unique', () => {
    expect([...byId.keys()]).toContain('person:ada');
    expect([...byId.keys()]).toContain('publication:Ada2026_ai');
    expect([...byId.keys()]).toContain('project:atlas');
    expect([...byId.keys()]).toContain('software:sbmlutils');
    expect(byId.size).toBe(rows.nodes.length);
  });

  it('links every endpoint to an existing node', () => {
    for (const link of rows.links) {
      expect(byId.has(link.source)).toBe(true);
      expect(byId.has(link.target)).toBe(true);
    }
  });

  it('draws an author link per people entry of a publication, skipping unknown ids', () => {
    expect(linkKeys).toContain('publication:Ada2026_ai->person:ada:author');
    expect(linkKeys).toContain('publication:Ada2026_ai->person:bob:author');
    expect(linkKeys).toContain('publication:Bob2025_twin->person:bob:author');
    expect(rows.links.filter((l) => l.kind === 'author')).toHaveLength(3);
  });

  it('draws no research-area link at all', () => {
    expect(rows.links.some((l) => l.source.startsWith('topic:') || l.target.startsWith('topic:'))).toBe(false);
    expect(rows.links.map((l) => l.kind)).not.toContain('topic');
  });

  it('links a project and a software entry to their publications', () => {
    expect(linkKeys).toContain('project:atlas->publication:Ada2026_ai:project');
    expect(linkKeys).toContain('software:sbmlutils->publication:Bob2025_twin:software');
    expect(rows.links.some((l) => l.target === 'publication:missing_pub')).toBe(false);
  });

  it('links a person to the projects and software they belong to', () => {
    expect(linkKeys).toContain('person:ada->project:atlas:member');
    expect(linkKeys).toContain('person:ada->software:sbmlutils:member');
  });

  it('deduplicates links', () => {
    const dup = graphRows(input({ projects: [{ ...projects[0], people: ['ada', 'ada'], publications: ['Ada2026_ai', 'Ada2026_ai'] }] }));
    const keys = dup.links.map((l) => `${l.source}->${l.target}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('derives a person’s topics from the union of their publications’ tags', () => {
    expect(byId.get('person:ada')?.topics).toEqual(['ai']);
    expect(byId.get('person:bob')?.topics).toEqual(['ai', 'digital-twins']);
    expect(byId.get('publication:Bob2025_twin')?.topics).toEqual(['digital-twins', 'ai']);
    // projects and software carry their own tags' slugs
    expect(byId.get('project:atlas')?.topics).toEqual(['ai']);
    expect(byId.get('software:sbmlutils')?.topics).toEqual(['digital-twins']);
  });

  it('carries a publication’s citation count beside its degree, 0 without a DOI or entry', () => {
    expect(byId.get('publication:Ada2026_ai')?.citations).toBe(17);
    expect(byId.get('publication:Bob2025_twin')?.citations).toBe(0);
    expect(graphRows(input({ citations: emptyCitations() })).nodes.find((n) => n.id === 'publication:Ada2026_ai')?.citations).toBe(0);
    // only a publication has one: the tooltip is the only place it is shown
    for (const node of rows.nodes) if (node.type !== 'publication') expect(node.citations).toBeNull();
  });

  it('counts the connected items as the value of every node type', () => {
    expect(byId.get('person:ada')?.value).toBe(3); // one publication, one project, one software
    expect(byId.get('project:atlas')?.value).toBe(2); // one publication, one member
    expect(byId.get('publication:Ada2026_ai')?.value).toBe(3); // two authors, one project
    expect(byId.get('publication:Bob2025_twin')?.value).toBe(2); // one known author, one software entry
    // every value is the node's own link count
    for (const node of rows.nodes) {
      expect(node.value).toBe(rows.links.filter((l) => l.source === node.id || l.target === node.id).length);
    }
  });

  it('builds every href from the base path', () => {
    for (const node of rows.nodes) expect(node.href.startsWith(BASE)).toBe(true);
    expect(byId.get('person:ada')?.href).toBe(`${BASE}people/#person/ada`);
    expect(byId.get('project:atlas')?.href).toBe(`${BASE}projects/#project/atlas`);
    expect(byId.get('software:sbmlutils')?.href).toBe(`${BASE}research/#software/sbmlutils`);
    expect(byId.get('publication:Ada2026_ai')?.href).toBe(`${BASE}publications/#publication/Ada2026_ai`);
    const local = graphRows(input({ base: '/' }));
    expect(local.nodes.find((n) => n.id === 'person:ada')?.href).toBe('/people/#person/ada');
  });

  it('gives a photo to people only, and only when the file exists', () => {
    expect(byId.get('person:ada')?.image).toBe(`${BASE}assets/image/graph/people/ada.webp`);
    expect(byId.get('person:bob')?.image).toBeNull();
    // projects and software are drawn as shapes now
    expect(byId.get('project:atlas')?.image).toBeNull();
    expect(byId.get('software:sbmlutils')?.image).toBeNull();
    expect(byId.get('publication:Ada2026_ai')?.image).toBeNull();
    // a project thumbnail lying around is not picked up any more
    const withStale = graphRows(input({ thumbs: new Set(['assets/image/graph/projects/atlas.webp']) }));
    expect(withStale.nodes.find((n) => n.id === 'project:atlas')?.image).toBeNull();
  });

  it('prefixes page hrefs with a locale base, but a photo with the asset base only', () => {
    // `base` carries a locale prefix (a German page); `assetBase` never does -
    // the thumbnail is not duplicated under /de/.
    const localeRows = graphRows(input({ base: `${BASE}de/`, assetBase: BASE }));
    const byLocaleId = new Map(localeRows.nodes.map((n) => [n.id, n]));
    expect(byLocaleId.get('person:ada')?.href).toBe(`${BASE}de/people/#person/ada`);
    expect(byLocaleId.get('person:ada')?.image).toBe(`${BASE}assets/image/graph/people/ada.webp`);
  });

  it('labels nodes and adds a detail line per type', () => {
    expect(byId.get('person:ada')).toMatchObject({ label: 'Ada L.', detail: 'Group Leader' });
    expect(byId.get('person:bob')?.detail).toBe('Alumni');
    expect(byId.get('publication:Ada2026_ai')).toMatchObject({ label: 'Deep liver', detail: '2026 · J Hepatol' });
    expect(byId.get('publication:Bob2025_twin')?.detail).toBe('2025 · Nature');
    expect(byId.get('software:sbmlutils')).toMatchObject({ label: 'sbmlutils', detail: 'SBML tools' });
    expect(byId.get('project:atlas')?.label).toBe('ATLAS decision support');
  });
});

describe('graphRows over the real data', () => {
  const rows = (name: string) => load(readFileSync(`data/${name}.yml`, 'utf8')) as Record<string, unknown>[];
  const parse = <T>(name: string, schema: { array: () => { parse: (v: unknown) => T[] } }): T[] => schema.array().parse(rows(name));
  const withIds = <T extends { id?: string }>(items: T[]): (T & { id: string })[] => items.map((i) => ({ ...i, id: i.id as string }));

  const thumbDir = 'public/assets/image/graph';
  const thumbs = new Set(
    readdirSync(thumbDir, { withFileTypes: true, recursive: true })
      .filter((e) => e.isFile())
      .map((e) => `${e.parentPath.replace(/^public\//, '')}/${e.name}`),
  );

  const data = {
    tags: toTagInfo(parse('tags', s.tagSchema)),
    people: withIds(parse('people', s.personSchema)),
    publications: withIds(parse('publications', s.publicationSchema)),
    projects: withIds(parse('projects', s.projectSchema)),
    software: withIds(parse('software', s.softwareSchema)),
  };
  const graph = graphRows({ ...data, citations: emptyCitations(), base: '/', assetBase: '/', thumbs });
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));

  it('has one node per row of every table and 210 nodes with 310 links in total', () => {
    expect(graph.nodes.filter((n) => n.type === 'person')).toHaveLength(data.people.length);
    expect(graph.nodes.filter((n) => n.type === 'publication')).toHaveLength(data.publications.length);
    expect(graph.nodes.filter((n) => n.type === 'project')).toHaveLength(data.projects.length);
    expect(graph.nodes.filter((n) => n.type === 'software')).toHaveLength(data.software.length);
    expect(byId.size).toBe(graph.nodes.length);
    expect(graph.nodes).toHaveLength(210);
    expect(graph.links).toHaveLength(310);
  });

  it('links only existing nodes and draws no duplicate edge', () => {
    for (const link of graph.links) {
      expect(byId.has(link.source)).toBe(true);
      expect(byId.has(link.target)).toBe(true);
    }
    const keys = graph.links.map((l) => `${l.source}->${l.target}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('gives every person a photo and nothing else an image, and every node a base-relative href', () => {
    for (const node of graph.nodes) {
      expect(node.href.startsWith('/')).toBe(true);
      if (node.type === 'person') expect(node.image).not.toBeNull();
      else expect(node.image).toBeNull();
    }
  });

  it('has 23 people without a single link, which the drawn view drops', () => {
    const isolated = graph.nodes.filter((n) => !graph.links.some((l) => l.source === n.id || l.target === n.id));
    // people with no publication, project or software entry of their own
    expect(isolated.every((n) => n.type === 'person')).toBe(true);
    expect(isolated).toHaveLength(23);
    // filterRows() draws only what is connected (see networkOptions.ts)
    const view = filterRows(graph, null);
    expect(view.nodes).toHaveLength(graph.nodes.length - isolated.length);
    expect(view.nodes).toHaveLength(187);
    for (const node of view.nodes) {
      expect(view.links.some((l) => l.source === node.id || l.target === node.id)).toBe(true);
    }
  });

  it('keeps every topic of every node a known slug', () => {
    const slugs = new Set(data.tags.map((t) => t.slug));
    for (const node of graph.nodes) for (const topic of node.topics) expect(slugs.has(topic)).toBe(true);
  });
});
