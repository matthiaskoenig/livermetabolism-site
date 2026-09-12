/**
 * In-place refresh of the server-rendered GitHub bits of the research page:
 * the `.software-stats` line of every software card and the "updated …" note.
 *
 * The markup comes from `SoftwareCard.vue` / `SoftwareLive.astro` and is
 * complete without JavaScript; this only patches text nodes, `href`s and the
 * `hidden` attribute — nothing is ever inserted as HTML, so a release tag or
 * licence name from the snapshot cannot become markup. Imported by the
 * bundled `<script>` of `SoftwareLive.astro` (site chrome is plain
 * TypeScript, not a Vue island — see CLAUDE.md).
 */
import { relativeDate, statsFor } from './githubRows';
import type { Snapshot } from './githubSchema';

/** A field span of a stats line, with the element whose visibility it controls. */
function field(root: ParentNode, name: string): { text: HTMLElement; stat: HTMLElement } | null {
  const text = root.querySelector<HTMLElement>(`[data-field="${name}"]`);
  if (!text) return null;
  return { text, stat: text.closest<HTMLElement>('.software-stat') ?? text };
}

function set(root: ParentNode, name: string, value: string | null, iso?: string): void {
  const found = field(root, name);
  if (!found) return;
  found.text.textContent = value ?? '';
  if (iso) found.text.dataset.iso = iso;
  found.stat.hidden = !value;
}

/**
 * Re-render every `[data-field][data-iso]` span from its timestamp, so a
 * page built weeks ago does not keep claiming "yesterday".
 */
export function refreshRelativeDates(root: ParentNode = document, now: Date = new Date()): void {
  for (const el of root.querySelectorAll<HTMLElement>('[data-field][data-iso]')) {
    const iso = el.dataset.iso;
    if (iso) el.textContent = relativeDate(iso, now);
  }
}

/**
 * Patch every stats line and the "updated" note from `snapshot`. A card whose
 * repository the snapshot does not cover keeps what the build rendered.
 */
export function applyStats(snapshot: Snapshot, root: ParentNode = document, now: Date = new Date()): void {
  for (const line of root.querySelectorAll<HTMLElement>('.software-stats[data-repo]')) {
    const stats = statsFor(snapshot, line.dataset.repo ?? '');
    if (!stats) continue;
    const release = field(line, 'release');
    if (release) {
      const link = release.text.closest('a');
      if (link) link.href = stats.release?.htmlUrl ?? stats.htmlUrl;
      if (link && stats.release) link.title = `Release ${stats.release.tag}, ${relativeDate(stats.release.publishedAt, now)}`;
    }
    set(line, 'release', stats.release?.tag ?? null);
    set(line, 'stars', String(stats.stars));
    set(line, 'issues', `${stats.openIssues} open`);
    set(line, 'pushed', relativeDate(stats.pushedAt, now), stats.pushedAt);
    set(line, 'language', stats.language);
    set(line, 'license', stats.license);
  }
  const note = root.querySelector<HTMLElement>('[data-github-note] [data-field="updated"]');
  if (note) {
    note.dataset.iso = snapshot.fetchedAt;
    note.textContent = relativeDate(snapshot.fetchedAt, now);
    if (note instanceof HTMLTimeElement) note.dateTime = snapshot.fetchedAt;
  }
}
