/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'happy-dom',
    include: ['site/**/*.test.ts', 'scripts/**/*.test.ts'],
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
