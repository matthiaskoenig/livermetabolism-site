/**
 * Shared ECharts setup for the chart islands of the research, publications
 * and network pages.
 *
 * Only the pieces those charts use are registered (`echarts/core` plus the
 * bar/line/scatter/graph series and the grid, tooltip, legend and data-zoom
 * components), so the chunk stays far below the full `echarts` bundle. The
 * canvas renderer is deliberate: it draws everything inside one <canvas>, so
 * no chart internals can produce inline styles or markup — the site's CSP has
 * no 'unsafe-inline' (see CLAUDE.md).
 *
 * The chart height is applied through the CSSOM (`el.style.height`), never as
 * a `style=` attribute, for the same reason.
 */
import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { getInstanceByDom, init, use, type EChartsCoreOption, type ECharts } from 'echarts/core';
import { BarChart, GraphChart, LineChart, ScatterChart } from 'echarts/charts';
import { DataZoomComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// GraphChart is the force-directed network of /network/ (NetworkGraph.vue)
use([BarChart, LineChart, ScatterChart, GraphChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

export interface ChartOptions {
  /**
   * Whether a re-render throws the previous option away (ECharts' `notMerge`).
   * True — the default — is what the bar/line/scatter charts want: their
   * series are rebuilt from scratch and a stale series must not survive.
   *
   * The network graph passes false: `notMerge` rebuilds the whole
   * `GlobalModel`, which discards the force layout's `preservedPoints` (the
   * node positions it resumes from, keyed by node id), so every focus change
   * and every height change would rescramble all 213 nodes. In merge mode the
   * series model survives and only the new styles are applied.
   */
  notMerge?: boolean;
}

/**
 * Renders `option()` into the returned element ref and keeps it in sync:
 * re-renders whenever the reactive data behind `option`/`height` changes,
 * resizes with the container, and disposes on unmount.
 */
export function useChart(option: () => EChartsCoreOption, height: () => number, onClick?: (params: unknown) => void, { notMerge = true }: ChartOptions = {}): Ref<HTMLDivElement | null> {
  const el = ref<HTMLDivElement | null>(null);
  let chart: ECharts | null = null;
  let observer: ResizeObserver | null = null;

  onMounted(() => {
    const node = el.value;
    if (!node) return;
    node.style.height = `${height()}px`;
    chart = init(node);
    chart.setOption(option());
    if (onClick) chart.on('click', onClick);
    observer = new ResizeObserver(() => chart?.resize());
    observer.observe(node);
  });

  watch([option, height], ([next, h]) => {
    if (!chart || !el.value) return;
    el.value.style.height = `${h}px`;
    chart.resize();
    chart.setOption(next, notMerge);
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    chart?.dispose();
    chart = null;
  });

  return el;
}

/**
 * Zooms or pans the chart drawn into `el` (the zoom buttons of the network
 * graph): `graphRoam` multiplies the current zoom around the given pixel
 * origin. Kept here so no component has to import ECharts itself.
 */
export function roamChart(el: HTMLElement | null, action: { type: string; zoom?: number; originX?: number; originY?: number; dx?: number; dy?: number }): void {
  if (el) getInstanceByDom(el)?.dispatchAction({ seriesIndex: 0, ...action });
}

/**
 * Draws `option` from scratch (`notMerge`), which is also the only way to
 * throw the user's zoom and pan away without the toolbox component — the
 * "Reset" button of the network graph. The layout starts over with it, which
 * is why nothing else re-renders this way (see `ChartOptions.notMerge`).
 */
export function resetChart(el: HTMLElement | null, option: EChartsCoreOption): void {
  if (el) getInstanceByDom(el)?.setOption(option, true);
}

/** Opens a chart item's URL in a new tab (click handler of the timeline and stars charts). */
export function openInNewTab(url: unknown): void {
  if (typeof url === 'string' && url.startsWith('https://')) window.open(url, '_blank', 'noopener');
}
