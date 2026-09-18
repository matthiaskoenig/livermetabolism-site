/**
 * Applies the active research area to the static DOM (issue #68).
 *
 * The site is server-rendered HTML, so filtering is hiding, not
 * re-rendering: every card, row and grid is already on the page and the
 * sweep only toggles the `hidden` attribute (Tailwind preflight's
 * `[hidden]{display:none!important}`), never an inline `display`.
 *
 * Three markers make up the contract:
 *
 * - `data-tags` - a pipe-separated list of area **slugs** on anything
 *   filterable (`data-tags="ai|open-fair"`). Emitted by every card
 *   component.
 * - `data-filter-group` - a wrapper that disappears once it holds nothing
 *   visible. The publications page's year groups: a "2025" heading over an
 *   empty table is noise.
 * - `data-filter-empty` - a line revealed when the *containing element* has
 *   no visible item left. Sections like `/research/#software` use this
 *   instead of hiding, because the navbar dropdown links straight at those
 *   anchors and a section that vanishes takes its anchor with it.
 *
 * Unlike the per-page `TagFilter` islands this replaces, the sweep is
 * document-wide and needs no `target` container: one bar drives the whole
 * page, which is what makes `/research/`'s three formerly independent
 * filters agree.
 */

/**
 * The detail modal holds a prerendered fragment of whatever the reader
 * clicked, which is deliberately unrelated to the filter - hiding its
 * contents because the open entry sits in another research area would empty
 * the dialog the reader just opened.
 */
function filterable(el: HTMLElement): boolean {
  return el.closest('dialog') === null;
}

function matches(el: HTMLElement, topic: string): boolean {
  const raw = el.dataset.tags;
  return raw ? raw.split('|').includes(topic) : false;
}

/**
 * Whether `hash` names an element the active area has hidden - either
 * directly or by hiding the group it sits in.
 *
 * A reader who follows a search result or a "Show in list" link has asked
 * for one specific entry, which outranks a filter they set earlier: the bar
 * clears the filter rather than scrolling them to something invisible. A
 * detail hash (`#publication/foo`) matches no element id and is ignored,
 * because the detail modal shows its entry regardless of the filter.
 */
export function hiddenByFilter(hash: string, root: Document = document): boolean {
  const id = hash.replace(/^#/, '');
  // ids on this site are `<type>-<data id>`; anything else (a detail hash,
  // an injected selector) is not ours to look up
  if (!id || !/^[A-Za-z0-9_.-]+$/.test(id)) return false;
  const el = root.getElementById(id);
  return el instanceof HTMLElement && el.closest('[hidden]') !== null;
}

export function applyTopic(topic: string | null, root: Document | HTMLElement = document): void {
  const items = [...root.querySelectorAll<HTMLElement>('[data-tags]')].filter(filterable);
  for (const el of items) el.hidden = topic !== null && !matches(el, topic);

  for (const group of root.querySelectorAll<HTMLElement>('[data-filter-group]')) {
    if (!filterable(group)) continue;
    group.hidden = !group.querySelector('[data-tags]:not([hidden])');
  }

  for (const note of root.querySelectorAll<HTMLElement>('[data-filter-empty]')) {
    if (!filterable(note)) continue;
    const container = note.parentElement;
    note.hidden = !container || container.querySelector('[data-tags]:not([hidden])') !== null;
  }
}
