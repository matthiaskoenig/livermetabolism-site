/**
 * ECharts option builders for the research page's three chart islands and the
 * publications page's three charts (two Scholar ones plus publications over
 * time). Pure functions over the rows from `githubRows.ts` /
 * `scholarRows.ts` / `publicationRows.ts` — no ECharts import here, so they
 * stay testable and the chart library is pulled in only by `useChart.ts`.
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
import { monthsFor } from './i18n/dates';
import { fmt } from './i18n/format';
import { DEFAULT_LOCALE, type Locale } from './i18n/locales';
import { TAG_PALETTE } from './tagGraphics';
import { STATUS_ORDER, type PublicationYearRows } from './publicationRows';
import type { HistoryRow, PerYearRow } from './scholarRows';

export const PALETTE = ['#18bc9c', '#3498db', '#f39c12', '#e74c3c', '#2c3e50', '#8e44ad', '#16a085', '#d35400', '#2980b9', '#7f8c8d', '#c0392b'];

/**
 * The research-area colours by tag slug (`slugify(tag)`, as on
 * `TagInfo.slug`), used by the publications chart and the network graph. They
 * live in `tagGraphics.ts` beside the per-area artwork, because the thumbnail
 * generator (`scripts/lib/graph-thumbs.ts`) rings the topic nodes in them and
 * cannot import this module through Node's type stripping; re-exported here,
 * where every chart reads them.
 */
export { TAG_PALETTE };

/** Muted grey of the axis labels and the legend text. */
export const MUTED = '#95a5a6';
/** Body ink of the theme, used wherever a chart draws real text. */
export const INK = '#212529';
const GRID = '#ecf0f1';
/** The site's body font stack, repeated for the canvas (see above). */
export const FONT = 'Lato, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

/** Palette entry `i`, wrapping around — also for the -1 of an unlisted language. */
const color = (i: number) => PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length]!;

/**
 * Dark tooltip drawn inside the canvas (no HTML, no inline styles). Exported
 * for `networkOptions.ts`, which builds a chart of its own on the same rules.
 */
export const tooltip = <T>(formatter: (p: T) => string, trigger: 'item' | 'axis' = 'item') => ({
  trigger,
  renderMode: 'richText' as const,
  backgroundColor: '#2c3e50',
  borderWidth: 0,
  textStyle: { color: '#ffffff', fontFamily: FONT, fontSize: 12 },
  formatter,
});

const axisLabel = (c = MUTED) => ({ color: c, fontFamily: FONT, fontSize: 11 });

/**
 * A numeric yAxis's axisLabel, with a locale-appropriate thousands
 * separator. ECharts has no locale awareness of its own: a bare
 * `axisLabel()` on a numeric axis renders whatever `String(value)` gives,
 * which for a value like 4000 is "4000" (no separator at all, not even
 * English's) - fine as-is, but once an axis crosses into the thousands on
 * a German page, a hand-rolled separator is needed or the reader has
 * nothing to parse the magnitude by. `Intl.NumberFormat` handles both
 * locales' grouping (and decimal, should a non-integer ever reach one of
 * these axes) correctly with no separate en/de branch.
 */
const numberAxisLabel = (locale: Locale, c = MUTED) => ({
  ...axisLabel(c),
  formatter: (value: number) => new Intl.NumberFormat(locale).format(value),
});

/** Scatter of every release date, one lane per repository. */
export function releaseTimelineOption(rows: TimelineRow[]) {
  const names = rows.map((r) => r.name);
  return {
    animation: false,
    tooltip: tooltip((p: { value: [string, number, string] }) => `${names[p.value[1]]} ${p.value[2]}\n${p.value[0].slice(0, 10)}`),
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
        // [date, lane, tag] — the release URL is derived from the lane (releaseUrl)
        data: rows.flatMap((r, i) => r.points.map((p) => ({ value: [p.date, i, p.tag], itemStyle: { color: color(i) } }))),
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

const weekLabel = (week: string) => {
  const d = new Date(week);
  return Number.isNaN(d.getTime()) ? week : `${monthsFor('en')[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
};

/**
 * Most stacked series of the commit chart. Ten distinct palette entries are
 * enough for ten repositories; with more, the nine most active keep theirs and
 * the rest share one "N others" series in the grey of `PALETTE[9]`, so a colour
 * never stands for two repositories.
 */
const ACTIVITY_SERIES = 10;

/** The commit-activity chart's tooltip templates ({date}/{count} placeholders) - a narrow, serialisable bundle (see `slices.ts`), the island's props must serialise into `astro-island`. */
export interface CommitActivityStrings {
  weekOf: string;
  total: string;
  others: string;
}

/**
 * Weekly commits of the last year, stacked per repository. `series` arrive
 * most active first (`activityRows()`), which decides who is folded.
 */
export function commitActivityOption({ weeks, series }: ActivityRows, strings: CommitActivityStrings, locale: Locale = DEFAULT_LOCALE) {
  const folded = series.length > ACTIVITY_SERIES ? series.slice(ACTIVITY_SERIES - 1) : [];
  const drawn = folded.length
    ? [
        ...series.slice(0, ACTIVITY_SERIES - 1),
        { name: fmt(strings.others, { count: folded.length }), values: weeks.map((_, i) => folded.reduce((s, f) => s + f.values[i]!, 0)) },
      ]
    : series;
  const foldedIn = (week: number) =>
    folded.flatMap((f) => (f.values[week]! > 0 ? [`${f.name} ${f.values[week]}`] : [])).join(', ');
  return {
    animation: false,
    tooltip: tooltip((ps: { name: string; seriesName: string; seriesIndex: number; dataIndex: number; value: number }[]) => {
      const rows = ps
        .filter((p) => p.value > 0)
        .map((p) => (folded.length && p.seriesIndex === drawn.length - 1 ? `${p.seriesName}: ${p.value} (${foldedIn(p.dataIndex)})` : `${p.seriesName}: ${p.value}`));
      const total = ps.reduce((s, p) => s + p.value, 0);
      return [fmt(strings.weekOf, { date: ps[0]?.name ?? '' }), ...rows, fmt(strings.total, { count: total })].join('\n');
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
    yAxis: { type: 'value', axisLabel: numberAxisLabel(locale), splitLine: { lineStyle: { color: GRID } } },
    series: drawn.map((s, i) => ({ name: s.name, type: 'bar', stack: 'commits', data: s.values, itemStyle: { color: color(i) } })),
  };
}

export const ACTIVITY_HEIGHT = 340;

/* ------------------------------------------------------------------
   Google Scholar charts of the publications page (rows from
   `scholarRows.ts`); same rules as above — pure, no ECharts import,
   richText tooltips.
   ------------------------------------------------------------------ */

/** "{count} citation(s)", one/other - shared by both citation tooltips below. */
export interface CitationCountStrings {
  one: string;
  other: string;
}

const citationCount = (n: number, strings: CitationCountStrings) => fmt(n === 1 ? strings.one : strings.other, { count: n });

/** Scholar's citations-per-year histogram as bars, years ascending. */
export function citationsPerYearOption(rows: PerYearRow[], citation: CitationCountStrings, locale: Locale = DEFAULT_LOCALE) {
  const years = [...rows].sort((a, b) => a.year - b.year);
  return {
    animation: false,
    tooltip: tooltip((p: { name: string; value: number }) => `${p.name}\n${citationCount(p.value, citation)}`),
    grid: { left: 8, right: 14, top: 14, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: years.map((r) => String(r.year)),
      axisLabel: { ...axisLabel(), hideOverlap: true },
      axisTick: { show: false },
    },
    yAxis: { type: 'value', axisLabel: numberAxisLabel(locale), splitLine: { lineStyle: { color: GRID } } },
    series: [
      {
        type: 'bar',
        data: years.map((r) => r.count),
        barCategoryGap: '25%',
        itemStyle: { color: color(0) },
      },
    ],
  };
}

export const PER_YEAR_HEIGHT = 260;

/**
 * Total citations over time, one point per daily snapshot. `symbol` is shown
 * on purpose: the series starts with a single point (the first snapshot), and
 * a line through one point would draw nothing at all.
 */
export function citationHistoryOption(rows: HistoryRow[], citation: CitationCountStrings, locale: Locale = DEFAULT_LOCALE) {
  const points = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  return {
    animation: false,
    tooltip: tooltip((ps: { name: string; value: [string, number] }[]) => `${ps[0]?.name ?? ''}\n${citationCount(ps[0]?.value[1] ?? 0, citation)}`, 'axis'),
    grid: { left: 8, right: 14, top: 14, bottom: 8, containLabel: true },
    // a time axis, so the year-end totals and the daily readings sit at their
    // true distances instead of one slot per point
    xAxis: {
      type: 'time',
      axisLabel: { ...axisLabel(), hideOverlap: true },
      axisTick: { show: false },
    },
    // `scale` so a slowly growing total does not look flat against a 0 baseline
    yAxis: { type: 'value', scale: true, axisLabel: numberAxisLabel(locale), splitLine: { lineStyle: { color: GRID } } },
    series: [
      {
        type: 'line',
        // year-end totals as hollow circles, daily readings as filled ones
        data: points.map((r) => ({ name: r.date, value: [r.date, r.citations] as [string, number], symbol: r.source === 'year' ? 'emptyCircle' : 'circle' })),
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: color(1), width: 2 },
        itemStyle: { color: color(1) },
      },
    ],
  };
}

export const HISTORY_HEIGHT = 260;

/* ------------------------------------------------------------------
   Publications over time (rows from `publicationRows.ts`, computed at
   build time — this chart has no live part). Same rules as above:
   pure, no ECharts import, richText tooltip.
   ------------------------------------------------------------------ */

/** Which split the publications chart stacks by (the two mode buttons). */
export type PublicationsMode = 'tag' | 'status';

/**
 * The `total: {count}` template plus every status' display label
 * (`publicationStatusLabel()` in `publicationRows.ts`, keyed by the status
 * value itself - a narrow, serialisable bundle, not a `TFn`, because
 * `PublicationsChart.vue` is a hydrated island).
 */
export interface PublicationsChartStrings {
  total: string;
  status: Record<string, string>;
}

/**
 * Papers per year as stacked bars, split by research area or by status.
 *
 * `xAxis.triggerEvent` is on so a click on a year label reaches the
 * component's handler (it scrolls to that year's group); the series names are
 * the plain tag names, which is what the handler presses in the tag filter as
 * `[data-tag="…"]`.
 */
export function publicationsOption(rows: PublicationYearRows, mode: PublicationsMode, strings: PublicationsChartStrings, locale: Locale = DEFAULT_LOCALE) {
  // Series `name` stays the machine tag value (never the label): the click
  // handler in PublicationsChart.vue matches it against `[data-tag]`, and a
  // translated name would break that match on a German page. Only the
  // legend/tooltip TEXT is translated, via this name -> label lookup.
  const tagLabelOf = new Map(rows.byTag.map((s) => [s.tag, s.label]));
  const series = mode === 'status'
    ? rows.byStatus.map((s) => ({
        name: strings.status[s.status] ?? s.status, type: 'bar', stack: 'publications', data: s.counts,
        itemStyle: { color: color(STATUS_ORDER.indexOf(s.status)) },
      }))
    : rows.byTag.map((s, i) => ({
        name: s.tag, type: 'bar', stack: 'publications', data: s.counts,
        itemStyle: { color: TAG_PALETTE[s.slug] ?? color(i) },
      }));
  return {
    animation: false,
    tooltip: tooltip((ps: { name: string; seriesName: string; value: number }[]) => {
      const lines = ps.filter((p) => p.value > 0).map((p) => `${tagLabelOf.get(p.seriesName) ?? p.seriesName}: ${p.value}`);
      const total = ps.reduce((s, p) => s + p.value, 0);
      return [ps[0]?.name ?? '', ...lines, fmt(strings.total, { count: total })].join('\n');
    }, 'axis'),
    legend: {
      type: 'scroll', bottom: 0, itemHeight: 8, itemWidth: 12, textStyle: axisLabel(),
      formatter: (name: string) => tagLabelOf.get(name) ?? name,
    },
    grid: { left: 8, right: 14, top: 10, bottom: 34, containLabel: true },
    xAxis: {
      type: 'category',
      data: rows.years.map(String),
      // a click on a year label must reach the chart's click handler
      triggerEvent: true,
      axisLabel: { ...axisLabel(), hideOverlap: true },
      axisTick: { show: false },
    },
    // whole papers only: no 0.5 gridline on a year with a single paper
    yAxis: { type: 'value', minInterval: 1, axisLabel: numberAxisLabel(locale), splitLine: { lineStyle: { color: GRID } } },
    series,
  };
}

export const PUBLICATIONS_HEIGHT = 320;
