import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `installed` in modals.ts is a module-level singleton, matching the
 * brief's "installModalRouter is idempotent as a whole" contract. To keep
 * each test's "first call" semantics (a fresh `installed = false`), reset
 * the module registry per test and import modals.ts dynamically inside
 * setup() rather than once, statically, at the top of the file.
 */
async function setup(hash = '') {
  document.body.innerHTML = `
    <button id="btn" data-modal-target="m1">open</button>
    <div id="card" role="button" tabindex="0" data-modal-target="m1"><a id="inner" href="#x">link</a></div>
    <dialog class="modal" id="m1"><p>hi</p><button id="close-btn" data-modal-close>close</button></dialog>
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
  const mod = await import('./modals');
  mod.installModalRouter();
  return mod;
}

describe('modal router', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.location.hash = '';
    vi.resetModules();
  });

  it('opens on a data-modal-target click and closes via closeModal', async () => {
    const { closeModal } = await setup();
    document.getElementById('btn')!.click();
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(true);
    closeModal('m1');
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(false);
  });

  it('ignores clicks on links inside a clickable card', async () => {
    await setup();
    document.getElementById('inner')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(false);
  });

  it('leaves a modified click on a trigger to the browser', async () => {
    await setup();
    const ctrl = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    document.getElementById('btn')!.dispatchEvent(ctrl);
    expect(ctrl.defaultPrevented).toBe(false);
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(false);
  });

  it('opens a card on Enter', async () => {
    await setup();
    document.getElementById('card')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(true);
  });

  it('opens a card on Space', async () => {
    await setup();
    document.getElementById('card')!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(true);
  });

  it('closes on a backdrop click (target is the dialog itself)', async () => {
    const { openModal } = await setup();
    openModal('m1');
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(true);
    document.getElementById('m1')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(false);
  });

  it('closes on a click on a [data-modal-close] element inside the dialog', async () => {
    const { openModal } = await setup();
    openModal('m1');
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(true);
    document.getElementById('close-btn')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(false);
  });

  it('opens the modal named by the URL hash on install, highlights other anchors', async () => {
    const { closeModal } = await setup('#m1');
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(true);
    closeModal('m1');
    window.location.hash = '#row-1';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(document.getElementById('row-1')!.classList.contains('search-highlight')).toBe(true);
    window.location.hash = '#home';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(document.getElementById('home')!.classList.contains('search-highlight')).toBe(false);
  });

  it('openModal dispatches modal:open', async () => {
    const { openModal } = await setup();
    let opened = 0;
    document.getElementById('m1')!.addEventListener('modal:open', () => opened++);
    openModal('m1');
    expect(opened).toBe(1);
  });
});
