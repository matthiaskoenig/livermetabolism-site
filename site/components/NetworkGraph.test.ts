import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getInstanceByDom } from 'echarts/core';
import NetworkGraph from './NetworkGraph.vue';
import type { GraphRows } from '../lib/graphRows';
import { uiFor } from '../lib/i18n/catalog';
import { slices } from '../lib/i18n/slices';
import { filterRows } from '../lib/networkOptions';
import { initTopic, setTopic } from '../lib/topicFilter';

const strings = slices(uiFor('en').t).network;

/**
 * Two research areas over the same shape of graph the page draws: `person:ada`
 * is in `ai` only through the paper she co-authored, and `person:cleo` has no
 * link at all, so `filterRows()` drops her from every view.
 */
const rows: GraphRows = {
  nodes: [
    { id: 'person:ada', type: 'person', label: 'Ada Lovelace', detail: 'PostDoc', href: '/people/#person/ada', image: null, topics: ['ai'], value: 3, citations: null },
    { id: 'person:bob', type: 'person', label: 'Bob Stone', detail: 'PhD student', href: '/people/#person/bob', image: null, topics: ['pharmacometrics'], value: 1, citations: null },
    { id: 'person:cleo', type: 'person', label: 'Cleo Solo', detail: 'Intern', href: '/people/#person/cleo', image: null, topics: ['ai'], value: 0, citations: null },
    { id: 'project:atlas', type: 'project', label: 'Atlas', detail: 'Atlas', href: '/projects/#project/atlas', image: null, topics: ['ai'], value: 1, citations: null },
    { id: 'publication:p1', type: 'publication', label: 'A paper on AI', detail: '2026 · Nature', href: '/publications/#pub-p1', image: null, topics: ['ai'], value: 1, citations: 17 },
    { id: 'publication:p2', type: 'publication', label: 'A paper on PK', detail: '2020 · JPKPD', href: '/publications/#pub-p2', image: null, topics: ['pharmacometrics'], value: 1, citations: 0 },
  ],
  links: [
    { source: 'publication:p1', target: 'person:ada', kind: 'author' },
    { source: 'publication:p2', target: 'person:bob', kind: 'author' },
    { source: 'person:ada', target: 'project:atlas', kind: 'member' },
  ],
};

const topics = [
  { tag: 'AI', slug: 'ai', label: 'AI' },
  { tag: 'Pharmacometrics', slug: 'pharmacometrics', label: 'Pharmacometrics' },
];
const NAMES = Object.fromEntries(topics.map((t) => [t.slug, t.tag]));

/**
 * happy-dom has no canvas 2D context and reports every element as 0x0, which
 * is all ECharts needs from the DOM: it draws into the canvas and reads the
 * container's size. Stubbing both lets the real chart run, so the assertions
 * below are about the option ECharts actually holds, not about a test double.
 */
function paintable(): void {
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (target, prop) => (prop === 'measureText' ? () => ({ width: 8 }) : prop in target ? target[prop as string] : () => undefined),
    set: (target, prop, value) => { target[prop as string] = value; return true; },
  });
  HTMLCanvasElement.prototype.getContext = (() => ctx) as unknown as HTMLCanvasElement['getContext'];
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { value: 960, configurable: true });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { value: 560, configurable: true });
}

/** Puts the filter store back in the state a fresh page load would give it. */
function reset(search = ''): void {
  localStorage.clear();
  window.history.replaceState(null, '', `/network/${search}`);
  initTopic(topics.map((t) => t.slug), NAMES);
}

const mountGraph = () => mount(NetworkGraph, { props: { rows, topics, strings }, attachTo: document.body });

/** The node ids the chart currently draws. */
function drawn(): string[] {
  const el = document.querySelector<HTMLElement>('.network-graph')!;
  const option = getInstanceByDom(el)!.getOption() as { series: { data: { id: string }[] }[] };
  return option.series[0]!.data.map((n) => n.id);
}

const expected = (topic: string | null) => filterRows(rows, topic).nodes.map((n) => n.id);

beforeAll(paintable);
beforeEach(() => reset());

describe('NetworkGraph', () => {
  it('draws the whole connected network while no research area is chosen', () => {
    const w = mountGraph();
    expect(drawn()).toEqual(expected(null));
    w.unmount();
  });

  it('draws the area the filter bar already restored, on the very first render', () => {
    // the tag name spelling the homepage sections link with; the store resolves it
    reset('?tag=AI');
    const w = mountGraph();
    expect(drawn()).toEqual(expected('ai'));
    w.unmount();
  });

  it('redraws when the global filter changes, and again when it is cleared', async () => {
    const w = mountGraph();
    setTopic('ai');
    await nextTick();
    expect(drawn()).toEqual(expected('ai'));
    setTopic(null);
    await nextTick();
    expect(drawn()).toEqual(expected(null));
    w.unmount();
  });

  it('keeps the zoom controls and leaves the research areas to the global bar', () => {
    const w = mountGraph();
    expect(w.findAll('.network-topic-btn')).toHaveLength(0);
    expect(w.findAll('.chart-modes button').map((b) => b.text())).toEqual(['+', '−', strings.reset]);
    w.unmount();
  });
});
