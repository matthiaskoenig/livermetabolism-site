import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Modal from './Modal.vue';

beforeEach(() => {
  // happy-dom lacks dialog.showModal()/close(); polyfill enough for the router
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); };
  document.body.innerHTML = '';
  window.location.hash = '';
  vi.resetModules();
});

/**
 * `installed` in modals.ts is a module-level singleton, so import
 * ModalRouter dynamically (after the beforeEach vi.resetModules()) to get
 * a router whose "first install" - including its one hash check - is this
 * test's.
 */
async function mountRouter() {
  const { default: ModalRouter } = await import('./ModalRouter.vue');
  return mount(ModalRouter, { attachTo: document.body });
}

describe('Modal', () => {
  it('renders a closed dialog with the ids the router and CSS use, and installs no router of its own', () => {
    const w = mount(Modal, { props: { id: 'm1', title: 'M1' }, attachTo: document.body });
    const dlg = w.find('dialog').element;
    expect(dlg.id).toBe('m1');
    expect(dlg.classList.contains('modal')).toBe(true);
    expect(dlg.getAttribute('aria-labelledby')).toBe('m1-label');
    expect(w.find('.modal-title').element.id).toBe('m1-label');
    expect(w.find('[data-modal-close]').exists()).toBe(true);
    expect(dlg.hasAttribute('open')).toBe(false);
    // it no longer re-checks the hash on mount either: that is ModalRouter's job
    w.unmount();
  });

  it('emits open/close for a hydrated user of those events (SiteSearch)', () => {
    const w = mount(Modal, { props: { id: 'm1', title: 'M1' }, attachTo: document.body });
    const dlg = w.find('dialog').element as HTMLDialogElement;
    dlg.showModal();
    dlg.dispatchEvent(new CustomEvent('modal:open'));
    expect(w.emitted('open')).toHaveLength(1);
    dlg.close();
    expect(w.emitted('close')).toHaveLength(1);
    w.unmount();
  });
});

describe('ModalRouter', () => {
  it('renders nothing visible and routes every static dialog on the page', async () => {
    document.body.innerHTML = `
      <dialog class="modal" id="a"></dialog>
      <dialog class="modal" id="b"></dialog>
      <button id="open-b" data-modal-target="b"></button>`;
    const w = await mountRouter();
    expect(w.element.hasAttribute('hidden')).toBe(true);
    document.getElementById('open-b')!.click();
    expect(document.getElementById('b')!.hasAttribute('open')).toBe(true);
    expect(document.getElementById('a')!.hasAttribute('open')).toBe(false);
    w.unmount();
  });

  it('opens the dialog named by the URL hash on mount (deep links from search)', async () => {
    document.body.innerHTML = '<dialog class="modal" id="person-modal-jane"></dialog>';
    window.location.hash = '#person-modal-jane';
    const w = await mountRouter();
    expect(document.getElementById('person-modal-jane')!.hasAttribute('open')).toBe(true);
    w.unmount();
  });
});
