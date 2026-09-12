/**
 * Shared ECharts setup for the research page's chart islands.
 *
 * Only the pieces the three charts use are registered (`echarts/core` plus
 * the bar/scatter series and the grid, tooltip, legend and data-zoom
 * components), so the chunk stays far below the full `echarts` bundle. The
 * canvas renderer is deliberate: it draws everything inside one <canvas>, so
 * no chart internals can produce inline styles or markup — the site's CSP has
 * no 'unsafe-inline' (see CLAUDE.md).
 *
 * The chart height is applied through the CSSOM (`el.style.height`), never as
 * a `style=` attribute, for the same reason.
 */
import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { init, use, type EChartsCoreOption, type ECharts } from 'echarts/core';
import { BarChart, ScatterChart } from 'echarts/charts';
import { DataZoomComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

use([BarChart, ScatterChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

/**
 * Renders `option()` into the returned element ref and keeps it in sync:
 * re-renders whenever the reactive data behind `option`/`height` changes,
 * resizes with the container, and disposes on unmount.
 */
export function useChart(option: () => EChartsCoreOption, height: () => number, onClick?: (params: unknown) => void): Ref<HTMLDivElement | null> {
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
    chart.setOption(next, true);
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    chart?.dispose();
    chart = null;
  });

  return el;
}

/** Opens a chart item's URL in a new tab (click handler of the timeline and stars charts). */
export function openInNewTab(url: unknown): void {
  if (typeof url === 'string' && url.startsWith('https://')) window.open(url, '_blank', 'noopener');
}
