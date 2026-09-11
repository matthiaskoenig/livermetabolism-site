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
