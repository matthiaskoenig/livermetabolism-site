import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import type { PeopleMap } from './people';
import type * as S from './schemas';
import { slugify } from './text';
import type { Entry, TagInfo } from './views';

type Ref = { collection: string; id: string };
const ids = (refs: Ref[] | undefined) => (refs ?? []).map((r) => r.id);

/** Flatten an entry: data + entry id, reference() objects back to id strings. */
function plain<K extends CollectionKey, T>(entry: CollectionEntry<K>): Entry<T> {
  const data = entry.data as Record<string, unknown>;
  const out: Record<string, unknown> = { ...data, id: entry.id };
  delete out.order;
  for (const key of ['tags', 'people', 'publications']) {
    if (Array.isArray(data[key])) out[key] = ids(data[key] as Ref[]);
  }
  return out as Entry<T>;
}

// getCollection() does not preserve a YAML file's row order (see the `yml`
// loader in content.config.ts) — restore it via the injected `order` field
// before flattening. Pages that need a different order (date, year, ...)
// sort again afterwards; this only fixes the ones that don't.
async function all<K extends CollectionKey, T>(key: K): Promise<Entry<T>[]> {
  const entries = await getCollection(key);
  return entries
    .slice()
    .sort((a, b) => (a.data as { order: number }).order - (b.data as { order: number }).order)
    .map((e) => plain<K, T>(e));
}

export async function getTags(): Promise<TagInfo[]> {
  // getCollection() does not preserve tags.yml's file order (see
  // content.config.ts) — restore it via the injected `order` field before
  // dropping it, since callers (the homepage tag sections) depend on file
  // order but must not see the internal `order` bookkeeping field itself.
  // Routed through the same plain() used by all() below so both paths
  // share one place that strips it.
  const tags = await getCollection('tags');
  return tags
    .slice()
    .sort((a, b) => a.data.order - b.data.order)
    .map((t) => plain<'tags', S.TagData>(t))
    .map((t) => ({ ...t, slug: slugify(t.tag) }));
}
export const getPeople = () => all<'people', S.PersonData>('people');
export const getPublications = () => all<'publications', S.PublicationData>('publications');
export const getProjects = () => all<'projects', S.ProjectData>('projects');
export const getSoftware = () => all<'software', S.SoftwareData>('software');
export const getEditors = () => all<'editors', S.EditorData>('editors');
export const getFunding = () => all<'funding', S.FundingData>('funding');
export const getNews = () => all<'news', S.NewsData>('news');
export const getTeaching = () => all<'teaching', S.TeachingData>('teaching');
export const getPresentations = () => all<'presentations', S.PresentationData>('presentations');
export const getPosters = () => all<'posters', S.PosterData>('posters');
export const getAbstracts = () => all<'abstracts', S.AbstractData>('abstracts');
/** meetings.html sorts by date, newest first. */
export async function getMeetings() {
  return (await all<'meetings', S.MeetingData>('meetings')).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPeopleMap(): Promise<PeopleMap> {
  const map: PeopleMap = {};
  for (const p of await getPeople()) map[p.id] = { id: p.id, name: p.name, image: p.image ?? null };
  return map;
}
