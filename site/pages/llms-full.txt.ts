import type { APIRoute } from 'astro';
import * as d from '../lib/data';
import { uiFor } from '../lib/i18n/catalog';
import { llmsFullTxt } from '../lib/llms';

// Served at /llms-full.txt: the content of every list page as one Markdown
// file (see site/lib/llms.ts). A new table the site shows belongs here too,
// like in search.json.ts. Not under [...locale]: one global file, always in
// English.
export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('llms-full.txt needs `site` in astro.config.mjs');
  const [tags, people, publications, projects, software, funding, editors, presentations, posters, abstracts, meetings, teaching, news] = await Promise.all([
    d.getTags(), d.getPeople(), d.getPublications(), d.getProjects(), d.getSoftware(), d.getFunding(), d.getEditors(),
    d.getPresentations(), d.getPosters(), d.getAbstracts(), d.getMeetings(), d.getTeaching(), d.getNews(),
  ]);
  const body = llmsFullTxt({
    site: site.href, base: import.meta.env.BASE_URL, t: uiFor('en').t,
    tags, people, publications, projects, software, funding, editors, presentations, posters, abstracts, meetings, teaching, news,
  });
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
