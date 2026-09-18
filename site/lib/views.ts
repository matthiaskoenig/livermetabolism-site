import type { PersonData, ProjectData, PublicationData, SoftwareData, TagData } from './schemas';
import { slugify } from './text';

/** A collection entry flattened to its data plus the guaranteed entry id (never the file-order bookkeeping field). */
export type Entry<T> = Omit<T, 'id' | 'order'> & { id: string };

export interface TagInfo {
  tag: string; slug: string; icon: string; short_description: string; description: string; vision: string; label: string;
}

/** The subset of `TagInfo` the tag-filter bar actually renders (button label/icon/tooltip/data-tag) - narrows what `TagFilter.vue` serialises into its island props. */


/**
 * lib/data.ts's getTags(): sort rows by the file-order `order` field
 * content.config.ts's tags loader injects (getCollection() doesn't
 * preserve tags.yml's order - see content.config.ts) and shape them into
 * the exact TagInfo the homepage's tag sections expect. Built explicitly,
 * field by field - no spread - so neither `order` nor `id` (both present
 * on the raw TagData row) can leak into the serialised `tagInfo` island
 * props.
 *
 * `tag` is the machine value (reference key, slug source, data-tag/?tag=
 * filter value) and never varies by locale. `label` is its translated
 * display text: the caller resolves it per slug (`labelFor`, backed by the
 * `tags.label.*` UI-catalog keys - see `site/lib/data.ts`'s `getTags()` and
 * i18n/TRANSLATION.md's "tags.tag" section) so this function stays free of
 * any i18n import. The default identity fallback keeps every existing
 * caller that does not care about the label (tests, the LLM export) compiling
 * unchanged.
 */
export function toTagInfo(rows: TagData[], labelFor: (slug: string, tag: string) => string = (slug) => slug): TagInfo[] {
  return rows
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((d) => {
      const slug = slugify(d.tag);
      return {
        tag: d.tag, slug, icon: d.icon, label: labelFor(slug, d.tag),
        short_description: d.short_description, description: d.description, vision: d.vision,
      };
    });
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
