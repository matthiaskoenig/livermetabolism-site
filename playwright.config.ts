import { defineConfig } from '@playwright/test';

// BASE is unset locally ("/") and "/livermetabolism-site/" in CI (see
// .github/workflows/site.yml); astro preview serves under that prefix.
// Tests use base-relative paths ('projects/', not '/projects/') so the
// same specs run in both.
// PREVIEW_PORT is unset in CI (4321, the default of `astro preview`); set it
// to run the specs against a preview on another port while a dev server holds
// 4321 (`npx astro preview --background --port 4325`, then
// `PREVIEW_PORT=4325 npm run e2e`).
const port = process.env.PREVIEW_PORT ?? '4321';
const origin = `http://localhost:${port}${process.env.BASE ?? '/'}`;

export default defineConfig({
  testDir: 'e2e',
  testMatch: /.*\.spec\.ts/,
  timeout: 30_000,
  use: { baseURL: origin, viewport: { width: 1280, height: 800 } },
  webServer: { command: `npm run preview -- --port ${port}`, url: origin, timeout: 120_000, reuseExistingServer: !process.env.CI },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
