/**
 * The one standard detail view of a person, a publication, a project, a
 * software entry or a news item — the five node types of the network graph —
 * as a pure projection of `data/*.yml` plus the three build-time snapshots.
 *
 * `detailModel()` builds everything `DetailView.vue` renders: header (image,
 * title, one subtitle line, research areas, external links), figures (live
 * numbers), body (the data's own HTML) and the related rows that link the
 * entities together. `site/pages/detail/[type]/[id].astro` prerenders one
 * static fragment per entity from it; the modal shell fetches that fragment
 * and adopts its nodes (see the spec in
 * `docs/superpowers/specs/2026-09-13-detail-modals-design.md`).
 *
 * Free of DOM, Vue and Astro imports, like `graphRows.ts`: every href is built
 * from the `base` the context carries (`import.meta.env.BASE_URL`, always
 * ending in `/`), mirroring `url()`/`asset()`, so the model can be built and
 * asserted in a plain test without the Astro runtime.
 *
 * `buildRelations()` derives the relations **once and symmetrically**: a
 * person is related to everything whose `people:` lists them, and a
 * publication to every project, software entry and presentation whose
 * `publications:` lists it. References to rows that do not exist are dropped
 * (the Zod schemas reject them at build time anyway), so both directions of
 * the index always agree.
 */
import { repoFullName } from '../../scripts/lib/repos';
import type { DetailType } from './detailTypes';
import { citationFor } from './citations';
import { openalexWorkUrl, type Citations } from './citationsSchema';
import { shortDate, statsFor } from './githubRows';
import type { Snapshot } from './githubSchema';
import type { PeopleMap } from './people';
import type { NewsData, PersonData, PosterData, PresentationData, ProjectData, PublicationData, SoftwareData } from './schemas';
import type { Scholar } from './scholarSchema';
import { capitalize, slugify } from './text';
import type { Entry, TagInfo } from './views';

/** The five entities that get a detail fragment and a modal (defined in the leaf module the client router imports). */
export { DETAIL_TYPES, type DetailType } from './detailTypes';
/** Presentations and posters have no detail of their own: they only appear as related rows linking to their card. */
export type RelatedType = DetailType | 'presentation' | 'poster';

/** One external (or PDF) link of the header's icon row. */
export interface DetailLink {
  label: string;
  href: string;
  /** `site/icons/<icon>.svg`, rendered by `Icon.vue`. */
  icon: string;
  /** true opens in a new tab (`target="_blank"`); site-internal links do not. */
  external: boolean;
}

/** One live number: citations, stars, publication counts, … */
export interface DetailFigure {
  label: string;
  value: string;
  href?: string;
}

/** One compact row of a related section. */
export interface RelatedRow {
  type: RelatedType;
  id: string;
  title: string;
  /** The single line under the title: year and journal, role, status, date, … */
  line: string;
  image: string | null;
  /** The list anchor: what a presentation/poster row links to, and the no-JS fallback of every other row. */
  href: string;
}

export interface DetailSection {
  label: string;
  rows: RelatedRow[];
}

/**
 * The one rich block a detail can carry, between the figures and the body —
 * what the retired `NewsModal.vue` and `ProjectModal.vue` showed:
 *
 * - `video`: a news item's YouTube embed. `src` is `news.video` unchanged,
 *   which `newsSchema` has already restricted to the two YouTube embed hosts
 *   `astro.config.mjs`'s `frame-src` allows, so a hand-edited URL fails the
 *   data build instead of being silently blocked in the modal.
 * - `gallery`: a project's images, every one of them, with `image_title` as
 *   the caption.
 */
export type DetailMedia =
  | { kind: 'video'; src: string; title: string }
  | { kind: 'gallery'; images: string[]; caption: string | null };

export interface DetailModel {
  type: DetailType;
  id: string;
  title: string;
  /** HTML-free text; the authors are rendered separately by the view via `PersonChips`. */
  subtitle: string;
  /** Publications only: the free-text author string plus the internal ids `PersonChips` splices avatars into. */
  authors?: { text: string; people: string[] };
  image: string | null;
  /** `round` a person's photo, `thumb` a picture cropped to fill, `logo` a software logo shown whole. */
  imageShape: 'round' | 'thumb' | 'logo';
  badge?: { text: string; cls: string };
  tags: string[];
  links: DetailLink[];
  figures: DetailFigure[];
  /** A news item's video embed or a project's image gallery; null for every other type (and for a news item without a video). */
  media: DetailMedia | null;
  /** Trusted HTML from the data — the same field the cards already render. */
  body: string;
  keywords: string[];
  related: DetailSection[];
  /** "Show in list": the item's own card or row. */
  listHref: string;
}

/** Everything a model needs: the collections, the tag table, the `PeopleMap`, the three snapshots and the deploy's base path. */
export interface DetailContext {
  people: Entry<PersonData>[];
  publications: Entry<PublicationData>[];
  projects: Entry<ProjectData>[];
  software: Entry<SoftwareData>[];
  news: Entry<NewsData>[];
  presentations: Entry<PresentationData>[];
  posters: Entry<PosterData>[];
  tags: TagInfo[];
  peopleMap: PeopleMap;
  /** The GitHub snapshot behind a software entry's figures. */
  github: Snapshot;
  /**
   * The Google Scholar snapshot. No figure reads it yet — a person's citation
   * figure is summed from the per-paper OpenAlex counts, which are the numbers
   * the publications page shows — but it is part of the context so a
   * group-level figure can be added without threading a new argument through
   * every caller.
   */
  scholar: Scholar;
  /** The OpenAlex snapshot behind the publication and person citation figures. */
  citations: Citations;
  /** `import.meta.env.BASE_URL`: `/` locally, `/livermetabolism-site/` on GitHub Pages. */
  base: string;
}

export interface PersonRelations {
  publications: string[];
  projects: string[];
  software: string[];
  news: string[];
  presentations: string[];
  posters: string[];
}
export interface PublicationRelations {
  people: string[];
  projects: string[];
  software: string[];
  presentations: string[];
}
export interface MemberRelations {
  people: string[];
  publications: string[];
}

/** The symmetric relation index; every id in it exists in its own table. */
export interface Relations {
  person: Map<string, PersonRelations>;
  publication: Map<string, PublicationRelations>;
  project: Map<string, MemberRelations>;
  software: Map<string, MemberRelations>;
  news: Map<string, { people: string[] }>;
}

/** Asset directories, mirroring the `imageBase`/`pdfBase` props the cards get. */
const AVATAR_DIR = 'assets/image/people/128/';
const PROJECT_DIR = 'assets/image/projects/';
const SOFTWARE_DIR = 'assets/image/software/';
const NEWS_DIR = 'assets/image/news/';
const PDF_DIR = 'assets/pdf/';

/** Append `id` to a list unless it is already there (a row may list the same person twice). */
function addOnce(list: string[], id: string): void {
  if (!list.includes(id)) list.push(id);
}

/**
 * The relations of every entity, both ways round. Built once per context (the
 * detail pages build ~300 models from the same one, see `relationsFor`).
 */
export function buildRelations(ctx: DetailContext): Relations {
  const person = new Map<string, PersonRelations>(
    ctx.people.map((p) => [p.id, { publications: [], projects: [], software: [], news: [], presentations: [], posters: [] }]),
  );
  const publication = new Map<string, PublicationRelations>(
    ctx.publications.map((p) => [p.id, { people: [], projects: [], software: [], presentations: [] }]),
  );
  const project = new Map<string, MemberRelations>(ctx.projects.map((p) => [p.id, { people: [], publications: [] }]));
  const software = new Map<string, MemberRelations>(ctx.software.map((s) => [s.id, { people: [], publications: [] }]));
  const news = new Map<string, { people: string[] }>(ctx.news.map((n) => [n.id, { people: [] }]));

  /** Link one row to the people it lists, in both directions. */
  const members = (id: string, peopleIds: string[], side: keyof PersonRelations, own?: { people: string[] }) => {
    for (const pid of peopleIds) {
      const rel = person.get(pid);
      if (!rel) continue;
      addOnce(rel[side], id);
      if (own) addOnce(own.people, pid);
    }
  };
  /** Link one row to the publications it lists, in both directions. */
  const cites = (id: string, pubIds: string[], side: keyof PublicationRelations, own?: { publications: string[] }) => {
    for (const pubId of pubIds) {
      const rel = publication.get(pubId);
      if (!rel) continue;
      addOnce(rel[side], id);
      if (own) addOnce(own.publications, pubId);
    }
  };

  for (const pub of ctx.publications) members(pub.id, pub.people, 'publications', publication.get(pub.id)!);
  for (const p of ctx.projects) {
    members(p.id, p.people, 'projects', project.get(p.id)!);
    cites(p.id, p.publications, 'projects', project.get(p.id)!);
  }
  for (const s of ctx.software) {
    members(s.id, s.people, 'software', software.get(s.id)!);
    cites(s.id, s.publications, 'software', software.get(s.id)!);
  }
  for (const n of ctx.news) members(n.id, n.people, 'news', news.get(n.id)!);
  for (const t of ctx.presentations) {
    members(t.id, t.people, 'presentations');
    cites(t.id, t.publications, 'presentations');
  }
  for (const p of ctx.posters) members(p.id, p.people, 'posters');

  return { person, publication, project, software, news };
}

/** Every entity that gets a fragment, in table order: 5 tables, one `{ type, id }` each. */
export function detailIds(ctx: DetailContext): { type: DetailType; id: string }[] {
  return [
    ...ctx.people.map((p) => ({ type: 'person' as const, id: p.id })),
    ...ctx.publications.map((p) => ({ type: 'publication' as const, id: p.id })),
    ...ctx.projects.map((p) => ({ type: 'project' as const, id: p.id })),
    ...ctx.software.map((s) => ({ type: 'software' as const, id: s.id })),
    ...ctx.news.map((n) => ({ type: 'news' as const, id: n.id })),
  ];
}

/** The page and element id of an entity's own card or row, with the deploy's base path. */
export function listAnchor(type: RelatedType, id: string, base: string): string {
  switch (type) {
    case 'person':
      return `${base}people/#person-${id}`;
    case 'publication':
      return `${base}publications/#pub-${id}`;
    case 'project':
      return `${base}projects/#project-${id}`;
    case 'software':
      return `${base}research/#software-${id}`;
    case 'news':
      return `${base}news/#news-${id}`;
    case 'presentation':
      return `${base}publications/#presentation-${id}`;
    case 'poster':
      return `${base}publications/#poster-${id}`;
  }
}

/** Row lookups by id, cached per context (both are rebuilt only when the page builds a new context). */
interface Lookups {
  people: Map<string, Entry<PersonData>>;
  publications: Map<string, Entry<PublicationData>>;
  projects: Map<string, Entry<ProjectData>>;
  software: Map<string, Entry<SoftwareData>>;
  news: Map<string, Entry<NewsData>>;
  presentations: Map<string, Entry<PresentationData>>;
  posters: Map<string, Entry<PosterData>>;
}
const lookupCache = new WeakMap<DetailContext, Lookups>();
const relationCache = new WeakMap<DetailContext, Relations>();

function lookups(ctx: DetailContext): Lookups {
  let found = lookupCache.get(ctx);
  if (!found) {
    const byId = <T extends { id: string }>(rows: T[]) => new Map(rows.map((r) => [r.id, r]));
    found = {
      people: byId(ctx.people), publications: byId(ctx.publications), projects: byId(ctx.projects),
      software: byId(ctx.software), news: byId(ctx.news), presentations: byId(ctx.presentations), posters: byId(ctx.posters),
    };
    lookupCache.set(ctx, found);
  }
  return found;
}

function relationsFor(ctx: DetailContext): Relations {
  let found = relationCache.get(ctx);
  if (!found) {
    found = buildRelations(ctx);
    relationCache.set(ctx, found);
  }
  return found;
}

/** Drop the empty parts, then join with the subtitle separator. */
const line = (parts: (string | number | null | undefined)[]): string =>
  parts.map((p) => (p == null ? '' : String(p).trim())).filter(Boolean).join(' · ');

/** An external link, if the field is set. */
const extLink = (label: string, href: string | null | undefined, icon: string): DetailLink[] =>
  href ? [{ label, href, icon, external: true }] : [];

/**
 * A free-text data URL (`news.link`), the way `link()` in `lib/url.ts` treats
 * it: a root-absolute path is a site path and carries the base, anything else
 * passes through. The schemas keep these fields closed to arbitrary input.
 */
const dataHref = (href: string, base: string): string => (/^\/(?!\/)/.test(href) ? `${base}${href.replace(/^\/+/, '')}` : href);

// --- related rows -------------------------------------------------------

const personRow = (ctx: DetailContext, id: string): RelatedRow | null => {
  const p = lookups(ctx).people.get(id);
  if (!p) return null;
  return {
    type: 'person', id, title: p.name, line: p.role.join(' · '),
    image: p.image ? `${ctx.base}${AVATAR_DIR}${p.image}` : null,
    href: listAnchor('person', id, ctx.base),
  };
};

const publicationRow = (ctx: DetailContext, id: string): RelatedRow | null => {
  const p = lookups(ctx).publications.get(id);
  if (!p) return null;
  return {
    type: 'publication', id, title: p.title, line: line([p.year, p.journal_short || p.journal]),
    image: null, href: listAnchor('publication', id, ctx.base),
  };
};

const projectRow = (ctx: DetailContext, id: string): RelatedRow | null => {
  const p = lookups(ctx).projects.get(id);
  if (!p) return null;
  return {
    type: 'project', id, title: p.title, line: capitalize(p.status),
    image: p.images[0] ? `${ctx.base}${PROJECT_DIR}${p.images[0]}` : null,
    href: listAnchor('project', id, ctx.base),
  };
};

const softwareRow = (ctx: DetailContext, id: string): RelatedRow | null => {
  const s = lookups(ctx).software.get(id);
  if (!s) return null;
  return {
    type: 'software', id, title: s.name, line: s.title,
    image: s.image ? `${ctx.base}${SOFTWARE_DIR}${s.image}` : null,
    href: listAnchor('software', id, ctx.base),
  };
};

const newsRow = (ctx: DetailContext, id: string): RelatedRow | null => {
  const n = lookups(ctx).news.get(id);
  if (!n) return null;
  return {
    type: 'news', id, title: n.title, line: n.date, image: newsImage(ctx, n),
    href: listAnchor('news', id, ctx.base),
  };
};

const presentationRow = (ctx: DetailContext, id: string): RelatedRow | null => {
  const t = lookups(ctx).presentations.get(id);
  if (!t) return null;
  return {
    type: 'presentation', id, title: t.title, line: line([t.date, t.event]),
    image: t.image ? `${ctx.base}${PDF_DIR}${t.image}` : null,
    href: listAnchor('presentation', id, ctx.base),
  };
};

const posterRow = (ctx: DetailContext, id: string): RelatedRow | null => {
  const p = lookups(ctx).posters.get(id);
  if (!p) return null;
  return {
    type: 'poster', id, title: p.title, line: line([p.date, p.event]),
    image: p.image ? `${ctx.base}${PDF_DIR}${p.image}` : null,
    href: listAnchor('poster', id, ctx.base),
  };
};

/** A section, or nothing at all when it has no rows. */
function section(label: string, rows: (RelatedRow | null)[]): DetailSection[] {
  const kept = rows.filter((r): r is RelatedRow => r !== null);
  return kept.length ? [{ label, rows: kept }] : [];
}

/** Publication ids newest first — the order the person modal and the publications page use. */
function byYearDesc(ctx: DetailContext, ids: string[]): string[] {
  const pubs = lookups(ctx).publications;
  return [...ids].sort((a, b) => (pubs.get(b)?.year ?? 0) - (pubs.get(a)?.year ?? 0));
}

/** The card's thumbnail: the image, else the YouTube still of an embedded video (as `NewsCard.vue`). */
function newsImage(ctx: DetailContext, n: Entry<NewsData>): string | null {
  if (n.image) return `${ctx.base}${NEWS_DIR}${n.image}`;
  if (n.video) return `https://img.youtube.com/vi/${n.video.split('/embed/').pop()}/hqdefault.jpg`;
  return null;
}

// --- models -------------------------------------------------------------

/**
 * The research areas of a person: they carry none of their own, so the union
 * of the tags of everything they are credited on, in first-seen order (the
 * same derivation the network graph uses for a person's topics).
 */
function personTags(ctx: DetailContext, rel: PersonRelations): string[] {
  const known = new Set(ctx.tags.map((t) => t.tag));
  const out: string[] = [];
  const add = (tags: string[]) => {
    for (const tag of tags) if (known.has(tag) && !out.includes(tag)) out.push(tag);
  };
  const l = lookups(ctx);
  for (const id of rel.publications) add(l.publications.get(id)?.tags ?? []);
  for (const id of rel.projects) add(l.projects.get(id)?.tags ?? []);
  for (const id of rel.software) add(l.software.get(id)?.tags ?? []);
  return out;
}

function personModel(ctx: DetailContext, id: string): DetailModel {
  const p = lookups(ctx).people.get(id);
  if (!p) throw new Error(`detailModel: no person with id ${id}`);
  const rel = relationsFor(ctx).person.get(id)!;
  const pubs = byYearDesc(ctx, rel.publications);
  const cited = pubs.reduce((sum, pubId) => sum + (citationFor(ctx.citations, lookups(ctx).publications.get(pubId)?.doi)?.citedByCount ?? 0), 0);
  return {
    type: 'person', id, title: p.name,
    subtitle: line([p.role.join(' · '), p.tenure, p.affiliation]),
    image: p.image ? `${ctx.base}${AVATAR_DIR}${p.image}` : null,
    imageShape: 'round',
    tags: personTags(ctx, rel),
    links: [
      ...extLink('Homepage', p.homepage, 'home'),
      ...extLink('ORCID', p.orcid ? `https://orcid.org/${p.orcid}` : null, 'orcid'),
      ...extLink('Repository', p.repository, 'github'),
    ],
    figures: [
      ...(pubs.length ? [{ label: 'Publications', value: String(pubs.length) }] : []),
      ...(cited > 0 ? [{ label: 'Citations', value: String(cited) }] : []),
    ],
    media: null,
    body: p.description ?? '',
    keywords: [],
    related: [
      ...section('Publications', pubs.map((pubId) => publicationRow(ctx, pubId))),
      ...section('Projects', rel.projects.map((pid) => projectRow(ctx, pid))),
      ...section('Software', rel.software.map((sid) => softwareRow(ctx, sid))),
      ...section('News', rel.news.map((nid) => newsRow(ctx, nid))),
      ...section('Presentations', rel.presentations.map((tid) => presentationRow(ctx, tid))),
      ...section('Posters', rel.posters.map((pid) => posterRow(ctx, pid))),
    ],
    listHref: listAnchor('person', id, ctx.base),
  };
}

function publicationModel(ctx: DetailContext, id: string): DetailModel {
  const p = lookups(ctx).publications.get(id);
  if (!p) throw new Error(`detailModel: no publication with id ${id}`);
  const rel = relationsFor(ctx).publication.get(id)!;
  const cites = citationFor(ctx.citations, p.doi);
  return {
    type: 'publication', id, title: p.title,
    subtitle: line([p.journal, p.year]),
    authors: { text: p.authors, people: p.people },
    image: null, imageShape: 'thumb',
    badge: { text: capitalize(p.status), cls: `status-${slugify(p.status)}` },
    tags: p.tags,
    links: [
      ...extLink('DOI', p.doi ? `https://doi.org/${p.doi}` : null, 'book'),
      ...extLink('PubMed', p.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${p.pmid}` : null, 'file-text-o'),
      ...(p.pdf ? [{ label: 'PDF', href: `${ctx.base}${PDF_DIR}${p.pdf}`, icon: 'file-pdf-o', external: false }] : []),
      ...extLink('Homepage', p.homepage, 'globe'),
      ...extLink('Repository', p.repository, 'github'),
    ],
    figures: cites
      ? [
          { label: 'Citations', value: String(cites.citedByCount), href: openalexWorkUrl(cites.openalexId) },
          ...(cites.isOa ? [{ label: 'Open access', value: cites.oaStatus }] : []),
        ]
      : [],
    media: null,
    body: p.abstract ?? '',
    keywords: p.keywords,
    related: [
      ...section('People', rel.people.map((pid) => personRow(ctx, pid))),
      ...section('Projects', rel.projects.map((pid) => projectRow(ctx, pid))),
      ...section('Software', rel.software.map((sid) => softwareRow(ctx, sid))),
      ...section('Presentations', rel.presentations.map((tid) => presentationRow(ctx, tid))),
    ],
    listHref: listAnchor('publication', id, ctx.base),
  };
}

function projectModel(ctx: DetailContext, id: string): DetailModel {
  const p = lookups(ctx).projects.get(id);
  if (!p) throw new Error(`detailModel: no project with id ${id}`);
  const rel = relationsFor(ctx).project.get(id)!;
  return {
    type: 'project', id, title: p.title,
    subtitle: line([capitalize(p.status), p.cooperation_partners]),
    // no header thumbnail: the gallery below shows every image, the first one
    // included, so a thumbnail would only repeat it (as the retired
    // ProjectModal.vue did, which led with the gallery too)
    image: null,
    imageShape: 'thumb',
    tags: p.tags,
    links: [...extLink('Homepage', p.homepage, 'globe'), ...extLink('Repository', p.repository, 'github')],
    figures: [],
    media: p.images.length ? { kind: 'gallery', images: p.images.map((img) => `${ctx.base}${PROJECT_DIR}${img}`), caption: p.image_title ?? null } : null,
    body: p.abstract,
    keywords: [],
    related: [
      ...section('People', rel.people.map((pid) => personRow(ctx, pid))),
      ...section('Publications', byYearDesc(ctx, rel.publications).map((pubId) => publicationRow(ctx, pubId))),
    ],
    listHref: listAnchor('project', id, ctx.base),
  };
}

function softwareModel(ctx: DetailContext, id: string): DetailModel {
  const s = lookups(ctx).software.get(id);
  if (!s) throw new Error(`detailModel: no software with id ${id}`);
  const rel = relationsFor(ctx).software.get(id)!;
  // the snapshot key of this entry's repository, exactly as the research page
  // looks it up (see statsFor: the key, not GitHub's current fullName)
  const repo = s.repository ? repoFullName(s.repository) : null;
  const stats = repo ? statsFor(ctx.github, repo) : null;
  return {
    type: 'software', id, title: s.name,
    subtitle: s.title,
    image: s.image ? `${ctx.base}${SOFTWARE_DIR}${s.image}` : null,
    imageShape: 'logo',
    tags: s.tags,
    links: [
      ...extLink('Homepage', s.homepage, 'globe'),
      ...extLink('Repository', s.repository, 'github'),
      ...extLink('DOI', s.doi ? `https://doi.org/${s.doi}` : null, 'book'),
    ],
    figures: stats
      ? [
          { label: 'Stars', value: String(stats.stars), href: stats.htmlUrl },
          ...(stats.release ? [{ label: 'Latest release', value: stats.release.tag, href: stats.release.htmlUrl }] : []),
          { label: 'Open issues', value: String(stats.openIssues), href: stats.htmlUrl },
          // an absolute date, not "3 days ago": a fragment is cached in the
          // browser and never re-rendered, so a relative date would go stale
          { label: 'Last push', value: shortDate(stats.pushedAt) },
        ]
      : [],
    media: null,
    body: s.description,
    keywords: [],
    related: [
      ...section('People', rel.people.map((pid) => personRow(ctx, pid))),
      ...section('Publications', byYearDesc(ctx, rel.publications).map((pubId) => publicationRow(ctx, pubId))),
    ],
    listHref: listAnchor('software', id, ctx.base),
  };
}

function newsModel(ctx: DetailContext, id: string): DetailModel {
  const n = lookups(ctx).news.get(id);
  if (!n) throw new Error(`detailModel: no news with id ${id}`);
  const rel = relationsFor(ctx).news.get(id)!;
  return {
    type: 'news', id, title: n.title,
    subtitle: n.date,
    // the player below carries the video, so the header falls back to the
    // YouTube still only when there is no embed to show (as NewsCard.vue does)
    image: n.video ? (n.image ? `${ctx.base}${NEWS_DIR}${n.image}` : null) : newsImage(ctx, n),
    imageShape: 'thumb',
    tags: n.tags,
    links: [
      ...(n.link ? [{ label: 'Read more', href: dataHref(n.link, ctx.base), icon: 'globe', external: true }] : []),
      ...extLink('Video', n.video, 'video-camera'),
    ],
    figures: [],
    media: n.video ? { kind: 'video', src: n.video, title: n.title } : null,
    body: n.abstract ?? n.short,
    keywords: [],
    related: [...section('People', rel.people.map((pid) => personRow(ctx, pid)))],
    listHref: listAnchor('news', id, ctx.base),
  };
}

/** The complete detail of one entity; throws when its table has no such id (a build error, never a runtime one). */
export function detailModel(type: DetailType, id: string, ctx: DetailContext): DetailModel {
  switch (type) {
    case 'person':
      return personModel(ctx, id);
    case 'publication':
      return publicationModel(ctx, id);
    case 'project':
      return projectModel(ctx, id);
    case 'software':
      return softwareModel(ctx, id);
    case 'news':
      return newsModel(ctx, id);
  }
}
