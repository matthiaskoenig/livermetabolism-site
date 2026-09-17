/**
 * The one registry of which <table>.<field> carries translatable prose.
 * Read by the overlay (content.ts), by `npm run i18n:check`
 * (scripts/lib/i18n-check.ts) and by the translate-de skill, so the three
 * can never disagree about what is translatable.
 *
 * Deliberately absent:
 *  - every bibliographic table (publications, posters, presentations,
 *    abstracts, panels): a paper's title is its citation identity.
 *  - tags.tag: it is simultaneously a reference key, a slug, a chart series
 *    name and a filter value, so it is never translated. Its display label
 *    is German, via the tags.label.* keys of the UI catalog (ui.en.ts /
 *    i18n/de/ui.yml), resolved per slug by tagLabel() in
 *    site/lib/i18n/tagLabel.ts and baked into TagInfo.label by
 *    site/lib/data.ts's getTags() - see i18n/TRANSLATION.md's "tags.tag"
 *    section.
 *  - names, institutions, funders and place names, which stay as written.
 *  - activities: has a collection and schema (like panels and linkedin)
 *    but no getter, page, or component renders it anywhere on the site -
 *    see CLAUDE.md's repository-layout note. Translating content nothing
 *    shows a visitor only cost a red `npm run i18n:check` on every edit
 *    to data/activities.yml, so it was removed rather than built a page
 *    for; re-add it here only alongside an actual renderer.
 */
export const TRANSLATABLE = {
  tags: ['short_description', 'description', 'vision'],
  people: ['description', 'role'],
  projects: ['title', 'abstract', 'image_title'],
  software: ['title', 'description'],
  editors: ['name', 'description'],
  funding: ['title', 'description'],
  news: ['title', 'short', 'abstract'],
  teaching: ['title', 'content', 'caption', 'funding'],
  meetings: ['title', 'description', 'location'],
} as const;

export type TranslatableTable = keyof typeof TRANSLATABLE;

export function isTranslatable(table: string): table is TranslatableTable {
  return Object.hasOwn(TRANSLATABLE, table);
}
