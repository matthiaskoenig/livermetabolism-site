import { describe, expect, it } from 'vitest';
import { commitActivityOption, languageColor, PALETTE, releaseTimelineOption, starsLanguages, starsOption } from './chartOptions';

describe('releaseTimelineOption', () => {
  const rows = [
    { repo: 'a/one', name: 'one', points: [{ date: '2026-01-01T00:00:00Z', tag: '1.0', url: 'https://github.com/a/one/releases/tag/1.0' }] },
    { repo: 'b/two', name: 'two', points: [{ date: '2025-01-01T00:00:00Z', tag: '2.0', url: 'https://github.com/b/two/releases/tag/2.0' }] },
  ];

  it('puts one point per release on its repository lane, carrying the URL for the click handler', () => {
    const option = releaseTimelineOption(rows);
    expect(option.yAxis.data).toEqual(['one', 'two']);
    expect(option.series[0]!.data.map((d) => d.value)).toEqual([
      ['2026-01-01T00:00:00Z', 0, '1.0', 'https://github.com/a/one/releases/tag/1.0'],
      ['2025-01-01T00:00:00Z', 1, '2.0', 'https://github.com/b/two/releases/tag/2.0'],
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
