/**
 * Known icon names (the Font Awesome 4 class names `scripts/fetch-icons.sh`
 * fetches into `site/icons/*.svg`), kept as a static list rather than an
 * `import.meta.glob` so this module — imported by `Icon.vue` on every page
 * — never pulls the raw SVG sources into the client bundle. The raw
 * sources themselves live behind `iconSprite.ts` (eager glob + sprite
 * builder), imported only by `IconSprite.astro`, which renders them once
 * per page as `<symbol>`s; `iconSvg()` below just references them via
 * `<use>`. Re-run `scripts/fetch-icons.sh` and update this list together
 * when adding an icon.
 */
const ICON_NAMES = [
  'book', 'caret-down', 'chevron-down', 'chevron-up', 'code', 'cogs', 'compass', 'cube',
  'desktop', 'envelope', 'file-o', 'file-pdf-o', 'file-text-o', 'flask', 'github', 'globe',
  'google', 'graduation-cap', 'heartbeat', 'home', 'image', 'laptop-code', 'line-chart',
  'linkedin', 'money', 'newspaper-o', 'orcid', 'pencil', 'person-chalkboard', 'phone',
  'picture-o', 'registered', 'search', 'unlock-alt', 'user', 'user-circle-o', 'users',
  'video-camera', 'youtube',
] as const;

export function iconNames(): string[] {
  return [...ICON_NAMES].sort();
}

/** Sprite reference with the old `fa fa-<name>` classes so the ported CSS keeps matching. */
export function iconSvg(name: string, extraClass = ''): string {
  if (!(ICON_NAMES as readonly string[]).includes(name)) {
    throw new Error(`Unknown icon "${name}" (add it to scripts/fetch-icons.sh)`);
  }
  const cls = ['fa', `fa-${name}`, 'icon', extraClass].filter(Boolean).join(' ');
  return `<svg class="${cls}" aria-hidden="true" focusable="false" fill="currentColor"><use href="#icon-${name}"></use></svg>`;
}
