/**
 * The machine-readable entry points of the site, generated at build time from
 * `data/*.yml` by the endpoints `robots.txt.ts`, `llms.txt.ts` and
 * `llms-full.txt.ts`:
 *
 * - `robotsTxt()` — every crawler (AI crawlers and agents included) may read
 *   the whole site except `/detail/`, the page partials the detail modal
 *   fetches (also kept out of the sitemap, see `astro.config.mjs`); it names
 *   the sitemap and the two LLM files.
 * - `llmsTxt()` — the short Markdown index of https://llmstxt.org/: H1 title,
 *   blockquote summary, then link lists (research areas, pages, software,
 *   current projects) and the `Optional` section last.
 * - `llmsFullTxt()` — the content of every list page in one Markdown file,
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
 */
import { SITE_PAGES } from './sitePages';
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

const TITLE = 'König Lab — Systems Medicine, Digital Twins & AI';
const SUMMARY =
  'The König Lab (Prof. Matthias König, University Hospital Schleswig-Holstein, Campus Lübeck, Germany) works on metabolic inflammation and carcinogenesis of the liver. ' +
  'We build open, FAIR digital twins of human physiology — AI-powered models that predict disease and therapy, patient by patient.';
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
  const abs = absolute(input);
  const summary = (html: string, words: number) => truncateWords(plainText(html, abs, { links: false }), words);
  const pages = SITE_PAGES.filter((p) => !p.legal);
  const legal = SITE_PAGES.filter((p) => p.legal);

  return doc([
    header(),
    'The site presents the research areas, team, publications, projects, software, funding, meetings, teaching and news of the group. ' +
      'Every entry links to its place on the site; `llms-full.txt` holds all of it as one Markdown file.',
    section('Research areas', input.tags.map((t) => item(t.tag, abs(`/#${t.slug}`), t.short_description))),
    section('Pages', pages.map((p) => item(p.title, abs(p.path), p.description))),
    section(
      'Software',
      input.software.map((s) => {
        const source = s.repository ? ` Source: ${s.repository}` : s.homepage ? ` Homepage: ${s.homepage}` : '';
        return item(s.name, abs(`/research/#software/${s.id}`), `${sentence(plainText(s.title, abs, { links: false }))}${source}`);
      }),
    ),
    section(
      'Current projects',
      input.projects.filter((p) => p.status === 'current').map((p) => item(plainText(p.title, abs, { links: false }), abs(`/projects/#project/${p.id}`), summary(p.abstract, 30))),
    ),
    section('Optional', [
      item('Full content', abs('llms-full.txt'), 'research areas, team, publications, projects, software, funding, editorial roles, presentations, posters, meetings, teaching and news as one Markdown file'),
      item('Search index', abs('search.json'), 'JSON index of every entry, as used by the site search'),
      item('Sitemap', abs('sitemap-index.xml')),
      item('CV of Matthias König', abs(CV_PDF), 'PDF'),
      ...legal.map((p) => item(p.title, abs(p.path), p.description)),
    ]),
  ]);
}

export function llmsFullTxt(input: LlmsFullInput): string {
  const abs = absolute(input);
  const text = (html: string | null | undefined) => (html ? plainText(html, abs) : '');
  const title = (html: string) => plainText(html, abs, { links: false });
  const areas = (tags: string[]) => (tags.length ? tags.join(', ') : null);
  const byDateDesc = <T extends { date: string }>(rows: T[]) => [...rows].sort((a, b) => b.date.localeCompare(a.date));
  /** `### heading`, the field lines, then the body paragraph — each block only if set, a blank line between. */
  const entry = (heading: string, lines: string[], body?: string) => [`### ${heading}`, lines.join('\n'), body].filter(Boolean).join('\n\n');

  const current = input.people.filter((p) => p.status === 'current');
  const alumni = input.people.filter((p) => p.status === 'alumni' && p.image);
  const person = (p: LlmsFullInput['people'][number]) => {
    const context = [p.tenure, p.affiliation].filter(Boolean).join(', ');
    const description = text(p.description);
    return `- **${p.name}** — ${p.role.join(', ')}${context ? ` (${context})` : ''}.${description ? ` ${description}` : ''} Profile: ${abs(`/people/#person/${p.id}`)}`;
  };

  return doc([
    header(),
    `Generated from the website's data at build time. Website: ${abs('')} — short index: ${abs('llms.txt')}`,
    entries('Research areas', input.tags.map((t) => entry(t.tag, [], `${t.description.trim()}\n\nVision: ${t.vision.trim()}`))),
    entries('Team', [
      ...(current.length ? [`### Current members\n\n${current.map(person).join('\n')}`] : []),
      ...(alumni.length ? [`### Alumni\n\n${alumni.map(person).join('\n')}`] : []),
    ]),
    entries(
      'Publications',
      [...input.publications]
        .sort((a, b) => b.year - a.year)
        .map((p) =>
          entry(
            title(p.title),
            fields([
              ['Authors', title(p.authors)],
              ['Published', `${title(p.journal)}, ${p.year}`],
              ['Type', p.status],
              ['DOI', p.doi ? `https://doi.org/${p.doi}` : null],
              ['Research areas', areas(p.tags)],
              ['URL', abs(`/publications/#publication/${p.id}`)],
            ]),
            text(p.abstract),
          ),
        ),
    ),
    entries(
      'Projects',
      input.projects
        .filter((p) => p.status === 'current')
        .map((p) => entry(title(p.title), fields([['Research areas', areas(p.tags)], ['Homepage', p.homepage], ['URL', abs(`/projects/#project/${p.id}`)]]), text(p.abstract))),
    ),
    entries(
      'Software',
      input.software.map((s) =>
        entry(
          `${s.name} — ${title(s.title)}`,
          fields([['Repository', s.repository], ['Homepage', s.homepage], ['Research areas', areas(s.tags)], ['URL', abs(`/research/#software/${s.id}`)]]),
          text(s.description),
        ),
      ),
    ),
    entries(
      'Funding',
      input.funding.map((f) =>
        entry(
          title(f.title),
          fields([['Funder', `${f.funder} (${f.funder_short})`], ['Period', `${f.start}–${f.end}`], ['Role', f.role], ['Homepage', f.homepage], ['URL', abs(`/research/#funding-${f.id}`)]]),
          text(f.description),
        ),
      ),
    ),
    entries('Editorial roles', input.editors.map((e) => entry(title(e.name), fields([['Tenure', e.tenure], ['Homepage', e.homepage], ['URL', abs(`/research/#editor-${e.id}`)]]), text(e.description)))),
    section(
      'Presentations',
      byDateDesc(input.presentations).map((p) => `- ${sentence(title(p.title))} ${sentence(title(p.authors))} ${[p.event, p.location, p.date].filter(Boolean).join(', ')}. ${abs(`/publications/#presentation-${p.id}`)}`),
    ),
    section('Posters', byDateDesc(input.posters).map((p) => `- ${sentence(title(p.title))} ${sentence(title(p.authors))} ${p.event}, ${p.date}. ${abs(`/publications/#poster-${p.id}`)}`)),
    section(
      'Conference abstracts',
      [...input.abstracts].sort((a, b) => b.year - a.year).map((a) => `- ${sentence(title(a.title))} ${sentence(title(a.authors))} ${[a.event, a.year].filter(Boolean).join(', ')}. ${abs(`/publications/#abstract-${a.id}`)}`),
    ),
    entries(
      'Meetings',
      byDateDesc(input.meetings).map((m) => entry(title(m.title), fields([['Date', m.date], ['Location', m.location], ['Homepage', m.homepage], ['URL', abs(`/meetings/#meeting-${m.id}`)]]), text(m.description))),
    ),
    entries('Teaching', input.teaching.map((t) => entry(title(t.title), fields([['Semester', t.semester], ['Location', t.location], ['URL', abs(`/teaching/#teaching-${t.id}`)]]), text(t.content)))),
    entries('News', byDateDesc(input.news).map((n) => entry(`${n.date}: ${title(n.title)}`, fields([['URL', abs(`/news/#news/${n.id}`)]]), text(n.short)))),
  ]);
}
