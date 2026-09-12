/**
 * In-place refresh of the server-rendered Scholar bits of the publications
 * page: the numbers of the summary strip, the "since <year>" labels, the
 * profile name and the "last update …" note.
 *
 * The markup comes from `ScholarStats.astro` and is complete without
 * JavaScript; this only patches text nodes and the `hidden` attribute —
 * nothing is ever inserted as HTML, and the profile URL is not touched at all
 * (it is rendered at build time through `profileHref`), so no string from the
 * snapshot can become markup or a URL. Imported by the bundled `<script>` of
 * `ScholarStats.astro` (site chrome is plain TypeScript, not a Vue island —
 * see CLAUDE.md).
 */
import { refreshNote } from './githubStats';
import { stripValues } from './scholarRows';
import type { Scholar } from './scholarSchema';

function set(root: ParentNode, name: string, value: string): void {
  const el = root.querySelector<HTMLElement>(`[data-field="${name}"]`);
  if (el) el.textContent = value;
}

/**
 * Patch the strip and the note from `scholar`. A snapshot without data (the
 * epoch of `emptyScholar()`) leaves the figures hidden and only re-renders the
 * note, so the page never shows zeros as if they were metrics.
 */
export function applyScholar(scholar: Scholar, root: ParentNode = document, now: Date = new Date()): void {
  const v = stripValues(scholar);
  const strip = root.querySelector<HTMLElement>('[data-scholar-strip]');
  if (strip && v.known) {
    set(strip, 'citations', String(v.citations));
    set(strip, 'citations-since', String(v.citationsSince));
    set(strip, 'h-index', String(v.hIndex));
    set(strip, 'h-index-since', String(v.hIndexSince));
    set(strip, 'i10-index', String(v.i10Index));
    set(strip, 'i10-index-since', String(v.i10IndexSince));
    for (const el of strip.querySelectorAll<HTMLElement>('[data-since-year]')) el.textContent = `since ${v.sinceYear}`;
    // the metric figures are rendered empty and hidden by a build that had no
    // snapshot; now that there are numbers, show them
    for (const el of strip.querySelectorAll<HTMLElement>('[data-scholar-metric]')) el.hidden = false;
  }

  const note = root.querySelector<HTMLElement>('[data-scholar-note]');
  if (!note) return;
  const name = note.querySelector<HTMLElement>('[data-field="profile-name"]');
  if (name && v.name) {
    name.textContent = v.name;
    const wrap = name.closest<HTMLElement>('[data-scholar-name]');
    if (wrap) wrap.hidden = false;
  }
  refreshNote(note.querySelector<HTMLElement>('[data-field="updated"]'), v.fetchedAt, now);
}

/**
 * Re-exported for the bundled script: a page built weeks ago must re-date its
 * note before the live snapshot arrives. The helper is generic (every
 * `[data-field][data-iso]` under `root`) and already covered by
 * `githubStats.test.ts`.
 */
export { refreshRelativeDates } from './githubStats';
