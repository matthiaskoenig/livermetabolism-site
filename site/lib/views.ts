import type { PersonData, ProjectData, PublicationData, SoftwareData, TagData } from './schemas';
import { slugify } from './text';

/** A collection entry flattened to its data plus the guaranteed entry id (never the file-order bookkeeping field). */
export type Entry<T> = Omit<T, 'id' | 'order'> & { id: string };

export interface TagInfo {
  tag: string; slug: string; icon: string; short_description: string; description: string; vision: string;
}

/** The subset of `TagInfo` the tag-filter bar actually renders (button label/icon/tooltip/data-tag) — narrows what `TagFilter.vue` serialises into its island props. */
export type TagFilterEntry = Pick<TagInfo, 'tag' | 'slug' | 'icon' | 'short_description'>;

/** Map full `TagInfo` rows down to `TagFilterEntry` before handing them to a `<TagFilter>` island. */
export function toTagFilterEntries(tags: TagInfo[]): TagFilterEntry[] {
  return tags.map(({ tag, slug, icon, short_description }) => ({ tag, slug, icon, short_description }));
}

/**
 * lib/data.ts's getTags(): sort rows by the file-order `order` field
 * content.config.ts's tags loader injects (getCollection() doesn't
 * preserve tags.yml's order — see content.config.ts) and shape them into
 * the exact TagInfo the homepage's tag sections expect. Built explicitly,
 * field by field — no spread — so neither `order` nor `id` (both present
 * on the raw TagData row) can leak into the serialised `tagInfo` island
 * props.
 */
export function toTagInfo(rows: TagData[]): TagInfo[] {
  return rows
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((d) => ({
      tag: d.tag, slug: slugify(d.tag), icon: d.icon,
      short_description: d.short_description, description: d.description, vision: d.vision,
    }));
}

/** Consecutive runs of the same year, in the given order (Liquid's prev_year loop). */
export function groupByYear<T extends { year: number }>(items: T[]): { year: number; items: T[] }[] {
  const groups: { year: number; items: T[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.year === item.year) last.items.push(item);
    else groups.push({ year: item.year, items: [item] });
  }
  return groups;
}

/** team.html alumni timeline: alumni with a photo, sorted by end_year desc, grouped. */
export function alumniByYear<T extends Pick<PersonData, 'status' | 'end_year' | 'image'>>(people: T[]): { year: number; people: T[] }[] {
  const alumni = people
    .filter((p) => p.status === 'alumni' && !!p.image && p.end_year != null)
    .sort((a, b) => (b.end_year as number) - (a.end_year as number));
  const groups: { year: number; people: T[] }[] = [];
  for (const p of alumni) {
    const last = groups[groups.length - 1];
    if (last && last.year === p.end_year) last.people.push(p);
    else groups.push({ year: p.end_year as number, people: [p] });
  }
  return groups;
}

/** index.html tag sections: counts behind the Publications/Projects/Software links. */
export function tagCounts(
  tag: string,
  publications: Pick<PublicationData, 'tags'>[],
  projects: Pick<ProjectData, 'tags' | 'status'>[],
  software: Pick<SoftwareData, 'tags'>[],
) {
  return {
    publications: publications.filter((p) => p.tags.includes(tag)).length,
    projects: projects.filter((p) => p.tags.includes(tag) && p.status === 'current').length,
    software: software.filter((s) => s.tags.includes(tag)).length,
  };
}
