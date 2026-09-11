// Side-by-side screenshots of the Jekyll build (served on :4400) and the
// Astro build (:4321) for manual parity review. Run:
//   npx serve web -l 4400 &  npm run preview &  npx tsx e2e/screenshots.ts
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const pages = ['/', '/projects/', '/publications/', '/people/', '/research/', '/meetings/', '/news/', '/teaching/', '/impressum/', '/privacy/'];
const widths = [1280, 400];
const targets = { jekyll: 'http://localhost:4400', astro: 'http://localhost:4321' };

mkdirSync('e2e/screenshots', { recursive: true });
const browser = await chromium.launch();
for (const [name, origin] of Object.entries(targets)) {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    for (const path of pages) {
      await page.goto(origin + path, { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.setItem('cookie_consent', 'declined'));
      await page.reload({ waitUntil: 'networkidle' });
      const slug = path === '/' ? 'home' : path.replaceAll('/', '');
      await page.screenshot({ path: `e2e/screenshots/${slug}-${width}-${name}.png`, fullPage: true });
    }
    await page.close();
  }
}
await browser.close();
console.log('wrote e2e/screenshots/*.png');
