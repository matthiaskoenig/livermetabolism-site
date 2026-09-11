import { describe, expect, it } from 'vitest';
import { alumniByYear, crossRefs, groupByYear, tagCounts, toTagInfo } from './views';

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

describe('crossRefs', () => {
  it('collects a person’s publications (newest year first), projects and software', () => {
    const refs = crossRefs(
      'x',
      [{ id: 'p1', year: 2020, people: ['x'] }, { id: 'p2', year: 2024, people: ['x', 'y'] }, { id: 'p3', year: 2022, people: ['y'] }] as never,
      [{ id: 'pr', people: ['x'] }] as never,
      [{ id: 'sw', people: ['y'] }] as never,
    );
    expect(refs.publications.map((p) => p.id)).toEqual(['p2', 'p1']);
    expect(refs.projects.map((p) => p.id)).toEqual(['pr']);
    expect(refs.software).toEqual([]);
  });
});

describe('toTagInfo', () => {
  it('sorts by file order and shapes exactly TagInfo — no order, no id', () => {
    const t = (order: number, tag: string) =>
      ({ id: tag, order, tag, icon: 'icon-' + tag, short_description: 'short', description: 'long', vision: 'vision' });
    const rows = [t(2, 'Open & FAIR'), t(0, 'Digital Twins'), t(1, 'AI')];
    const info = toTagInfo(rows as never);
    expect(info.map((i) => i.tag)).toEqual(['Digital Twins', 'AI', 'Open & FAIR']);
    for (const i of info) expect(Object.keys(i)).toEqual(['tag', 'slug', 'icon', 'short_description', 'description', 'vision']);
    expect(info[0]).toEqual({ tag: 'Digital Twins', slug: 'digital-twins', icon: 'icon-Digital Twins', short_description: 'short', description: 'long', vision: 'vision' });
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
