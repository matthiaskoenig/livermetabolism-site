import type { APIRoute } from 'astro';
import * as d from '../lib/data';
import type { SearchRecord } from '../lib/search';
import { stripHtml } from '../lib/text';
import { url } from '../lib/url';

const clean = (s: string | null | undefined) => (s ?? '').replace(/\s*\n\s*/g, ' ').trim();
const join = (parts: (string | number | null | undefined)[]) => clean(parts.map((p) => (p == null ? '' : String(p))).join(' '));

export const GET: APIRoute = async () => {
  const [tags, people, publications, presentations, posters, abstracts, projects, software, funding, editors, news, meetings, teaching] =
    await Promise.all([d.getTags(), d.getPeople(), d.getPublications(), d.getPresentations(), d.getPosters(), d.getAbstracts(), d.getProjects(), d.getSoftware(), d.getFunding(), d.getEditors(), d.getNews(), d.getMeetings(), d.getTeaching()]);

  const out: SearchRecord[] = [];
  for (const p of publications) out.push({ type: 'Publication', title: stripHtml(p.title), text: join([stripHtml(p.authors), p.journal, p.year, p.status, p.tags.join(', '), stripHtml(p.abstract ?? ''), p.keywords.join(', ')]), url: url(`/publications/#publication/${p.id}`) });
  for (const p of presentations) out.push({ type: 'Presentation', title: stripHtml(p.title), text: join([stripHtml(p.authors), p.event, p.location, p.tags.join(', '), stripHtml(p.abstract ?? ''), p.keywords.join(', ')]), url: url(`/publications/#presentation-${p.id}`) });
  for (const p of posters) out.push({ type: 'Poster', title: stripHtml(p.title), text: join([stripHtml(p.authors), p.event, p.tags.join(', '), stripHtml(p.abstract), p.keywords.join(', ')]), url: url(`/publications/#poster-${p.id}`) });
  for (const a of abstracts) out.push({ type: 'Abstract', title: stripHtml(a.title), text: join([stripHtml(a.authors), a.event, stripHtml(a.abstract ?? ''), a.keywords.join(', ')]), url: url(`/publications/#abstract-${a.id}`) });
  for (const p of projects) if (p.status === 'current') out.push({ type: 'Project', title: stripHtml(p.title), text: join([p.tags.join(', '), stripHtml(p.abstract)]), url: url(`/projects/#project/${p.id}`) });
  for (const s of software) out.push({ type: 'Software', title: stripHtml(s.name), text: join([s.title, stripHtml(s.description), s.tags.join(', ')]), url: url(`/research/#software/${s.id}`) });
  for (const f of funding) out.push({ type: 'Funding', title: stripHtml(f.title), text: join([f.funder, f.funder_short, stripHtml(f.description), f.tags.join(', ')]), url: url(`/research/#funding-${f.id}`) });
  for (const e of editors) out.push({ type: 'Editorial role', title: stripHtml(e.name), text: join([e.tenure, stripHtml(e.description), e.tags.join(', ')]), url: url(`/research/#editor-${e.id}`) });
  for (const n of news) out.push({ type: 'News', title: stripHtml(n.title), text: join([stripHtml(n.short), n.tags.join(', ')]), url: url(`/news/#news/${n.id}`) });
  for (const m of meetings) out.push({ type: 'Meeting', title: stripHtml(m.title), text: join([m.location, stripHtml(m.description), m.tags.join(', ')]), url: url(`/meetings/#meeting-${m.id}`) });
  for (const t of teaching) out.push({ type: 'Teaching', title: stripHtml(t.title), text: join([t.type.join(', '), t.location, stripHtml(t.content), t.tags.join(', ')]), url: url(`/teaching/#teaching-${t.id}`) });
  for (const p of people) if (p.status === 'current' || p.image) out.push({ type: 'Person', title: stripHtml(p.name), text: join([p.role.join(', '), p.affiliation, p.tenure, stripHtml(p.description ?? '')]), url: url(`/people/#person/${p.id}`) });
  for (const t of tags) out.push({ type: 'Research area', title: t.tag, text: join([t.short_description, t.vision]), url: url(`/#${t.slug}`) });

  const pages: [string, string, string][] = [
    ['Team', 'Current members and alumni of the group.', '/people/'],
    ['Open Positions', 'Internships, Bachelor and Master theses, PhD and PostDoc positions - in Lübeck or Berlin.', '/people/#open-positions'],
    ['Research', 'Software, funding, and editorial roles.', '/research/'],
    ['Projects', 'Ongoing research projects.', '/projects/'],
    ['Publications', 'Publications, presentations, posters, and abstracts.', '/publications/'],
    ['Network', 'Interactive network graph of the research areas, people, publications, projects, and software of the group.', '/network/'],
    ['News', 'Recent news and updates from the group.', '/news/'],
    ['Meetings', 'Meetings, workshops, and events organized or hosted by the group.', '/meetings/'],
    ['Teaching', 'Project-based teaching in digital health and shared decision-making, Open Science, and interdisciplinary collaboration.', '/teaching/'],
    ['Impressum', 'Legal notice: contact details, address, and person responsible for content per section 5 TMG.', '/impressum/'],
    ['Datenschutzerklärung', 'Privacy policy: server logs, Google Analytics, cookie consent, and data subject rights.', '/privacy/'],
  ];
  for (const [title, text, path] of pages) out.push({ type: 'Page', title, text, url: url(path) });

  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
