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
    keywords: 'Keywords:',
    showInList: 'Show in list',
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
    stars: 'Stars',
    issues: 'Open issues',
    issuesOpen: '{count} open',
    lastPush: 'Last push',
    language: 'Main language',
    license: 'License',
    release: 'Release {tag} · {date}',
    releases: 'Releases',
    preRelease: 'pre-release',
    noReleases: 'No releases in the last two years.',
  },
  links: {
    pdf: 'PDF',
    homepage: 'Homepage',
    projectHomepage: 'Project homepage',
    meetingHomepage: 'Meeting homepage',
    repository: 'Repository',
    repositoryHomepage: 'Repository homepage',
    eventPage: 'Event page',
    slides: 'Slides',
    video: 'Video',
    readMore: 'Read more',
  },
  person: {
    viewProfile: 'View full profile of {name}',
    fullProfile: 'Full profile',
    orcid: 'ORCID',
  },
  pub: {
    citationsTitle: 'Citations (OpenAlex)',
    openAccess: 'open access',
    openAccessWith: 'Open access ({status})',
    openAccessTitle: 'Open access',
    cited: 'cited {count}',
    abstract: 'Abstract',
  },
  filter: {
    all: 'All',
  },
  chart: {
    stackBy: 'Stack publications by',
    researchArea: 'Research area',
    status: 'Status',
    publicationsPerYear: 'Publications per year',
    starsPerRepository: 'Stars per repository',
    primaryLanguage: 'Primary language',
    starsCaption: 'Stars per repository, coloured by primary language; click a bar to open the repository.',
    totalCitationsOverTime: 'Total citations over time',
    citationsPerYear: 'Citations per year',
    citationsPerYearCaption: 'Citations per year, as counted by Google Scholar.',
    commitsPerWeek: 'Commits per week per repository',
    commitActivityCaption: 'Commits per week over the last year, stacked per repository.',
    releaseDatesPerRepository: 'Release dates per repository',
    releaseTimelineCaption: 'One dot per release; drag the slider to zoom, click a dot to open it on GitHub.',
  },
  network: {
    showArea: 'Show one research area',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    reset: 'Reset',
    loading: 'Loading the network…',
    graphLabel: 'Network of the people, publications, projects and software of the group',
    caption:
      "Pick a research area to show only its people, publications, projects and software; the graph re-arranges itself around what is left. Drag a node to move it, drag the background to pan, use the buttons to zoom. Clicking a node opens it on the site. People carry their photo, projects are squares and software diamonds; a publication is a dot in its research area's colour. Every node is sized by how many people, papers, projects and tools it connects to.",
    intro:
      "How the work of the group hangs together: {people} people, {publications} publications, {projects} projects and {software} software tools, connected by authorship and membership. People carry their photo, projects are squares, software diamonds and publications dots in their research area's colour; every node is sized by how many people, papers, projects and tools it connects to.",
    introFilterHint: 'Pick a research area to show only its people, publications, projects and software - the graph re-arranges itself around what is left. Drag a node to move it, drag the background to pan, and click a node to open it on the site.',
    metaDescription: 'Interactive network graph of the people, publications, projects, and software of the König group.',
  },
  home: {
    subtitle: 'Metabolic Inflammation and Carcinogenesis of the Liver',
    visionBefore: 'We build open, FAIR',
    visionStrong: 'digital twins',
    visionAfter: 'of human physiology - AI-powered models that predict disease and therapy, patient by patient.',
    provocation: 'What if every medical model served you, not the average - and belonged to everyone?',
    scrollTo: 'Scroll to {label}',
    sectionHome: 'Home',
    sectionFooter: 'Footer',
    linkProjectsText: 'Explore our ongoing research projects and digital twin models.',
    linkPublicationsText: 'Peer-reviewed papers, preprints, and open datasets from the lab.',
    linkSoftwareText: 'Open-source tools and models we build to make research reproducible, reusable, and trustworthy.',
    linkTeamText: 'Get to know the researchers, engineers, and students turning ideas into digital twins.',
    linkOpenPositionsText: 'Internships, theses, and PhD opportunities - come join us.',
    publicationsOn: 'Papers, reviews, and preprints on {tag}.',
    projectsOn: 'Ongoing {tag} research projects.',
    softwareOn: 'Open-source tools for {tag}.',
    networkOn: 'People, papers, and tools around {tag}.',
  },
  positions: {
    internship: {
      title: 'Internship',
      before: 'We offer internships online or in-person for instance via the',
      linkText: 'Humboldt Internship Program',
      after: '.',
      erasmus: 'We support ERASMUS student internships.',
    },
    bachelor: {
      title: 'Bachelor Thesis',
      text: 'Undergraduate (Bachelor) students are always welcome. Projects can take place in Lübeck or Berlin.',
    },
    master: {
      title: 'Master Thesis',
      text: 'Graduate (Master) students are always welcome. Projects can take place in Lübeck or Berlin.',
    },
    phd: {
      title: 'PhD',
      text1: 'We have a fully funded open position available as PhD in Lübeck as a Research Software Engineer (RSE) or Informatician.',
      text2: 'We also supervise doctoral projects if you have a fellowship or similar funding source.',
    },
    postdoc: {
      title: 'PostDoc',
      text1: 'We have a fully funded open position available as PostDoc in Lübeck as a Research Software Engineer (RSE) or Informatician.',
      text2: 'We also supervise postdoctoral projects if you have a fellowship or similar funding source.',
    },
    intro: 'We offer projects on the following topics',
    contactBefore: 'Interested in joining the group? Contact',
  },
  meetings: {
    intro: 'Meetings, workshops, and events we organized or hosted.',
  },
  research: {
    latestReleases: 'Latest releases',
    releaseHistory: 'Release history',
    commitActivity: 'Commit activity',
    fundingBefore: 'This work was supported by the BMFTR-funded',
    fundingLinkText: 'de.NBI',
    fundingAfter:
      'Cloud within the German Network for Bioinformatics Infrastructure (de.NBI) (031A537B, 031A533A, 031A538A, 031A533B, 031A535A, 031A537C, 031A534A, 031A532B).',
    editorsIntro: 'We are actively involved in the standardization and reproducibility efforts in Systems Biology and Systems Medicine.',
  },
  pubChart: {
    title: 'Publications over time',
    note: 'Clicking a bar filters the list below by that research area; clicking a year jumps to it. A paper with several research areas counts once per area.',
  },
  teaching: {
    intro:
      'Welcome to our teaching page! Our focus is on project-based learning that empowers students to actively engage with real-world challenges in digital health and shared decision-making. Through interdisciplinary collaboration, innovative digital formats, and a strong commitment to Open Science and ethical research, we create hands-on, inclusive learning environments. By supporting early-career researchers - especially women - and integrating digital competencies, we prepare the next generation of professionals to shape the future of healthcare.',
  },
  cv: {
    title: 'Curriculum Vitae',
  },
} as const;

type Leaves<T> = T extends string
  ? ''
  : { [K in keyof T & string]: Leaves<T[K]> extends '' ? K : `${K}.${Leaves<T[K]>}` }[keyof T & string];

/** Every dotted leaf path of `en`, e.g. 'nav.publications'. */
export type UiKey = Leaves<typeof en>;
