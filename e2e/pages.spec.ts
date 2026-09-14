import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// base-relative (no leading slash): see playwright.config.ts
const pages = ['', 'projects/', 'publications/', 'people/', 'research/', 'meetings/', 'network/', 'news/', 'teaching/', 'cv/', 'impressum/', 'privacy/'];

// read once so the footer-version assertion never drifts from the released version
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };

for (const path of pages) {
  test(`renders ${path} without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('nav.site-navbar')).toBeVisible();
    await expect(page.locator('footer.footer')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('footer states the build version and commit', async ({ page }) => {
  await page.goto('');
  const footer = page.locator('footer.footer .footer-legal');
  const versionLink = footer.locator('a', { hasText: /^v\d+\.\d+\.\d+$/ });
  await expect(versionLink).toHaveText(`v${version}`);
  await expect(versionLink).toHaveAttribute('href', new RegExp(`/releases/tag/${version.replace(/\./g, '\\.')}$`));
  // the commit is a short SHA, or 'unknown' where the build had no git
  const commit = footer.locator('a.footer-version').last();
  const sha = (await commit.innerText()).trim();
  if (sha !== 'unknown') {
    expect(sha).toMatch(/^[0-9a-f]{7}$/);
    await expect(commit).toHaveAttribute('href', new RegExp(`/commit/${sha}$`));
  }
});

// The detail fragments (/detail/<type>/<id>/) are Astro page partials: no
// doctype, no <head>, no navbar and no footer, so they cannot join the loop
// above. What matters is that one is served, that it is still a partial (the
// modal adopts its root element), and that it stays out of the sitemap.
test('a detail fragment is served as a partial and is not in the sitemap', async ({ page, request }) => {
  const res = await request.get('detail/person/matthias_koenig/');
  expect(res.status()).toBe(200);
  const html = (await res.text()).trim();
  expect(html.startsWith('<div class="detail"')).toBe(true);
  expect(html).not.toContain('<!DOCTYPE');
  expect(html).not.toContain('<head');
  // it parses to exactly one .detail root with a title and related rows
  await page.setContent(html);
  await expect(page.locator('.detail')).toHaveCount(1);
  await expect(page.locator('.detail > .detail-header .detail-title')).not.toBeEmpty();
  expect(await page.locator('.detail-related .related-row[data-detail]').count()).toBeGreaterThan(0);

  const sitemap = await request.get('sitemap-0.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain('/detail/');
});

// robots.txt, llms.txt and llms-full.txt carry absolute URLs built from the
// build's SITE and BASE, not from the preview server's origin; the path below
// BASE is what the preview serves.
const base = process.env.BASE ?? '/';
const servedPath = (absolute: string) => {
  const { pathname } = new URL(absolute);
  expect(pathname.startsWith(base), absolute).toBe(true);
  return pathname.slice(base.length);
};

test('robots.txt lets crawlers in, keeps the detail fragments out, and names the sitemap and llms.txt', async ({ request }) => {
  const res = await request.get('robots.txt');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('text/plain');
  const text = await res.text();
  expect(text).toMatch(/^User-agent: \*$/m);
  expect(text).toContain(`\nDisallow: ${base}detail/\n`);
  for (const pattern of [/^Sitemap: (\S+)$/m, /(\S+\/llms\.txt)$/m]) {
    const target = text.match(pattern)?.[1];
    expect(target, String(pattern)).toBeDefined();
    expect((await request.get(servedPath(target as string))).status(), target).toBe(200);
  }
});

test('llms.txt and llms-full.txt are Markdown whose site links all resolve', async ({ request }) => {
  const paths = new Set<string>();
  for (const file of ['llms.txt', 'llms-full.txt']) {
    const res = await request.get(file);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');
    const text = await res.text();
    expect(text.startsWith('# ')).toBe(true);
    expect(text).not.toMatch(/<\/?[a-z][^>]*>/i);
    // the site root (origin + base) from the file's own link to llms-full.txt or its "Website:" line;
    // other sites on the same origin (GitHub Pages project sites) are external links
    const anchor = text.match(/\((https?:\/\/[^)]*\/llms-full\.txt)\)|Website: (\S+)/)?.slice(1).find(Boolean);
    expect(anchor, file).toBeDefined();
    const siteRoot = new URL('./', anchor as string).href;
    for (const m of text.matchAll(/https?:\/\/[^\s)\]]+/g)) if (m[0].startsWith(siteRoot)) paths.add(servedPath(m[0].split('#')[0]));
  }
  expect(paths.size).toBeGreaterThan(10);
  for (const path of paths) expect((await request.get(path)).status(), path).toBe(200);
});

test('404 page', async ({ page }) => {
  const res = await page.goto('does-not-exist/');
  expect(res?.status()).toBe(404);
  await expect(page.getByText('The page you are looking for cannot be found.')).toBeVisible();
});

test('every /assets/ reference on every page resolves', async ({ page, request }) => {
  const seen = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    const urls = await page.$$eval('[src],[href],object[data]', (els) => els.map((e) => (e as HTMLElement).getAttribute('src') ?? (e as HTMLElement).getAttribute('href') ?? (e as HTMLElement).getAttribute('data') ?? ''));
    for (const u of urls) if (u.includes('/assets/') && !seen.has(u)) seen.add(u);
  }
  for (const u of seen) {
    const res = await request.head(u);
    expect(res.status(), u).toBe(200);
  }
});
