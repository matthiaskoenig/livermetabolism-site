import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import Modal from './Modal.vue';

beforeEach(() => {
  // happy-dom lacks dialog.showModal()/close(); polyfill enough for the router
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); };
  document.body.innerHTML = '';
  window.location.hash = '';
});

describe('Modal', () => {
  it('opens on mount when the URL hash names it, even though another island installed the router first', () => {
    // first island to hydrate installs the document-level router; its own
    // id does not match the hash, so it must stay closed
    const other = mount(Modal, { props: { id: 'other', title: 'Other' }, attachTo: document.body });
    expect(other.find('dialog').element.hasAttribute('open')).toBe(false);

    window.location.hash = '#m1';
    // this island mounts after the router already exists - installModalRouter()
    // is a no-op for it, so it must re-check the hash itself on its own mount
    const w = mount(Modal, { props: { id: 'm1', title: 'M1' }, attachTo: document.body });
    expect(w.find('dialog').element.hasAttribute('open')).toBe(true);

    other.unmount();
    w.unmount();
  });
});
