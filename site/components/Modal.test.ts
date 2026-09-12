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
    // it no longer re-checks the hash on mount either: that is the router's job
    w.unmount();
  });
});
