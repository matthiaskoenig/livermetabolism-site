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
 *    name and a filter value. Only its display label is German, via the
 *    tags.label.* keys of the UI catalog.
 *  - names, institutions, funders and place names, which stay as written.
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
  meetings: ['title', 'description'],
  activities: ['title', 'description'],
} as const;

export type TranslatableTable = keyof typeof TRANSLATABLE;

export function isTranslatable(table: string): table is TranslatableTable {
  return Object.hasOwn(TRANSLATABLE, table);
}
