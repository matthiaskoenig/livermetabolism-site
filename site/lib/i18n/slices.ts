import type { TFn } from './catalog';

/**
 * Per-component string bundles. Components take a plain serialisable object
 * rather than a `t` function, so the same rule covers the statically
 * rendered cards and the hydrated islands, whose props must serialise into
 * astro-island. Keeping the bundles narrow is what stops the whole ~500-key
 * catalog from being written into the island props of every page.
 *
 * A parameterised string stays a {placeholder} template here; the component
 * runs it through fmt() with its own values.
 *
 * Several small "link tooltip" bundles (`links`, `person`) are shared across
 * many card components rather than duplicated per card: the icons/titles
 * they carry (PDF, Homepage, Repository, ...) are identical wherever they
 * appear, so one narrow bundle reused by ten cards is simpler than ten
 * near-identical ones.
 */
/** The one-per-unit "N ago" bundle `relativeDate()` (`githubRows.ts`) needs, shared by every component and script that renders a relative date. */
const relativeDateStrings = (t: TFn) => ({
  today: t('time.today'),
  yesterday: t('time.yesterday'),
  day: { one: t('time.day.one'), other: t('time.day.other') },
  week: { one: t('time.week.one'), other: t('time.week.other') },
  month: { one: t('time.month.one'), other: t('time.month.other') },
  year: { one: t('time.year.one'), other: t('time.year.other') },
});

/**
 * Every `PublicationStatus` display label, keyed by the status value itself
 * (never translated on its own - see `publicationStatusLabel()` in
 * `publicationRows.ts`). Shared by `publicationsChart` (the legend) and
 * `publicationRow` (the list badge) so the status text can never drift
 * between the list, the chart and the detail modal (which builds the same
 * label at build time via `publicationStatusLabel()` directly).
 */
const statusLabels = (t: TFn) => ({
  publication: t('status.publication'), review: t('status.review'), proceeding: t('status.proceeding'),
  chapter: t('status.chapter'), preprint: t('status.preprint'), abstract: t('status.abstract'),
  thesis: t('status.thesis'), report: t('status.report'),
});

export const slices = (t: TFn) => ({
  relativeDate: relativeDateStrings(t),
  softwareCard: {
    stars: t('gh.stars'),
    issues: t('gh.issues'),
    issuesOpen: t('gh.issuesOpen'),
    lastPush: t('gh.lastPush'),
    language: t('gh.language'),
    license: t('gh.license'),
    release: t('gh.release'),
    releases: t('gh.releases'),
    homepage: t('links.projectHomepage'),
    repository: t('links.repositoryHomepage'),
    relativeDate: relativeDateStrings(t),
  },
  publicationRow: {
    citations: t('pub.citationsTitle'),
    openAccess: t('pub.openAccess'),
    openAccessWith: t('pub.openAccessWith'),
    openAccessTitle: t('pub.openAccessTitle'),
    cited: { one: t('pub.citedOne'), other: t('pub.citedOther') },
    abstract: t('pub.abstract'),
    keywords: t('detail.keywords'),
    pdf: t('links.pdf'),
    homepage: t('links.projectHomepage'),
    repository: t('links.repositoryHomepage'),
    statusLabels: statusLabels(t),
  },
  teachingCard: {
    type: { lecture: t('teachingType.lecture'), course: t('teachingType.course'), seminar: t('teachingType.seminar') },
  },
  fundingCard: {
    role: { Recipient: t('fundingRole.recipient'), 'Co-Investigator': t('fundingRole.coInvestigator') },
    projectHomepage: t('links.projectHomepage'),
    repositoryHomepage: t('links.repositoryHomepage'),
  },
  personCard: {
    viewProfile: t('person.viewProfile'),
    fullProfile: t('person.fullProfile'),
    homepage: t('links.homepage'),
    orcid: t('person.orcid'),
    repository: t('links.repositoryHomepage'),
  },
  /** Shared icon-tooltip labels reused by the "simple" project-style cards. */
  links: {
    pdf: t('links.pdf'),
    homepage: t('links.homepage'),
    projectHomepage: t('links.projectHomepage'),
    meetingHomepage: t('links.meetingHomepage'),
    repository: t('links.repository'),
    repositoryHomepage: t('links.repositoryHomepage'),
    eventPage: t('links.eventPage'),
    slides: t('links.slides'),
    video: t('links.video'),
    readMore: t('links.readMore'),
  },
  detailView: {
    keywords: t('detail.keywords'),
    showInList: t('detail.showInList'),
  },
  publicationsChart: {
    stackBy: t('chart.stackBy'),
    researchArea: t('chart.researchArea'),
    status: t('chart.status'),
    ariaLabel: t('chart.publicationsPerYear'),
    total: t('chart.total'),
    statusLabels: statusLabels(t),
  },
  starsChart: {
    ariaLabel: t('chart.starsPerRepository'),
    primaryLanguage: t('chart.primaryLanguage'),
    caption: t('chart.starsCaption'),
  },
  citationHistoryChart: {
    ariaLabel: t('chart.totalCitationsOverTime'),
    historyNote: { yearly: t('scholar.historyYearly'), daily: t('scholar.historyDaily'), starts: t('scholar.historyStarts') },
    citation: { one: t('chart.citationOne'), other: t('chart.citationOther') },
  },
  citationsPerYearChart: {
    ariaLabel: t('chart.citationsPerYear'),
    caption: t('chart.citationsPerYearCaption'),
    citation: { one: t('chart.citationOne'), other: t('chart.citationOther') },
  },
  commitActivityChart: {
    ariaLabel: t('chart.commitsPerWeek'),
    caption: t('chart.commitActivityCaption'),
    weekOf: t('chart.weekOf'),
    total: t('chart.total'),
    others: t('chart.others'),
  },
  releaseTimeline: {
    ariaLabel: t('chart.releaseDatesPerRepository'),
    caption: t('chart.releaseTimelineCaption'),
  },
  releaseFeed: {
    preRelease: t('gh.preRelease'),
    noReleases: t('gh.noReleases'),
  },
  network: {
    zoomIn: t('network.zoomIn'),
    zoomOut: t('network.zoomOut'),
    reset: t('network.reset'),
    loading: t('network.loading'),
    graphLabel: t('network.graphLabel'),
    caption: t('network.caption'),
    labels: {
      category: { person: t('detail.people'), project: t('nav.projects'), software: t('nav.software'), publication: t('nav.publications') },
      type: { person: t('type.person'), project: t('type.project'), software: t('type.software'), publication: t('type.publication') },
      citation: { one: t('chart.citationOne'), other: t('chart.citationOther') },
    },
  },
});

export type UiSlices = ReturnType<typeof slices>;
