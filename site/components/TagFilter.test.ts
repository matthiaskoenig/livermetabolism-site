import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { beforeEach, describe, expect, it } from 'vitest';
import TagFilter from './TagFilter.vue';
import type { TagInfo } from '../lib/views';

const tag = (t: string): TagInfo => ({ tag: t, slug: t.toLowerCase().replace(/[^a-z0-9]+/g, '-'), icon: 'fa-flask', short_description: t, description: t, vision: t });
const tags = [tag('AI'), tag('Open & FAIR')];

/**
 * The static DOM TagFilter filters: two year groups, each with rows
 * carrying `data-tags`, exactly as publications.astro renders them.
 */
function target(): void {
  document.body.innerHTML = `
    <div id="list">
      <div class="pub-year-group">
        <h3 class="year-heading">2026</h3>
        <table><tbody>
          <tr id="r1" data-tags="AI"></tr>
          <tr id="r2" data-tags="AI|Open &amp; FAIR"></tr>
        </tbody></table>
      </div>
      <div class="pub-year-group">
        <h3 class="year-heading">2025</h3>
        <table><tbody>
          <tr id="r3" data-tags="Open &amp; FAIR"></tr>
          <tr id="r4" data-tags=""></tr>
        </tbody></table>
      </div>
    </div>`;
}

function mountFilter(search = '') {
  window.history.replaceState({}, '', `/publications/${search}`);
  target();
  return mount(TagFilter, { props: { id: 'publication', tags, target: 'list', strings: { all: 'All' } }, attachTo: document.body });
}

const hidden = (id: string) => document.getElementById(id)!.hasAttribute('hidden');
const groupHidden = (i: number) => document.querySelectorAll('.pub-year-group')[i]!.hasAttribute('hidden');

beforeEach(() => {
  document.body.innerHTML = '';
  window.history.replaceState({}, '', '/publications/');
});

describe('TagFilter', () => {
  it('renders the same filter bar markup the CSS and e2e suite expect', () => {
    const w = mountFilter();
    const bar = document.getElementById('publication-tag-filter')!;
    expect(bar.classList.contains('tag-filter')).toBe(true);
    const buttons = [...bar.querySelectorAll<HTMLElement>('.tag-filter-btn')];
    expect(buttons.map((b) => b.dataset.tag)).toEqual(['all', 'AI', 'Open & FAIR']);
    expect(buttons[0]!.classList.contains('active')).toBe(true);
    w.unmount();
  });

  it('shows everything while the filter is on all', () => {
    const w = mountFilter();
    expect(['r1', 'r2', 'r3', 'r4'].map(hidden)).toEqual([false, false, false, false]);
    expect([groupHidden(0), groupHidden(1)]).toEqual([false, false]);
    w.unmount();
  });

  it('hides non-matching items with the hidden attribute on a button click', async () => {
    const w = mountFilter();
    await w.find('[data-tag="AI"]').trigger('click');
    expect(['r1', 'r2', 'r3', 'r4'].map(hidden)).toEqual([false, false, true, true]);
    expect(w.find('[data-tag="AI"]').classes()).toContain('active');
    w.unmount();
  });

  it('hides a group once none of its items is visible, and shows it again', async () => {
    const w = mountFilter();
    await w.find('[data-tag="AI"]').trigger('click');
    expect([groupHidden(0), groupHidden(1)]).toEqual([false, true]);
    await w.find('[data-tag="all"]').trigger('click');
    expect([groupHidden(0), groupHidden(1)]).toEqual([false, false]);
    expect(['r1', 'r2', 'r3', 'r4'].map(hidden)).toEqual([false, false, false, false]);
    w.unmount();
  });

  it('pre-applies ?tag= on mount', async () => {
    const w = mountFilter('?tag=Open%20%26%20FAIR');
    // the bar's active class lands on the next tick; the DOM filtering above is synchronous
    await nextTick();
    expect(w.find('[data-tag="Open & FAIR"]').classes()).toContain('active');
    expect(['r1', 'r2', 'r3', 'r4'].map(hidden)).toEqual([true, false, false, true]);
    expect([groupHidden(0), groupHidden(1)]).toEqual([false, false]);
    w.unmount();
  });

  it('ignores a ?tag= value that is not one of the known tags', async () => {
    const w = mountFilter('?tag=Bogus');
    await nextTick();
    expect(w.find('[data-tag="all"]').classes()).toContain('active');
    expect(['r1', 'r2', 'r3', 'r4'].map(hidden)).toEqual([false, false, false, false]);
    w.unmount();
  });

  it('does nothing when the target container is missing', async () => {
    window.history.replaceState({}, '', '/publications/?tag=AI');
    document.body.innerHTML = '';
    const w = mount(TagFilter, { props: { id: 'publication', tags, target: 'nope', strings: { all: 'All' } }, attachTo: document.body });
    await nextTick();
    expect(w.find('[data-tag="AI"]').classes()).toContain('active');
    w.unmount();
  });

  it('accepts a custom group selector', async () => {
    window.history.replaceState({}, '', '/research/');
    document.body.innerHTML = `
      <div id="grid">
        <div class="card-group"><div id="c1" data-tags="AI"></div></div>
        <div class="card-group"><div id="c2" data-tags="Open &amp; FAIR"></div></div>
      </div>`;
    const w = mount(TagFilter, { props: { id: 'software', tags, target: 'grid', groupSelector: '.card-group', strings: { all: 'All' } }, attachTo: document.body });
    await w.find('[data-tag="AI"]').trigger('click');
    expect([hidden('c1'), hidden('c2')]).toEqual([false, true]);
    const groups = document.querySelectorAll('.card-group');
    expect([groups[0]!.hasAttribute('hidden'), groups[1]!.hasAttribute('hidden')]).toEqual([false, true]);
    w.unmount();
  });
});
