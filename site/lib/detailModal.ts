/**
 * The one detail modal of the site: the shell (`site/components/DetailModal.astro`)
 * is static markup in the base layout on every page, and the content of a
 * person, publication, project, software entry or news item is the prerendered
 * fragment under `/detail/<type>/<id>/` (`site/pages/detail/[type]/[id].astro`),
 * fetched on first open and cached for the rest of the page's life.
 *
 * Anything with `data-detail="<type>:<id>"` is a trigger — the cards, rows and
 * avatars of the list pages, the search results (by URL) and the related rows
 * inside an open modal, which makes the modal browsable with a Back button.
 *
 * Addressing and history:
 *   - a detail is addressed as `#<type>/<id>`, which cannot clash with an
 *     element id (no id contains a slash), plus the legacy `#person-modal-<id>`,
 *     `#project-modal-<id>` and `#news-modal-<id>` of the retired per-page modals;
 *   - opening from a click pushes that hash, opening from a hash (on load, on
 *     `hashchange`, on `popstate`) does not push;
 *   - Back inside the modal pops the in-modal stack and `replaceState`s the hash;
 *   - closing drops the hash with `replaceState` — never `history.back()`, which
 *     could navigate away from the site.
 *
 * The browsing stack and the fragment cache hang off the shell element itself
 * (`states`), so they are exactly as long-lived as the page's dialog.
 *
 * Security: `type` and `id` are validated against the five type names and
 * `^[A-Za-z0-9_.-]+$` before any fetch, so nothing from the URL ever reaches a
 * request path unchecked; the response is parsed with `DOMParser` and its root
 * element adopted — never assigned as HTML — and it is the site's own
 * same-origin build output (`connect-src 'self'`).
 */
import { DETAIL_TYPES, type DetailType } from './detailTypes';

export interface DetailEntry {
  type: DetailType;
  id: string;
}

/** The id shapes `src/data.py` and `site/lib/schemas.ts` allow — and nothing that could escape the fetch path. */
const ID_RE = /^[A-Za-z0-9_.-]+$/;

const SHELL_ID = 'detail-modal';

export function isValidId(id: string): boolean {
  return ID_RE.test(id) && id !== '.' && id !== '..';
}

function isDetailType(value: string): value is DetailType {
  return (DETAIL_TYPES as readonly string[]).includes(value);
}

/**
 * `#<type>/<id>` (the scheme) or `#person-modal-<id>` / `#project-modal-<id>` /
 * `#news-modal-<id>` (the hashes the retired modals were deep-linked by, kept
 * working for old links and bookmarks). Anything else — a list anchor such as
 * `#pub-<id>`, an unknown type, an id with a slash — is not a detail.
 */
export function parseDetailHash(hash: string): DetailEntry | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const slash = decoded.indexOf('/');
  if (slash > 0) {
    const type = decoded.slice(0, slash);
    const id = decoded.slice(slash + 1);
    return isDetailType(type) && isValidId(id) ? { type, id } : null;
  }
  const legacy = /^(person|project|news)-modal-(.+)$/.exec(decoded);
  if (legacy) {
    const type = legacy[1] as DetailType;
    const id = legacy[2]!;
    return isValidId(id) ? { type, id } : null;
  }
  return null;
}

// --- the shell and its state ---------------------------------------------

interface Shell {
  dialog: HTMLDialogElement;
  body: HTMLElement;
  title: HTMLElement;
  back: HTMLElement;
  /** The in-modal browsing stack: the last entry is what is shown, Back pops it. */
  stack: DetailEntry[];
  /** Adopted fragment roots by `<type>:<id>`; re-appended on a revisit. */
  cache: Map<string, Element>;
  /** Guards against a slow fetch landing after the user has moved on. */
  pending: number;
}

let base = import.meta.env.BASE_URL || '/';
let fetchImpl: typeof fetch = (...args) => fetch(...args);
let installed = false;
const states = new WeakMap<HTMLDialogElement, Shell>();

function shell(): Shell | null {
  const dialog = document.getElementById(SHELL_ID);
  if (!(dialog instanceof HTMLDialogElement)) return null;
  const existing = states.get(dialog);
  if (existing) return existing;
  const body = dialog.querySelector<HTMLElement>('.modal-body');
  const title = dialog.querySelector<HTMLElement>('.modal-title');
  const back = dialog.querySelector<HTMLElement>('.modal-back');
  if (!body || !title || !back) return null;
  const view: Shell = { dialog, body, title, back, stack: [], cache: new Map(), pending: 0 };
  states.set(dialog, view);
  // Escape, the backdrop and the × all end in the dialog's own close event
  // (the modal router handles the last two), so the URL and the stack are
  // reset from here however the modal was closed.
  dialog.addEventListener('close', () => reset(view));
  return view;
}

function message(cls: string, text: string): HTMLParagraphElement {
  const p = document.createElement('p');
  p.className = cls;
  p.textContent = text;
  return p;
}

/** Fetch a fragment and adopt its `.detail` root into this document, once per entity. */
async function fragment(view: Shell, entry: DetailEntry): Promise<Element> {
  const key = `${entry.type}:${entry.id}`;
  const hit = view.cache.get(key);
  if (hit) return hit;
  const res = await fetchImpl(`${base}detail/${entry.type}/${entry.id}/`);
  if (!res.ok) throw new Error(`detail fragment ${key}: HTTP ${res.status}`);
  const parsed = new DOMParser().parseFromString(await res.text(), 'text/html');
  const root = parsed.querySelector('.detail');
  if (!root) throw new Error(`detail fragment ${key}: no .detail root`);
  const node = document.adoptNode(root);
  view.cache.set(key, node);
  return node;
}

function setHash(entry: DetailEntry, push: boolean): void {
  const hash = `#${entry.type}/${entry.id}`;
  if (window.location.hash === hash) return;
  if (push) window.history.pushState(null, '', hash);
  else window.history.replaceState(null, '', hash);
}

/** Drop a detail hash from the URL without adding a history entry (and without leaving the site). */
function clearHash(): void {
  if (!parseDetailHash(window.location.hash)) return;
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

/** Render the top of the stack: the cached or freshly fetched fragment, with the title read from it. */
async function render(view: Shell): Promise<void> {
  const entry = view.stack[view.stack.length - 1];
  if (!entry) return;
  const token = ++view.pending;
  view.back.hidden = view.stack.length < 2;
  if (!view.cache.has(`${entry.type}:${entry.id}`)) {
    view.title.textContent = 'Loading…';
    view.body.replaceChildren(message('detail-loading', 'Loading…'));
  }
  try {
    const node = await fragment(view, entry);
    if (token !== view.pending) return;
    view.title.textContent = node.querySelector('.detail-title')?.textContent?.trim() || 'Details';
    view.body.replaceChildren(node);
    view.body.scrollTop = 0;
  } catch {
    if (token !== view.pending) return;
    view.title.textContent = 'Details';
    view.body.replaceChildren(message('detail-error', 'This entry could not be loaded. Please try again.'));
  }
}

/**
 * Show the detail of `type`/`id`. While the modal is open the entry is pushed
 * onto the in-modal stack (Back returns to the previous one); otherwise it
 * starts a fresh stack. `push` (the default) adds a history entry for the
 * hash — a hash-driven open passes `false`, the URL already says so.
 */
export async function openDetail(type: DetailType, id: string, opts: { push?: boolean } = {}): Promise<void> {
  if (!isDetailType(type) || !isValidId(id)) return;
  const view = shell();
  if (!view) return;
  const entry: DetailEntry = { type, id };
  const top = view.stack[view.stack.length - 1];
  // re-opening what is already on screen is a no-op, not a second stack entry
  if (view.dialog.open && top && top.type === type && top.id === id) return;
  if (view.dialog.open) view.stack.push(entry);
  else view.stack.splice(0, view.stack.length, entry);
  setHash(entry, opts.push !== false);
  if (!view.dialog.open) view.dialog.showModal();
  await render(view);
}

/** Close the modal and forget the stack; the fragment cache survives for the page's life. */
export function closeDetail(): void {
  const view = shell();
  if (!view) return;
  if (view.dialog.open) view.dialog.close();
  else reset(view);
}

/** Everything a close has to undo, however the dialog was closed. */
function reset(view: Shell): void {
  view.stack.length = 0;
  view.pending++;
  view.body.replaceChildren();
  view.title.textContent = '';
  view.back.hidden = true;
  clearHash();
}

/** Back: drop the current entry and show the one it was opened from. */
function goBack(view: Shell): void {
  if (view.stack.length < 2) return;
  view.stack.pop();
  setHash(view.stack[view.stack.length - 1]!, false);
  void render(view);
}

/** The `<type>:<id>` of a trigger, validated. */
function triggerEntry(el: HTMLElement): DetailEntry | null {
  const value = el.dataset.detail ?? '';
  const colon = value.indexOf(':');
  if (colon <= 0) return null;
  const type = value.slice(0, colon);
  const id = value.slice(colon + 1);
  return isDetailType(type) && isValidId(id) ? { type, id } : null;
}

/**
 * Follow the current URL hash: open the detail it names, or close a modal left
 * open by a non-detail hash (a "Show in list" link, say). A hash that already
 * names what is on screen changes nothing — the modal writes the hash itself,
 * and a search result may point at the detail that is already open.
 */
function followHash(): void {
  const view = shell();
  const entry = parseDetailHash(window.location.hash);
  if (!entry) {
    if (view?.dialog.open) closeDetail();
    return;
  }
  const top = view?.stack[view.stack.length - 1];
  if (view?.dialog.open && top && top.type === entry.type && top.id === entry.id) return;
  void openDetail(entry.type, entry.id, { push: false });
}

/**
 * Wire the document-level listeners (once) and point the router at this
 * deploy's base path. Called by `installModalRouter()` (`site/lib/modals.ts`),
 * which keeps the plain-anchor and static-dialog behaviour beside it.
 */
export function installDetailRouter(opts: { base: string; fetchImpl?: typeof fetch }): void {
  base = opts.base || '/';
  if (opts.fetchImpl) fetchImpl = opts.fetchImpl;
  if (!installed) {
    installed = true;

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const view = shell();
      if (view && view.dialog.contains(target) && target.closest('.modal-back')) {
        e.preventDefault();
        goBack(view);
        return;
      }
      const trigger = target.closest<HTMLElement>('[data-detail]');
      if (!trigger) return;
      // a real link inside a clickable card (PDF, homepage, repository) navigates on its own
      const link = target.closest('a');
      if (link && trigger.contains(link) && link !== trigger) return;
      const entry = triggerEntry(trigger);
      if (!entry) return;
      e.preventDefault();
      void openDetail(entry.type, entry.id);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-detail][role="button"]');
      if (!card) return;
      const entry = triggerEntry(card);
      if (!entry) return;
      e.preventDefault();
      void openDetail(entry.type, entry.id);
    });

    // a search result navigates by URL — on the same page that is a bare
    // hashchange, on another page the initial check below covers it
    window.addEventListener('hashchange', followHash);
    window.addEventListener('popstate', followHash);
  }
  followHash();
}
