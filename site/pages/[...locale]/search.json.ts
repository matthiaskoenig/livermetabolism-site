import type { APIRoute } from 'astro';
import * as d from '../../lib/data';
import { uiFor } from '../../lib/i18n/catalog';
import { localeFromParams, localePaths, urlFor } from '../../lib/i18n/routes';
import type { SearchRecord } from '../../lib/search';
import { sitePages } from '../../lib/sitePages';
import { stripHtml } from '../../lib/text';

// One index per locale, under [...locale] like the rest of the site's pages
// (see CLAUDE.md, "Site search"); Base.astro fetches /search.json or
// /de/search.json depending on the page it is rendered on.
export const getStaticPaths = localePaths;

const clean = (s: string | null | undefined) => (s ?? '').replace(/\s*\n\s*/g, ' ').trim();
const join = (parts: (string | number | null | undefined)[]) => clean(parts.map((p) => (p == null ? '' : String(p))).join(' '));

export const GET: APIRoute = async ({ params }) => {
  const locale = localeFromParams(params as { locale?: string });
  const { t } = uiFor(locale);
  const url = urlFor(locale);

  const [tags, people, publications, presentations, posters, abstracts, projects, software, funding, editors, news, meetings, teaching] =
    await Promise.all([d.getTags(locale), d.getPeople(locale), d.getPublications(locale), d.getPresentations(locale), d.getPosters(locale), d.getAbstracts(locale), d.getProjects(locale), d.getSoftware(locale), d.getFunding(locale), d.getEditors(locale), d.getNews(locale), d.getMeetings(locale), d.getTeaching(locale)]);

  const out: SearchRecord[] = [];
  for (const p of publications) out.push({ kind: 'publication', type: t('searchType.publication'), title: stripHtml(p.title), text: join([stripHtml(p.authors), p.journal, p.year, p.status, p.tags.join(', '), stripHtml(p.abstract ?? ''), p.keywords.join(', ')]), url: url(`/publications/#publication/${p.id}`) });
  for (const p of presentations) out.push({ kind: 'presentation', type: t('searchType.presentation'), title: stripHtml(p.title), text: join([stripHtml(p.authors), p.event, p.location, p.tags.join(', '), stripHtml(p.abstract ?? ''), p.keywords.join(', ')]), url: url(`/publications/#presentation-${p.id}`) });
  for (const p of posters) out.push({ kind: 'poster', type: t('searchType.poster'), title: stripHtml(p.title), text: join([stripHtml(p.authors), p.event, p.tags.join(', '), stripHtml(p.abstract), p.keywords.join(', ')]), url: url(`/publications/#poster-${p.id}`) });
  for (const a of abstracts) out.push({ kind: 'abstract', type: t('searchType.abstract'), title: stripHtml(a.title), text: join([stripHtml(a.authors), a.event, stripHtml(a.abstract ?? ''), a.keywords.join(', ')]), url: url(`/publications/#abstract-${a.id}`) });
  for (const p of projects) if (p.status === 'current') out.push({ kind: 'project', type: t('searchType.project'), title: stripHtml(p.title), text: join([p.tags.join(', '), stripHtml(p.abstract)]), url: url(`/projects/#project/${p.id}`) });
  for (const s of software) out.push({ kind: 'software', type: t('searchType.software'), title: stripHtml(s.name), text: join([s.title, stripHtml(s.description), s.tags.join(', ')]), url: url(`/research/#software/${s.id}`) });
  for (const f of funding) out.push({ kind: 'funding', type: t('searchType.funding'), title: stripHtml(f.title), text: join([f.funder, f.funder_short, stripHtml(f.description), f.tags.join(', ')]), url: url(`/research/#funding-${f.id}`) });
  for (const e of editors) out.push({ kind: 'editorialRole', type: t('searchType.editorialRole'), title: stripHtml(e.name), text: join([e.tenure, stripHtml(e.description), e.tags.join(', ')]), url: url(`/research/#editor-${e.id}`) });
  for (const n of news) out.push({ kind: 'news', type: t('searchType.news'), title: stripHtml(n.title), text: join([stripHtml(n.short), n.tags.join(', ')]), url: url(`/news/#news/${n.id}`) });
  for (const m of meetings) out.push({ kind: 'meeting', type: t('searchType.meeting'), title: stripHtml(m.title), text: join([m.location, stripHtml(m.description), m.tags.join(', ')]), url: url(`/meetings/#meeting-${m.id}`) });
  for (const t2 of teaching) out.push({ kind: 'teaching', type: t('searchType.teaching'), title: stripHtml(t2.title), text: join([t2.type.join(', '), t2.location, stripHtml(t2.content), t2.tags.join(', ')]), url: url(`/teaching/#teaching-${t2.id}`) });
  for (const p of people) if (p.status === 'current' || p.image) out.push({ kind: 'person', type: t('searchType.person'), title: stripHtml(p.name), text: join([p.role.join(', '), p.affiliation, p.tenure, stripHtml(p.description ?? '')]), url: url(`/people/#person/${p.id}`) });
  for (const tag of tags) out.push({ kind: 'researchArea', type: t('searchType.researchArea'), title: tag.label, text: join([tag.short_description, tag.vision]), url: url(`/#${tag.slug}`) });

  for (const p of sitePages(t)) out.push({ kind: 'page', type: t('searchType.page'), title: p.title, text: p.description, url: url(p.path) });

  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
