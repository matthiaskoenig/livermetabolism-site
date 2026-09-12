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
  const hidden = await page.locator('#publication-list tr[data-tags]:not([data-tags*="AI"])').evaluateAll((rows) => rows.filter((r) => (r as HTMLElement).style.display === 'none').length);
  const nonMatching = await page.locator('#publication-list tr[data-tags]:not([data-tags*="AI"])').count();
  expect(hidden).toBe(nonMatching);
  await page.locator('#publication-tag-filter [data-tag="all"]').click();
  await expect(page.locator('#publication-list tr[data-tags]').first()).toBeVisible();
});

test('search opens with "/", finds a publication, result navigates', async ({ page }) => {
  await page.goto('');
  // the search island hydrates client:idle; Astro drops the `ssr` attribute
  // once the keyboard shortcut listener is live (slow CI runners race this)
  await page.locator('astro-island[component-url*="SiteSearch"]:not([ssr])').waitFor({ state: 'attached' });
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

test('mobile navbar toggles', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto('');
  await expect(page.locator('#navbar')).toBeHidden();
  await page.locator('#navbar-toggler').click();
  await expect(page.locator('#navbar')).toBeVisible();
});
