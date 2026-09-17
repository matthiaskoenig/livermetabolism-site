/**
 * The machine-readable entry points of the site, generated at build time from
 * `data/*.yml` by the endpoints `robots.txt.ts`, `llms.txt.ts` and
 * `llms-full.txt.ts`:
 *
 * - `robotsTxt()` - every crawler (AI crawlers and agents included) may read
 *   the whole site except `/detail/`, the page partials the detail modal
 *   fetches (also kept out of the sitemap, see `astro.config.mjs`); it names
 *   the sitemap and the two LLM files.
 * - `llmsTxt()` - the short Markdown index of https://llmstxt.org/: H1 title,
 *   blockquote summary, then link lists (research areas, pages, software,
 *   current projects) and the `Optional` section last.
 * - `llmsFullTxt()` - the content of every list page in one Markdown file,
 *   showing what the site shows (current projects, current members and
 *   alumni with a photo).
 *
 * Pure (no Astro or DOM imports) like `graphRows.ts`: the endpoints pass the
 * collection entries plus `site`/`base` of the deploy, and every link is an
 * absolute URL under both, so the files stay correct on the GitHub Pages base
 * path and on the custom domain. Data fields may hold HTML; `plainText()`
 * turns it into plain text with Markdown links, never passing markup through.
 *
 * Input field sets are `Pick`s of the collection entries, so the endpoints
 * pass their full entries unchanged while the tests stay small.
 *
 * `llmsTxt()`/`llmsFullTxt()` take `t` for their section headings and field
 * labels, like every other pure module - but `robots.txt`, `llms.txt` and
 * `llms-full.txt` are single global endpoints, not under `[...locale]` (see
 * CLAUDE.md, "Live GitHub and Scholar data" and "Site search" for the same
 * pattern), so their caller always passes the English translator today; the
 * strings still live in the one catalog rather than a second, independently
 * maintained copy.
 */
import type { TFn } from './i18n/catalog';
import { sitePages } from './sitePages';
import { truncateWords } from './text';
import type { Entry, TagInfo } from './views';
import type * as S from './schemas';

export interface Deploy {
  /** Origin of the deploy (`astro.config.mjs`'s `site`), e.g. `https://livermetabolism.com`. */
  site: string;
  /** Base path of the deploy (`import.meta.env.BASE_URL`), `/` or `/livermetabolism-site/`. */
  base: string;
}

export interface LlmsInput extends Deploy {
  t: TFn;
  tags: Pick<TagInfo, 'tag' | 'slug' | 'short_description' | 'description' | 'vision'>[];
  projects: Pick<Entry<S.ProjectData>, 'id' | 'title' | 'status' | 'tags' | 'abstract' | 'homepage'>[];
  software: Pick<Entry<S.SoftwareData>, 'id' | 'name' | 'title' | 'description' | 'homepage' | 'repository' | 'tags'>[];
}

export interface LlmsFullInput extends LlmsInput {
  people: Pick<Entry<S.PersonData>, 'id' | 'name' | 'status' | 'role' | 'tenure' | 'affiliation' | 'description' | 'image'>[];
  publications: Pick<Entry<S.PublicationData>, 'id' | 'title' | 'authors' | 'journal' | 'year' | 'status' | 'doi' | 'tags' | 'abstract'>[];
  funding: Pick<Entry<S.FundingData>, 'id' | 'title' | 'funder' | 'funder_short' | 'start' | 'end' | 'role' | 'description' | 'homepage'>[];
  editors: Pick<Entry<S.EditorData>, 'id' | 'name' | 'tenure' | 'description' | 'homepage'>[];
  presentations: Pick<Entry<S.PresentationData>, 'id' | 'title' | 'authors' | 'event' | 'date' | 'location'>[];
  posters: Pick<Entry<S.PosterData>, 'id' | 'title' | 'authors' | 'event' | 'date'>[];
  abstracts: Pick<Entry<S.AbstractData>, 'id' | 'title' | 'authors' | 'event' | 'year'>[];
  meetings: Pick<Entry<S.MeetingData>, 'id' | 'title' | 'date' | 'location' | 'description' | 'homepage'>[];
  teaching: Pick<Entry<S.TeachingData>, 'id' | 'title' | 'semester' | 'location' | 'content'>[];
  news: Pick<Entry<S.NewsData>, 'id' | 'title' | 'date' | 'short'>[];
}

const TITLE = 'König Lab - Systems Medicine, Digital Twins & AI';
const SUMMARY =
  'The König Lab (Prof. Matthias König, University Hospital Schleswig-Holstein, Campus Lübeck, Germany) works on metabolic inflammation and carcinogenesis of the liver. ' +
  'We build open, FAIR digital twins of human physiology - AI-powered models that predict disease and therapy, patient by patient.';
const CV_PDF = '/assets/cv/Koenig_CV.pdf';

type Abs = (path: string) => string;

/** Absolute URL of a site path under the deploy's origin and base path. */
function absolute({ site, base }: Deploy): Abs {
  const root = new URL(base.endsWith('/') ? base : `${base}/`, site).href;
  return (path) => root + path.replace(/^\/+/, '');
}

const escapeLinkText = (s: string) => s.replace(/[[\]]/g, '\\$&');
const collapse = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * HTML from a data field as one line of plain text: affiliation superscripts
 * dropped, line breaks and block ends as spaces, other tags removed. A link
 * to an http(s) URL or a site path becomes a Markdown link (site paths made
 * absolute through `abs`), any other link (mailto:, #anchor) keeps its text.
 * `links: false` keeps only the text of every link, for summaries that get
 * truncated.
 */
export function plainText(html: string, abs: Abs, { links = true }: { links?: boolean } = {}): string {
  const withLinks = html
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<a\b[^>]*?\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (_m, _q, href: string, inner: string) => {
      const text = collapse(inner.replace(/<[^>]*>/g, ''));
      const target = /^https?:\/\//i.test(href) ? href : /^\/(?!\/)/.test(href) ? abs(href) : null;
      return links && target && text ? `[${escapeLinkText(text)}](${target})` : text;
    });
  return collapse(withLinks.replace(/<br\s*\/?>|<\/(?:p|li|ul|ol|div)>/gi, ' ').replace(/<[^>]*>/g, ''));
}

/** A sentence ending in punctuation, so notes can be joined without "..". */
const sentence = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);
const item = (title: string, href: string, note?: string) => `- [${escapeLinkText(title)}](${href})${note ? `: ${note}` : ''}`;
/** `## title`, then the lines of a list (`sep` = one newline) or the blocks of `entries()` (a blank line between); '' when empty. */
const section = (title: string, body: string[], sep = '\n') => (body.length ? `## ${title}\n\n${body.join(sep)}` : '');
const entries = (title: string, blocks: string[]) => section(title, blocks, '\n\n');
const header = () => [`# ${TITLE}`, '', `> ${SUMMARY}`].join('\n');
const doc = (parts: string[]) => `${parts.filter(Boolean).join('\n\n')}\n`;
/** `- Label: value` lines for the values that are set. */
const fields = (pairs: [string, string | number | null | undefined][]) =>
  pairs.filter(([, v]) => v != null && v !== '').map(([k, v]) => `- ${k}: ${v}`);

export function robotsTxt(deploy: Deploy): string {
  const abs = absolute(deploy);
  const basePath = new URL(abs('')).pathname;
  return [
    `# ${TITLE}`,
    '# Every crawler is welcome, AI crawlers and agents included.',
    '# /detail/ holds the fragments the detail dialogs load, not pages of their own.',
    '',
    'User-agent: *',
    'Allow: /',
    `Disallow: ${basePath}detail/`,
    '',
    `# Summary for LLMs and AI agents (https://llmstxt.org/): ${abs('llms.txt')}`,
    `# The full content as one Markdown file: ${abs('llms-full.txt')}`,
    '',
    `Sitemap: ${abs('sitemap-index.xml')}`,
    '',
  ].join('\n');
}

export function llmsTxt(input: LlmsInput): string {
  const { t } = input;
  const abs = absolute(input);
  const summary = (html: string, words: number) => truncateWords(plainText(html, abs, { links: false }), words);
  const pages = sitePages(t).filter((p) => !p.legal);
  const legal = sitePages(t).filter((p) => p.legal);

  return doc([
    header(),
    t('llms.intro'),
    section(t('llms.researchAreas'), input.tags.map((tag) => item(tag.tag, abs(`/#${tag.slug}`), tag.short_description))),
    section(t('llms.pages'), pages.map((p) => item(p.title, abs(p.path), p.description))),
    section(
      t('nav.software'),
      input.software.map((s) => {
        const source = s.repository ? ` ${t('llms.source')} ${s.repository}` : s.homepage ? ` ${t('links.homepage')}: ${s.homepage}` : '';
        return item(s.name, abs(`/research/#software/${s.id}`), `${sentence(plainText(s.title, abs, { links: false }))}${source}`);
      }),
    ),
    section(
      t('llms.currentProjects'),
      input.projects.filter((p) => p.status === 'current').map((p) => item(plainText(p.title, abs, { links: false }), abs(`/projects/#project/${p.id}`), summary(p.abstract, 30))),
    ),
    section(t('llms.optional'), [
      item(t('llms.fullContent'), abs('llms-full.txt'), t('llms.fullContentNote')),
      item(t('llms.searchIndex'), abs('search.json'), t('llms.searchIndexNote')),
      item(t('llms.sitemap'), abs('sitemap-index.xml')),
      item(t('llms.cvOfMatthias'), abs(CV_PDF), t('links.pdf')),
      ...legal.map((p) => item(p.title, abs(p.path), p.description)),
    ]),
  ]);
}

export function llmsFullTxt(input: LlmsFullInput): string {
  const { t } = input;
  const abs = absolute(input);
  const text = (html: string | null | undefined) => (html ? plainText(html, abs) : '');
  const title = (html: string) => plainText(html, abs, { links: false });
  const areas = (tags: string[]) => (tags.length ? tags.join(', ') : null);
  const byDateDesc = <T extends { date: string }>(rows: T[]) => [...rows].sort((a, b) => b.date.localeCompare(a.date));
  /** `### heading`, the field lines, then the body paragraph - each block only if set, a blank line between. */
  const entry = (heading: string, lines: string[], body?: string) => [`### ${heading}`, lines.join('\n'), body].filter(Boolean).join('\n\n');

  const current = input.people.filter((p) => p.status === 'current');
  const alumni = input.people.filter((p) => p.status === 'alumni' && p.image);
  const person = (p: LlmsFullInput['people'][number]) => {
    const context = [p.tenure, p.affiliation].filter(Boolean).join(', ');
    const description = text(p.description);
    return `- **${p.name}** - ${p.role.join(', ')}${context ? ` (${context})` : ''}.${description ? ` ${description}` : ''} Profile: ${abs(`/people/#person/${p.id}`)}`;
  };

  return doc([
    header(),
    `Generated from the website's data at build time. Website: ${abs('')} - short index: ${abs('llms.txt')}`,
    entries(t('llms.researchAreas'), input.tags.map((tag) => entry(tag.tag, [], `${tag.description.trim()}\n\nVision: ${tag.vision.trim()}`))),
    entries(t('nav.team'), [
      ...(current.length ? [`### ${t('llms.currentMembers')}\n\n${current.map(person).join('\n')}`] : []),
      ...(alumni.length ? [`### ${t('nav.alumni')}\n\n${alumni.map(person).join('\n')}`] : []),
    ]),
    entries(
      t('nav.publications'),
      [...input.publications]
        .sort((a, b) => b.year - a.year)
        .map((p) =>
          entry(
            title(p.title),
            fields([
              [t('llms.authors'), title(p.authors)],
              [t('llms.published'), `${title(p.journal)}, ${p.year}`],
              [t('llms.type'), p.status],
              [t('links.doi'), p.doi ? `https://doi.org/${p.doi}` : null],
              [t('llms.researchAreas'), areas(p.tags)],
              [t('llms.url'), abs(`/publications/#publication/${p.id}`)],
            ]),
            text(p.abstract),
          ),
        ),
    ),
    entries(
      t('nav.projects'),
      input.projects
        .filter((p) => p.status === 'current')
        .map((p) => entry(title(p.title), fields([[t('llms.researchAreas'), areas(p.tags)], [t('links.homepage'), p.homepage], [t('llms.url'), abs(`/projects/#project/${p.id}`)]]), text(p.abstract))),
    ),
    entries(
      t('nav.software'),
      input.software.map((s) =>
        entry(
          `${s.name} - ${title(s.title)}`,
          fields([[t('links.repository'), s.repository], [t('links.homepage'), s.homepage], [t('llms.researchAreas'), areas(s.tags)], [t('llms.url'), abs(`/research/#software/${s.id}`)]]),
          text(s.description),
        ),
      ),
    ),
    entries(
      t('nav.funding'),
      input.funding.map((f) =>
        entry(
          title(f.title),
          fields([[t('llms.funder'), `${f.funder} (${f.funder_short})`], [t('llms.period'), `${f.start}–${f.end}`], [t('llms.role'), f.role], [t('links.homepage'), f.homepage], [t('llms.url'), abs(`/research/#funding-${f.id}`)]]),
          text(f.description),
        ),
      ),
    ),
    entries(t('llms.editorialRoles'), input.editors.map((e) => entry(title(e.name), fields([[t('llms.tenure'), e.tenure], [t('links.homepage'), e.homepage], [t('llms.url'), abs(`/research/#editor-${e.id}`)]]), text(e.description)))),
    section(
      t('nav.presentations'),
      byDateDesc(input.presentations).map((p) => `- ${sentence(title(p.title))} ${sentence(title(p.authors))} ${[p.event, p.location, p.date].filter(Boolean).join(', ')}. ${abs(`/publications/#presentation-${p.id}`)}`),
    ),
    section(t('nav.posters'), byDateDesc(input.posters).map((p) => `- ${sentence(title(p.title))} ${sentence(title(p.authors))} ${p.event}, ${p.date}. ${abs(`/publications/#poster-${p.id}`)}`)),
    section(
      t('llms.conferenceAbstracts'),
      [...input.abstracts].sort((a, b) => b.year - a.year).map((a) => `- ${sentence(title(a.title))} ${sentence(title(a.authors))} ${[a.event, a.year].filter(Boolean).join(', ')}. ${abs(`/publications/#abstract-${a.id}`)}`),
    ),
    entries(
      t('nav.meetings'),
      byDateDesc(input.meetings).map((m) => entry(title(m.title), fields([[t('llms.date'), m.date], [t('llms.location'), m.location], [t('links.homepage'), m.homepage], [t('llms.url'), abs(`/meetings/#meeting-${m.id}`)]]), text(m.description))),
    ),
    entries(t('nav.teaching'), input.teaching.map((row) => entry(title(row.title), fields([[t('llms.semester'), row.semester], [t('llms.location'), row.location], [t('llms.url'), abs(`/teaching/#teaching-${row.id}`)]]), text(row.content)))),
    entries(t('nav.news'), byDateDesc(input.news).map((n) => entry(`${n.date}: ${title(n.title)}`, fields([[t('llms.url'), abs(`/news/#news/${n.id}`)]]), text(n.short)))),
  ]);
}
