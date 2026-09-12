import { describe, expect, it } from 'vitest';
import { citationHistoryOption, citationsPerYearOption, commitActivityOption, languageColor, PALETTE, releaseTimelineOption, starsLanguages, starsOption } from './chartOptions';

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
    expect(commitActivityOption({ weeks: [], series: [] }).tooltip.renderMode).toBe('richText');
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
    const option = commitActivityOption(data);
    expect(option.series.map((s) => [s.name, s.type, s.stack])).toEqual([
      ['one', 'bar', 'commits'],
      ['two', 'bar', 'commits'],
    ]);
  });

  it('labels only the first week of each month', () => {
    const { formatter } = commitActivityOption(data).xAxis.axisLabel;
    expect(data.weeks.map((w, i) => formatter(w, i))).toEqual(['Jan 26', '', 'Feb 26']);
  });
});

describe('citationsPerYearOption', () => {
  // rows arrive ascending from perYearRows; the builder must not depend on it
  const rows = [{ year: 2012, count: 46 }, { year: 2011, count: 25 }, { year: 2013, count: 93 }];

  it('puts the years ascending on the x axis with their counts as bars', () => {
    const option = citationsPerYearOption(rows);
    expect(option.xAxis.data).toEqual(['2011', '2012', '2013']);
    expect(option.series[0]!.type).toBe('bar');
    expect(option.series[0]!.data).toEqual([25, 46, 93]);
    expect(option.series[0]!.itemStyle.color).toBe(PALETTE[0]);
  });

  it('renders its tooltip inside the canvas (CSP)', () => {
    expect(citationsPerYearOption(rows).tooltip.renderMode).toBe('richText');
    expect(citationsPerYearOption(rows).tooltip.formatter({ name: '2011', value: 25 })).toBe('2011\n25 citations');
  });

  it('survives an empty histogram', () => {
    expect(citationsPerYearOption([]).series[0]!.data).toEqual([]);
  });
});

describe('citationHistoryOption', () => {
  const point = (date: string, citations: number) => ({ date, citations, hIndex: 26, i10Index: 36 });

  it('draws one line point per day, ascending', () => {
    const option = citationHistoryOption([point('2026-09-13', 3830), point('2026-09-12', 3827)]);
    expect(option.xAxis.data).toEqual(['2026-09-12', '2026-09-13']);
    expect(option.series[0]!.type).toBe('line');
    expect(option.series[0]!.data).toEqual([3827, 3830]);
    expect(option.series[0]!.lineStyle.color).toBe(PALETTE[1]);
  });

  it('shows the symbol, so a one-point history is visible at all', () => {
    const option = citationHistoryOption([point('2026-09-12', 3827)]);
    expect(option.series[0]!.data).toEqual([3827]);
    expect(option.series[0]!.showSymbol).toBe(true);
    expect(option.series[0]!.symbol).toBe('circle');
    // a total that grows slowly must not look flat against a 0 baseline
    expect(option.yAxis.scale).toBe(true);
  });

  it('renders its tooltip inside the canvas (CSP)', () => {
    const { tooltip } = citationHistoryOption([point('2026-09-12', 3827)]);
    expect(tooltip.renderMode).toBe('richText');
    expect(tooltip.trigger).toBe('axis');
    expect(tooltip.formatter([{ name: '2026-09-12', value: 3827 }])).toBe('2026-09-12\n3827 citations');
  });
});
