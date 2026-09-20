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
    // Footer.astro's two postal addresses (institution/department names and
    // the street stay fixed template text in both locales, like every other
    // institution name - see TRANSLATION.md); only the country word was
    // unreachable by the translation workflow. Whether German says
    // "Deutschland" is a reversible content call, not a translation
    // correctness one - swap this one value back to "Germany" to revert.
    country: 'Germany',
    // Matches the page's own <h2> heading (i18n/en/pages/impressum.yml /
    // privacy.yml's `heading`), not the German loanword: a footer link
    // reading "Impressum" that lands on a page headed "Legal Notice" read
    // as two different pages to an English visitor. sitePages.impressum /
    // .privacy (the search/llms.txt description) already used the English
    // wording; this brings the footer link and the <title> (see
    // impressum.astro/privacy.astro) in line with it.
    impressum: 'Legal Notice',
    privacy: 'Privacy Policy',
    // Opens GitHub's "new issue" form for this site's own repository
    // (issue #67): the site has no contact form, and a reader who spots a
    // broken link or a wrong figure has nowhere else to say so.
    reportIssue: 'Report an issue',
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
    people: 'People',
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
    historyYearly: 'yearly totals from the citation histogram up to {year}',
    historyDaily: 'daily readings from {date}',
    historyStarts: 'history starts {date}',
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
    latestRelease: 'Latest release',
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
    doi: 'DOI',
    pubmed: 'PubMed',
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
    citedOne: 'cited {count}',
    citedOther: 'cited {count}',
    abstract: 'Abstract',
  },
  filter: {
    all: 'All',
    // The one global research-area filter (issue #68). It is site chrome now
    // (TopicFilter.astro, sticky under the navbar on every page that has
    // taggable content), not a per-page island, so these strings describe the
    // whole page's filtered state rather than one grid's.
    label: 'Research area',
    // Shown in place of a grid that the active research area empties, so a
    // section keeps its heading and its #anchor instead of vanishing.
    empty: 'Nothing in this research area yet.',
    // Screen-reader-only summary of what the bar currently does, announced
    // when the selection changes. {topic} is the translated area label.
    active: 'Showing {topic} only',
    clear: 'Show all research areas',
  },
  tags: {
    // The display label of a research-area tag - `tag` itself (data/tags.yml)
    // is a machine value (a cross-reference target, a slug source, a
    // data-tag/?tag= filter value, a chart series name) and is never
    // translated; only this label is. Keyed by the tag's slug
    // (`slugify(tag)`), the same key TAG_PALETTE/TAG_GRAPHICS use, so it
    // survives a tag being renamed as long as the slug does not change.
    // Adding a research area to data/tags.yml means adding its slug's label
    // key here (see i18n/TRANSLATION.md).
    label: {
      digitalTwins: 'Digital Twins',
      ai: 'AI',
      digitalPathology: 'Digital Pathology',
      pharmacometrics: 'Pharmacometrics',
      openFair: 'Open & FAIR',
    },
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
    weekOf: 'Week of {date}',
    total: 'total: {count}',
    others: '{count} others',
    citationOne: '{count} citation',
    citationOther: '{count} citations',
  },
  network: {
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    reset: 'Reset',
    loading: 'Loading the network…',
    graphLabel: 'Network of the people, publications, projects and software of the group',
    caption:
      "Pick a research area to show only its people, publications, projects and software; the graph re-arranges itself around what is left. Drag a node to move it, drag the background to pan, use the buttons to zoom. Clicking a node opens it on the site. People carry their photo, projects are squares, software diamonds and publications dots; each kind is outlined in its own colour, as in the legend. Every node is sized by how many people, papers, projects and tools it connects to.",
    intro:
      "How the work of the group hangs together: {people} people, {publications} publications, {projects} projects and {software} software tools, connected by authorship and membership. People carry their photo, projects are squares, software diamonds and publications dots, each kind outlined in its own colour; every node is sized by how many people, papers, projects and tools it connects to.",
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
    teamMembers: 'Team members',
    softwarePackages: 'Software packages',
    fundedProjects: 'Funded projects',
    alumniCount: '{count} alumni',
    starOne: '{count} star',
    starOther: '{count} stars',
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
  time: {
    today: 'today',
    yesterday: 'yesterday',
    day: { one: '{count} day ago', other: '{count} days ago' },
    week: { one: '{count} week ago', other: '{count} weeks ago' },
    month: { one: '{count} month ago', other: '{count} months ago' },
    year: { one: '{count} year ago', other: '{count} years ago' },
  },
  status: {
    current: 'Current',
    old: 'Old',
    publication: 'Publication',
    review: 'Review',
    proceeding: 'Proceeding',
    chapter: 'Chapter',
    preprint: 'Preprint',
    abstract: 'Abstract',
    thesis: 'Thesis',
    report: 'Report',
  },
  type: {
    person: 'Person',
    project: 'Project',
    software: 'Software',
    publication: 'Publication',
  },
  teachingType: {
    lecture: 'Lecture',
    course: 'Course',
    seminar: 'Seminar',
  },
  fundingRole: {
    recipient: 'Recipient',
    coInvestigator: 'Co-Investigator',
  },
  searchType: {
    publication: 'Publication',
    presentation: 'Presentation',
    poster: 'Poster',
    abstract: 'Abstract',
    project: 'Project',
    software: 'Software',
    funding: 'Funding',
    editorialRole: 'Editorial role',
    news: 'News',
    meeting: 'Meeting',
    teaching: 'Teaching',
    person: 'Person',
    researchArea: 'Research area',
    page: 'Page',
  },
  llms: {
    researchAreas: 'Research areas',
    pages: 'Pages',
    currentProjects: 'Current projects',
    optional: 'Optional',
    intro: 'The site presents the research areas, team, publications, projects, software, funding, meetings, teaching and news of the group. Every entry links to its place on the site; `llms-full.txt` holds all of it as one Markdown file.',
    fullContent: 'Full content',
    fullContentNote: 'research areas, team, publications, projects, software, funding, editorial roles, presentations, posters, meetings, teaching and news as one Markdown file',
    searchIndex: 'Search index',
    searchIndexNote: 'JSON index of every entry, as used by the site search',
    sitemap: 'Sitemap',
    cvOfMatthias: 'CV of Matthias König',
    source: 'Source:',
    currentMembers: 'Current members',
    authors: 'Authors',
    published: 'Published',
    type: 'Type',
    url: 'URL',
    funder: 'Funder',
    period: 'Period',
    role: 'Role',
    editorialRoles: 'Editorial roles',
    tenure: 'Tenure',
    conferenceAbstracts: 'Conference abstracts',
    date: 'Date',
    location: 'Location',
    semester: 'Semester',
  },
  sitePages: {
    team: 'Current members and alumni of the group.',
    openPositions: 'Internships, Bachelor and Master theses, PhD and PostDoc positions - in Lübeck or Berlin.',
    research: 'Software, funding, and editorial roles.',
    projects: 'Ongoing research projects.',
    publications: 'Publications, presentations, posters, and abstracts.',
    network: 'Interactive network graph of the research areas, people, publications, projects, and software of the group.',
    news: 'Recent news and updates from the group.',
    meetings: 'Meetings, workshops, and events organized or hosted by the group.',
    teaching: 'Project-based teaching in digital health and shared decision-making, Open Science, and interdisciplinary collaboration.',
    impressum: 'Legal notice: contact details, address, and person responsible for content per section 5 TMG.',
    privacy: 'Privacy policy: server logs, Google Analytics, cookie consent, and data subject rights.',
  },
} as const;

type Leaves<T> = T extends string
  ? ''
  : { [K in keyof T & string]: Leaves<T[K]> extends '' ? K : `${K}.${Leaves<T[K]>}` }[keyof T & string];

/** Every dotted leaf path of `en`, e.g. 'nav.publications'. */
export type UiKey = Leaves<typeof en>;
