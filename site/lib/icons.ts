// Vite bundles the SVG sources at build time; works in .astro and .vue alike.
const files = import.meta.glob('../icons/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const byName: Record<string, string> = {};
for (const [path, raw] of Object.entries(files)) {
  const name = path.slice(path.lastIndexOf('/') + 1, -'.svg'.length);
  byName[name] = raw;
}

export function iconNames(): string[] {
  return Object.keys(byName).sort();
}

/** Inline SVG with the old `fa fa-<name>` classes so the ported CSS keeps matching. */
export function iconSvg(name: string, extraClass = ''): string {
  const raw = byName[name];
  if (!raw) throw new Error(`Unknown icon "${name}" (add it to scripts/fetch-icons.sh)`);
  const cls = ['fa', `fa-${name}`, 'icon', extraClass].filter(Boolean).join(' ');
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg\b([^>]*)>/, (_m, attrs: string) => `<svg${attrs} class="${cls}" aria-hidden="true" focusable="false" fill="currentColor">`)
    .trim();
}
