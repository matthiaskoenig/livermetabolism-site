import { iconNames } from './icons';

// Vite bundles the SVG sources at build time; eager so iconSprite() can run
// synchronously in IconSprite.astro. This is the only module that pulls the
// raw SVG markup in — keep it that way so icons.ts (imported by Icon.vue on
// every page) stays free of the raw sources.
const files = import.meta.glob('../icons/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const byName: Record<string, string> = {};
for (const [path, raw] of Object.entries(files)) {
  const name = path.slice(path.lastIndexOf('/') + 1, -'.svg'.length);
  byName[name] = raw;
}

function toSymbol(name: string, raw: string): string {
  const cleaned = raw.replace(/<!--[\s\S]*?-->/g, '');
  const viewBox = cleaned.match(/viewBox="([^"]*)"/)?.[1] ?? '0 0 512 512';
  const inner = cleaned.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)?.[1]?.trim() ?? '';
  return `<symbol id="icon-${name}" viewBox="${viewBox}">${inner}</symbol>`;
}

/** One hidden sprite `<svg>` holding a `<symbol id="icon-<name>">` per known icon. */
export function iconSprite(): string {
  const symbols = iconNames()
    .map((name) => {
      const raw = byName[name];
      if (!raw) throw new Error(`Missing icon source for "${name}" (expected site/icons/${name}.svg)`);
      return toSymbol(name, raw);
    })
    .join('');
  // CSP forbids inline `style` attributes injected via raw HTML (Astro can
  // only hash style/script content it sees statically in .astro templates,
  // not markup produced by a helper like this one), so hide the sprite with
  // a stylesheet class instead (`.icon-sprite` in global.css).
  return `<svg xmlns="http://www.w3.org/2000/svg" class="icon-sprite" aria-hidden="true">${symbols}</svg>`;
}
