import { beforeEach, describe, expect, it } from 'vitest';
import { closeModal, installModalRouter, openModal } from './modals';

function setup(hash = '') {
  document.body.innerHTML = `
    <button id="btn" data-modal-target="m1">open</button>
    <div id="card" role="button" tabindex="0" data-modal-target="m1"><a id="inner" href="#x">link</a></div>
    <dialog class="modal" id="m1"><p>hi</p></dialog>
    <div id="row-1">row</div>
    <section class="page-section" id="home"></section>`;
  // happy-dom lacks showModal(); polyfill enough for the router
  for (const d of document.querySelectorAll('dialog')) {
    const dlg = d as HTMLDialogElement;
    dlg.showModal = () => { dlg.setAttribute('open', ''); };
    dlg.close = () => { dlg.removeAttribute('open'); dlg.dispatchEvent(new Event('close')); };
    dlg.scrollIntoView = () => {};
  }
  (document.getElementById('row-1') as HTMLElement).scrollIntoView = () => {};
  window.location.hash = hash;
  installModalRouter();
}

describe('modal router', () => {
  beforeEach(() => { document.body.innerHTML = ''; window.location.hash = ''; });

  it('opens on a data-modal-target click and closes via closeModal', () => {
    setup();
    document.getElementById('btn')!.click();
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(true);
    closeModal('m1');
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(false);
  });

  it('ignores clicks on links inside a clickable card', () => {
    setup();
    document.getElementById('inner')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(false);
  });

  it('opens a card on Enter', () => {
    setup();
    document.getElementById('card')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(true);
  });

  it('opens the modal named by the URL hash on install, highlights other anchors', () => {
    setup('#m1');
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(true);
    closeModal('m1');
    window.location.hash = '#row-1';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(document.getElementById('row-1')!.classList.contains('search-highlight')).toBe(true);
    window.location.hash = '#home';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(document.getElementById('home')!.classList.contains('search-highlight')).toBe(false);
  });

  it('openModal dispatches modal:open', () => {
    setup();
    let opened = 0;
    document.getElementById('m1')!.addEventListener('modal:open', () => opened++);
    openModal('m1');
    expect(opened).toBe(1);
  });
});
