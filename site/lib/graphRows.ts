/**
 * Pure projection of `data/*.yml` into the nodes and links of the network
 * graph (`/network/`): every person, publication, project and software entry,
 * connected by authorship and membership.
 *
 * The five research areas are **not** nodes — they filter the graph (see
 * `filterRows()` in `networkOptions.ts`), which is what the `topics` slugs on
 * every node are for.
 *
 * Free of DOM, Vue and ECharts imports (like `publicationRows.ts`), and
 * computed once in `network.astro`'s frontmatter — the rows are handed to the
 * island as props, so nothing here runs in the browser.
 *
 * Two build-time inputs come from outside the YAML: the citation snapshot
 * (`site/lib/citations.ts`, it sizes the publication nodes) and `thumbs`, the
 * set of thumbnail files that actually exist under `public/` (written by
 * `npm run graph:thumbs`, see `scripts/lib/graph-thumbs.ts`) — a node whose
 * thumbnail is missing gets `image: null` and the chart draws a plain circle.
 *
 * Every `href` is a site-internal path built from `base` (the deploy's
 * `import.meta.env.BASE_URL`, always ending in `/`) and an id the schemas
 * restrict, mirroring `url()`; the click handler of the island refuses an
 * href that does not start with the base.
 *
 * The input field sets are `Pick`s of the collection entries, so the page can
 * pass its full `Entry<PersonData>[]` etc. unchanged while the tests stay
 * small.
 */
import { citationFor } from './citations';
import type { Citations } from './citationsSchema';
import type { Entry, TagInfo } from './views';
import type { PersonData, ProjectData, PublicationData, SoftwareData } from './schemas';

export type NodeType = 'person' | 'project' | 'software' | 'publication';

export interface GraphNode {
  /** `<type>:<data id>`. */
  id: string;
  type: NodeType;
  /** Name shown on the canvas and as the first tooltip line. */
  label: string;
  /** Second tooltip line: year and journal, roles, the full title, the tool's name. */
  detail: string;
  /** Site-internal link the node navigates to on click. */
  href: string;
  /** Asset URL of the node's thumbnail, or null when there is none. */
  image: string | null;
  /** Research-area slugs this node belongs to — what the page filters by (a person's are derived from their publications). */
  topics: string[];
  /** Citations for a publication, the number of connected items for every other type. */
  value: number;
}

export interface GraphLink {
  source: string;
  target: string;
  kind: 'author' | 'project' | 'software' | 'member';
}

export interface GraphRows { nodes: GraphNode[]; links: GraphLink[] }

/** Only the tag-name-to-slug mapping is needed: the research areas are filters, not nodes. */
export type GraphTopic = Pick<TagInfo, 'tag' | 'slug'>;
export type GraphPerson = Pick<Entry<PersonData>, 'id' | 'name' | 'role' | 'status'>;
export type GraphPublication = Pick<Entry<PublicationData>, 'id' | 'title' | 'year' | 'journal' | 'journal_short' | 'people' | 'tags' | 'doi'>;
export type GraphProject = Pick<Entry<ProjectData>, 'id' | 'title' | 'people' | 'publications' | 'tags' | 'images'>;
export type GraphSoftware = Pick<Entry<SoftwareData>, 'id' | 'name' | 'title' | 'people' | 'publications' | 'tags' | 'image'>;

export interface GraphRowsInput {
  tags: GraphTopic[];
  people: GraphPerson[];
  publications: GraphPublication[];
  projects: GraphProject[];
  software: GraphSoftware[];
  /** The OpenAlex snapshot; `emptyCitations()` is fine and makes every publication value 0. */
  citations: Citations;
  /** `import.meta.env.BASE_URL`: `/` locally, `/livermetabolism-site/` on GitHub Pages. */
  base: string;
  /** Thumbnail paths relative to `public/`, e.g. `assets/image/graph/people/matthias_koenig.webp`. */
  thumbs: Set<string>;
}

/** Directory under `assets/image/graph/` per node type that has a thumbnail. */
const THUMB_DIR: Record<Exclude<NodeType, 'publication'>, string> = {
  person: 'people', project: 'projects', software: 'software',
};

function nodeId(type: NodeType, id: string): string {
  return `${type}:${id}`;
}

/** Uniform initial capital for a status word used as a fallback detail line. */
function capitalized(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function graphRows(input: GraphRowsInput): GraphRows {
  const { base, thumbs, citations } = input;
  /** Tag name (as written in the YAML `tags` lists) -> topic slug. */
  const slugOf = new Map(input.tags.map((t) => [t.tag, t.slug]));

  /** The topic slugs of an item's `tags`, in the item's own order, without unknown tags or repeats. */
  const topicsOf = (tags: string[]): string[] => {
    const slugs: string[] = [];
    for (const tag of tags) {
      const slug = slugOf.get(tag);
      if (slug && !slugs.includes(slug)) slugs.push(slug);
    }
    return slugs;
  };

  const image = (type: Exclude<NodeType, 'publication'>, id: string): string | null => {
    const path = `assets/image/graph/${THUMB_DIR[type]}/${id}.webp`;
    return thumbs.has(path) ? `${base}${path}` : null;
  };

  // --- nodes, in the category order of the chart legend -----------------
  const nodes: GraphNode[] = [];
  const push = (node: Omit<GraphNode, 'value'>) => nodes.push({ ...node, value: 0 });

  for (const person of input.people) {
    push({
      id: nodeId('person', person.id), type: 'person', label: person.name,
      detail: person.role.length ? person.role.join(', ') : capitalized(person.status),
      href: `${base}people/#person-modal-${person.id}`, image: image('person', person.id),
      topics: [], // filled in from their publications below
    });
  }
  for (const project of input.projects) {
    push({
      id: nodeId('project', project.id), type: 'project', label: project.title, detail: project.title,
      href: `${base}projects/#project-modal-${project.id}`, image: image('project', project.id),
      topics: topicsOf(project.tags),
    });
  }
  for (const entry of input.software) {
    push({
      id: nodeId('software', entry.id), type: 'software', label: entry.name, detail: entry.title,
      href: `${base}research/#software-${entry.id}`, image: image('software', entry.id),
      topics: topicsOf(entry.tags),
    });
  }
  for (const pub of input.publications) {
    push({
      id: nodeId('publication', pub.id), type: 'publication', label: pub.title,
      detail: `${pub.year} · ${pub.journal_short || pub.journal}`,
      href: `${base}publications/#pub-${pub.id}`, image: null,
      topics: topicsOf(pub.tags),
      // value is the citation count; the degree below only fills the others.
    });
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));

  // --- links: only between existing nodes, one edge per node pair -------
  const links: GraphLink[] = [];
  const seen = new Set<string>();
  const link = (source: string, target: string, kind: GraphLink['kind']) => {
    if (source === target || !byId.has(source) || !byId.has(target)) return;
    const key = `${source}|${target}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push({ source, target, kind });
  };

  for (const pub of input.publications) {
    const id = nodeId('publication', pub.id);
    for (const person of pub.people) link(id, nodeId('person', person), 'author');
  }
  for (const project of input.projects) {
    const id = nodeId('project', project.id);
    for (const pub of project.publications) link(id, nodeId('publication', pub), 'project');
    for (const person of project.people) link(nodeId('person', person), id, 'member');
  }
  for (const entry of input.software) {
    const id = nodeId('software', entry.id);
    for (const pub of entry.publications) link(id, nodeId('publication', pub), 'software');
    for (const person of entry.people) link(nodeId('person', person), id, 'member');
  }

  // --- derived node fields ---------------------------------------------
  // A person carries no tags of their own: their research areas are the union
  // of those of the publications they co-authored, in first-seen order.
  for (const pub of input.publications) {
    const slugs = topicsOf(pub.tags);
    if (!slugs.length) continue;
    for (const personId of pub.people) {
      const node = byId.get(nodeId('person', personId));
      if (!node) continue;
      for (const slug of slugs) if (!node.topics.includes(slug)) node.topics.push(slug);
    }
  }

  const degree = new Map<string, number>();
  for (const l of links) {
    degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
    degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
  }
  for (const node of nodes) node.value = degree.get(node.id) ?? 0;
  for (const pub of input.publications) {
    const node = byId.get(nodeId('publication', pub.id));
    if (node) node.value = citationFor(citations, pub.doi)?.citedByCount ?? 0;
  }

  return { nodes, links };
}
