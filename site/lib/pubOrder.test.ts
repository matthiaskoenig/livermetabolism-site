import { beforeEach, describe, expect, it } from 'vitest';
import { applyOrder, orderByCitations, restoreOrder } from './pubOrder';

/**
 * What publications.astro renders: two year groups (newest first, as
 * `groupByYear` produces them), each with a heading and a table of
 * `tr[data-tags][data-cited]` rows, plus the empty flat table the "Most
 * cited" order moves the rows into.
 */
const markup = `
  <div id="publication-list">
    <div class="pub-year-group">
      <h3 class="year-heading">2026</h3>
      <table class="table publication-table"><tbody>
        <tr id="pub-a" data-tags="AI" data-cited="5"><td>a</td></tr>
        <tr id="pub-b" data-tags="Open &amp; FAIR" data-cited="0"><td>b</td></tr>
      </tbody></table>
    </div>
    <div class="pub-year-group">
      <h3 class="year-heading">2025</h3>
      <table class="table publication-table"><tbody>
        <tr id="pub-c" data-tags="AI" data-cited="12"><td>c</td></tr>
        <tr id="pub-d" data-tags="AI|Open &amp; FAIR" data-cited="5"><td>d</td></tr>
      </tbody></table>
    </div>
    <table id="publication-list-flat" class="table publication-table" hidden><tbody></tbody></table>
  </div>`;

const list = () => document.getElementById('publication-list')!;
const flat = () => document.getElementById('publication-list-flat')!;
const groups = () => [...document.querySelectorAll<HTMLElement>('.pub-year-group')];
/** The ids of every row of `#publication-list`, in document order. */
const ids = () => [...list().querySelectorAll('tr[data-tags]')].map((r) => r.id);
const flatIds = () => [...flat().querySelectorAll('tr[data-tags]')].map((r) => r.id);

beforeEach(() => { document.body.innerHTML = markup; });

describe('orderByCitations', () => {
  it('moves every row into the flat table by count descending, ties by year descending', () => {
    orderByCitations(list());
    // 12, then the two 5s in their original (year-descending) order, then 0
    expect(flatIds()).toEqual(['pub-c', 'pub-a', 'pub-d', 'pub-b']);
    expect(ids()).toEqual(['pub-c', 'pub-a', 'pub-d', 'pub-b']);
  });

  it('hides the year groups and shows the flat table', () => {
    orderByCitations(list());
    expect(groups().every((g) => g.hidden)).toBe(true);
    expect(flat().hidden).toBe(false);
  });

  it('is idempotent', () => {
    orderByCitations(list());
    orderByCitations(list());
    expect(flatIds()).toEqual(['pub-c', 'pub-a', 'pub-d', 'pub-b']);
    expect(document.querySelectorAll('tr[data-tags]')).toHaveLength(4);
  });

  it('keeps rows the tag filter hid hidden', () => {
    document.getElementById('pub-b')!.hidden = true;
    orderByCitations(list());
    expect(document.getElementById('pub-b')!.hidden).toBe(true);
    expect(document.getElementById('pub-c')!.hidden).toBe(false);
  });

  it('does nothing when the page has no flat table', () => {
    flat().remove();
    expect(() => orderByCitations(list())).not.toThrow();
    expect(ids()).toEqual(['pub-a', 'pub-b', 'pub-c', 'pub-d']);
  });
});

describe('restoreOrder', () => {
  it('puts the rows back in their exact original places', () => {
    orderByCitations(list());
    restoreOrder(list());
    expect(ids()).toEqual(['pub-a', 'pub-b', 'pub-c', 'pub-d']);
    expect(flatIds()).toEqual([]);
    expect(document.getElementById('pub-a')!.closest('.pub-year-group')).toBe(groups()[0]);
    expect(document.getElementById('pub-c')!.closest('.pub-year-group')).toBe(groups()[1]);
  });

  it('shows the year groups again and hides the flat table', () => {
    orderByCitations(list());
    restoreOrder(list());
    expect(groups().every((g) => g.hidden)).toBe(false);
    expect(flat().hidden).toBe(true);
  });

  it('re-derives group visibility, so a filter applied in cited order is respected', () => {
    // the tag filter hid both rows of the 2026 group while the list was flat
    orderByCitations(list());
    document.getElementById('pub-a')!.hidden = true;
    document.getElementById('pub-b')!.hidden = true;
    restoreOrder(list());
    expect(groups()[0].hidden).toBe(true);
    expect(groups()[1].hidden).toBe(false);
  });

  it('is idempotent and harmless before any reordering', () => {
    restoreOrder(list());
    expect(ids()).toEqual(['pub-a', 'pub-b', 'pub-c', 'pub-d']);
    orderByCitations(list());
    restoreOrder(list());
    restoreOrder(list());
    expect(ids()).toEqual(['pub-a', 'pub-b', 'pub-c', 'pub-d']);
  });
});

describe('applyOrder', () => {
  it('dispatches to the two orders', () => {
    applyOrder(list(), 'cited');
    expect(flatIds()).toEqual(['pub-c', 'pub-a', 'pub-d', 'pub-b']);
    applyOrder(list(), 'year');
    expect(ids()).toEqual(['pub-a', 'pub-b', 'pub-c', 'pub-d']);
    expect(flat().hidden).toBe(true);
  });

  it('treats a missing data-cited as zero', () => {
    document.getElementById('pub-c')!.removeAttribute('data-cited');
    applyOrder(list(), 'cited');
    expect(flatIds()).toEqual(['pub-a', 'pub-d', 'pub-b', 'pub-c']);
  });
});
