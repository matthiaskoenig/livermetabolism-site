import { describe, expect, it } from 'vitest';
import { publicationsPerYear, STATUS_ORDER, type ChartPublication, type ChartTag } from './publicationRows';

const tags: ChartTag[] = [
  { tag: 'Digital Twins', slug: 'digital-twins' },
  { tag: 'AI', slug: 'ai' },
  { tag: 'Open & FAIR', slug: 'open-fair' },
];

const pub = (year: number, status: ChartPublication['status'], ...t: string[]): ChartPublication => ({ year, status, tags: t });

describe('publicationsPerYear', () => {
  const pubs: ChartPublication[] = [
    pub(2024, 'publication', 'AI', 'Open & FAIR'),
    pub(2022, 'preprint', 'AI'),
    pub(2024, 'review', 'Open & FAIR'),
    pub(2020, 'thesis'),
  ];

  it('lists the years ascending and contiguous from the first to the last', () => {
    expect(publicationsPerYear(pubs, tags).years).toEqual([2020, 2021, 2022, 2023, 2024]);
    // a gap year keeps its slot (all series carry a 0 there)
    expect(publicationsPerYear(pubs, tags).byTag.map((s) => s.counts.length)).toEqual([5, 5]);
  });

  it('has no years and no series for no publications', () => {
    expect(publicationsPerYear([], tags)).toEqual({ years: [], byTag: [], byStatus: [] });
  });

  it('counts a paper with several research areas once per area', () => {
    const { byTag } = publicationsPerYear(pubs, tags);
    // tags.yml order, and a tag no paper carries (Digital Twins) is dropped
    expect(byTag.map((s) => [s.tag, s.slug])).toEqual([['AI', 'ai'], ['Open & FAIR', 'open-fair']]);
    //                             2020 2021 2022 2023 2024
    expect(byTag[0]!.counts).toEqual([0, 0, 1, 0, 1]);
    expect(byTag[1]!.counts).toEqual([0, 0, 0, 0, 2]);
    // 4 (paper, area) pairs out of 3 tagged papers — the tag totals are not
    // the paper count, which is what the chart caption warns about (the
    // untagged thesis is in no tag series at all)
    const pairs = byTag.reduce((s, r) => s + r.counts.reduce((a, b) => a + b, 0), 0);
    expect(pairs).toBe(4);
  });

  it('counts every paper exactly once in the status split, in STATUS_ORDER', () => {
    const { byStatus } = publicationsPerYear(pubs, tags);
    expect(byStatus.map((s) => s.status)).toEqual(['publication', 'review', 'preprint', 'thesis']);
    expect(byStatus.find((s) => s.status === 'publication')!.counts).toEqual([0, 0, 0, 0, 1]);
    expect(byStatus.find((s) => s.status === 'preprint')!.counts).toEqual([0, 0, 1, 0, 0]);
    const total = byStatus.reduce((s, r) => s + r.counts.reduce((a, b) => a + b, 0), 0);
    expect(total).toBe(pubs.length);
  });

  it('orders the statuses by importance, every publication status covered', () => {
    expect(STATUS_ORDER).toEqual(['publication', 'review', 'proceeding', 'chapter', 'preprint', 'abstract', 'thesis', 'report']);
    const all = STATUS_ORDER.map((s, i) => pub(2020 + i, s));
    expect(publicationsPerYear(all, tags).byStatus.map((s) => s.status)).toEqual([...STATUS_ORDER]);
  });

  it('ignores a tag that is not defined in tags.yml', () => {
    const { byTag } = publicationsPerYear([pub(2020, 'publication', 'Ghost')], tags);
    expect(byTag).toEqual([]);
  });
});
