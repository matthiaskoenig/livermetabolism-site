import { describe, expect, it } from 'vitest';
import type { GraphRows } from './graphRows';
import { uiFor } from './i18n/catalog';
import {
  BORDER_WIDTH, CATEGORY_COLOR, CATEGORY_ORDER, FILL_TINT, LAYOUT_FRICTION, SETTLE_FRICTION, SIZE, SYMBOL,
  ROAM, ZOOM_ALL, ZOOM_TOPIC, degrees, filterRows, networkOption, nodeStyle, symbolSize, tint, type NetworkLabels,
} from './networkOptions';

const { t } = uiFor('en');
const labels: NetworkLabels = {
  category: { person: t('detail.people'), project: t('nav.projects'), software: t('nav.software'), publication: t('nav.publications') },
  type: { person: t('type.person'), project: t('type.project'), software: t('type.software'), publication: t('type.publication') },
  citation: { one: t('chart.citationOne'), other: t('chart.citationOther') },
};
const CATEGORY_LABEL = labels.category;

/**
 * Two research areas over seven nodes: `person:ada` is in `ai` only through
 * the paper she co-authored (a person carries no tags of their own), and
 * `software:tool` belongs to the other area although a person of the first
 * one is a member — so filtering must drop it together with the link.
 */
const rows: GraphRows = {
  nodes: [
    { id: 'person:ada', type: 'person', label: 'Ada Lovelace', detail: 'PostDoc', href: '/people/#person/ada', image: '/assets/image/graph/people/ada.webp', topics: ['ai'], value: 3, citations: null },
    { id: 'person:bob', type: 'person', label: 'Bob Stone', detail: 'PhD student', href: '/people/#person/bob', image: null, topics: ['pharmacometrics'], value: 1, citations: null },
    { id: 'project:atlas', type: 'project', label: 'Atlas', detail: 'Atlas', href: '/projects/#project/atlas', image: null, topics: ['ai'], value: 1, citations: null },
    { id: 'software:tool', type: 'software', label: 'tool', detail: 'A tool for models', href: '/research/#software-tool', image: null, topics: ['pharmacometrics'], value: 2, citations: null },
    { id: 'publication:p1', type: 'publication', label: 'A paper on AI', detail: '2026 · Nature', href: '/publications/#pub-p1', image: null, topics: ['ai'], value: 1, citations: 17 },
    { id: 'publication:p2', type: 'publication', label: 'A paper on PK', detail: '2020 · JPKPD', href: '/publications/#pub-p2', image: null, topics: ['pharmacometrics'], value: 1, citations: 0 },
    { id: 'publication:p3', type: 'publication', label: 'An untagged paper', detail: '2019 · Other', href: '/publications/#pub-p3', image: null, topics: [], value: 1, citations: 5 },
    { id: 'person:cleo', type: 'person', label: 'Cleo Solo', detail: 'Intern', href: '/people/#person/cleo', image: null, topics: ['ai'], value: 0, citations: null },
  ],
  links: [
    { source: 'publication:p1', target: 'person:ada', kind: 'author' },
    { source: 'publication:p2', target: 'person:bob', kind: 'author' },
    { source: 'software:tool', target: 'publication:p3', kind: 'software' },
    { source: 'person:ada', target: 'project:atlas', kind: 'member' },
    { source: 'person:ada', target: 'software:tool', kind: 'member' },
  ],
};

const series = (topic: string | null, relayout?: boolean) =>
  networkOption(rows, topic, labels, relayout === undefined ? undefined : { relayout }).series[0]!;
const node = (topic: string | null, id: string) => series(topic).data.find((n) => n.id === id)!;
const ids = (topic: string | null) => series(topic).data.map((n) => n.id);

describe('filterRows', () => {
  it('keeps the nodes of one research area, including a person who got it from a paper', () => {
    expect(filterRows(rows, 'ai').nodes.map((n) => n.id)).toEqual(['person:ada', 'project:atlas', 'publication:p1']);
  });

  it('drops a node left without a link, so the view is always a network', () => {
    // cleo is tagged AI but has no link at all
    expect(rows.nodes.some((n) => n.id === 'person:cleo')).toBe(true);
    expect(filterRows(rows, 'ai').nodes.some((n) => n.id === 'person:cleo')).toBe(false);
    expect(filterRows(rows, null).nodes.some((n) => n.id === 'person:cleo')).toBe(false);
    // bob keeps his one remaining link inside pharmacometrics; the tool's
    // only links leave the area, so it goes with them
    expect(filterRows(rows, 'pharmacometrics').nodes.map((n) => n.id)).toEqual(['person:bob', 'publication:p2']);
    // every drawn node has at least one link
    for (const slug of [null, 'ai', 'pharmacometrics']) {
      const view = filterRows(rows, slug);
      for (const n of view.nodes) expect(view.links.some((l) => l.source === n.id || l.target === n.id)).toBe(true);
    }
  });

  it('drops a publication without the tag', () => {
    expect(filterRows(rows, 'ai').nodes.some((n) => n.id === 'publication:p2')).toBe(false);
    expect(filterRows(rows, 'ai').nodes.some((n) => n.id === 'publication:p3')).toBe(false);
  });

  it('drops every link to a removed node', () => {
    const { links } = filterRows(rows, 'ai');
    const kept = new Set(filterRows(rows, 'ai').nodes.map((n) => n.id));
    for (const l of links) {
      expect(kept.has(l.source)).toBe(true);
      expect(kept.has(l.target)).toBe(true);
    }
    // ada is a member of a pharmacometrics tool: the edge goes with the tool
    expect(links.map((l) => `${l.source}->${l.target}`)).toEqual(['publication:p1->person:ada', 'person:ada->project:atlas']);
  });

  it('returns the whole connected graph without a slug', () => {
    expect(filterRows(rows, null).links).toEqual(rows.links);
    expect(filterRows(rows, null).nodes.map((n) => n.id)).toEqual(rows.nodes.filter((n) => n.id !== 'person:cleo').map((n) => n.id));
  });

  it('is empty for an unknown slug', () => {
    expect(filterRows(rows, 'nope')).toEqual({ nodes: [], links: [] });
  });
});

describe('networkOption', () => {
  it('is a pannable force-layout graph that does not trap the wheel', () => {
    const s = series(null);
    expect(s.type).toBe('graph');
    expect(s.layout).toBe('force');
    // 'move', not true: the wheel must keep scrolling the page (the component
    // has zoom buttons instead)
    expect(s.roam).toBe('move');
    expect(ROAM).toBe('move');
    // a drag anywhere on the canvas pans, not only inside the node bbox
    expect(s.roamTrigger).toBe('global');
    expect(s.draggable).toBe(true);
    expect(s.force.repulsion).toBe(200);
    expect(s.force.gravity).toBe(0.03);
    expect(s.force.edgeLength).toEqual([60, 220]);
    expect(s.labelLayout).toEqual({ hideOverlap: true });
  });

  it('re-runs the layout by default and settles only when asked to', () => {
    // a first draw and a filter change re-arrange the graph …
    expect(series(null).force.friction).toBe(LAYOUT_FRICTION);
    expect(series(null, true).force.friction).toBe(LAYOUT_FRICTION);
    expect(series(null).force.initLayout).toBe('circular');
    // … a resize must not: friction 0 cannot move a node
    expect(series(null, false).force.friction).toBe(SETTLE_FRICTION);
    expect(SETTLE_FRICTION).toBe(0);
  });

  it('holds only the nodes and links of a filtered research area, zoomed in', () => {
    expect(ids(null)).toHaveLength(rows.nodes.length - 1); // the isolated node is dropped
    expect(ids('ai')).toEqual(['person:ada', 'project:atlas', 'publication:p1']);
    expect(series('ai').links.map((l) => l.source)).toEqual(['publication:p1', 'person:ada']);
    expect(ids('nope')).toEqual([]);
    // the whole graph is drawn wide, one area fills the canvas
    expect(series(null).zoom).toBe(ZOOM_ALL);
    expect(series('ai').zoom).toBe(ZOOM_TOPIC);
    expect(ZOOM_TOPIC).toBeGreaterThan(ZOOM_ALL);
  });

  it('has the four node categories in legend order, each outlined in its main colour', () => {
    const s = series(null);
    expect(CATEGORY_ORDER).toEqual(['person', 'project', 'software', 'publication']);
    expect(s.categories.map((c) => c.name)).toEqual(CATEGORY_ORDER.map((t) => CATEGORY_LABEL[t]));
    expect(s.categories.map((c) => c.itemStyle)).toEqual(CATEGORY_ORDER.map((t) => nodeStyle(t)));
    expect(s.categories.map((c) => c.itemStyle.borderColor)).toEqual(CATEGORY_ORDER.map((t) => CATEGORY_COLOR[t]));
    expect(node(null, 'person:ada').category).toBe(CATEGORY_ORDER.indexOf('person'));
    expect(node(null, 'publication:p1').category).toBe(CATEGORY_ORDER.indexOf('publication'));
  });

  it('gives the four categories four different main colours', () => {
    expect(new Set(Object.values(CATEGORY_COLOR)).size).toBe(CATEGORY_ORDER.length);
  });

  it('fills a node with a light tint of the colour it is outlined in', () => {
    expect(tint('#000000', 0.5)).toBe('#808080');
    expect(tint('#3498db', 0)).toBe('#3498db');
    expect(tint('#3498db', 1)).toBe('#ffffff');
    for (const type of CATEGORY_ORDER) {
      expect(nodeStyle(type)).toEqual({ color: tint(CATEGORY_COLOR[type], FILL_TINT), borderColor: CATEGORY_COLOR[type], borderWidth: BORDER_WIDTH });
    }
  });

  it('draws every legend entry as the symbol of its nodes, in their outline and fill', () => {
    expect(networkOption(rows, null, labels).legend.data).toEqual(
      CATEGORY_ORDER.map((t) => ({ name: CATEGORY_LABEL[t], icon: SYMBOL[t], itemStyle: nodeStyle(t) })),
    );
  });

  it('draws a person as their photo and every other type as a shape', () => {
    expect(node(null, 'person:ada').symbol).toBe('image:///assets/image/graph/people/ada.webp');
    // a person without a photo, and everything that never has one
    expect(node(null, 'person:bob').symbol).toBe('circle');
    expect(node(null, 'project:atlas').symbol).toBe('roundRect');
    expect(node(null, 'software:tool').symbol).toBe('diamond');
    expect(node(null, 'publication:p1').symbol).toBe('circle');
    expect(SYMBOL).toEqual({ person: 'circle', project: 'roundRect', software: 'diamond', publication: 'circle' });
    // no image symbol anywhere but on a person
    for (const n of series(null).data) {
      if (n.type !== 'person') expect(n.symbol.startsWith('image://')).toBe(false);
    }
    // only the photos need it
    expect(series(null).symbolKeepAspect).toBe(true);
  });

  it('counts the degree of the drawn view and sizes every node by it', () => {
    // degrees of the whole graph
    expect(degrees(rows).get('person:ada')).toBe(3);
    expect(degrees(rows).get('person:cleo')).toBeUndefined();
    expect(symbolSize('person', 0)).toBe(SIZE.person.min);
    for (const n of series(null).data) {
      expect(n.value).toBe(rows.links.filter((l) => l.source === n.id || l.target === n.id).length);
      expect(n.symbolSize).toBeCloseTo(symbolSize(n.type, n.value), 6);
    }
    // min + k * sqrt(degree), capped per type
    expect(SIZE.person).toEqual({ min: 24, k: 6, cap: 56 });
    expect(SIZE.project).toEqual({ min: 10, k: 4, cap: 32 });
    expect(SIZE.software).toEqual({ min: 10, k: 4, cap: 32 });
    expect(SIZE.publication).toEqual({ min: 6, k: 3, cap: 22 });
    expect(symbolSize('person', 4)).toBe(24 + 6 * 2);
    expect(symbolSize('publication', 9)).toBe(6 + 3 * 3);
    expect(symbolSize('person', 1e6)).toBe(SIZE.person.cap);
    expect(symbolSize('project', 1e6)).toBe(SIZE.project.cap);
    // an isolated node would be drawn at the minimum — but it is not drawn
    expect(series(null).data.some((n) => n.id === 'person:cleo')).toBe(false);
    expect(Math.min(...series(null).data.map((n) => n.value))).toBeGreaterThan(0);
  });

  it('re-counts the degree inside a filtered view, so the sizes change with it', () => {
    // ada has three links in the whole graph and two inside the AI subgraph
    expect(node(null, 'person:ada').value).toBe(3);
    const filtered = series('ai').data.find((n) => n.id === 'person:ada')!;
    expect(filtered.value).toBe(2);
    expect(filtered.symbolSize).toBeCloseTo(symbolSize('person', 2), 6);
    expect(filtered.symbolSize).toBeLessThan(node(null, 'person:ada').symbolSize);
  });

  it('never colours a node by its research area: the category alone decides (issue #77)', () => {
    for (const n of series(null).data) expect(n).not.toHaveProperty('itemStyle');
  });

  it('labels a node on hover only', () => {
    const s = series(null);
    expect(s.label.show).toBe(false);
    expect(s.emphasis.label.show).toBe(true);
    expect(s.emphasis.focus).toBe('adjacency');
    // the node name is what ECharts draws; the id is what the links resolve by
    expect(node(null, 'person:ada').name).toBe('Ada Lovelace');
  });

  it('carries the click target and the tooltip text on every node', () => {
    const n = node(null, 'project:atlas');
    expect(n.href).toBe('/projects/#project/atlas');
    expect(n.type).toBe('project');
    expect(n.value).toBe(1);
    // every link endpoint resolves to a node id
    const known = new Set(ids(null));
    for (const l of series(null).links) {
      expect(known.has(l.source)).toBe(true);
      expect(known.has(l.target)).toBe(true);
    }
  });

  it('renders the tooltip inside the canvas as "label\\ntype · detail"', () => {
    const { tooltip } = networkOption(rows, null, labels);
    expect(tooltip.renderMode).toBe('richText');
    // a publication also gets its citation count, the only `value` that means
    // something to a reader (every other type carries a degree)
    expect(tooltip.formatter({ dataType: 'node', data: node(null, 'publication:p1') }))
      .toBe('A paper on AI\nPublication · 2026 · Nature\n17 citations');
    expect(tooltip.formatter({ dataType: 'node', data: node(null, 'publication:p2') }))
      .toBe('A paper on PK\nPublication · 2020 · JPKPD\n0 citations');
    expect(tooltip.formatter({ dataType: 'node', data: node(null, 'person:ada') }))
      .toBe('Ada Lovelace\nPerson · PostDoc');
    // the citation line comes from the node's own count, never from its size
    expect(tooltip.formatter({ dataType: 'node', data: node(null, 'publication:p3') }))
      .toBe('An untagged paper\nPublication · 2019 · Other\n5 citations');
    // a project's detail is its title, which is already the label: no second time
    expect(tooltip.formatter({ dataType: 'node', data: node(null, 'project:atlas') })).toBe('Atlas\nProject');
    // edges have no tooltip
    expect(tooltip.formatter({ dataType: 'edge', data: undefined })).toBe('');
  });
});
