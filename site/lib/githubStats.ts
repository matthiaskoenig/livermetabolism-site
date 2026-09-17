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
import { ENGLISH_RELATIVE_DATE_STRINGS, hasData, relativeDate, shortDate, statsFor, type RelativeDateStrings } from './githubRows';
import type { Snapshot } from './githubSchema';
import { fmt } from './i18n/format';

/**
 * English fallbacks for markup that carries no `data-*-template` (older
 * cached HTML, a test fixture) - the literal text these fields always
 * showed before they took a template. Exported so `githubStats.test.ts` can
 * pin them to `en.gh.release` / `en.gh.releases` / `en.gh.issuesOpen`, the
 * catalog entries they must never drift from.
 */
export const DEFAULT_RELEASE_TEMPLATE = 'Release {tag} · {date}';
export const DEFAULT_RELEASES_LABEL = 'Releases';
export const DEFAULT_ISSUES_OPEN_TEMPLATE = '{count} open';

/**
 * The `RelativeDateStrings` a bundled script needs, from the `data-time-strings`
 * JSON an Astro component (`SoftwareLive.astro`, `ScholarStats.astro`,
 * `PublicationsOrder.astro`) rendered from the UI catalog on its own root
 * element - the catalog itself is build-time only and cannot be imported into
 * browser code (see CLAUDE.md, "Site chrome"). Falls back to the English
 * literal for markup that carries none or unparsable JSON.
 */
export function timeStringsFrom(el: HTMLElement | null): RelativeDateStrings {
  const raw = el?.dataset.timeStrings;
  if (!raw) return ENGLISH_RELATIVE_DATE_STRINGS;
  try {
    return JSON.parse(raw) as RelativeDateStrings;
  } catch {
    return ENGLISH_RELATIVE_DATE_STRINGS;
  }
}

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
 * Re-render every `[data-field][data-iso]` span from its timestamp, so a page
 * built weeks ago does not keep claiming "yesterday". A span whose timestamp
 * is the epoch of `emptySnapshot()` falls back to its `data-empty` text
 * ("never" on the note) instead of reading as "56 years ago".
 */
export function refreshRelativeDates(root: ParentNode = document, now: Date = new Date(), strings: RelativeDateStrings = ENGLISH_RELATIVE_DATE_STRINGS): void {
  for (const el of root.querySelectorAll<HTMLElement>('[data-field][data-iso]')) {
    const iso = el.dataset.iso;
    if (!iso) continue;
    el.textContent = hasData(iso) ? relativeDate(iso, now, strings) : (el.dataset.empty ?? '');
  }
}

/**
 * Re-render one "updated …" note from a snapshot's `fetchedAt`: a page built
 * weeks ago must not keep claiming "yesterday", and the epoch of an empty
 * snapshot falls back to the element's `data-empty` text ("never") instead of
 * reading as "56 years ago". `data-iso` (what the live updaters compare
 * against) and, on a `<time>`, `datetime` are kept in step with the text.
 *
 * Shared by the three live-data notes: GitHub (`applyStats` below), Scholar
 * (`applyScholar`) and citations (`PublicationsOrder.astro`, via the
 * re-export in `citationsStats.ts`).
 */
export function refreshNote(el: HTMLElement | null, fetchedAt: string, now: Date = new Date(), strings: RelativeDateStrings = ENGLISH_RELATIVE_DATE_STRINGS): void {
  if (!el) return;
  const known = hasData(fetchedAt);
  el.dataset.iso = fetchedAt;
  el.textContent = known ? relativeDate(fetchedAt, now, strings) : (el.dataset.empty ?? '');
  if (el instanceof HTMLTimeElement) el.dateTime = known ? fetchedAt : '';
}

/**
 * Patch every stats line and the "updated" note from `snapshot`. A card whose
 * repository the snapshot does not cover keeps what the build rendered.
 *
 * The release title, the "Releases" fallback and the "N open" issues text are
 * templates read from `data-release-template` / `data-releases-label` /
 * `data-issues-open-template` on the page's `[data-github-note]` element -
 * set by `SoftwareLive.astro` from the UI catalog, the same key
 * `SoftwareCard.vue` renders at build time (see CLAUDE.md, the four
 * duplicates) - with the English literal as a fallback for markup that
 * carries none (older cached HTML, a test fixture).
 */
export function applyStats(snapshot: Snapshot, root: ParentNode = document, now: Date = new Date(), strings: RelativeDateStrings = ENGLISH_RELATIVE_DATE_STRINGS): void {
  const note = root.querySelector<HTMLElement>('[data-github-note]');
  const releaseTemplate = note?.dataset.releaseTemplate ?? DEFAULT_RELEASE_TEMPLATE;
  const releasesLabel = note?.dataset.releasesLabel ?? DEFAULT_RELEASES_LABEL;
  const issuesOpenTemplate = note?.dataset.issuesOpenTemplate ?? DEFAULT_ISSUES_OPEN_TEMPLATE;
  for (const line of root.querySelectorAll<HTMLElement>('.software-stats[data-repo]')) {
    const stats = statsFor(snapshot, line.dataset.repo ?? '');
    if (!stats) continue;
    const release = field(line, 'release');
    const link = release?.text.closest('a');
    if (link) {
      link.href = stats.release?.htmlUrl ?? stats.htmlUrl;
      // absolute date: nothing re-renders this title later
      link.title = stats.release ? fmt(releaseTemplate, { tag: stats.release.tag, date: shortDate(stats.release.publishedAt) }) : releasesLabel;
    }
    set(line, 'release', stats.release?.tag ?? null);
    set(line, 'stars', String(stats.stars));
    set(line, 'issues', fmt(issuesOpenTemplate, { count: stats.openIssues }));
    set(line, 'pushed', relativeDate(stats.pushedAt, now, strings), stats.pushedAt);
    set(line, 'language', stats.language);
    set(line, 'license', stats.license);
  }
  refreshNote(root.querySelector<HTMLElement>('[data-github-note] [data-field="updated"]'), snapshot.fetchedAt, now, strings);
}
