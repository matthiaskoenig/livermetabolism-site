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
  for (const key of ['tags', 'people', 'publications']) {
    if (Array.isArray(data[key])) out[key] = ids(data[key] as Ref[]);
  }
  return out as Entry<T>;
}

async function all<K extends CollectionKey, T>(key: K): Promise<Entry<T>[]> {
  return (await getCollection(key)).map((e) => plain<K, T>(e));
}

export async function getTags(): Promise<TagInfo[]> {
  return (await getCollection('tags')).map((t) => ({ ...t.data, tag: t.data.tag, slug: slugify(t.data.tag) }));
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
