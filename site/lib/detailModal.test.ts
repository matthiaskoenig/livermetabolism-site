import { beforeEach, describe, expect, it, vi } from 'vitest';
import { closeDetail, installDetailRouter, isValidId, openDetail, parseDetailHash } from './detailModal';

/**
 * The router's document-level listeners are installed once per page, so the
 * module is imported once here too (re-importing it through `vi.resetModules()`
 * would leave every earlier instance's listeners on the shared `document`).
 * The browsing stack and the fragment cache hang off the shell element, so
 * building a fresh dialog in `setup()` is what gives each test a clean slate.
 */
const BASE = '/';

/** A fragment exactly as `site/pages/detail/[type]/[id].astro` renders it: a bare `.detail` root, no doctype. */
function fragment(type: string, id: string, title: string, related: [string, string][] = []): string {
  const rows = related
    .map(([t, i]) => `<li><a class="related-row" href="/x/#${t}-${i}" data-detail="${t}:${i}"><span class="related-row-title">${t} ${i}</span></a></li>`)
    .join('');
  return `<div class="detail" data-detail-type="${type}" data-detail-id="${id}">
    <div class="detail-header"><h3 class="detail-title">${title}</h3></div>
    <div class="detail-related-group"><ul class="detail-related">${rows}</ul></div>
  </div>`;
}

function makeFetch(fragments: Record<string, string>) {
  const urls: string[] = [];
  const impl = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    urls.push(url);
    const html = fragments[url];
    if (html === undefined) return { ok: false, status: 404, text: async () => 'not found' } as Response;
    return { ok: true, status: 200, text: async () => html } as Response;
  });
  return { impl: impl as unknown as typeof fetch, urls };
}

async function setup(fragments: Record<string, string>, hash = '') {
  document.body.innerHTML = `
    <a id="trigger" href="#publication/P1" data-detail="publication:P1">a paper</a>
    <div id="card" role="button" tabindex="0" data-detail="project:proj"><a id="inner" href="https://example.org/">out</a></div>
    <dialog id="detail-modal" class="modal detail-modal" aria-labelledby="detail-modal-label">
      <div class="modal-header">
        <button type="button" class="modal-back" data-detail-back hidden>Back</button>
        <h5 class="modal-title" id="detail-modal-label"></h5>
        <button type="button" class="btn-close" data-modal-close aria-label="Close"></button>
      </div>
      <div class="modal-body"></div>
    </dialog>`;
  for (const d of document.querySelectorAll('dialog')) {
    const dlg = d as HTMLDialogElement;
    dlg.showModal = () => { dlg.setAttribute('open', ''); };
    dlg.close = () => { dlg.removeAttribute('open'); dlg.dispatchEvent(new Event('close')); };
  }
  window.location.hash = hash;
  const fetchStub = makeFetch(fragments);
  installDetailRouter({ base: BASE, fetchImpl: fetchStub.impl });
  return { fetchStub };
}

const dialog = () => document.getElementById('detail-modal')!;
const body = () => dialog().querySelector('.modal-body')!;
const title = () => dialog().querySelector('.modal-title')!.textContent;
const back = () => dialog().querySelector('.modal-back') as HTMLElement;

const FRAGMENTS: Record<string, string> = {
  '/detail/publication/P1/': fragment('publication', 'P1', 'A paper about livers', [['person', 'ada']]),
  '/detail/person/ada/': fragment('person', 'ada', 'Ada Lovelace'),
  '/detail/project/proj/': fragment('project', 'proj', 'A project'),
};

/** Wait for the (async) fragment fetch and render to land. */
const shown = (text: string) => vi.waitFor(() => expect(title()).toBe(text));

describe('parseDetailHash', () => {
  const parse = parseDetailHash;

  it('reads the #<type>/<id> scheme for every detail type', () => {
    expect(parse('#publication/Koenig2012_x')).toEqual({ type: 'publication', id: 'Koenig2012_x' });
    expect(parse('#person/matthias_koenig')).toEqual({ type: 'person', id: 'matthias_koenig' });
    expect(parse('#project/atlas')).toEqual({ type: 'project', id: 'atlas' });
    expect(parse('#software/sbmlutils')).toEqual({ type: 'software', id: 'sbmlutils' });
    expect(parse('#news/n1')).toEqual({ type: 'news', id: 'n1' });
    expect(parse('publication/x')).toEqual({ type: 'publication', id: 'x' });
  });

  it('maps the legacy #<type>-modal-<id> hashes', () => {
    expect(parse('#person-modal-matthias_koenig')).toEqual({ type: 'person', id: 'matthias_koenig' });
    expect(parse('#project-modal-atlas')).toEqual({ type: 'project', id: 'atlas' });
    expect(parse('#news-modal-n1')).toEqual({ type: 'news', id: 'n1' });
  });

  it('rejects unknown types, list anchors and unsafe ids', () => {
    expect(parse('')).toBeNull();
    expect(parse('#')).toBeNull();
    expect(parse('#foo/bar')).toBeNull();
    expect(parse('#pub-Koenig2012_x')).toBeNull();
    expect(parse('#person-matthias_koenig')).toBeNull();
    expect(parse('#publication/a/b')).toBeNull();
    expect(parse('#publication/<script>')).toBeNull();
    expect(parse('#publication/')).toBeNull();
    expect(parse('#publication/../../etc/passwd')).toBeNull();
    expect(parse('#software-modal-x')).toBeNull();
  });
});

describe('isValidId', () => {
  it('accepts the ids the schemas allow and nothing else', () => {
    expect(isValidId('Koenig2012_x')).toBe(true);
    expect(isValidId('libsbgn-python')).toBe(true);
    expect(isValidId('a.b')).toBe(true);
    expect(isValidId('')).toBe(false);
    expect(isValidId('a/b')).toBe(false);
    expect(isValidId('<script>')).toBe(false);
    expect(isValidId('a b')).toBe(false);
    expect(isValidId('..')).toBe(false);
  });
});

describe('detail modal router', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.history.replaceState(null, '', window.location.pathname);
  });

  it('fetches the fragment once, adopts its root and shows its title', async () => {
    const { fetchStub } = await setup(FRAGMENTS);
    await openDetail('publication', 'P1');
    await shown('A paper about livers');
    expect(fetchStub.urls).toEqual(['/detail/publication/P1/']);
    expect(dialog().hasAttribute('open')).toBe(true);
    const root = body().querySelector('.detail')!;
    expect(root.getAttribute('data-detail-type')).toBe('publication');
    expect(root.ownerDocument).toBe(document);

    // a second visit is served from the cache
    await openDetail('person', 'ada');
    await shown('Ada Lovelace');
    await openDetail('publication', 'P1');
    await shown('A paper about livers');
    expect(fetchStub.urls).toEqual(['/detail/publication/P1/', '/detail/person/ada/']);
  });

  it('opens on a [data-detail] click and pushes the hash', async () => {
    const push = vi.spyOn(window.history, 'pushState');
    await setup(FRAGMENTS);
    document.getElementById('trigger')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await shown('A paper about livers');
    expect(push).toHaveBeenCalledWith(null, '', '#publication/P1');
    push.mockRestore();
  });

  it('cancels the trigger anchor and ignores real links inside a clickable card', async () => {
    const { fetchStub } = await setup(FRAGMENTS);
    // the external link inside the clickable project card navigates on its own
    const inner = new MouseEvent('click', { bubbles: true, cancelable: true });
    document.getElementById('inner')!.dispatchEvent(inner);
    expect(inner.defaultPrevented).toBe(false);
    expect(dialog().hasAttribute('open')).toBe(false);
    expect(fetchStub.urls).toEqual([]);

    // the trigger itself is an anchor: the modal opens instead of navigating
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    document.getElementById('trigger')!.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    await shown('A paper about livers');
  });

  it('opens a role="button" trigger on Enter', async () => {
    await setup(FRAGMENTS);
    document.getElementById('card')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await shown('A project');
  });

  it('a related row opens the next detail and Back returns to the previous one', async () => {
    await setup(FRAGMENTS);
    await openDetail('publication', 'P1');
    await shown('A paper about livers');
    expect(back().hidden).toBe(true);

    body().querySelector<HTMLElement>('.related-row')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await shown('Ada Lovelace');
    expect(back().hidden).toBe(false);

    back().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await shown('A paper about livers');
    expect(back().hidden).toBe(true);
    expect(window.location.hash).toBe('#publication/P1');
  });

  it('keeps the focus inside the dialog when a related row replaces the body', async () => {
    await setup(FRAGMENTS);
    await openDetail('publication', 'P1');
    await shown('A paper about livers');

    // the clicked row is gone with the old body, so focus would fall back to <body>
    body().querySelector<HTMLElement>('.related-row')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await shown('Ada Lovelace');
    expect(dialog().contains(document.activeElement)).toBe(true);
  });

  it('leaves a modified click on a trigger to the browser', async () => {
    const { fetchStub } = await setup(FRAGMENTS);
    const ctrl = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    document.getElementById('trigger')!.dispatchEvent(ctrl);
    expect(ctrl.defaultPrevented).toBe(false);

    const middle = new MouseEvent('click', { bubbles: true, cancelable: true, button: 1 });
    document.getElementById('trigger')!.dispatchEvent(middle);
    expect(middle.defaultPrevented).toBe(false);

    expect(dialog().hasAttribute('open')).toBe(false);
    expect(fetchStub.urls).toEqual([]);
  });

  it('pops the in-modal stack when the browser Back returns to the entry below the top', async () => {
    await setup(FRAGMENTS);
    await openDetail('publication', 'P1');
    await shown('A paper about livers');
    body().querySelector<HTMLElement>('.related-row')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await shown('Ada Lovelace');
    expect(back().hidden).toBe(false);

    // the browser has already restored the previous URL when popstate fires
    window.history.replaceState(null, '', '#publication/P1');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await shown('A paper about livers');
    // the stack is [P1] again - pushing it a second time would keep Back visible
    expect(back().hidden).toBe(true);
    expect(window.location.hash).toBe('#publication/P1');
  });

  it('closeDetail empties the body, closes the dialog and drops the hash', async () => {
    await setup(FRAGMENTS);
    await openDetail('publication', 'P1');
    await shown('A paper about livers');
    expect(window.location.hash).toBe('#publication/P1');
    closeDetail();
    expect(dialog().hasAttribute('open')).toBe(false);
    expect(body().children.length).toBe(0);
    expect(window.location.hash).toBe('');
  });

  it('opens the detail named by the hash on install, without pushing a second entry', async () => {
    const push = vi.spyOn(window.history, 'pushState');
    await setup(FRAGMENTS, '#person/ada');
    await shown('Ada Lovelace');
    expect(push).not.toHaveBeenCalled();
    push.mockRestore();
  });

  it('opens a legacy hash and follows a hashchange', async () => {
    const { fetchStub } = await setup(FRAGMENTS, '#person-modal-ada');
    await shown('Ada Lovelace');
    window.location.hash = '#publication/P1';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await shown('A paper about livers');
    expect(fetchStub.urls).toEqual(['/detail/person/ada/', '/detail/publication/P1/']);
  });

  it('never fetches an invalid type or id', async () => {
    const { fetchStub } = await setup(FRAGMENTS);
    await openDetail('tag' as 'person', 'ai');
    await openDetail('person', '../secret');
    await openDetail('person', '');
    expect(fetchStub.urls).toEqual([]);
    expect(dialog().hasAttribute('open')).toBe(false);
  });

  it('shows an error line when the fragment cannot be loaded', async () => {
    await setup(FRAGMENTS);
    await openDetail('news', 'gone');
    await vi.waitFor(() => expect(body().querySelector('.detail-error')).not.toBeNull());
    expect(body().querySelector('.detail-error')!.textContent).toMatch(/could not be loaded/i);
    expect(dialog().hasAttribute('open')).toBe(true);
  });
});
