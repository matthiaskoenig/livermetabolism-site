import { expect, test } from '@playwright/test';

test('project card opens its modal, links inside do not', async ({ page }) => {
  await page.goto('projects/');
  const card = page.locator('.project-card.is-clickable').first();
  const id = (await card.getAttribute('data-modal-target'))!;
  await card.click();
  await expect(page.locator(`dialog#${id}`)).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(page.locator(`dialog#${id}`)).not.toHaveAttribute('open', '');
});

test('news card opens its modal', async ({ page }) => {
  await page.goto('news/');
  const card = page.locator('.project-card.is-clickable').first();
  const id = (await card.getAttribute('data-modal-target'))!; // "news-modal-<id>"
  await card.click();
  await expect(page.locator(`dialog#${id}`)).toHaveAttribute('open', '');
});

test('deep link opens a person modal', async ({ page }) => {
  await page.goto('people/#person-modal-matthias_koenig');
  await expect(page.locator('dialog#person-modal-matthias_koenig')).toHaveAttribute('open', '');
  await expect(page.locator('dialog#person-modal-matthias_koenig .modal-title')).toContainText('König');
});

test('alumni hover card shows on hover', async ({ page }) => {
  await page.goto('people/');
  const avatar = page.locator('.alumni-card .person-avatar').first();
  // PersonAvatar hydrates client:visible; scroll it into view and wait for
  // hydration (Astro drops the `ssr` attribute) before hovering, otherwise
  // the hover can race the island mounting its @mouseenter listener.
  await avatar.scrollIntoViewIfNeeded();
  await page.locator('astro-island[component-url*="PersonAvatar"]:not([ssr])').first().waitFor({ state: 'attached' });
  await avatar.hover();
  await expect(avatar.locator('.person-card')).toHaveClass(/is-visible/);
});

test('tag filter hides non-matching publications and honours ?tag=', async ({ page }) => {
  await page.goto('publications/?tag=AI');
  await expect(page.locator('#publication-tag-filter .tag-filter-btn.active')).toHaveText(/AI/);
  // rows are static HTML now; TagFilter toggles the `hidden` attribute on them
  const nonMatching = page.locator('#publication-list tr[data-tags]:not([data-tags*="AI"])');
  const hidden = await nonMatching.evaluateAll((rows) => rows.filter((r) => (r as HTMLElement).hidden).length);
  expect(hidden).toBe(await nonMatching.count());
  expect(hidden).toBeGreaterThan(0);
  // a year group with no matching row left hides too
  const emptyGroups = await page.locator('#publication-list .pub-year-group').evaluateAll(
    (groups) => groups.filter((g) => !g.querySelector('tr[data-tags]:not([hidden])')).every((g) => (g as HTMLElement).hidden),
  );
  expect(emptyGroups).toBe(true);
  await page.locator('#publication-tag-filter [data-tag="all"]').click();
  await expect(page.locator('#publication-list tr[data-tags]').first()).toBeVisible();
  await expect(page.locator('#publication-list tr[data-tags][hidden]')).toHaveCount(0);
});

test('research pre-applies ?tag= to each of its three filter bars', async ({ page }) => {
  await page.goto('research/?tag=Open%20%26%20FAIR');
  for (const id of ['software', 'funding', 'editors']) {
    await expect(page.locator(`#${id}-tag-filter .tag-filter-btn.active`)).toHaveText(/Open & FAIR/);
    const grid = page.locator(`#${id}-grid`);
    await expect(grid.locator('[data-tags*="Open & FAIR"]').first()).toBeVisible();
    const off = grid.locator('[data-tags]:not([data-tags*="Open & FAIR"])');
    for (let i = 0; i < await off.count(); i++) await expect(off.nth(i)).toBeHidden();
  }
  // "All" on one bar only affects that bar's grid
  await page.locator('#funding-tag-filter [data-tag="all"]').click();
  await expect(page.locator('#funding-grid [data-tags]:not([data-tags*="Open & FAIR"])').first()).toBeVisible();
});

test('search opens with "/", finds a publication, result navigates', async ({ page }) => {
  await page.goto('');
  // the search script is a bundled module: it runs before the load event
  // page.goto() waits for, so the shortcut listener is live here
  await page.keyboard.press('/');
  await expect(page.locator('dialog#site-search-modal')).toHaveAttribute('open', '');
  await page.locator('#site-search-input').fill('liver');
  const first = page.locator('.site-search-result').first();
  await expect(first).toBeVisible();
  await first.click();
  await expect(page).toHaveURL(/#(pub|presentation|poster|abstract|project-modal|software|funding|editor|news-modal|meeting|teaching|person-modal)-/);
});

test('analytics loads only after consent', async ({ page }) => {
  const ga: string[] = [];
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', (r) => { if (r.url().includes('googletagmanager.com')) ga.push(r.url()); });
  await page.goto('');
  await expect(page.locator('#cookie-consent-banner')).toBeVisible();
  expect(ga).toEqual([]);
  const gaRequest = page.waitForRequest((r) => r.url().includes('googletagmanager.com'));
  await page.locator('#cookie-consent-accept').click();
  await gaRequest;
  expect(ga.length).toBeGreaterThan(0);
  await expect(page.locator('#cookie-consent-banner')).toBeHidden();
  // the CSP allows googletagmanager.com/google-analytics.com explicitly (see
  // astro.config.mjs); a blocked request would show up as a console error
  expect(errors).toEqual([]);
});

test('privacy page reset button brings the banner back after declining', async ({ page }) => {
  await page.goto('privacy/');
  await expect(page.locator('#cookie-consent-banner')).toBeVisible();
  await page.locator('#cookie-consent-decline').click();
  await expect(page.locator('#cookie-consent-banner')).toBeHidden();
  await page.reload();
  await expect(page.locator('#cookie-consent-banner')).toBeHidden();
  await page.locator('#cookie-consent-reset').click();
  await expect(page.locator('#cookie-consent-banner')).toBeVisible();
});

test('mobile navbar toggles', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto('');
  await expect(page.locator('#navbar')).toBeHidden();
  await page.locator('#navbar-toggler').click();
  await expect(page.locator('#navbar')).toBeVisible();
});

test('research page renders the live GitHub data: stats lines, release feed, charts', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('research/');

  // the stats line is server-rendered from the build's snapshot and patched
  // in place by SoftwareLive.astro's script (two cards share this repository)
  const release = page.locator('.software-stats[data-repo="matthiaskoenig/sbmlutils"] [data-field="release"]').first();
  await expect(release).toHaveText(/\d/);
  await expect(page.locator('[data-github-note] [data-field="updated"]')).not.toBeEmpty();

  // a renamed repository keeps the data/software.yml key as data-repo, which is
  // what the browser-side refresh looks it up by (GitHub calls it libsbgnpy now)
  const renamed = page.locator('.software-stats[data-repo="matthiaskoenig/libsbgn-python"]');
  await expect(renamed.locator('[data-field="stars"]')).toHaveText(/\d/);
  await expect(renamed.locator('a').first()).toHaveAttribute('href', /libsbgnpy\/releases\/tag\//);

  expect(await page.locator('#releases .release-row').count()).toBeGreaterThan(0);

  // the charts are client:visible islands: nothing is drawn before each one
  // scrolls into view, so visit both sections
  await page.locator('#releases .github-chart').scrollIntoViewIfNeeded();
  await expect(page.locator('#releases canvas').first()).toBeVisible();
  await page.locator('#activity').scrollIntoViewIfNeeded();
  await expect(page.locator('#activity canvas').first()).toBeVisible();

  // no CSP violation from the snapshot fetch or from ECharts (see astro.config.mjs)
  expect(errors).toEqual([]);
});

test('publications page renders the live Scholar data: summary strip and charts', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('publications/');

  // the strip is server-rendered from the build's snapshot and patched in
  // place by ScholarStats.astro's script
  await expect(page.locator('#scholar [data-field="citations"]')).toHaveText(/\d/);
  await expect(page.locator('#scholar [data-field="h-index"]')).toHaveText(/\d/);
  await expect(page.locator('#scholar [data-scholar-note] [data-field="updated"]')).not.toBeEmpty();

  // both charts are client:visible islands: nothing is drawn before the
  // section scrolls into view
  await page.locator('#scholar .scholar-charts').scrollIntoViewIfNeeded();
  await expect(page.locator('#scholar canvas').first()).toBeVisible();

  // no CSP violation from the snapshot fetch or from ECharts (see astro.config.mjs)
  expect(errors).toEqual([]);
});

test('publication rows show citation badges and the Year / Most cited toggle reorders', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('publications/');

  // the badges are server-rendered from the build's snapshot (a row without a
  // DOI has no badge at all) and patched in place by PublicationsOrder's script
  const cited = page.locator('#publication-list .pub-cites [data-field="cited"]:not([hidden])');
  expect(await cited.count()).toBeGreaterThan(0);
  await expect(cited.first()).toHaveText(/^cited \d+$/);
  await expect(cited.first()).toHaveAttribute('href', /^https:\/\/openalex\.org\/W\d+$/);
  await expect(page.locator('#publication-list .pub-badge-oa:not([hidden])').first()).toHaveText('open access');
  await expect(page.locator('[data-citations-note] [data-field="updated"]')).not.toBeEmpty();

  // "Most cited" moves the existing rows into the flat table, most cited first
  const counts = await page.locator('#publication-list tr[data-tags]').evaluateAll(
    (rows) => rows.map((r) => Number((r as HTMLElement).dataset.cited)),
  );
  await page.locator('#publication-order [data-order="cited"]').click();
  await expect(page.locator('#publication-list-flat')).toBeVisible();
  await expect(page.locator('#publication-list .pub-year-group').first()).toBeHidden();
  const first = page.locator('#publication-list tr[data-tags]:not([hidden])').first();
  expect(Number(await first.getAttribute('data-cited'))).toBe(Math.max(...counts));
  // still one copy of every row, and the year headings come back
  expect(await page.locator('#publication-list tr[data-tags]').count()).toBe(counts.length);
  await page.locator('#publication-order [data-order="year"]').click();
  await expect(page.locator('#publication-list .year-heading').first()).toBeVisible();
  await expect(page.locator('#publication-list-flat')).toBeHidden();

  expect(errors).toEqual([]);
});

test('the tag filter still applies in "Most cited" order (?tag= and ?order=)', async ({ page }) => {
  await page.goto('publications/?tag=AI&order=cited');
  await expect(page.locator('#publication-order [data-order="cited"]')).toHaveClass(/active/);
  await expect(page.locator('#publication-list-flat')).toBeVisible();
  // TagFilter hydrates client:idle and filters the rows wherever they now sit
  await expect(page.locator('#publication-list tr[data-tags][hidden]').first()).toBeAttached();
  const visible = page.locator('#publication-list tr[data-tags]:not([hidden])');
  expect(await visible.count()).toBeGreaterThan(0);
  const tags = await visible.evaluateAll((rows) => rows.map((r) => (r as HTMLElement).dataset.tags ?? ''));
  expect(tags.every((t) => t.split('|').includes('AI'))).toBe(true);

  // back to year order: only the groups that still hold a matching row show
  await page.locator('#publication-order [data-order="year"]').click();
  const groupsOk = await page.locator('#publication-list .pub-year-group').evaluateAll(
    (groups) => groups.every((g) => (g as HTMLElement).hidden === !g.querySelector('tr[data-tags]:not([hidden])')),
  );
  expect(groupsOk).toBe(true);
});
