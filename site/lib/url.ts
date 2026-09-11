/**
 * Base-path aware links. import.meta.env.BASE_URL is "/" locally and
 * "/livermetabolism-site/" on the interim GitHub Pages URL (it always ends
 * with "/" because astro.config sets trailingSlash: 'always').
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** `url('/people/')` -> `/people/` or `/livermetabolism-site/people/`. */
export function url(path: string): string {
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** `asset('image/people/128/x.webp')` -> `/assets/image/people/128/x.webp` (+ base). */
export function asset(relPath: string): string {
  return url(`/assets/${relPath.replace(/^\/+/, '')}`);
}

/**
 * For free-text data fields (`slides`, `link`, …) that hold either a
 * root-absolute site path (e.g. '/assets/pdf/x.pdf', a leftover from the
 * pre-base-path data) or a fully external URL. Root-absolute paths get the
 * base prefix via `url()`; everything else (http(s):, mailto:, #anchor,
 * protocol-relative //) passes through unchanged.
 */
export function link(href: string): string {
  return /^\/(?!\/)/.test(href) ? url(href) : href;
}
