/**
 * ECharts option builders for the research page's three chart islands. Pure
 * functions over the rows from `githubRows.ts` — no ECharts import here, so
 * they stay testable and the chart library is pulled in only by `useChart.ts`.
 *
 * The colours mirror the `@theme` tokens of `site/styles/global.css`
 * (--color-success, --color-info, --color-warning, --color-danger,
 * --color-primary, --color-secondary and the tag colours); a canvas cannot
 * read CSS custom properties, so they are repeated here as literals — keep
 * the two in sync.
 *
 * Every tooltip uses `renderMode: 'richText'`, which draws inside the canvas
 * instead of injecting an HTML element with inline styles: the site's CSP has
 * no 'unsafe-inline' in style-src (see CLAUDE.md), and richText tooltips also
 * cannot turn snapshot text into markup.
 */
import type { ActivityRows, StarRow, TimelineRow } from './githubRows';

export const PALETTE = ['#18bc9c', '#3498db', '#f39c12', '#e74c3c', '#2c3e50', '#8e44ad', '#16a085', '#d35400', '#2980b9', '#7f8c8d', '#c0392b'];
const MUTED = '#95a5a6';
const INK = '#212529';
const GRID = '#ecf0f1';
const FONT = 'Lato, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

/** Palette entry `i`, wrapping around — also for the -1 of an unlisted language. */
const color = (i: number) => PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length]!;

/** Dark tooltip drawn inside the canvas (no HTML, no inline styles). */
const tooltip = <T>(formatter: (p: T) => string, trigger: 'item' | 'axis' = 'item') => ({
  trigger,
  renderMode: 'richText' as const,
  backgroundColor: '#2c3e50',
  borderWidth: 0,
  textStyle: { color: '#ffffff', fontFamily: FONT, fontSize: 12 },
  formatter,
});

const axisLabel = (c = MUTED) => ({ color: c, fontFamily: FONT, fontSize: 11 });

/** Scatter of every release date, one lane per repository. */
export function releaseTimelineOption(rows: TimelineRow[]) {
  const names = rows.map((r) => r.name);
  return {
    animation: false,
    tooltip: tooltip((p: { value: [string, number, string, string] }) => `${names[p.value[1]]} ${p.value[2]}\n${p.value[0].slice(0, 10)}`),
    grid: { left: 8, right: 20, top: 8, bottom: 52, containLabel: true },
    xAxis: { type: 'time', axisLabel: axisLabel(), splitLine: { lineStyle: { color: GRID } } },
    yAxis: { type: 'category', data: names, inverse: true, axisLabel: axisLabel(INK), axisTick: { show: false } },
    dataZoom: [
      { type: 'slider', xAxisIndex: 0, height: 18, bottom: 10, borderColor: GRID, fillerColor: 'rgba(24,188,156,0.2)', textStyle: { color: MUTED, fontFamily: FONT } },
      { type: 'inside', xAxisIndex: 0 },
    ],
    series: [
      {
        type: 'scatter',
        symbolSize: 10,
        data: rows.flatMap((r, i) => r.points.map((p) => ({ value: [p.date, i, p.tag, p.url], itemStyle: { color: color(i) } }))),
        emphasis: { scale: 1.6 },
      },
    ],
  };
}

export const releaseTimelineHeight = (rows: number) => Math.max(220, rows * 26 + 90);

/** The languages of the stars chart, in legend order. */
export const starsLanguages = (rows: StarRow[]) => [...new Set(rows.map((r) => r.language ?? 'other'))];
export const languageColor = (languages: string[], language: string | null) => color(languages.indexOf(language ?? 'other'));

/** Horizontal bars of stars per repository, coloured by primary language. */
export function starsOption(rows: StarRow[]) {
  const languages = starsLanguages(rows);
  return {
    animation: false,
    tooltip: tooltip((p: { name: string; value: number; dataIndex: number }) => `${p.name}\n★ ${p.value} · ${rows[p.dataIndex]?.language ?? '—'}`),
    grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value', axisLabel: axisLabel(), splitLine: { lineStyle: { color: GRID } } },
    yAxis: { type: 'category', data: rows.map((r) => r.name), inverse: true, axisLabel: axisLabel(INK), axisTick: { show: false } },
    series: [
      {
        type: 'bar',
        data: rows.map((r) => ({ value: r.stars, itemStyle: { color: languageColor(languages, r.language) } })),
        barCategoryGap: '30%',
        label: { show: true, position: 'right', color: MUTED, fontFamily: FONT, fontSize: 11 },
      },
    ],
  };
}

export const starsHeight = (rows: number) => Math.max(180, rows * 26 + 40);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekLabel = (week: string) => {
  const d = new Date(week);
  return Number.isNaN(d.getTime()) ? week : `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
};

/** Weekly commits of the last year, stacked per repository. */
export function commitActivityOption({ weeks, series }: ActivityRows) {
  return {
    animation: false,
    tooltip: tooltip((ps: { name: string; seriesName: string; value: number }[]) => {
      const rows = ps.filter((p) => p.value > 0).map((p) => `${p.seriesName}: ${p.value}`);
      const total = ps.reduce((s, p) => s + p.value, 0);
      return [`Week of ${ps[0]?.name ?? ''}`, ...rows, `total: ${total}`].join('\n');
    }, 'axis'),
    legend: { type: 'scroll', bottom: 0, itemHeight: 8, itemWidth: 12, textStyle: axisLabel() },
    grid: { left: 8, right: 16, top: 8, bottom: 34, containLabel: true },
    xAxis: {
      type: 'category',
      data: weeks,
      // one label per month rather than one per week
      axisLabel: { ...axisLabel(), hideOverlap: true, interval: 0, formatter: (week: string, i: number) => (i > 0 && weeks[i - 1]?.slice(0, 7) === week.slice(0, 7) ? '' : weekLabel(week)) },
      axisTick: { show: false },
    },
    yAxis: { type: 'value', axisLabel: axisLabel(), splitLine: { lineStyle: { color: GRID } } },
    series: series.map((s, i) => ({ name: s.name, type: 'bar', stack: 'commits', data: s.values, itemStyle: { color: color(i) } })),
  };
}

export const ACTIVITY_HEIGHT = 340;
