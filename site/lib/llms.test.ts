import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { uiFor } from './i18n/catalog';
import { llmsFullTxt, llmsTxt, plainText, robotsTxt, type LlmsFullInput } from './llms';
import * as s from './schemas';
import { toTagInfo } from './views';

const { t } = uiFor('en');
const ROOT = { site: 'https://example.org', base: '/', t };
const PAGES = { site: 'https://matthiaskoenig.github.io', base: '/livermetabolism-site/', t };

const lines = (text: string) => text.split('\n');
/** Every `[text](target)` link target in a Markdown document. */
const linkTargets = (md: string) => [...md.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
/** The Markdown between `## <name>` and the next `## ` heading. */
const section = (md: string, name: string) => {
  const start = md.indexOf(`\n## ${name}\n`);
  if (start < 0) return null;
  const rest = md.slice(start + name.length + 5);
  const end = rest.indexOf('\n## ');
  return end < 0 ? rest : rest.slice(0, end);
};

function fixture(over: Partial<LlmsFullInput> = {}): LlmsFullInput {
  return {
    ...ROOT,
    tags: [
      { tag: 'AI', slug: 'ai', label: 'AI', short_description: 'Short AI.', description: 'Long AI.', vision: 'AI vision.' },
      { tag: 'Open & FAIR', slug: 'open-fair', label: 'Open & FAIR', short_description: 'Short FAIR.', description: 'Long FAIR.', vision: 'FAIR vision.' },
    ],
    people: [
      { id: 'ada', name: 'Ada Lovelace', status: 'current', role: ['PhD student', 'PostDoc'], tenure: '2020-', affiliation: null, description: 'Works on <b>digital twins</b>.', image: 'ada.webp' },
      { id: 'bob', name: 'Bob Builder', status: 'alumni', role: ['Master student'], tenure: '2018-2019', affiliation: 'TU Berlin', description: null, image: 'bob.webp' },
      { id: 'eve', name: 'Eve Hidden', status: 'alumni', role: ['Intern'], tenure: '2017', affiliation: null, description: null, image: null },
    ],
    publications: [
      { id: 'Old2019_x', title: 'An old paper', authors: 'Lovelace A<sup>1</sup>, Builder B<sup>2</sup>', journal: 'Nature', year: 2019, status: 'publication', doi: '10.1000/old', tags: ['AI'], abstract: '<p>Old abstract.</p>' },
      { id: 'New2026_y', title: 'A <i>new</i> preprint', authors: 'Builder B', journal: 'bioRxiv', year: 2026, status: 'preprint', doi: null, tags: [], abstract: null },
    ],
    projects: [
      { id: 'atlas', title: 'ATLAS', status: 'current', tags: ['AI'], abstract: 'A current project about liver function.', homepage: 'https://atlas.example' },
      { id: 'gone', title: 'Finished project', status: 'old', tags: [], abstract: 'Done.', homepage: null },
    ],
    software: [
      { id: 'sbmlutils', name: 'sbmlutils', title: 'Python utilities for SBML', description: 'Tools for <a href="https://sbml.org">SBML</a>.', homepage: null, repository: 'https://github.com/matthiaskoenig/sbmlutils', tags: ['Open & FAIR'] },
    ],
    funding: [
      { id: 'grant1', title: 'Liver twins', funder: 'Deutsche Forschungsgemeinschaft', funder_short: 'DFG', start: '2024', end: '2027', role: 'Recipient', description: 'Funded work.', homepage: null },
    ],
    editors: [{ id: 'ed1', name: 'Journal of Examples', tenure: '2021-', description: 'Editorial board member.', homepage: null }],
    presentations: [{ id: 'talk1', title: 'Digital twins talk', authors: 'Lovelace A', event: 'Liver Meeting', date: '2025-05-01', location: 'Berlin' }],
    posters: [{ id: 'poster1', title: 'A poster', authors: 'Builder B', event: 'ICSB', date: '2024-10-01' }],
    abstracts: [{ id: 'abs1', title: 'A conference abstract', authors: 'Lovelace A', event: 'GAMM', year: 2026 }],
    meetings: [{ id: 'combine2022', title: 'COMBINE 2022', date: '2022-10-10', location: 'Berlin', description: 'The 13th COMBINE meeting.', homepage: 'https://co.mbine.org' }],
    teaching: [{ id: 'pk2024', title: 'Pharmacokinetics course', semester: 'WS 2024/25', location: 'HU Berlin', content: 'PBPK modeling.' }],
    news: [{ id: 'n1', title: 'New paper', date: '2026-09-01', short: 'Our paper is out, see <a href="/publications/">publications</a>.' }],
    ...over,
  };
}

/** `llmsFullTxt()` over a fixture, both locale contexts built from the same fixture (the fixture itself carries no real German text). */
const fixtureFull = (over: Partial<LlmsFullInput> = {}) => llmsFullTxt({ en: fixture(over), de: fixture(over) });
/** The English half of a bilingual `llmsFullTxt()` document, so single-locale assertions keep reading like before. */
const englishHalf = (md: string) => md.slice(0, md.indexOf('## Deutsch'));

const realRows = (name: string) => load(readFileSync(`data/${name}.yml`, 'utf8')) as Record<string, unknown>[];
const realParse = <T>(name: string, schema: { array: () => { parse: (v: unknown) => T[] } }): T[] => schema.array().parse(realRows(name));
const withRealIds = <T extends { id?: string }>(items: T[]): (T & { id: string })[] => items.map((i) => ({ ...i, id: i.id as string }));

/**
 * A real, full `LlmsFullInput` from the actual YAML, for the given locale's
 * translator. Bibliographic tables (publications, presentations, posters,
 * abstracts) read the same for either locale: they are absent from
 * i18n/fields.ts's TRANSLATABLE, so nothing here (or in production) overlays
 * them - which is exactly what the bibliographic-title test below relies on.
 */
function realInput(locale: 'en' | 'de'): LlmsFullInput {
  return {
    site: 'https://livermetabolism.com',
    base: '/',
    t: uiFor(locale).t,
    tags: toTagInfo(realParse('tags', s.tagSchema)),
    people: withRealIds(realParse('people', s.personSchema)),
    publications: withRealIds(realParse('publications', s.publicationSchema)),
    projects: withRealIds(realParse('projects', s.projectSchema)),
    software: withRealIds(realParse('software', s.softwareSchema)),
    funding: withRealIds(realParse('funding', s.fundingSchema)),
    editors: withRealIds(realParse('editors', s.editorSchema)),
    presentations: withRealIds(realParse('presentations', s.presentationSchema)),
    posters: withRealIds(realParse('posters', s.posterSchema)),
    abstracts: withRealIds(realParse('abstracts', s.abstractSchema)),
    meetings: withRealIds(realParse('meetings', s.meetingSchema)),
    teaching: withRealIds(realParse('teaching', s.teachingSchema)),
    news: withRealIds(realParse('news', s.newsSchema)),
  };
}

describe('robotsTxt', () => {
  it('names the sitemap and llms.txt by their absolute URLs', () => {
    const text = robotsTxt(ROOT);
    expect(lines(text)).toContain('Sitemap: https://example.org/sitemap-index.xml');
    expect(text).toContain('https://example.org/llms.txt');
  });

  it('lets every crawler in and keeps only the detail fragments (English and German) out', () => {
    const rules = lines(robotsTxt(ROOT)).filter((l) => /^(User-agent|Allow|Disallow):/.test(l));
    expect(rules).toEqual(['User-agent: *', 'Allow: /', 'Disallow: /detail/', 'Disallow: /de/detail/']);
  });

  it('carries the base path in the disallowed paths and the sitemap URL', () => {
    const text = lines(robotsTxt(PAGES));
    expect(text).toContain('Disallow: /livermetabolism-site/detail/');
    expect(text).toContain('Disallow: /livermetabolism-site/de/detail/');
    expect(text).toContain('Sitemap: https://matthiaskoenig.github.io/livermetabolism-site/sitemap-index.xml');
  });
});

describe('plainText', () => {
  const abs = (path: string) => `https://example.org${path}`;

  it.each([
    ['drops affiliation superscripts', 'König M<sup>1,2</sup>, Doe J<sup>3</sup>', 'König M, Doe J'],
    ['turns line breaks and paragraphs into spaces', '<p>one</p><p>two<br />three</p>', 'one two three'],
    ['keeps the text of inline markup', 'a <b>bold</b> and <i>italic</i> word', 'a bold and italic word'],
    ['collapses whitespace', '  spread \n over\tlines  ', 'spread over lines'],
    ['keeps an external link as a Markdown link', 'see <a href="https://sbml.org">SBML</a>', 'see [SBML](https://sbml.org)'],
    ['makes a site-relative link absolute', 'read <a href="/assets/pdf/t.pdf">the thesis</a>', 'read [the thesis](https://example.org/assets/pdf/t.pdf)'],
    ['keeps only the text of a mailto link', '<a href="mailto:x@y.org">mail us</a>', 'mail us'],
  ])('%s', (_name, html, want) => {
    expect(plainText(html, abs)).toBe(want);
  });

  it('escapes square brackets inside link text', () => {
    expect(plainText('<a href="https://x.org">[beta] tool</a>', abs)).toBe('[\\[beta\\] tool](https://x.org)');
  });
});

describe('llmsTxt', () => {
  const text = llmsTxt(fixture());

  it('opens with the H1 title and a blockquote summary, as llmstxt.org requires', () => {
    const [h1, blank, quote] = lines(text);
    expect(h1).toBe('# König Lab - Systems Medicine, Digital Twins & AI');
    expect(blank).toBe('');
    expect(quote.startsWith('> ')).toBe(true);
  });

  it('links every research area to its homepage section with its short description', () => {
    expect(section(text, 'Research areas')).toContain('- [AI](https://example.org/#ai): Short AI.');
    expect(section(text, 'Research areas')).toContain('- [Open & FAIR](https://example.org/#open-fair): Short FAIR.');
  });

  it('lists software with its site detail link and its repository', () => {
    expect(section(text, 'Software')).toContain('- [sbmlutils](https://example.org/research/#software/sbmlutils): Python utilities for SBML. Source: https://github.com/matthiaskoenig/sbmlutils');
  });

  it('lists current projects only', () => {
    const projects = section(text, 'Current projects');
    expect(projects).toContain('[ATLAS](https://example.org/projects/#project/atlas)');
    expect(projects).not.toContain('Finished project');
  });

  it('leaves out a section with nothing to list instead of an empty heading', () => {
    const md = llmsTxt(fixture({ projects: [{ id: 'gone', title: 'Finished project', status: 'old', tags: [], abstract: 'Done.', homepage: null }] }));
    expect(md).not.toContain('## Current projects');
    expect(md).not.toMatch(/\n\n\n/);
  });

  it('puts llms-full.txt, the sitemap and both language homepages into the Optional section, which comes last', () => {
    const optional = section(text, 'Optional');
    expect(optional).toContain('(https://example.org/llms-full.txt)');
    expect(optional).toContain('(https://example.org/sitemap-index.xml)');
    expect(optional).toContain('[English](https://example.org/)');
    expect(optional).toContain('[Deutsch](https://example.org/de/)');
    expect(text.lastIndexOf('\n## ')).toBe(text.indexOf('\n## Optional\n'));
  });

  it('builds every link under the deploy base path', () => {
    const targets = linkTargets(llmsTxt(fixture(PAGES)));
    expect(targets.length).toBeGreaterThan(10);
    for (const target of targets) expect(target.startsWith('https://matthiaskoenig.github.io/livermetabolism-site/')).toBe(true);
  });
});

describe('llmsFullTxt', () => {
  const full = fixtureFull();
  const text = englishHalf(full);

  it('opens with the same H1 title and summary as llms.txt', () => {
    expect(lines(text)[0]).toMatch(/^# \S/);
    expect(lines(text).slice(0, 3)).toEqual(lines(llmsTxt(fixture())).slice(0, 3));
  });

  it('gives every research area its vision statement', () => {
    const areas = section(text, 'Research areas');
    expect(areas).toContain('### AI');
    expect(areas).toContain('AI vision.');
    expect(areas).toContain('Long FAIR.');
  });

  it('writes a publication with plain-text authors, a DOI link, its research areas and its abstract', () => {
    const pubs = section(text, 'Publications')!;
    expect(pubs).toContain('### An old paper');
    expect(pubs).toContain('Lovelace A, Builder B');
    expect(pubs).toContain('https://doi.org/10.1000/old');
    expect(pubs).toContain('Research areas: AI');
    expect(pubs).toContain('Old abstract.');
    expect(pubs).toContain('https://example.org/publications/#publication/Old2019_x');
  });

  it('orders publications newest first', () => {
    const pubs = section(text, 'Publications')!;
    expect(pubs.indexOf('### A new preprint')).toBeLessThan(pubs.indexOf('### An old paper'));
  });

  it('shows the same people as the team page: current members and alumni with a photo', () => {
    const team = section(text, 'Team')!;
    expect(team).toContain('Ada Lovelace');
    expect(team).toContain('Bob Builder');
    expect(team).not.toContain('Eve Hidden');
  });

  it('leaves finished projects out, like the projects page', () => {
    const projects = section(text, 'Projects')!;
    expect(projects).toContain('### ATLAS');
    expect(projects).not.toContain('Finished project');
  });

  it('has a section for every other table the site shows', () => {
    expect(section(text, 'Software')).toContain('sbmlutils');
    expect(section(text, 'Funding')).toContain('Liver twins');
    expect(section(text, 'Editorial roles')).toContain('Journal of Examples');
    expect(section(text, 'Presentations')).toContain('Digital twins talk');
    expect(section(text, 'Posters')).toContain('A poster');
    expect(section(text, 'Conference abstracts')).toContain('A conference abstract');
    expect(section(text, 'Meetings')).toContain('COMBINE 2022');
    expect(section(text, 'Teaching')).toContain('Pharmacokinetics course');
    expect(section(text, 'News')).toContain('[publications](https://example.org/publications/)');
  });

  it.each([
    ['llms.txt', () => llmsTxt(fixture())],
    ['llms-full.txt', () => fixtureFull()],
  ])('%s sets every heading off by a blank line and never leaves two blank lines in a row', (_name, build) => {
    const md = build();
    const ls = lines(md);
    ls.forEach((l, i) => {
      if (i > 0 && l.startsWith('#')) expect(ls[i - 1], `line before "${l}"`).toBe('');
      if (l.startsWith('#')) expect(ls[i + 1], `line after "${l}"`).toBe('');
    });
    expect(md).not.toMatch(/\n\n\n/);
    expect(md.endsWith('\n') && !md.endsWith('\n\n')).toBe(true);
  });

  it('contains no HTML', () => {
    expect(text).toContain('Works on digital twins.');
    expect(full).not.toMatch(/<\/?[a-z][^>]*>/i);
  });
});

describe('llms files over the real data', () => {
  const en = realInput('en');
  const full = llmsFullTxt({ en, de: realInput('de') });
  const english = englishHalf(full);
  const index = llmsTxt(en);

  it('writes one heading per publication (in both halves) and contains no HTML', () => {
    const headings = lines(section(english, 'Publications')!).filter((l) => l.startsWith('### '));
    expect(headings).toHaveLength(en.publications.length);
    expect(full).not.toMatch(/<\/?[a-z][^>]*>/i);
    expect(index).not.toMatch(/<\/?[a-z][^>]*>/i);
  });

  it('links only to absolute http(s) URLs', () => {
    expect(linkTargets(full).length).toBeGreaterThan(0);
    expect(linkTargets(index).length).toBeGreaterThan(en.software.length);
    for (const target of [...linkTargets(full), ...linkTargets(index)]) expect(target).toMatch(/^https?:\/\/\S+$/);
  });
});

// Task 19: llms.txt/llms-full.txt stay single, bilingual files rather than
// becoming per-locale files (the site owner's own decision) - an agent
// fetching either file must find the content in either language.
describe('bilingual output', () => {
  async function buildLlmsFull(): Promise<string> {
    return llmsFullTxt({ en: realInput('en'), de: realInput('de') });
  }

  async function buildLlms(): Promise<string> {
    return llmsTxt(realInput('en'));
  }

  it('llms-full.txt carries an English and a German half', async () => {
    const out = await buildLlmsFull();
    expect(out).toContain('## Deutsch');
    expect(out.indexOf('## Deutsch')).toBeGreaterThan(0);
  });

  it('the German half links to /de/ URLs', async () => {
    const out = await buildLlmsFull();
    const german = out.slice(out.indexOf('## Deutsch'));
    expect(german).toContain('/de/publications/');
  });

  it('the English half never links to /de/', async () => {
    const out = await buildLlmsFull();
    const english = out.slice(0, out.indexOf('## Deutsch'));
    expect(english).not.toContain('/de/');
  });

  it('llms.txt lists both language homepages', async () => {
    const out = await buildLlms();
    expect(out).toContain('/de/');
    expect(out).toMatch(/^# /m);
  });

  it('llms.txt keeps ## Optional last', async () => {
    const out = await buildLlms();
    const headings = [...out.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(headings.at(-1)).toBe('Optional');
  });

  it('renders a real paper title in English in BOTH halves, untranslated', async () => {
    // Read a real title from the data rather than hard-coding a fragment, so
    // the test keeps meaning something as publications.yml grows.
    const publications = load(readFileSync('data/publications.yml', 'utf8')) as { title: string }[];
    const title = publications.find((p) => p.title.length > 40)!.title;

    const out = await buildLlmsFull();
    const split = out.indexOf('## Deutsch');
    const english = out.slice(0, split);
    const german = out.slice(split);

    // The same English string, byte for byte, on both sides: bibliographic
    // records are never translated.
    expect(english).toContain(title);
    expect(german).toContain(title);
  });
});
