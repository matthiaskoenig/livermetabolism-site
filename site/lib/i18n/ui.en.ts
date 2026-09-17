/**
 * The English UI catalog: the source of every user-facing string that is not
 * data. `UiKey` is derived from this object, so a typo in a t() call is a
 * type error and a key missing from i18n/de/ui.yml fails the build
 * (see catalog.ts).
 *
 * Placeholders are {name} and are interpolated by fmt() (format.ts).
 * Plurals get explicit .one/.other keys rather than a plural library:
 * German and English share the same two-form system.
 */
export const en = {
  nav: {
    publications: 'Publications',
    projects: 'Projects',
    research: 'Research',
    team: 'Team',
    meetings: 'Meetings',
    network: 'Network',
    news: 'News',
    teaching: 'Teaching',
    cv: 'CV',
  },
  search: {
    open: 'Search',
    openTitle: 'Search ({key})',
    close: 'Close',
    placeholder: 'Search publications, people, projects, software, news, ...',
    hint: 'Start typing to search publications, people, projects, software, news, and more.',
    unavailable: 'Search is temporarily unavailable.',
    empty: 'No results for “{query}”.',
  },
} as const;

type Leaves<T> = T extends string
  ? ''
  : { [K in keyof T & string]: Leaves<T[K]> extends '' ? K : `${K}.${Leaves<T[K]>}` }[keyof T & string];

/** Every dotted leaf path of `en`, e.g. 'nav.publications'. */
export type UiKey = Leaves<typeof en>;
