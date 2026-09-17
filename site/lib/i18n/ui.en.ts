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
    citations: 'Citations',
    presentations: 'Presentations',
    posters: 'Posters',
    abstracts: 'Abstracts',
    openPositions: 'Open Positions',
    alumni: 'Alumni',
    releases: 'Releases',
    activity: 'Activity',
    software: 'Software',
    funding: 'Funding',
    editors: 'Editors',
    toggleNav: 'Toggle navigation',
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
  footer: {
    tagline: 'Systems Medicine, Digital Twins & AI',
    position: 'Professor of Metabolic Inflammation and Carcinogenesis of the Liver',
    cv: 'Curriculum vitae',
    releaseNotes: 'Release notes',
    deployedCommit: 'Deployed commit',
    toTop: 'Scroll to top',
    impressum: 'Impressum',
    privacy: 'Datenschutzerklärung',
  },
  meta: {
    description: 'Research Group König',
  },
  consent: {
    message: "This site uses Google Analytics to understand how it's used. It only runs if you accept - see the",
    privacyLink: 'privacy policy',
    messageSuffix: 'for details.',
    decline: 'Decline',
    accept: 'Accept',
  },
  detail: {
    back: 'Back',
    backLabel: 'Back to the previous entry',
    close: 'Close',
    loading: 'Loading…',
    title: 'Details',
    error: 'This entry could not be loaded. Please try again.',
  },
  scholar: {
    citations: 'Citations',
    hIndex: 'h-index',
    i10Index: 'i10-index',
    publications: 'Publications',
    peerReviewed: 'peer-reviewed',
    since: 'since {year}',
    sinceUnknown: 'since',
    citationMetricsFrom: 'Citation metrics from',
    lastUpdate: 'last update',
    none: 'none yet',
  },
  pubOrder: {
    groupLabel: 'Order publications',
    year: 'Year',
    mostCited: 'Most cited',
    citationsFrom: 'Citations from',
    updated: 'updated',
    never: 'never',
  },
  gh: {
    dataFrom: 'Data from',
    updated: 'updated',
    never: 'never',
  },
} as const;

type Leaves<T> = T extends string
  ? ''
  : { [K in keyof T & string]: Leaves<T[K]> extends '' ? K : `${K}.${Leaves<T[K]>}` }[keyof T & string];

/** Every dotted leaf path of `en`, e.g. 'nav.publications'. */
export type UiKey = Leaves<typeof en>;
