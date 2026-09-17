import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import { uiFor } from './i18n/catalog';
import { loadCatalog, localize } from './i18n/content';
import { isTranslatable, TRANSLATABLE } from './i18n/fields';
import type { Locale } from './i18n/locales';
import { tagLabel } from './i18n/tagLabel';
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
//
// This is also the single choke point the German overlay is wired into
// (Task 11): every page, the detail fragments, the search index and the
// LLM files read through these getters, so overlaying here reaches every
// surface without a second code path. A table absent from TRANSLATABLE
// (the bibliographic ones) is returned as-is regardless of locale.
async function all<K extends keyof CollectionData & CollectionKey>(key: K, locale: Locale): Promise<Entry<CollectionData[K]>[]> {
  const entries = await getCollection(key);
  const rows = entries
    .slice()
    .sort((a, b) => (a.data as { order: number }).order - (b.data as { order: number }).order)
    .map((e) => plain(e));
  if (!isTranslatable(key)) return rows;
  return localize(rows, loadCatalog(locale, key), TRANSLATABLE[key]);
}

export async function getTags(locale: Locale): Promise<TagInfo[]> {
  // getCollection() does not preserve tags.yml's file order (see
  // content.config.ts) — toTagInfo() (lib/views.ts) restores it via the
  // injected `order` field and shapes the exact TagInfo, so neither
  // `order` nor `id` (both present on the raw row) can leak into the
  // homepage tag sections' island props. tags.yml rows have no `id`
  // column - the tag name is the id (see content.config.ts) - so the
  // overlay is given `entry.id` explicitly; `toTagInfo` still reads the
  // untranslated `tag` field for the id and slug, so only the three
  // description fields can change.
  const tags = await getCollection('tags');
  const raw = tags.map((t) => ({ ...(t.data as S.TagData), id: t.id }));
  const localized = localize(raw, loadCatalog(locale, 'tags'), TRANSLATABLE.tags);
  const { t } = uiFor(locale);
  return toTagInfo(localized, (slug) => tagLabel(slug, t));
}
export const getPeople = (locale: Locale) => all('people', locale);
export const getPublications = (locale: Locale) => all('publications', locale);
export const getProjects = (locale: Locale) => all('projects', locale);
export const getSoftware = (locale: Locale) => all('software', locale);
export const getEditors = (locale: Locale) => all('editors', locale);
export const getFunding = (locale: Locale) => all('funding', locale);
export const getNews = (locale: Locale) => all('news', locale);
export const getTeaching = (locale: Locale) => all('teaching', locale);
export const getPresentations = (locale: Locale) => all('presentations', locale);
export const getPosters = (locale: Locale) => all('posters', locale);
export const getAbstracts = (locale: Locale) => all('abstracts', locale);
/** meetings.html sorts by date, newest first. */
export async function getMeetings(locale: Locale) {
  return (await all('meetings', locale)).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPeopleMap(locale: Locale): Promise<PeopleMap> {
  const map: PeopleMap = {};
  for (const p of await getPeople(locale)) map[p.id] = { id: p.id, name: p.name, image: p.image ?? null };
  return map;
}
