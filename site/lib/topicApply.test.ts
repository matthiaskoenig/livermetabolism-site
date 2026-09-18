import { beforeEach, describe, expect, it } from 'vitest';
import { applyTopic, hiddenByFilter } from './topicApply';

/**
 * Mirrors the two shapes the sweep has to handle: the publications page's
 * year groups (a heading plus rows, where an emptied group hides entirely)
 * and a card grid with a section heading and an #anchor the navbar links to
 * (where the grid stays and an empty-state line appears instead).
 */
function fixture() {
  document.body.innerHTML = `
    <div id="publication-list">
      <div class="pub-year-group" data-filter-group>
        <h3 class="year-heading">2026</h3>
        <table><tbody>
          <tr id="pub-a" data-tags="ai|open-fair"></tr>
          <tr id="pub-b" data-tags="pharmacometrics"></tr>
        </tbody></table>
      </div>
      <div class="pub-year-group" data-filter-group>
        <h3 class="year-heading">2025</h3>
        <table><tbody>
          <tr id="pub-c" data-tags="ai"></tr>
        </tbody></table>
      </div>
    </div>
    <section id="software">
      <h2>Software</h2>
      <div class="project-grid">
        <div id="sw-a" data-tags="open-fair"></div>
        <p data-filter-empty hidden>Nothing in this research area yet.</p>
      </div>
    </section>`;
}

const visible = (id: string) => !document.getElementById(id)!.hidden;
const groups = () => [...document.querySelectorAll<HTMLElement>('[data-filter-group]')];

describe('applyTopic', () => {
  beforeEach(fixture);

  it('shows everything when no topic is active', () => {
    applyTopic(null);
    expect([visible('pub-a'), visible('pub-b'), visible('pub-c'), visible('sw-a')]).toEqual([true, true, true, true]);
  });

  it('hides the items that do not carry the topic', () => {
    applyTopic('ai');
    expect(visible('pub-a')).toBe(true);
    expect(visible('pub-b')).toBe(false);
    expect(visible('pub-c')).toBe(true);
  });

  it('matches any of an item’s areas, not just its first', () => {
    applyTopic('open-fair');
    expect(visible('pub-a')).toBe(true);
    expect(visible('sw-a')).toBe(true);
  });

  it('hides a group left with no visible item', () => {
    applyTopic('pharmacometrics');
    expect(groups().map((g) => g.hidden)).toEqual([false, true]);
  });

  it('shows every group again when the filter is cleared', () => {
    applyTopic('pharmacometrics');
    applyTopic(null);
    expect(groups().map((g) => g.hidden)).toEqual([false, false]);
  });

  it('reveals the empty-state line when a grid is emptied, keeping the section’s #anchor reachable', () => {
    applyTopic('ai');
    expect(document.querySelector<HTMLElement>('[data-filter-empty]')!.hidden).toBe(false);
    expect(document.getElementById('software')!.hidden).toBe(false);
  });

  it('hides the empty-state line again once the grid has something to show', () => {
    applyTopic('ai');
    applyTopic('open-fair');
    expect(document.querySelector<HTMLElement>('[data-filter-empty]')!.hidden).toBe(true);
  });

  it('does not count the empty-state line itself as content', () => {
    applyTopic('ai');
    const grid = document.querySelector('#software .project-grid')!;
    expect(grid.querySelectorAll('[data-tags]:not([hidden])')).toHaveLength(0);
  });

  it('leaves an item with no areas visible only when unfiltered', () => {
    document.body.insertAdjacentHTML('beforeend', '<div id="untagged" data-tags=""></div>');
    applyTopic(null);
    expect(visible('untagged')).toBe(true);
    applyTopic('ai');
    expect(visible('untagged')).toBe(false);
  });

  it('never touches the detail modal, whose fragments are not part of the list', () => {
    document.body.insertAdjacentHTML('beforeend',
      '<dialog id="detail-modal"><div id="modal-row" data-tags="pharmacometrics"></div></dialog>');
    applyTopic('ai');
    expect(visible('modal-row')).toBe(true);
  });

  it('is idempotent, so a re-apply after a live refresh changes nothing', () => {
    applyTopic('ai');
    const first = [visible('pub-a'), visible('pub-b'), visible('pub-c'), visible('sw-a')];
    applyTopic('ai');
    expect([visible('pub-a'), visible('pub-b'), visible('pub-c'), visible('sw-a')]).toEqual(first);
  });

  it('is a no-op on a page with nothing filterable', () => {
    document.body.innerHTML = '<p>Teaching</p>';
    expect(() => applyTopic('ai')).not.toThrow();
  });
});

describe('hiddenByFilter', () => {
  beforeEach(fixture);

  it('reports an item the active area has hidden, so a deep link can win over the filter', () => {
    applyTopic('ai');
    expect(hiddenByFilter('#pub-b')).toBe(true);
  });

  it('reports nothing for an item the active area shows', () => {
    applyTopic('ai');
    expect(hiddenByFilter('#pub-a')).toBe(false);
  });

  it('reports an item whose whole group was hidden, not just the item itself', () => {
    applyTopic('pharmacometrics');
    // #pub-c is alone in the 2025 group, so the group is what carries [hidden]
    expect(hiddenByFilter('#pub-c')).toBe(true);
  });

  it('ignores a detail hash, which names no element on the page', () => {
    applyTopic('ai');
    expect(hiddenByFilter('#publication/pub-b')).toBe(false);
  });

  it('ignores an empty or missing hash', () => {
    applyTopic('ai');
    expect(hiddenByFilter('')).toBe(false);
    expect(hiddenByFilter('#')).toBe(false);
    expect(hiddenByFilter('#nothing-here')).toBe(false);
  });
});
