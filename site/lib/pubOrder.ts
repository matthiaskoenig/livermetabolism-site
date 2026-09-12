/**
 * The Year / Most cited ordering of the publications list, driven by the
 * static markup of `publications.astro` and the toggle of
 * `PublicationsOrder.astro`.
 *
 * There is only ever **one** copy of the rows: "Most cited" moves the existing
 * `tr[data-tags]` nodes out of their year groups into the flat table
 * `#publication-list-flat` (ordered by `data-cited` descending), hides the
 * groups and shows the flat table; "Year" moves every node back to the exact
 * parent and next sibling it was rendered at. Both are idempotent, and neither
 * touches a row's own `hidden` attribute — that belongs to the tag filter
 * (`TagFilter.vue`), which finds the rows by `[data-tags]` under
 * `#publication-list` in either order because the flat table lives inside it.
 * Restoring re-derives the year groups' visibility the same way the filter
 * does, so a tag selected while the list was flat still holds afterwards.
 */

/** Where a row was rendered, so it can be put back exactly there. */
interface Origin {
  parent: ParentNode;
  next: Node | null;
  /** Position in the initial document order (year descending). */
  index: number;
}

/**
 * Module-level, so the original positions survive any number of toggles; keyed
 * by the row element itself, so nothing is retained once the page goes away.
 */
const origins = new WeakMap<HTMLElement, Origin>();

export type PubOrder = 'year' | 'cited';

function rows(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('tr[data-tags]')];
}

/** A row's citation count; a row without a DOI (or before the patch) is 0. */
function citedCount(row: HTMLElement): number {
  const n = Number(row.dataset.cited);
  return Number.isFinite(n) ? n : 0;
}

/** Remember where each row started out, once. */
function remember(list: HTMLElement[]): void {
  list.forEach((row, index) => {
    if (origins.has(row)) return;
    origins.set(row, { parent: row.parentNode!, next: row.nextSibling, index });
  });
}

/**
 * Flat order: citation count descending, ties by the original document order —
 * which is year descending, so the tie-break of the spec needs no year
 * attribute. Sorting by the remembered index (not the current DOM position)
 * keeps the result the same however often this runs.
 */
export function orderByCitations(root: HTMLElement): void {
  const flat = root.querySelector<HTMLElement>('#publication-list-flat');
  const body = flat?.querySelector('tbody') ?? flat;
  if (!flat || !body) return;

  const list = rows(root);
  remember(list);
  const index = (row: HTMLElement) => origins.get(row)?.index ?? 0;
  list.sort((a, b) => citedCount(b) - citedCount(a) || index(a) - index(b));
  for (const row of list) body.appendChild(row);

  for (const group of root.querySelectorAll<HTMLElement>('.pub-year-group')) group.hidden = true;
  flat.hidden = false;
}

/**
 * Year order: every remembered row back to its own parent and next sibling.
 * Descending by index, so a row's recorded next sibling is already back in
 * place by the time it is needed.
 */
export function restoreOrder(root: HTMLElement): void {
  const list = rows(root)
    .filter((row) => origins.has(row))
    .sort((a, b) => origins.get(b)!.index - origins.get(a)!.index);
  for (const row of list) {
    const { parent, next } = origins.get(row)!;
    parent.insertBefore(row, next && next.parentNode === parent ? next : null);
  }

  const flat = root.querySelector<HTMLElement>('#publication-list-flat');
  if (flat) flat.hidden = true;
  // the tag filter may have run while the list was flat (every group was empty
  // and therefore hidden): derive each group's visibility from its rows again
  for (const group of root.querySelectorAll<HTMLElement>('.pub-year-group')) {
    group.hidden = !group.querySelector('[data-tags]:not([hidden])');
  }
}

/** `order` as the toggle and `?order=` spell it. */
export function applyOrder(root: HTMLElement, order: PubOrder): void {
  if (order === 'cited') orderByCitations(root);
  else restoreOrder(root);
}
