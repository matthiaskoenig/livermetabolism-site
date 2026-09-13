import { expect, test } from '@playwright/test';

const modal = 'dialog#detail-modal';

/** Open the first trigger of a page and assert the shell shows that entity. */
async function opensDetail(page: import('@playwright/test').Page, path: string, selector: string, type: string) {
  await page.goto(path);
  const trigger = page.locator(selector).first();
  const id = (await trigger.getAttribute('data-detail'))!.split(':').slice(1).join(':');
  await trigger.click();
  const dialog = page.locator(modal);
  await expect(dialog).toHaveAttribute('open', '');
  await expect(dialog.locator('.detail')).toHaveAttribute('data-detail-type', type);
  await expect(dialog.locator('.modal-title')).not.toBeEmpty();
  await expect(page).toHaveURL(new RegExp(`#${type}/`));
  return { dialog, id };
}

test('a publication title opens its detail modal, with related rows', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  const { dialog } = await opensDetail(page, 'publications/', '#publication-list .pub-title-link', 'publication');
  // the title of the shell is the fragment's own title
  await expect(dialog.locator('.modal-title')).toHaveText((await dialog.locator('.detail-title').innerText()).trim());
  expect(await dialog.locator('.related-row').count()).toBeGreaterThan(0);
  // Escape closes it and the hash goes away again
  await page.keyboard.press('Escape');
  await expect(dialog).not.toHaveAttribute('open', '');
  expect(new URL(page.url()).hash).toBe('');
  expect(errors).toEqual([]);
});

test('a person card opens the person detail', async ({ page }) => {
  await opensDetail(page, 'people/', '.member-card .member-name-link', 'person');
});

test('a project card opens the project detail, links inside do not', async ({ page }) => {
  const { dialog } = await opensDetail(page, 'projects/', '.project-card.is-clickable', 'project');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toHaveAttribute('open', '');
  // a real link inside the clickable card navigates instead of opening the modal
  const link = page.locator('.project-card.is-clickable a[target="_blank"]').first();
  await expect(link).toHaveAttribute('href', /^https?:/);
  await link.click({ modifiers: ['Control'] }); // open in a background tab, stay here
  await expect(dialog).not.toHaveAttribute('open', '');
});

test('a news card opens the news detail', async ({ page }) => {
  await opensDetail(page, 'news/', '.project-card.is-clickable', 'news');
});

test('a software card title opens the software detail', async ({ page }) => {
  await opensDetail(page, 'research/', '.software-name-link', 'software');
});

test('a related row opens the next detail and Back returns', async ({ page }) => {
  const { dialog } = await opensDetail(page, 'publications/', '#publication-list .pub-title-link', 'publication');
  const first = (await dialog.locator('.modal-title').innerText()).trim();
  const back = dialog.locator('.modal-back');
  await expect(back).toBeHidden();

  const row = dialog.locator('.related-row[data-detail]').first();
  const rowType = (await row.getAttribute('data-detail'))!.split(':')[0];
  await row.click();
  await expect(dialog.locator('.detail')).toHaveAttribute('data-detail-type', rowType!);
  await expect(back).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`#${rowType}/`));

  await back.click();
  await expect(dialog.locator('.modal-title')).toHaveText(first);
  await expect(back).toBeHidden();
  await expect(page).toHaveURL(/#publication\//);
});

test('a #<type>/<id> deep link opens the detail on load', async ({ page }) => {
  await page.goto('publications/');
  const id = (await page.locator('#publication-list .pub-title-link').first().getAttribute('data-detail'))!.split(':').slice(1).join(':');
  await page.goto(`publications/#publication/${id}`);
  const dialog = page.locator(modal);
  await expect(dialog).toHaveAttribute('open', '');
  await expect(dialog.locator('.detail')).toHaveAttribute('data-detail-id', id);
});

test('the legacy #person-modal-<id> deep link still opens the person detail', async ({ page }) => {
  await page.goto('people/#person-modal-matthias_koenig');
  const dialog = page.locator(modal);
  await expect(dialog).toHaveAttribute('open', '');
  await expect(dialog.locator('.modal-title')).toContainText('König');
  await expect(dialog.locator('.detail')).toHaveAttribute('data-detail-id', 'matthias_koenig');
});

test('a search result opens the detail modal on the page it lands on', async ({ page }) => {
  await page.goto('');
  await page.keyboard.press('/');
  await expect(page.locator('dialog#site-search-modal')).toHaveAttribute('open', '');
  await page.locator('#site-search-input').fill('Matthias');
  const result = page.locator('.site-search-result[href*="#person/"]').first();
  await expect(result).toBeVisible();
  await result.click();
  const dialog = page.locator(modal);
  await expect(dialog).toHaveAttribute('open', '');
  await expect(dialog.locator('.detail')).toHaveAttribute('data-detail-type', 'person');
  expect(await dialog.locator('.related-row').count()).toBeGreaterThan(0);
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
  await expect(page).toHaveURL(/#((publication|person|project|software|news)\/|(presentation|poster|abstract|funding|editor|meeting|teaching)-)/);
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

test('publications-over-time chart draws and the mode switch re-renders it', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('publications/');

  // client:visible island: nothing is drawn before the section is in view
  await page.locator('#publications-chart').scrollIntoViewIfNeeded();
  const canvas = page.locator('#publications-chart canvas').first();
  await expect(canvas).toBeVisible();
  await expect(page.locator('#publications-chart .chart-mode-btn[aria-pressed="true"]')).toHaveText('Research area');

  // clicking a bar segment is not reliably hittable on a canvas; assert that
  // the switch swaps the series (setOption) without throwing instead
  await page.locator('#publications-chart .chart-mode-btn').nth(1).click();
  await expect(page.locator('#publications-chart .chart-mode-btn.active')).toHaveText('Status');
  await expect(canvas).toBeVisible();
  await page.locator('#publications-chart .chart-mode-btn').first().click();
  await expect(page.locator('#publications-chart .chart-mode-btn.active')).toHaveText('Research area');

  expect(errors).toEqual([]);
});

test('homepage at-a-glance strip shows six linked figures', async ({ page }) => {
  await page.goto('');
  const stats = page.locator('.home-stat');
  // six figures with the snapshots CI builds against (Scholar citations and
  // h-index are omitted only when the snapshot cannot be read at all)
  await expect(stats).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    const stat = stats.nth(i);
    await expect(stat.locator('.home-stat-value')).toHaveText(/^\d+$/);
    await expect(stat).toHaveAttribute('href', /\/(publications|people|research)\//);
  }
  // build-time only: the strip adds no script of its own to the homepage
  await expect(page.locator('.home-stats script')).toHaveCount(0);
});

test('network page draws the graph and filters by research area', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('network/');

  // client:load island: the canvas is up without scrolling anywhere
  await expect(page.locator('#network-graph canvas').first()).toBeVisible();
  // "All" plus the five research areas; the areas are filters, not nodes
  const buttons = page.locator('#network-graph .network-topic-btn');
  await expect(buttons).toHaveCount(6);
  await expect(buttons.first()).toHaveText('All');
  // the wheel is left to the page, so zooming is by button
  await expect(page.locator('#network-graph [aria-label="Zoom in"]')).toBeVisible();
  await expect(page.locator('#network-graph [aria-label="Zoom out"]')).toBeVisible();
  // "All" is the state on arrival, and the loading note is gone
  await expect(page.locator('#network-graph .network-topic-btn.active')).toHaveText('All');
  await expect(page.getByText('Loading the network…')).toHaveCount(0);
  await expect(page.locator('nav.site-navbar .nav-item.active .nav-link')).toHaveText('Network');

  // a node click is not reliably hittable on a canvas; assert that a filter
  // re-renders the graph (setOption) without throwing instead
  await buttons.nth(1).click();
  await expect(page.locator('#network-graph .network-topic-btn.active')).toHaveCount(1);
  await expect(page.locator('#network-graph .network-topic-btn').first()).not.toHaveClass(/active/);
  await expect(page.locator('#network-graph canvas').first()).toBeVisible();

  // the zoom and reset controls re-render without throwing either
  await page.locator('#network-graph [aria-label="Zoom in"]').click();
  await page.locator('#network-graph [aria-label="Zoom out"]').click();
  await page.locator('#network-graph .chart-mode-btn', { hasText: 'Reset' }).click();
  await expect(page.locator('#network-graph canvas').first()).toBeVisible();

  // and back to the whole graph
  await buttons.first().click();
  await expect(page.locator('#network-graph .network-topic-btn.active')).toHaveText('All');

  expect(errors).toEqual([]);
});

test('network page pre-selects ?topic= as the research-area filter', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('network/?topic=AI');

  const active = page.locator('#network-graph .network-topic-btn.active');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveText('AI');
  await expect(active).toHaveAttribute('aria-pressed', 'true');
  // "All" is off while an area is selected
  await expect(page.locator('#network-graph .network-topic-btn').first()).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#network-graph canvas').first()).toBeVisible();

  // an unknown area is ignored: the whole graph is shown
  await page.goto('network/?topic=nope');
  await expect(page.locator('#network-graph .network-topic-btn.active')).toHaveText('All');

  expect(errors).toEqual([]);
});

test('network graph: clicking a node opens its detail modal in place', async ({ page }) => {
  // probing the canvas pixel by pixel and clicking several candidates is slow
  test.slow();
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('network/');
  const canvas = page.locator('#network-graph canvas').first();
  await expect(canvas).toBeVisible();
  // the force layout needs a moment to settle before the pixels mean anything
  await page.waitForTimeout(6000);

  const box = (await canvas.boundingBox())!;
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  // ECharts draws on a canvas, so there is nothing to query: a hoverable item
  // shows up as the container's `pointer` cursor (like the drag test). That is
  // true of the edges too, and only a node opens a detail — so collect the
  // candidates and click them until one does.
  const candidates: { x: number; y: number }[] = [];
  for (let dx = -100; dx <= 100 && candidates.length < 24; dx += 10) {
    for (let dy = -100; dy <= 100 && candidates.length < 24; dy += 10) {
      await page.mouse.move(centre.x + dx, centre.y + dy);
      const cursor = await page.evaluate(() => getComputedStyle(document.querySelector('#network-graph canvas')!.parentElement!).cursor);
      if (cursor === 'pointer') candidates.push({ x: centre.x + dx, y: centre.y + dy });
    }
  }
  expect(candidates.length, 'hoverable items under the cursor near the middle of the canvas').toBeGreaterThan(0);

  const dialog = page.locator(modal);
  let opened = false;
  for (const point of candidates) {
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(300);
    opened = await dialog.evaluate((d) => (d as HTMLDialogElement).open);
    if (opened) break;
  }
  expect(opened, 'a node click opened the detail modal').toBe(true);
  await expect(dialog.locator('.modal-title')).not.toBeEmpty();
  // the graph stays where it is: the modal opened in place, no navigation
  await expect(page).toHaveURL(/\/network\/#(person|publication|project|software|news)\//);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toHaveAttribute('open', '');

  expect(errors).toEqual([]);
});

test('network graph: dragging a node moves the node, not the whole view', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('network/');
  const canvas = page.locator('#network-graph canvas').first();
  await expect(canvas).toBeVisible();
  // the force layout needs a moment to settle before the pixels mean anything
  await page.waitForTimeout(6000);

  const box = (await canvas.boundingBox())!;
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  // a node sets the container's cursor to `pointer` (ECharts on a canvas has
  // no DOM to query), so hunt for one near the middle
  let node: { x: number; y: number } | null = null;
  for (let dx = -80; dx <= 80 && !node; dx += 10) {
    for (let dy = -80; dy <= 80 && !node; dy += 10) {
      await page.mouse.move(centre.x + dx, centre.y + dy);
      const cursor = await page.evaluate(() => getComputedStyle(document.querySelector('#network-graph canvas')!.parentElement!).cursor);
      if (cursor === 'pointer') node = { x: centre.x + dx, y: centre.y + dy };
    }
  }
  expect(node, 'a node under the cursor near the middle of the canvas').not.toBeNull();

  /** The canvas, sampled every 4th pixel, as flat r,g,b bytes over white. */
  const pixels = () => page.evaluate(() => {
    const c = document.querySelector('#network-graph canvas') as HTMLCanvasElement;
    const { width, height } = c;
    const px = c.getContext('2d')!.getImageData(0, 0, width, height).data;
    const rgb: number[] = [];
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const i = (y * width + x) * 4;
        // composite over the page's white background, so a faded edge reads as
        // the light grey it looks like rather than as "no ink"
        const a = px[i + 3]! / 255;
        for (let ch = 0; ch < 3; ch++) rgb.push(Math.round(px[i + ch]! * a + 255 * (1 - a)));
      }
    }
    return { rgb, width, height };
  });

  /** Share of the pixels further than 300 px from `from` that changed visibly. */
  const changedFar = (before: { rgb: number[]; width: number }, after: { rgb: number[] }, from: { x: number; y: number }) => {
    const cols = Math.ceil(before.width / 4);
    let far = 0;
    let changed = 0;
    for (let i = 0; i < before.rgb.length; i += 3) {
      const sample = i / 3;
      const x = (sample % cols) * 4;
      const y = Math.floor(sample / cols) * 4;
      if (Math.hypot(x - from.x, y - from.y) <= 300) continue;
      far++;
      const d = Math.abs(before.rgb[i]! - after.rgb[i]!)
        + Math.abs(before.rgb[i + 1]! - after.rgb[i + 1]!)
        + Math.abs(before.rgb[i + 2]! - after.rgb[i + 2]!);
      if (d > 40) changed++;
    }
    expect(far).toBeGreaterThan(1000);
    return changed / far;
  };

  const drag = async (from: { x: number; y: number }) => {
    await page.mouse.move(from.x, from.y);
    await page.waitForTimeout(400);
    const before = await pixels();
    await page.mouse.down();
    for (let i = 1; i <= 20; i++) await page.mouse.move(from.x + i * 12, from.y - i * 8);
    await page.mouse.up();
    await page.waitForTimeout(1500);
    return changedFar(before, await pixels(), { x: from.x - box.x, y: from.y - box.y });
  };

  // A node drag moves that node and re-projects the rest a little (measured
  // at 8-9 % of the far pixels); the bug this guards against — the drag
  // panning the whole view, because the image symbol under the cursor is not
  // the draggable element — moves everything (~19 %). See the task report for
  // the manual check with .superpowers/.../drag-check.cjs.
  expect(await drag(node!)).toBeLessThan(0.15);

  expect(errors).toEqual([]);
});
