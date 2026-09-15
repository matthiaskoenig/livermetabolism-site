import { expect, test } from '@playwright/test';

test('withdrawing accepted consent disables analytics and removes domain cookies', async ({ page, context }) => {
  await page.route('https://www.googletagmanager.com/**', (route) => route.fulfill({ body: '', contentType: 'application/javascript' }));
  await page.goto('privacy/');
  const gaId = (await page.locator('#cookie-consent-banner').getAttribute('data-ga-id'))!;
  await page.locator('#cookie-consent-accept').click();
  await context.addCookies([{ name: '_ga', value: 'test', domain: new URL(page.url()).hostname, path: '/' }]);
  await page.locator('#cookie-consent-reset').click();
  await expect(page.locator('#cookie-consent-banner')).toBeVisible();
  expect(await page.evaluate((id) => (window as unknown as Record<string, unknown>)[`ga-disable-${id}`], gaId)).toBe(true);
  expect((await context.cookies()).filter((cookie) => cookie.name.startsWith('_ga'))).toEqual([]);
  await page.locator('#cookie-consent-accept').click();
  expect(await page.evaluate((id) => (window as unknown as Record<string, unknown>)[`ga-disable-${id}`], gaId)).toBe(false);
  await expect(page.locator('script[src*="googletagmanager.com/gtag/js"]')).toHaveCount(1);
});

test('Enter on a nested project link follows the link without opening its card', async ({ page }) => {
  await page.goto('projects/');
  const link = page.locator('.project-card.is-clickable a[target="_blank"]').first();
  await link.focus();
  // Prevent external navigation while observing whether the native click occurs.
  await link.evaluate((el) => el.addEventListener('click', (event) => {
    event.preventDefault();
    el.setAttribute('data-activated', 'true');
  }));
  await page.keyboard.press('Enter');
  await expect(page.locator('dialog#detail-modal')).not.toHaveAttribute('open', '');
  await expect(link).toHaveAttribute('data-activated', 'true');
});


test('live GitHub data rejects executable release URLs', async ({ page }) => {
  const repo = {
    name: 'sbmlutils', owner: 'matthiaskoenig', fullName: 'matthiaskoenig/sbmlutils',
    description: null, htmlUrl: 'https://github.com/matthiaskoenig/sbmlutils', homepage: null,
    stars: 1, forks: 0, openIssues: 0, language: null, license: null, topics: [],
    pushedAt: '2099-01-01T00:00:00Z', archived: false, defaultBranch: 'main',
    latestCommit: null, commitActivity: [],
    latestRelease: { tag: 'unsafe-review', name: 'unsafe-review', publishedAt: '2099-01-01T00:00:00Z', htmlUrl: 'javascript:alert(1)' },
  };
  await page.route('https://raw.githubusercontent.com/**/github.json', (route) => route.fulfill({
    json: { fetchedAt: '2099-01-01T00:00:00Z', repos: { 'matthiaskoenig/sbmlutils': repo }, releases: {} },
  }));
  await page.goto('research/');
  // Let the completed mocked response pass through the live updater.
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.software-stats a[href^="javascript:"]')).toHaveCount(0);
});


test('withdrawal on a subdomain deletes parent-domain analytics cookies', async ({ page, context, baseURL }) => {
  const local = new URL(baseURL!);
  await page.route('http://www.review.test/**', async (route) => {
    const request = new URL(route.request().url());
    const response = await route.fetch({ url: `${local.origin}${request.pathname}${request.search}` });
    await route.fulfill({ response });
  });
  await page.route('https://www.googletagmanager.com/**', (route) => route.fulfill({ body: '', contentType: 'application/javascript' }));
  await page.goto(`http://www.review.test${local.pathname}privacy/`);
  await page.locator('#cookie-consent-accept').click();
  await context.addCookies([{ name: '_ga', value: 'test', domain: '.review.test', path: '/' }]);
  // Reproduce why the old host-only deletion was insufficient.
  await page.evaluate(() => { document.cookie = '_ga=; max-age=0; path=/'; });
  expect((await context.cookies()).some((cookie) => cookie.name === '_ga')).toBe(true);
  await page.locator('#cookie-consent-reset').click();
  expect((await context.cookies()).filter((cookie) => cookie.name === '_ga')).toEqual([]);
});


test('mobile consent banner sizes to its text and controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('privacy/');
  const banner = page.locator('#cookie-consent-banner');
  await expect(banner).toBeVisible();
  const bounds = await banner.boundingBox();
  expect(bounds!.height).toBeLessThan(200);
  await expect(page.locator('#cookie-consent-accept')).toBeInViewport();
  await expect(page.locator('#cookie-consent-decline')).toBeInViewport();
});
