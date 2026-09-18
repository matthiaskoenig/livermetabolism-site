/**
 * The site's one definition of "a person's research areas".
 *
 * People carry no `tags:` of their own in `data/people.yml` - a person's
 * areas are derived: the union of the tags of every publication that lists
 * them in its `people:`. Two places need that derivation and must agree, or
 * the same person would sit in different areas on two pages: the person
 * nodes of the network graph (`graphRows.ts`) and the `data-tags` of the
 * team page's cards, which the global research-area filter sweeps
 * (`topicApply.ts`, issue #68).
 *
 * Slugs, like `tagSlugs()` in `text.ts` - that is what `data-tags`, the
 * filter buttons, `--color-tag-*` and `TAG_PALETTE` are all keyed by. No
 * lookup in `tags.yml` is needed to produce them: the content layer's
 * `refList('tags')` (see `content.config.ts`) already rejects a publication
 * referencing a tag that table does not define, so every tag name reaching
 * here is a real one and `slugify()` gives exactly the slug `toTagInfo()`
 * assigned it.
 *
 * Pure, like `graphRows.ts` and `publicationRows.ts`: no DOM, Vue or Astro
 * imports, computed once in a page's frontmatter.
 */
import type { PersonData, PublicationData } from './schemas';
import { slugify } from './text';
import type { Entry } from './views';

/** The only person field needed: the id a publication's `people:` references. */
export type TopicPerson = Pick<Entry<PersonData>, 'id'>;
/** A publication contributes its `tags` to each of its own `people`. */
export type TopicPublication = Pick<Entry<PublicationData>, 'people' | 'tags'>;

/**
 * Maps every given person's id to their research-area slugs, in first-seen
 * order over the publications (so it follows the file order of
 * `publications.yml`, newest first, like the rest of the site).
 *
 * Every person gets an entry, including an empty one: a person with no
 * tagged publication renders `data-tags=""` and is hidden by any active
 * area, the same as an untagged card of any other type. Author ids that are
 * not in `people` (external co-authors) are skipped.
 */
export function peopleTopics(people: TopicPerson[], publications: TopicPublication[]): Map<string, string[]> {
  const topics = new Map<string, string[]>(people.map((person) => [person.id, []]));

  for (const pub of publications) {
    const slugs = pub.tags.map(slugify);
    if (!slugs.length) continue;
    for (const id of pub.people) {
      const areas = topics.get(id);
      if (!areas) continue;
      for (const slug of slugs) if (!areas.includes(slug)) areas.push(slug);
    }
  }

  return topics;
}
