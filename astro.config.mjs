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
  // Astro 7 defaults to 'jsx' whitespace rules, which drop the spaces
  // between adjacent inline elements (icons next to text, author chips).
  compressHTML: true,
  integrations: [vue(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
