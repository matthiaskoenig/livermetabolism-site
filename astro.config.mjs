// @ts-check
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// SITE/BASE are set by .github/workflows/site.yml for GitHub Pages
// (https://matthiaskoenig.github.io + /livermetabolism-site/); the
// defaults serve local development. When the custom domain is attached,
// the workflow sets SITE=https://livermetabolism.com and BASE=/.
const site = process.env.SITE ?? 'http://localhost:4321';
const base = process.env.BASE ?? '/';

export default defineConfig({
  site,
  base,
  srcDir: './site',
  output: 'static',
  trailingSlash: 'always',
  // true keeps HTML whitespace rules (vs. Astro's 'jsx' option), so the
  // inline spacing between adjacent elements (icons next to text, author
  // chips) survives; this is already Astro's default, kept explicit here.
  compressHTML: true,
  integrations: [vue(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  // Content-Security-Policy, rendered as a per-page <meta http-equiv> tag.
  // Astro hashes its own bundled/inline scripts and styles (including the
  // Vue island hydration runtime) automatically; only third-party hosts
  // need to be listed explicitly below. Add new third-party hosts here
  // (see CLAUDE.md).
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https://img.youtube.com https://www.google-analytics.com",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
        "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
        "object-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: { resources: ["'self'", 'https://www.googletagmanager.com'] },
      // 'unsafe-inline' is required here (never for script-src): PersonAvatar.vue
      // sets a runtime `transform`/`--arrow-shift` inline style to clamp its
      // hover card inside the viewport, and the value depends on the
      // viewport width at hover time, so it cannot be pre-hashed at build
      // time. Astro drops style hashes entirely once 'unsafe-inline' is
      // present (browsers ignore a hash alongside 'unsafe-inline' per the
      // CSP spec), so this reduces style-src (only) to 'unsafe-inline'.
      styleDirective: { resources: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"] },
    },
  },
});
