/**
 * One document-level router for the static native <dialog class="modal">
 * elements of a page (the site search): opens on [data-modal-target]
 * clicks/keys, on a matching URL hash, and pulses non-modal anchors
 * (`#pub-<id>`, `#project-<id>`, ... the list anchors search results and the
 * detail modal's "Show in list" link point at).
 *
 * The detail modal is the other half: `installDetailRouter()` handles every
 * `[data-detail]` trigger and every detail hash (`#<type>/<id>` and the legacy
 * `#person-modal-<id>` forms) beside this, on the same document. The two do
 * not overlap - a detail hash never matches an element id, and a list anchor
 * is never a detail hash.
 */
import { installDetailRouter } from './detailModal';
import { url } from './url';

let installed = false;

function dialog(id: string): HTMLDialogElement | null {
  const el = document.getElementById(id);
  return el instanceof HTMLDialogElement ? el : null;
}

export function openModal(id: string): void {
  const dlg = dialog(id);
  if (!dlg || dlg.open) return;
  dlg.showModal();
  dlg.dispatchEvent(new CustomEvent('modal:open'));
}

export function closeModal(id: string): void {
  const dlg = dialog(id);
  if (dlg?.open) dlg.close();
}

function focusHashTarget(): void {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return;
  const el = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!el) return;
  if (el instanceof HTMLDialogElement) { openModal(el.id); return; }
  // homepage sections/footer are plain scroll-snap anchors, not search hits
  if (el.classList.contains('page-section') || el.classList.contains('footer')) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('search-highlight');
  window.setTimeout(() => el.classList.remove('search-highlight'), 2500);
}

export function installModalRouter(): void {
  if (installed) return;
  installed = true;

  installDetailRouter({ base: url('/') });

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    // backdrop click closes (the dialog itself is the event target then)
    if (target instanceof HTMLDialogElement && target.classList.contains('modal')) { target.close(); return; }
    if (target.closest('[data-modal-close]')) { target.closest('dialog')?.close(); return; }
    const trigger = target.closest<HTMLElement>('[data-modal-target]');
    if (!trigger) return;
    // links inside a clickable card navigate on their own
    const link = target.closest('a');
    if (link && trigger.contains(link) && link !== trigger) return;
    e.preventDefault();
    openModal(trigger.dataset.modalTarget!);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target as HTMLElement | null;
    const card = target?.closest<HTMLElement>('[data-modal-target][role="button"]');
    if (!card) return;
    e.preventDefault();
    openModal(card.dataset.modalTarget!);
  });

  window.addEventListener('hashchange', focusHashTarget);
  focusHashTarget();
}
