import type { APIRoute } from 'astro';
import { asset } from '../lib/url';

// Served at /site.webmanifest (Astro derives the route from the file
// name, like search.json.ts -> /search.json). A route, rather than the
// static public/assets/favicon/site.webmanifest this replaces, so its icon
// paths go through asset() and carry the deploy's base path
// (import.meta.env.BASE_URL) the same way every other asset reference does.
export const GET: APIRoute = () => {
  const manifest = {
    name: 'König Lab — Systems Medicine, Digital Twins & AI',
    short_name: 'König Lab',
    icons: [
      { src: asset('favicon/android-chrome-192x192.png'), sizes: '192x192', type: 'image/png' },
      { src: asset('favicon/android-chrome-512x512.png'), sizes: '512x512', type: 'image/png' },
    ],
    theme_color: '#212529',
    background_color: '#212529',
    display: 'standalone',
  };
  return new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/manifest+json' } });
};
