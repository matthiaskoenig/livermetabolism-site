/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'happy-dom',
    include: ['site/**/*.test.ts', 'scripts/**/*.test.ts'],
    // Warms Astro's content-layer cache before any test runs - see
    // vitest.global-setup.ts for why getCollection() needs it and why a
    // per-test node:fs mock can never substitute for it.
    globalSetup: ['./vitest.global-setup.ts'],
    // consent.test.ts appends a real <script src="https://googletagmanager.com/...">;
    // happy-dom disables remote script loading by default and logs a DOMException to
    // the console for it. Treat that as a successful (no-op) load instead so the
    // banner's opt-in script injection is exercised without console noise or any
    // actual network request.
    environmentOptions: {
      happyDOM: {
        settings: { handleDisabledFileLoadingAsSuccess: true },
      },
    },
  },
});
