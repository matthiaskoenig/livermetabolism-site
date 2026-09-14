import type { APIRoute } from 'astro';
import { robotsTxt } from '../lib/llms';

// Served at /robots.txt (see site/lib/llms.ts). Crawlers only read it at the
// root of a host, so it takes effect on the custom domain; under the interim
// GitHub Pages base path it is served but ignored.
export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('robots.txt needs `site` in astro.config.mjs');
  return new Response(robotsTxt({ site: site.href, base: import.meta.env.BASE_URL }), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
