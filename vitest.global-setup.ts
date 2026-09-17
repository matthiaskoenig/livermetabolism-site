// vitest's `getViteConfig()` wiring (vitest.config.ts) runs Astro's content-
// layer plugin the same way `astro dev` does (Vite's `command` resolves to
// "serve" either way), so `getCollection()` in any *.test.ts reads
// `.astro/data-store.json` - the persisted content cache Astro writes as a
// side effect of a dev session. `astro sync`/`astro check`/`astro build`
// also run a full content sync, but write it to `node_modules/.astro/`
// instead (Astro's build-mode cache directory, a different path for a
// non-dev Vite `command`) - never to the project root. So on a clean
// checkout, with neither cache warm, `getCollection()` silently returns an
// empty array for every collection and every getter's fields come back
// `undefined`, regardless of what an individual test mocks: this is a
// process-wide, one-time cache read done by Astro's own Vite plugin before
// any test file runs, so no per-test `node:fs` mock can reach it (see
// site/lib/data.test.ts's `withGermanFixtures` comment for the corollary -
// its `node:fs` mock only has to behave for the `i18n/de/*.yml` catalog
// paths it fakes, precisely because it can never affect this).
//
// This globalSetup makes `npx vitest run` self-sufficient on a clean
// checkout, without requiring `npm run check`/`build` to have run first:
// if the dev-mode store isn't already warm (e.g. a local `npm run dev`
// session left one), it runs `astro sync` - which populates the build-mode
// cache - and copies that store into the dev-mode path Astro's content
// plugin actually reads under vitest. The two files are the same
// devalue-encoded format regardless of which directory produced them, so
// copying is exact - no re-encoding, no schema involved.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export default function setup(): void {
  const devStore = path.join(process.cwd(), '.astro', 'data-store.json');
  if (existsSync(devStore)) return;

  const buildStore = path.join(process.cwd(), 'node_modules', '.astro', 'data-store.json');
  if (!existsSync(buildStore)) {
    execFileSync('npx', ['astro', 'sync'], { stdio: 'inherit' });
  }
  if (!existsSync(buildStore)) {
    throw new Error(`'astro sync' did not produce ${buildStore} - cannot warm the content-layer cache for tests.`);
  }

  mkdirSync(path.dirname(devStore), { recursive: true });
  copyFileSync(buildStore, devStore);
}
