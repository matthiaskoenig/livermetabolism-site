import { defineConfig } from '@playwright/test';

// BASE is unset locally ("/") and "/livermetabolism-site/" in CI (see
// .github/workflows/site.yml); astro preview serves under that prefix.
// Tests use base-relative paths ('projects/', not '/projects/') so the
// same specs run in both.
const origin = `http://localhost:4321${process.env.BASE ?? '/'}`;

export default defineConfig({
  testDir: 'e2e',
  testMatch: /.*\.spec\.ts/,
  timeout: 30_000,
  use: { baseURL: origin, viewport: { width: 1280, height: 800 } },
  webServer: { command: 'npm run preview', url: origin, timeout: 120_000, reuseExistingServer: !process.env.CI },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
