import { mount } from '@vue/test-utils';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getInstanceByDom } from 'echarts/core';
import PublicationsChart from './PublicationsChart.vue';
import { uiFor } from '../lib/i18n/catalog';
import { slices } from '../lib/i18n/slices';
import type { PublicationYearRows } from '../lib/publicationRows';
import { getTopic, initTopic } from '../lib/topicFilter';

const strings = slices(uiFor('en').t).publicationsChart;

/** Two years and two research areas, as publications.astro aggregates them. */
const rows: PublicationYearRows = {
  years: [2024, 2025],
  byTag: [
    { tag: 'AI', slug: 'ai', label: 'AI', counts: [1, 2] },
    { tag: 'Open & FAIR', slug: 'open-fair', label: 'Open & FAIR', counts: [0, 1] },
  ],
  byStatus: [{ status: 'publication', counts: [1, 3] }],
};

const SLUGS = ['ai', 'open-fair'];
const NAMES = { ai: 'AI', 'open-fair': 'Open & FAIR' };

/** See NetworkGraph.test.ts: the two things ECharts needs that happy-dom lacks. */
function paintable(): void {
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (target, prop) => (prop === 'measureText' ? () => ({ width: 8 }) : prop in target ? target[prop as string] : () => undefined),
    set: (target, prop, value) => { target[prop as string] = value; return true; },
  });
  HTMLCanvasElement.prototype.getContext = (() => ctx) as unknown as HTMLCanvasElement['getContext'];
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { value: 960, configurable: true });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { value: 420, configurable: true });
}

/** The list the chart scrolls to, with one year group in it. */
function list(): void {
  document.body.innerHTML = `
    <div id="publication-list">
      <div class="pub-year-group"><h3 class="year-heading">2025</h3></div>
      <div class="pub-year-group"><h3 class="year-heading">2024</h3></div>
    </div>`;
}

const scrolled: HTMLElement[] = [];

function reset(): void {
  localStorage.clear();
  window.history.replaceState(null, '', '/publications/');
  initTopic(SLUGS, NAMES);
  scrolled.length = 0;
  list();
}

const mountChart = () => mount(PublicationsChart, { props: { rows, strings }, attachTo: document.body });

/** ECharts routes a real click through the same emitter, so this is the handler the chart runs. */
function click(params: Record<string, unknown>): void {
  const el = document.querySelector<HTMLElement>('.publications-chart')!;
  (getInstanceByDom(el) as unknown as { trigger(type: string, params: unknown): void }).trigger('click', params);
}

beforeAll(() => {
  paintable();
  vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(function (this: HTMLElement) { scrolled.push(this); });
});
beforeEach(reset);

describe('PublicationsChart', () => {
  it('narrows the whole site to the research area of the clicked bar segment', () => {
    const w = mountChart();
    // the series name is the machine tag value, never a slug (chartOptions.ts)
    click({ componentType: 'series', seriesName: 'Open & FAIR', name: '2025' });
    expect(getTopic()).toBe('open-fair');
    expect(scrolled.at(-1)?.id).toBe('publication-list');
    w.unmount();
  });

  it('only scrolls in status mode, where there is nothing to filter by', async () => {
    const w = mountChart();
    await w.findAll('.chart-mode-btn')[1]!.trigger('click');
    click({ componentType: 'series', seriesName: 'Publication', name: '2025' });
    expect(getTopic()).toBeNull();
    expect(scrolled.at(-1)?.id).toBe('publication-list');
    w.unmount();
  });

  it('scrolls to a year group on a year label instead of filtering', () => {
    const w = mountChart();
    click({ componentType: 'xAxis', value: '2025' });
    expect(scrolled.at(-1)?.querySelector('h3')?.textContent).toBe('2025');
    expect(getTopic()).toBeNull();
    w.unmount();
  });

  it('falls back to the list when that year group is hidden by the most-cited order', () => {
    document.querySelectorAll<HTMLElement>('.pub-year-group').forEach((g) => { g.hidden = true; });
    const w = mountChart();
    click({ componentType: 'xAxis', value: '2025' });
    expect(scrolled.at(-1)?.id).toBe('publication-list');
    w.unmount();
  });
});
