/**
 * One document-level router for every native <dialog class="modal"> on a
 * page (person/project/news modals, site search): opens on
 * [data-modal-target] clicks/keys, on a matching URL hash (search results
 * deep-link to #person-modal-<id>), and pulses non-modal anchors.
 */
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
  // Listener registration happens once (multiple Modal.vue instances each
  // call this on mount); the initial-hash check below still runs on every
  // call, since it is what lets a freshly-mounted page/dialog pick up a
  // hash that was already in the URL - re-running it is idempotent in
  // effect (openModal/scroll-highlight are no-ops on an already-open
  // dialog / already-applied class).
  if (!installed) {
    installed = true;

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
  }
  focusHashTarget();
}
