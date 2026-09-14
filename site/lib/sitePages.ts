/**
 * The site's static pages with a one-line description each — the records
 * the site search indexes as "Page" (`search.json.ts`) and the page list of
 * `/llms.txt` (`llms.ts`). Paths are site paths without the base; callers
 * pass them through `url()` or an absolute-URL builder. `legal` marks the
 * Impressum and privacy pages, which `llms.txt` lists as optional.
 */
export interface SitePage {
  title: string;
  description: string;
  path: string;
  legal?: boolean;
}

export const SITE_PAGES: SitePage[] = [
  { title: 'Team', description: 'Current members and alumni of the group.', path: '/people/' },
  { title: 'Open Positions', description: 'Internships, Bachelor and Master theses, PhD and PostDoc positions - in Lübeck or Berlin.', path: '/people/#open-positions' },
  { title: 'Research', description: 'Software, funding, and editorial roles.', path: '/research/' },
  { title: 'Projects', description: 'Ongoing research projects.', path: '/projects/' },
  { title: 'Publications', description: 'Publications, presentations, posters, and abstracts.', path: '/publications/' },
  { title: 'Network', description: 'Interactive network graph of the research areas, people, publications, projects, and software of the group.', path: '/network/' },
  { title: 'News', description: 'Recent news and updates from the group.', path: '/news/' },
  { title: 'Meetings', description: 'Meetings, workshops, and events organized or hosted by the group.', path: '/meetings/' },
  { title: 'Teaching', description: 'Project-based teaching in digital health and shared decision-making, Open Science, and interdisciplinary collaboration.', path: '/teaching/' },
  { title: 'Impressum', description: 'Legal notice: contact details, address, and person responsible for content per section 5 TMG.', path: '/impressum/', legal: true },
  { title: 'Datenschutzerklärung', description: 'Privacy policy: server logs, Google Analytics, cookie consent, and data subject rights.', path: '/privacy/', legal: true },
];
