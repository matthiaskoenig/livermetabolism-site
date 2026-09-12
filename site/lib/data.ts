import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import type { PeopleMap } from './people';
import type * as S from './schemas';
import { toTagInfo } from './views';
import type { Entry, TagInfo } from './views';

type Ref = { collection: string; id: string };
const ids = (refs: Ref[] | undefined) => (refs ?? []).map((r) => r.id);

/** Every collection `all()` serves, mapped to the schema type its rows flatten to. */
interface CollectionData {
  people: S.PersonData;
  publications: S.PublicationData;
  projects: S.ProjectData;
  software: S.SoftwareData;
  editors: S.EditorData;
  funding: S.FundingData;
  news: S.NewsData;
  teaching: S.TeachingData;
  presentations: S.PresentationData;
  posters: S.PosterData;
  abstracts: S.AbstractData;
  meetings: S.MeetingData;
}

/** Flatten an entry: data + entry id, reference() objects back to id strings. */
function plain<K extends keyof CollectionData & CollectionKey>(entry: CollectionEntry<K>): Entry<CollectionData[K]> {
  const data = entry.data as Record<string, unknown>;
  const out: Record<string, unknown> = { ...data, id: entry.id };
  delete out.order;
  for (const key of ['tags', 'people', 'publications']) {
    if (Array.isArray(data[key])) out[key] = ids(data[key] as Ref[]);
  }
  return out as Entry<CollectionData[K]>;
}

// getCollection() does not preserve a YAML file's row order (see the `yml`
// loader in content.config.ts) — restore it via the injected `order` field
// before flattening. Pages that need a different order (date, year, ...)
// sort again afterwards; this only fixes the ones that don't.
async function all<K extends keyof CollectionData & CollectionKey>(key: K): Promise<Entry<CollectionData[K]>[]> {
  const entries = await getCollection(key);
  return entries
    .slice()
    .sort((a, b) => (a.data as { order: number }).order - (b.data as { order: number }).order)
    .map((e) => plain(e));
}

export async function getTags(): Promise<TagInfo[]> {
  // getCollection() does not preserve tags.yml's file order (see
  // content.config.ts) — toTagInfo() (lib/views.ts) restores it via the
  // injected `order` field and shapes the exact TagInfo, so neither
  // `order` nor `id` (both present on the raw row) can leak into the
  // homepage tag sections' island props.
  const tags = await getCollection('tags');
  return toTagInfo(tags.map((t) => t.data as S.TagData));
}
export const getPeople = () => all('people');
export const getPublications = () => all('publications');
export const getProjects = () => all('projects');
export const getSoftware = () => all('software');
export const getEditors = () => all('editors');
export const getFunding = () => all('funding');
export const getNews = () => all('news');
export const getTeaching = () => all('teaching');
export const getPresentations = () => all('presentations');
export const getPosters = () => all('posters');
export const getAbstracts = () => all('abstracts');
/** meetings.html sorts by date, newest first. */
export async function getMeetings() {
  return (await all('meetings')).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPeopleMap(): Promise<PeopleMap> {
  const map: PeopleMap = {};
  for (const p of await getPeople()) map[p.id] = { id: p.id, name: p.name, image: p.image ?? null };
  return map;
}
