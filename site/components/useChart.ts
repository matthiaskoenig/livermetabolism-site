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
   * Whether a re-render throws the previous option away (ECharts' `notMerge`),
   * either fixed or decided per render by a predicate.
   *
   * True — the default — is what the bar/line/scatter charts want: their
   * series are rebuilt from scratch and a stale series must not survive.
   *
   * The network graph decides per render: `notMerge` rebuilds the whole
   * `GlobalModel` and discards the force layout's `preservedPoints` (the node
   * positions it resumes from, keyed by node id), which is exactly right when
   * a filter change should re-arrange the graph and exactly wrong when a
   * height change should not move anything.
   */
  notMerge?: boolean | (() => boolean);
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
    chart.setOption(next, typeof notMerge === 'function' ? notMerge() : notMerge);
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

/**
 * Lets a node of a graph series be dragged without panning the whole view.
 *
 * ECharts' `RoamController` decides between "drag the thing under the cursor"
 * and "pan the view" from `e.target.draggable`; for a node drawn as an
 * `image://` symbol the target is the inner image, which is not draggable, so
 * the controller starts a pan while zrender's own drag logic moves the node —
 * and the pan wins visually. Switching `roam` off for the duration of the
 * drag leaves only the node moving, and the background still pans because a
 * drag that starts on empty canvas has no node under it.
 *
 * `force.friction: 0` rides along so the merge-render this needs cannot
 * restart the simulation mid-drag. Returns the unbind function.
 */
export function enableNodeDragging(el: HTMLElement | null, roam: string): () => void {
  const chart = el ? getInstanceByDom(el) : null;
  if (!chart) return () => {};
  let dragging = false;
  const setRoam = (value: string | boolean) => chart.setOption({ series: [{ roam: value, force: { friction: 0 } }] });
  const onDown = (params: unknown) => {
    if ((params as { dataType?: string })?.dataType !== 'node' || dragging) return;
    dragging = true;
    setRoam(false);
  };
  const release = () => {
    if (!dragging) return;
    dragging = false;
    setRoam(roam);
  };
  chart.on('mousedown', onDown);
  const zr = chart.getZr();
  zr.on('mouseup', release);
  zr.on('globalout', release);
  return () => {
    chart.off('mousedown', onDown);
    zr.off('mouseup', release);
    zr.off('globalout', release);
  };
}

/** Opens a chart item's URL in a new tab (click handler of the timeline and stars charts). */
export function openInNewTab(url: unknown): void {
  if (typeof url === 'string' && url.startsWith('https://')) window.open(url, '_blank', 'noopener');
}
