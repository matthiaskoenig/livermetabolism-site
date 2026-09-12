// @ts-check
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Version and commit of this build, shown in the footer (see
// site/components/Footer.astro). The container build has no git, so
// docker-compose-build.yml/deploy.sh pass SITE_COMMIT; GitHub Actions sets
// GITHUB_SHA; locally we ask git and fall back to 'unknown'.
const version = JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
const tryGit = () => {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
};
const commit = (process.env.SITE_COMMIT || process.env.GITHUB_SHA || tryGit()).slice(0, 7);

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
  vite: {
    plugins: [tailwindcss()],
    define: {
      __SITE_VERSION__: JSON.stringify(version),
      __SITE_COMMIT__: JSON.stringify(commit),
    },
  },
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
        // raw.githubusercontent.com: the daily snapshots the research (GitHub) and publications (Scholar) pages refetch (see CLAUDE.md)
        "connect-src 'self' https://raw.githubusercontent.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
        "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
        "object-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: { resources: ["'self'", 'https://www.googletagmanager.com'] },
      // No 'unsafe-inline' here: CSP's style-src only governs `<style>`
      // elements and `style=` attributes, which Astro hashes/avoids
      // automatically, not CSSOM writes like `el.style.transform`.
      // PersonAvatar.vue sets a runtime `transform`/`--arrow-shift` via the
      // CSSOM (`el.style.transform = ...`, `el.style.setProperty(...)`) to
      // clamp its hover card inside the viewport, which CSP does not
      // restrict at all, so it needs no allowance here. Any real `style=`
      // attribute (e.g. the CV page's PDF embed) instead gets its own class
      // in global.css (see CLAUDE.md) — never re-add 'unsafe-inline'.
      styleDirective: { resources: ["'self'", 'https://fonts.googleapis.com'] },
    },
  },
});
