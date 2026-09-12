import { describe, expect, it } from 'vitest';
import { TAG_PALETTE } from './chartOptions';
import type { GraphRows } from './graphRows';
import {
  CATEGORY_COLOR, CATEGORY_LABEL, CATEGORY_ORDER, DIM_OPACITY, PUBLICATION_SIZE_CAP,
  networkOption, neighbourhood, publicationSymbolSize,
} from './networkOptions';

/**
 * Two topics, two people, a project, a software entry and three publications
 * — enough to have an item of one topic (`person:ada`) whose neighbour
 * (`software:tool`) belongs to the other, which is what `neighbourhood()`
 * has to pull in.
 */
const rows: GraphRows = {
  nodes: [
    { id: 'topic:ai', type: 'topic', label: 'AI', detail: 'Machine learning for the liver', href: '/#ai', image: '/assets/image/graph/topics/ai.webp', topics: ['ai'], value: 3 },
    { id: 'topic:pharmacometrics', type: 'topic', label: 'Pharmacometrics', detail: 'PBPK models', href: '/#pharmacometrics', image: null, topics: ['pharmacometrics'], value: 4 },
    { id: 'person:ada', type: 'person', label: 'Ada Lovelace', detail: 'PostDoc', href: '/people/#person-modal-ada', image: '/assets/image/graph/people/ada.webp', topics: ['ai'], value: 3 },
    { id: 'person:bob', type: 'person', label: 'Bob Stone', detail: 'PhD student', href: '/people/#person-modal-bob', image: null, topics: ['pharmacometrics'], value: 1 },
    { id: 'project:atlas', type: 'project', label: 'Atlas', detail: 'Atlas', href: '/projects/#project-modal-atlas', image: '/assets/image/graph/projects/atlas.webp', topics: ['ai'], value: 2 },
    { id: 'software:tool', type: 'software', label: 'tool', detail: 'A tool for models', href: '/research/#software-tool', image: null, topics: ['pharmacometrics'], value: 3 },
    { id: 'publication:p1', type: 'publication', label: 'A paper on AI', detail: '2026 · Nature', href: '/publications/#pub-p1', image: null, topics: ['ai'], value: 17 },
    { id: 'publication:p2', type: 'publication', label: 'A paper on PK', detail: '2020 · JPKPD', href: '/publications/#pub-p2', image: null, topics: ['pharmacometrics'], value: 0 },
    { id: 'publication:p3', type: 'publication', label: 'An untagged paper', detail: '2019 · Other', href: '/publications/#pub-p3', image: null, topics: [], value: 5 },
  ],
  links: [
    { source: 'publication:p1', target: 'topic:ai', kind: 'topic' },
    { source: 'publication:p1', target: 'person:ada', kind: 'author' },
    { source: 'publication:p2', target: 'topic:pharmacometrics', kind: 'topic' },
    { source: 'publication:p2', target: 'person:bob', kind: 'author' },
    { source: 'project:atlas', target: 'topic:ai', kind: 'topic' },
    { source: 'software:tool', target: 'topic:pharmacometrics', kind: 'topic' },
    { source: 'software:tool', target: 'publication:p3', kind: 'software' },
    { source: 'person:ada', target: 'project:atlas', kind: 'member' },
    { source: 'person:ada', target: 'software:tool', kind: 'member' },
  ],
};

const series = (focus: string | null) => networkOption(rows, focus).series[0]!;
const node = (focus: string | null, id: string) => series(focus).data.find((n) => n.id === id)!;
const link = (focus: string | null, source: string, target: string) =>
  series(focus).links.find((l) => l.source === source && l.target === target)!;

describe('neighbourhood', () => {
  it('holds the topic, its items and their direct neighbours', () => {
    expect(neighbourhood(rows, 'ai')).toEqual(new Set([
      'topic:ai', // the hub itself
      'person:ada', 'project:atlas', 'publication:p1', // its items
      'software:tool', // a direct neighbour of ada, tagged pharmacometrics
    ]));
  });

  it('is empty for an unknown slug', () => {
    expect(neighbourhood(rows, 'nope')).toEqual(new Set());
  });
});

describe('networkOption', () => {
  it('is a roamable force-layout graph', () => {
    const s = series(null);
    expect(s.type).toBe('graph');
    expect(s.layout).toBe('force');
    expect(networkOption(rows, null).series[0]!.roam).toBe(true);
    expect(s.draggable).toBe(true);
    expect(s.force.repulsion).toBe(120);
    expect(s.force.gravity).toBe(0.08);
    expect(s.force.friction).toBe(0.6);
    // a topic edge is the long one, every other edge the short one: the force
    // layout maps the range to the link `value` (larger value, shorter edge)
    expect(s.force.edgeLength).toEqual([60, 160]);
    expect(link(null, 'publication:p1', 'topic:ai').value).toBeLessThan(link(null, 'publication:p1', 'person:ada').value);
  });

  it('has the five node categories in legend order, with their colours', () => {
    const s = series(null);
    expect(CATEGORY_ORDER).toEqual(['topic', 'person', 'project', 'software', 'publication']);
    expect(s.categories.map((c) => c.name)).toEqual(CATEGORY_ORDER.map((t) => CATEGORY_LABEL[t]));
    expect(s.categories.map((c) => c.itemStyle.color)).toEqual(CATEGORY_ORDER.map((t) => CATEGORY_COLOR[t]));
    // every node points at its own category, and the legend toggles them
    expect(node(null, 'person:ada').category).toBe(CATEGORY_ORDER.indexOf('person'));
    expect(node(null, 'publication:p1').category).toBe(CATEGORY_ORDER.indexOf('publication'));
    expect(networkOption(rows, null).legend.data).toEqual(s.categories.map((c) => c.name));
  });

  it('draws a thumbnail as an image symbol and everything else as a circle', () => {
    expect(node(null, 'topic:ai').symbol).toBe('image:///assets/image/graph/topics/ai.webp');
    expect(node(null, 'person:ada').symbol).toBe('image:///assets/image/graph/people/ada.webp');
    expect(node(null, 'person:bob').symbol).toBe('circle');
    expect(node(null, 'publication:p1').symbol).toBe('circle');
    expect(series(null).symbolKeepAspect).toBe(true);
  });

  it('sizes a publication by its citation count and the rest by type', () => {
    expect(publicationSymbolSize(0)).toBe(8);
    expect(publicationSymbolSize(1e6)).toBe(PUBLICATION_SIZE_CAP);
    expect(publicationSymbolSize(17)).toBeCloseTo(8 + 4 * Math.log(18), 6);
    expect(node(null, 'publication:p2').symbolSize).toBe(8);
    expect(node(null, 'publication:p1').symbolSize).toBeCloseTo(publicationSymbolSize(17), 6);
    // the other types carry a degree in `value` — never a size
    const topic = node(null, 'topic:ai');
    const person = node(null, 'person:ada');
    expect(topic.symbolSize).toBeGreaterThan(person.symbolSize);
    expect(person.symbolSize).toBeGreaterThan(PUBLICATION_SIZE_CAP);
  });

  it('colours a publication by its first topic and falls back to the category colour', () => {
    expect(node(null, 'publication:p1').itemStyle.color).toBe(TAG_PALETTE.ai);
    expect(node(null, 'publication:p2').itemStyle.color).toBe(TAG_PALETTE.pharmacometrics);
    expect(node(null, 'publication:p3').itemStyle.color).toBe(CATEGORY_COLOR.publication);
    // an image node keeps its category colour (it only shows through a circle fallback)
    expect(node(null, 'person:ada').itemStyle.color).toBeUndefined();
  });

  it('labels the topics on the canvas and everything else on hover only', () => {
    const s = series(null);
    expect(s.label.show).toBe(false);
    expect(s.emphasis.label.show).toBe(true);
    expect(s.emphasis.focus).toBe('adjacency');
    expect(node(null, 'topic:ai').label!.show).toBe(true);
    expect(node(null, 'person:ada').label).toBeUndefined();
    // the node name is what ECharts draws; the id is what the links resolve by
    expect(node(null, 'person:ada').name).toBe('Ada Lovelace');
  });

  it('carries the click target and the tooltip text on every node', () => {
    const n = node(null, 'project:atlas');
    expect(n.href).toBe('/projects/#project-modal-atlas');
    expect(n.type).toBe('project');
    expect(n.value).toBe(2);
    // every link endpoint resolves to a node id
    const ids = new Set(series(null).data.map((d) => d.id));
    for (const l of series(null).links) {
      expect(ids.has(l.source)).toBe(true);
      expect(ids.has(l.target)).toBe(true);
    }
  });

  it('renders the tooltip inside the canvas as "label\\ntype · detail"', () => {
    const { tooltip } = networkOption(rows, null);
    expect(tooltip.renderMode).toBe('richText');
    expect(tooltip.formatter({ dataType: 'node', data: node(null, 'publication:p1') }))
      .toBe('A paper on AI\nPublication · 2026 · Nature');
    expect(tooltip.formatter({ dataType: 'node', data: node(null, 'topic:ai') }))
      .toBe('AI\nResearch area · Machine learning for the liver');
    // a project's detail is its title, which is already the label: no second time
    expect(tooltip.formatter({ dataType: 'node', data: node(null, 'project:atlas') })).toBe('Atlas\nProject');
    // edges have no tooltip
    expect(tooltip.formatter({ dataType: 'edge', data: undefined })).toBe('');
  });

  it('leaves every node and link fully opaque without a focus', () => {
    expect(series(null).data.every((n) => n.itemStyle.opacity === 1)).toBe(true);
    expect(series(null).links.every((l) => l.lineStyle.opacity === 1)).toBe(true);
  });

  it('dims everything outside the focused neighbourhood', () => {
    expect(DIM_OPACITY).toBe(0.15);
    const inside = neighbourhood(rows, 'ai');
    for (const n of series('ai').data) {
      expect(n.itemStyle.opacity).toBe(inside.has(n.id) ? 1 : DIM_OPACITY);
    }
    // a link stays bright only while both of its endpoints do
    expect(link('ai', 'publication:p1', 'person:ada').lineStyle.opacity).toBe(1);
    expect(link('ai', 'person:ada', 'software:tool').lineStyle.opacity).toBe(1);
    expect(link('ai', 'software:tool', 'topic:pharmacometrics').lineStyle.opacity).toBe(DIM_OPACITY);
    expect(link('ai', 'publication:p2', 'person:bob').lineStyle.opacity).toBe(DIM_OPACITY);
  });

  it('ignores an unknown focus rather than dimming the whole graph', () => {
    expect(series('nope').data.every((n) => n.itemStyle.opacity === 1)).toBe(true);
    expect(series('nope').links.every((l) => l.lineStyle.opacity === 1)).toBe(true);
  });
});
