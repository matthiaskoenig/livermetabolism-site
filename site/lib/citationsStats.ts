/**
 * In-place refresh of the server-rendered citation badges of the publications
 * page: the "cited N" link, the "open access" badge and the `data-cited`
 * attribute the ordering toggle sorts by.
 *
 * The markup comes from `PublicationRow.vue` / `PublicationsOrder.astro` and
 * is complete without JavaScript; this only patches text nodes, one `href`
 * and the `hidden` attribute — nothing is ever inserted as HTML. The two
 * snapshot strings that reach the page are the OpenAlex work id, which
 * `citationsSchema` constrains to `^W\d+$` before it can become a link, and
 * the open-access status, which is written to a `title` **property** and so
 * stays text whatever it contains. Imported by the bundled `<script>` of
 * `PublicationsOrder.astro` (site chrome is plain TypeScript, not a Vue
 * island — see CLAUDE.md).
 */
import { openalexWorkUrl, type Citations } from './citationsSchema';

/**
 * Patch every `.pub-cites` badge group and its row's `data-cited` from
 * `citations`. A row without a DOI has no badge group at all, and a DOI the
 * snapshot does not cover keeps what the build rendered (a hidden skeleton and
 * `data-cited="0"`), so an unknown paper never shows as "cited 0".
 */
export function applyCitations(root: ParentNode, citations: Citations): void {
  for (const group of root.querySelectorAll<HTMLElement>('.pub-cites[data-doi]')) {
    const entry = citations.works[group.dataset.doi ?? ''];
    if (!entry) continue;

    const cited = group.querySelector<HTMLElement>('[data-field="cited"]');
    if (cited) {
      cited.textContent = `cited ${entry.citedByCount}`;
      if (cited instanceof HTMLAnchorElement) cited.href = openalexWorkUrl(entry.openalexId);
      // a paper nobody has cited yet gets no badge rather than a "cited 0" one
      cited.hidden = entry.citedByCount === 0;
    }

    const oa = group.querySelector<HTMLElement>('[data-field="oa"]');
    if (oa) {
      oa.title = `Open access (${entry.oaStatus})`;
      oa.hidden = !entry.isOa;
    }

    const row = group.closest<HTMLElement>('tr[data-tags]');
    if (row) row.dataset.cited = String(entry.citedByCount);
  }
}

/**
 * Re-exported for the bundled script of `PublicationsOrder.astro`: the
 * "Citations from OpenAlex, updated …" note is re-dated and then updated from
 * the live snapshot by the one routine the GitHub and Scholar notes use too
 * (`githubStats.ts`, covered by `githubStats.test.ts`).
 */
export { refreshNote } from './githubStats';
