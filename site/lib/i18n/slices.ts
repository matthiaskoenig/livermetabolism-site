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
export const slices = (t: TFn) => ({
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
  },
  publicationRow: {
    citations: t('pub.citationsTitle'),
    openAccess: t('pub.openAccess'),
    openAccessWith: t('pub.openAccessWith'),
    openAccessTitle: t('pub.openAccessTitle'),
    cited: t('pub.cited'),
    abstract: t('pub.abstract'),
    keywords: t('detail.keywords'),
    pdf: t('links.pdf'),
    homepage: t('links.projectHomepage'),
    repository: t('links.repositoryHomepage'),
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
  tagFilter: { all: t('filter.all') },
  publicationsChart: {
    stackBy: t('chart.stackBy'),
    researchArea: t('chart.researchArea'),
    status: t('chart.status'),
    ariaLabel: t('chart.publicationsPerYear'),
  },
  starsChart: {
    ariaLabel: t('chart.starsPerRepository'),
    primaryLanguage: t('chart.primaryLanguage'),
    caption: t('chart.starsCaption'),
  },
  citationHistoryChart: {
    ariaLabel: t('chart.totalCitationsOverTime'),
  },
  citationsPerYearChart: {
    ariaLabel: t('chart.citationsPerYear'),
    caption: t('chart.citationsPerYearCaption'),
  },
  commitActivityChart: {
    ariaLabel: t('chart.commitsPerWeek'),
    caption: t('chart.commitActivityCaption'),
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
    showArea: t('network.showArea'),
    all: t('filter.all'),
    zoomIn: t('network.zoomIn'),
    zoomOut: t('network.zoomOut'),
    reset: t('network.reset'),
    loading: t('network.loading'),
    graphLabel: t('network.graphLabel'),
    caption: t('network.caption'),
  },
});

export type UiSlices = ReturnType<typeof slices>;
