import { describe, expect, it } from 'vitest';
import { alumniByYear, groupByYear, tagCounts, toTagFilterEntries, toTagInfo } from './views';

describe('groupByYear', () => {
  it('groups consecutive runs in file order like the Liquid template', () => {
    const groups = groupByYear([{ year: 2026, id: 'a' }, { year: 2026, id: 'b' }, { year: 2025, id: 'c' }]);
    expect(groups.map((g) => [g.year, g.items.map((i) => i.id)])).toEqual([[2026, ['a', 'b']], [2025, ['c']]]);
  });
});

describe('alumniByYear', () => {
  it('takes alumni with an image, newest end_year first', () => {
    const p = (id: string, status: 'current' | 'alumni', end_year: number | null, image: string | null) =>
      ({ id, status, end_year, image, tenure: '', name: id, role: [], country: null, orcid: null, repository: null, homepage: null, affiliation: null, description: null });
    const groups = alumniByYear([p('a', 'alumni', 2020, 'a.webp'), p('b', 'alumni', 2024, 'b.webp'), p('c', 'alumni', 2024, null), p('d', 'current', null, 'd.webp')]);
    expect(groups.map((g) => [g.year, g.people.map((x) => x.id)])).toEqual([[2024, ['b']], [2020, ['a']]]);
  });
});

describe('toTagInfo', () => {
  it('sorts by file order and shapes exactly TagInfo — no order, no id', () => {
    const t = (order: number, tag: string) =>
      ({ id: tag, order, tag, icon: 'icon-' + tag, short_description: 'short', description: 'long', vision: 'vision' });
    const rows = [t(2, 'Open & FAIR'), t(0, 'Digital Twins'), t(1, 'AI')];
    const info = toTagInfo(rows as never);
    expect(info.map((i) => i.tag)).toEqual(['Digital Twins', 'AI', 'Open & FAIR']);
    for (const i of info) expect(Object.keys(i)).toEqual(['tag', 'slug', 'icon', 'label', 'short_description', 'description', 'vision']);
    // no labelFor given: label defaults to the slug, never the (never
    // translated) tag value itself.
    expect(info[0]).toEqual({ tag: 'Digital Twins', slug: 'digital-twins', icon: 'icon-Digital Twins', label: 'digital-twins', short_description: 'short', description: 'long', vision: 'vision' });
  });

  it('resolves label through the given labelFor, keyed by slug', () => {
    const t = (order: number, tag: string) =>
      ({ id: tag, order, tag, icon: 'icon-' + tag, short_description: 'short', description: 'long', vision: 'vision' });
    const info = toTagInfo([t(0, 'Digital Twins')] as never, (slug) => `translated:${slug}`);
    expect(info[0]?.tag).toBe('Digital Twins');
    expect(info[0]?.label).toBe('translated:digital-twins');
  });
});

describe('toTagFilterEntries', () => {
  it('narrows TagInfo down to the fields the tag-filter bar renders — no description, no vision', () => {
    const info = toTagInfo([
      { id: 'AI', order: 0, tag: 'AI', icon: 'fa-robot', short_description: 'short', description: 'long', vision: 'vision' },
    ] as never);
    const entries = toTagFilterEntries(info);
    expect(entries).toEqual([{ tag: 'AI', slug: 'ai', icon: 'fa-robot', short_description: 'short', label: 'ai' }]);
    expect(Object.keys(entries[0])).toEqual(['tag', 'slug', 'icon', 'short_description', 'label']);
  });
});

describe('tagCounts', () => {
  it('counts publications, current projects, software carrying the tag', () => {
    const c = tagCounts(
      'AI',
      [{ tags: ['AI'] }, { tags: [] }] as never,
      [{ tags: ['AI'], status: 'current' }, { tags: ['AI'], status: 'old' }] as never,
      [{ tags: ['AI'] }] as never,
    );
    expect(c).toEqual({ publications: 1, projects: 1, software: 1 });
  });
});
