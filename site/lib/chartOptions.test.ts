import { describe, expect, it } from 'vitest';
import { uiFor } from './i18n/catalog';
import { citationHistoryOption, citationsPerYearOption, commitActivityOption, languageColor, PALETTE, publicationsOption, releaseTimelineOption, starsLanguages, starsOption, TAG_PALETTE } from './chartOptions';

const { t } = uiFor('en');
const activityStrings = { weekOf: t('chart.weekOf'), total: t('chart.total'), others: t('chart.others') };
const citationStrings = { one: t('chart.citationOne'), other: t('chart.citationOther') };
const publicationsStrings = {
  total: t('chart.total'),
  status: {
    publication: t('status.publication'), review: t('status.review'), proceeding: t('status.proceeding'),
    chapter: t('status.chapter'), preprint: t('status.preprint'), abstract: t('status.abstract'),
    thesis: t('status.thesis'), report: t('status.report'),
  },
};

describe('releaseTimelineOption', () => {
  const rows = [
    { repo: 'a/one', name: 'one', htmlUrl: 'https://github.com/a/one', points: [{ date: '2026-01-01T00:00:00Z', tag: '1.0' }] },
    { repo: 'b/two', name: 'two', htmlUrl: 'https://github.com/b/two', points: [{ date: '2025-01-01T00:00:00Z', tag: '2.0' }] },
  ];

  it('puts one point per release on its repository lane, as [date, lane, tag]', () => {
    const option = releaseTimelineOption(rows);
    expect(option.yAxis.data).toEqual(['one', 'two']);
    // no per-point URL: the click handler builds it from the lane (releaseUrl)
    expect(option.series[0]!.data.map((d) => d.value)).toEqual([
      ['2026-01-01T00:00:00Z', 0, '1.0'],
      ['2025-01-01T00:00:00Z', 1, '2.0'],
    ]);
  });

  it('renders tooltips inside the canvas, never as styled HTML (CSP)', () => {
    expect(releaseTimelineOption(rows).tooltip.renderMode).toBe('richText');
    expect(starsOption([]).tooltip.renderMode).toBe('richText');
    expect(commitActivityOption({ weeks: [], series: [] }, activityStrings).tooltip.renderMode).toBe('richText');
  });
});

describe('starsOption', () => {
  const rows = [
    { repo: 'a/one', name: 'one', stars: 5, language: 'Python', url: 'https://github.com/a/one' },
    { repo: 'b/two', name: 'two', stars: 3, language: 'C++', url: 'https://github.com/b/two' },
    { repo: 'c/three', name: 'three', stars: 1, language: 'Python', url: 'https://github.com/c/three' },
  ];

  it('colours a bar by its language, one palette entry per language', () => {
    const colors = starsOption(rows).series[0]!.data.map((d) => d.itemStyle.color);
    expect(colors).toEqual([PALETTE[0], PALETTE[1], PALETTE[0]]);
    // the legend swatches (.chart-swatch-<i> in global.css) follow the same order
    expect(starsLanguages(rows)).toEqual(['Python', 'C++']);
    // a language that is not in the list (never happens for real rows) still gets a colour
    expect(languageColor(starsLanguages(rows), null)).toBe(PALETTE[PALETTE.length - 1]);
  });
});

describe('commitActivityOption', () => {
  const data = {
    weeks: ['2026-01-04', '2026-01-11', '2026-02-01'],
    series: [
      { repo: 'a/one', name: 'one', values: [1, 2, 3] },
      { repo: 'b/two', name: 'two', values: [0, 1, 0] },
    ],
  };

  it('stacks one bar series per repository', () => {
    const option = commitActivityOption(data, activityStrings);
    expect(option.series.map((s) => [s.name, s.type, s.stack])).toEqual([
      ['one', 'bar', 'commits'],
      ['two', 'bar', 'commits'],
    ]);
  });

  it('labels only the first week of each month', () => {
    const { formatter } = commitActivityOption(data, activityStrings).xAxis.axisLabel;
    expect(data.weeks.map((w, i) => formatter(w, i))).toEqual(['Jan 26', '', 'Feb 26']);
  });

  // `n` repositories, most active first (the order activityRows() returns)
  const many = (n: number) => ({
    weeks: ['2026-01-04', '2026-01-11'],
    series: Array.from({ length: n }, (_, i) => ({ repo: `o/r${i}`, name: `r${i}`, values: [n - i, i % 2] })),
  });

  it('gives each of up to ten repositories a colour of its own', () => {
    const option = commitActivityOption(many(10), activityStrings);
    expect(option.series.map((s) => s.name)).toEqual(many(10).series.map((s) => s.name));
    expect(new Set(option.series.map((s) => s.itemStyle.color)).size).toBe(10);
  });

  it('stacks the repositories after the nine most active as one grey series, so no colour repeats', () => {
    const option = commitActivityOption(many(12), activityStrings);
    expect(option.series.map((s) => s.name)).toEqual(['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', '3 others']);
    expect(new Set(option.series.map((s) => s.itemStyle.color)).size).toBe(10);
    expect(option.series.at(-1)!.itemStyle.color).toBe(PALETTE[9]);
    // r9 [3, 1] + r10 [2, 0] + r11 [1, 1]
    expect(option.series.at(-1)!.data).toEqual([6, 2]);
  });

  it('names the stacked repositories with their commits in the tooltip', () => {
    const option = commitActivityOption(many(12), activityStrings);
    const params = option.series.map((s, seriesIndex) => ({ name: 'Jan 11', seriesName: s.name, seriesIndex, dataIndex: 1, value: s.data[1]! }));
    expect(option.tooltip.formatter(params).split('\n')).toEqual([
      'Week of Jan 11', 'r1: 1', 'r3: 1', 'r5: 1', 'r7: 1', '3 others: 2 (r9 1, r11 1)', 'total: 6',
    ]);
  });
});

describe('citationsPerYearOption', () => {
  // rows arrive ascending from perYearRows; the builder must not depend on it
  const rows = [{ year: 2012, count: 46 }, { year: 2011, count: 25 }, { year: 2013, count: 93 }];

  it('puts the years ascending on the x axis with their counts as bars', () => {
    const option = citationsPerYearOption(rows, citationStrings);
    expect(option.xAxis.data).toEqual(['2011', '2012', '2013']);
    expect(option.series[0]!.type).toBe('bar');
    expect(option.series[0]!.data).toEqual([25, 46, 93]);
    expect(option.series[0]!.itemStyle.color).toBe(PALETTE[0]);
  });

  it('renders its tooltip inside the canvas (CSP)', () => {
    expect(citationsPerYearOption(rows, citationStrings).tooltip.renderMode).toBe('richText');
    expect(citationsPerYearOption(rows, citationStrings).tooltip.formatter({ name: '2011', value: 25 })).toBe('2011\n25 citations');
  });

  it('survives an empty histogram', () => {
    expect(citationsPerYearOption([], citationStrings).series[0]!.data).toEqual([]);
  });
});

describe('citationHistoryOption', () => {
  const day = (date: string, citations: number) => ({ date, citations, source: 'day' as const });
  const year = (date: string, citations: number) => ({ date, citations, source: 'year' as const });

  it('draws the points on a time axis, ascending, year ends hollow and days filled', () => {
    const option = citationHistoryOption([day('2026-09-13', 3830), year('2025-12-31', 3445), day('2026-09-12', 3827)], citationStrings);
    expect(option.xAxis.type).toBe('time');
    expect(option.series[0]!.type).toBe('line');
    expect(option.series[0]!.data.map((d) => d.value)).toEqual([['2025-12-31', 3445], ['2026-09-12', 3827], ['2026-09-13', 3830]]);
    expect(option.series[0]!.data.map((d) => d.symbol)).toEqual(['emptyCircle', 'circle', 'circle']);
    expect(option.series[0]!.lineStyle.color).toBe(PALETTE[1]);
  });

  it('shows the symbol, so a one-point history is visible at all', () => {
    const option = citationHistoryOption([day('2026-09-12', 3827)], citationStrings);
    expect(option.series[0]!.data).toHaveLength(1);
    expect(option.series[0]!.showSymbol).toBe(true);
    // a total that grows slowly must not look flat against a 0 baseline
    expect(option.yAxis.scale).toBe(true);
  });

  it('renders its tooltip inside the canvas (CSP)', () => {
    const { tooltip } = citationHistoryOption([day('2026-09-12', 3827)], citationStrings);
    expect(tooltip.renderMode).toBe('richText');
    expect(tooltip.trigger).toBe('axis');
    expect(tooltip.formatter([{ name: '2026-09-12', value: ['2026-09-12', 3827] }])).toBe('2026-09-12\n3827 citations');
  });
});

describe('publicationsOption', () => {
  const rows = {
    years: [2020, 2021, 2022],
    byTag: [
      { tag: 'AI', slug: 'ai', counts: [0, 1, 2] },
      { tag: 'Open & FAIR', slug: 'open-fair', counts: [1, 0, 3] },
      { tag: 'New Area', slug: 'new-area', counts: [0, 0, 1] },
    ],
    byStatus: [
      { status: 'publication' as const, counts: [1, 1, 4] },
      { status: 'preprint' as const, counts: [0, 0, 2] },
    ],
  };

  it('stacks one bar series per research area in the tag colours', () => {
    const option = publicationsOption(rows, 'tag', publicationsStrings);
    expect(option.xAxis.data).toEqual(['2020', '2021', '2022']);
    expect(option.series.map((s) => [s.name, s.type, s.stack])).toEqual([
      ['AI', 'bar', 'publications'],
      ['Open & FAIR', 'bar', 'publications'],
      ['New Area', 'bar', 'publications'],
    ]);
    // the tag colours mirror the --color-tag-* tokens of global.css; a tag
    // that has no token yet falls back to the generic palette
    expect(option.series.map((s) => s.itemStyle.color)).toEqual([TAG_PALETTE.ai, TAG_PALETTE['open-fair'], PALETTE[2]]);
    // the series name is what the click handler looks up as [data-tag="…"]
    expect(option.series[1]!.name).toBe(rows.byTag[1]!.tag);
  });

  it('swaps to one series per status, coloured by the status order', () => {
    const option = publicationsOption(rows, 'status', publicationsStrings);
    expect(option.series.map((s) => s.name)).toEqual(['Publication', 'Preprint']);
    expect(option.series.map((s) => s.data)).toEqual([[1, 1, 4], [0, 0, 2]]);
    // PALETTE index = index in STATUS_ORDER, so a missing status does not
    // shift the colours of the others
    expect(option.series.map((s) => s.itemStyle.color)).toEqual([PALETTE[0], PALETTE[4]]);
  });

  it('lets a click reach the year labels and keeps whole-number ticks', () => {
    const option = publicationsOption(rows, 'tag', publicationsStrings);
    expect(option.xAxis.triggerEvent).toBe(true);
    expect(option.yAxis.minInterval).toBe(1);
  });

  it('renders its tooltip inside the canvas, with the stack total (CSP)', () => {
    const { tooltip } = publicationsOption(rows, 'tag', publicationsStrings);
    expect(tooltip.renderMode).toBe('richText');
    expect(tooltip.trigger).toBe('axis');
    expect(tooltip.formatter([
      { name: '2022', seriesName: 'AI', value: 2 },
      { name: '2022', seriesName: 'Open & FAIR', value: 3 },
      { name: '2022', seriesName: 'New Area', value: 0 },
    ])).toBe('2022\nAI: 2\nOpen & FAIR: 3\ntotal: 5');
  });

  it('survives a page without publications', () => {
    const empty = publicationsOption({ years: [], byTag: [], byStatus: [] }, 'tag', publicationsStrings);
    expect(empty.xAxis.data).toEqual([]);
    expect(empty.series).toEqual([]);
  });
});
