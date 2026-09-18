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

test('footer links to the issue tracker (issue #67)', async ({ page }) => {
  await page.goto('');
  const report = page.locator('footer.footer .footer-legal a.footer-issue');
  await expect(report).toBeVisible();
  await expect(report).toHaveAttribute('href', 'https://github.com/matthiaskoenig/livermetabolism-site/issues/new');
  await expect(report).toHaveAttribute('target', '_blank');
  await expect(report).toHaveAttribute('rel', /noopener/);
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

// The German tree mirrors the English page list one-for-one (site/pages/[...locale]/):
// each page must render with lang="de", show the language switch back to English, and
// stay free of console errors, the same bar the English pages above are held to.
for (const path of pages) {
  test(`renders /de/${path} without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto(`de/${path}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    // The detail modal (closed on load) carries its own copy of the language
    // switch for use while its <dialog> is open (see DetailModal.astro), so
    // the navbar's copy needs scoping to stay a single match.
    await expect(page.locator('nav.site-navbar .lang-switch-link[lang="en"]')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

// hreflang alternates (Head.astro, site/lib/i18n/alternates.ts): en, de and
// x-default, each absolute (built from the build's SITE/BASE, like
// robots.txt/llms.txt above - see servedPath()) and each pointing at a page
// that exists in *this* build. Asserting the absolute hrefs' status directly
// would instead fetch the live production site (SITE, not the preview under
// test) in CI, so - as with robots.txt/llms.txt above - resolve each to its
// served path under BASE and request that from the preview.
test('hreflang alternates point at pages that exist', async ({ page, request }) => {
  await page.goto('publications/');
  const alternates = await page.locator('link[rel="alternate"]').evaluateAll((ls) =>
    ls.map((l) => ({ hreflang: (l as HTMLLinkElement).hreflang, href: (l as HTMLLinkElement).href })));
  expect(alternates).toHaveLength(3);
  const byHreflang = Object.fromEntries(alternates.map((a) => [a.hreflang, a.href]));
  expect(Object.keys(byHreflang).sort()).toEqual(['de-DE', 'en-US', 'x-default']);
  for (const { href } of alternates) expect(href, href).toMatch(/^https?:\/\//);
  expect(byHreflang['x-default']).toBe(byHreflang['en-US']);
  for (const { href } of alternates) {
    expect((await request.get(servedPath(href))).status(), href).toBe(200);
  }
});

test('the language switch sits at the right of the navbar, styled apart from the nav links', async ({ page }) => {
  await page.goto('');
  const box = await page.evaluate(() => {
    const sw = document.querySelector('nav.site-navbar .lang-switch')!.getBoundingClientRect();
    const container = document.querySelector('.navbar-container')!.getBoundingClientRect();
    const links = [...document.querySelectorAll('.navbar-nav .nav-link')].map((l) => l.getBoundingClientRect().right);
    return { swLeft: sw.left, swRight: sw.right, containerRight: container.right, lastLink: Math.max(...links) };
  });
  // hard right: within the container's own padding of its right edge
  expect(box.containerRight - box.swRight).toBeLessThan(24);
  // and after every navigation item, not before them
  expect(box.swLeft).toBeGreaterThan(box.lastLink);
});

test('the language switch shows a flag beside each language code', async ({ page }) => {
  await page.goto('');
  const links = page.locator('nav.site-navbar .lang-switch .lang-switch-link');
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toContainText('EN');
  await expect(links.nth(1)).toContainText('DE');
  // the flag is decorative: the accessible name stays the language, not a country
  const flags = await page.locator('nav.site-navbar .lang-switch .lang-switch-flag').evaluateAll(
    (els) => els.map((e) => ({ text: e.textContent?.trim(), hidden: e.getAttribute('aria-hidden') })),
  );
  expect(flags).toEqual([
    { text: '\u{1F1FA}\u{1F1F8}', hidden: 'true' },
    { text: '\u{1F1E9}\u{1F1EA}', hidden: 'true' },
  ]);
  // and it reads as one control rather than two more menu entries
  const border = await page.locator('nav.site-navbar .lang-switch').evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(border).not.toBe('0px');
});

test('the flags do not push the mobile navbar onto a second row', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('projects/');
  const navH = await page.evaluate(() => document.querySelector('.site-navbar')!.getBoundingClientRect().height);
  // one row: brand, controls and hamburger side by side, as before the flags
  expect(navH).toBeLessThan(80);
  // the flag is decorative, so it is what gives way rather than the EN/DE text
  await expect(page.locator('nav.site-navbar .lang-switch-link').first()).toContainText('EN');
});

test('the filter row is a compact tinted band with a gap before the content', async ({ page }) => {
  await page.goto('projects/');
  const m = await page.evaluate(() => {
    const bar = document.getElementById('topic-filter')!;
    const b = bar.getBoundingClientRect();
    // the first real element, not .page-content itself - the gap is that
    // element's distance from the chrome, wherever the padding lives
    const content = document.querySelector('.page-content .container > *')!.getBoundingClientRect();
    return {
      height: b.height,
      background: getComputedStyle(bar).backgroundColor,
      gap: content.top - b.bottom,
      radius: getComputedStyle(document.querySelector('.tag-filter-btn')!).borderTopLeftRadius,
    };
  });
  expect(m.height).toBeLessThan(46);
  expect(m.background).toBe('rgb(248, 249, 250)');
  expect(m.gap).toBeGreaterThan(16);
  expect(m.radius).toBe('4px');
});

test('every page starts the same distance below the chrome, bar or no bar', async ({ page }) => {
  const gapOn = async (path: string) => {
    await page.goto(path);
    return page.evaluate(() => {
      const bar = document.getElementById('topic-filter');
      const above = (bar ?? document.querySelector('.site-navbar')!).getBoundingClientRect().bottom;
      return Math.round(document.querySelector('.page-content .container > *')!.getBoundingClientRect().top - above);
    });
  };
  const withBar = await gapOn('projects/');
  const withoutBar = await gapOn('impressum/');
  expect(withBar).toBeGreaterThan(16);
  expect(withoutBar).toBe(withBar);
});

test('the pill controls and the card badges share one square corner radius', async ({ page }) => {
  await page.goto('publications/');
  const radii = await page.evaluate(() => {
    const r = (s: string) => {
      const el = document.querySelector(s);
      return el ? getComputedStyle(el).borderTopLeftRadius : 'missing';
    };
    return {
      filter: r('.tag-filter-btn'),
      order: r('.order-btn'),
      chartMode: r('.chart-mode-btn'),
      badge: r('.tag-badge'),
    };
  });
  expect(radii).toEqual({ filter: '4px', order: '4px', chartMode: '4px', badge: '4px' });
});
