import { expect, test } from '@playwright/test';

// base-relative (no leading slash): see playwright.config.ts
const pages = ['', 'projects/', 'publications/', 'people/', 'research/', 'meetings/', 'news/', 'teaching/', 'cv/', 'impressum/', 'privacy/'];

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
