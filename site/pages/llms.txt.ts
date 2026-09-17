import type { APIRoute } from 'astro';
import * as d from '../lib/data';
import { uiFor } from '../lib/i18n/catalog';
import { llmsTxt } from '../lib/llms';

// Served at /llms.txt, the short Markdown index for LLMs and AI agents
// (https://llmstxt.org/, see site/lib/llms.ts). Not under [...locale]: one
// global file, always in English.
export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('llms.txt needs `site` in astro.config.mjs');
  const [tags, projects, software] = await Promise.all([d.getTags(), d.getProjects(), d.getSoftware()]);
  const body = llmsTxt({ site: site.href, base: import.meta.env.BASE_URL, t: uiFor('en').t, tags, projects, software });
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
