import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const hasBoth = existsSync('web/index.html') && existsSync('dist/index.html');

describe.skipIf(!hasBoth)('parity with the Jekyll build in web/', () => {
  const pages = ['index.html', 'projects/index.html', 'publications/index.html', 'people/index.html', 'research/index.html', 'meetings/index.html', 'news/index.html', 'teaching/index.html'];

  it('keeps every element id that search results and links target', () => {
    for (const p of pages) {
      const ids = (f: string) => new Set([...readFileSync(f, 'utf8').matchAll(/ id="([^"]+)"/g)].map((m) => m[1]).filter((id) => !id.endsWith('-label')));
      const old = ids(`web/${p}`);
      const now = ids(`dist/${p}`);
      for (const id of old) expect(now, `${p} lost #${id}`).toContain(id);
    }
  });

  it('search index has the same number of records per type', () => {
    const count = (f: string) => {
      const c: Record<string, number> = {};
      for (const r of JSON.parse(readFileSync(f, 'utf8')) as { type: string }[]) c[r.type] = (c[r.type] ?? 0) + 1;
      return c;
    };
    expect(count('dist/search.json')).toEqual(count('web/search.json'));
  });

  it('sitemap covers every Jekyll page URL', () => {
    // web/sitemap.xml (jekyll-sitemap) enumerates every static file under
    // app/assets too (134 PDFs); Astro's sitemap integration only lists
    // page routes, not files served from public/. Restrict the comparison
    // to page URLs, which is what this check is actually about.
    const urls = (f: string) => new Set([...readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).filter((p) => !p.endsWith('.xml') && !p.startsWith('/assets/')));
    const old = urls('web/sitemap.xml');
    const now = urls('dist/sitemap-0.xml');
    for (const u of old) if (u !== '/feed.xml' && u !== '/404.html') expect(now, `sitemap lost ${u}`).toContain(u);
  });
});
