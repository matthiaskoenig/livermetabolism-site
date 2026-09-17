import type { APIRoute } from 'astro';
import * as d from '../lib/data';
import { uiFor } from '../lib/i18n/catalog';
import type { Locale } from '../lib/i18n/locales';
import { llmsFullTxt, type LlmsFullInput } from '../lib/llms';

// Served at /llms-full.txt: the content of every list page as one Markdown
// file, English followed by a German half after a `## Deutsch` heading (see
// site/lib/llms.ts). A new table the site shows belongs here too, like in
// search.json.ts. Not under [...locale]: one global, bilingual file (task
// 19's scope decision, so an agent fetching this one file finds the content
// in either language) - never split into per-locale files.
export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('llms-full.txt needs `site` in astro.config.mjs');
  const siteHref = site.href;

  async function contextFor(locale: Locale): Promise<LlmsFullInput> {
    const [tags, people, publications, projects, software, funding, editors, presentations, posters, abstracts, meetings, teaching, news] = await Promise.all([
      d.getTags(locale), d.getPeople(locale), d.getPublications(locale), d.getProjects(locale), d.getSoftware(locale), d.getFunding(locale), d.getEditors(locale),
      d.getPresentations(locale), d.getPosters(locale), d.getAbstracts(locale), d.getMeetings(locale), d.getTeaching(locale), d.getNews(locale),
    ]);
    return {
      site: siteHref, base: import.meta.env.BASE_URL, t: uiFor(locale).t,
      tags, people, publications, projects, software, funding, editors, presentations, posters, abstracts, meetings, teaching, news,
    };
  }

  const [en, de] = await Promise.all([contextFor('en'), contextFor('de')]);
  const body = llmsFullTxt({ en, de });
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
