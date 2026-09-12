import { describe, expect, it } from 'vitest';
import { TAG_PALETTE } from './chartOptions';
import type { GraphRows } from './graphRows';
import {
  CATEGORY_COLOR, CATEGORY_LABEL, CATEGORY_ORDER, LAYOUT_FRICTION, PUBLICATION_SIZE_CAP, SETTLE_FRICTION,
  filterRows, networkOption, publicationSymbolSize,
} from './networkOptions';

/**
 * Two research areas over seven nodes: `person:ada` is in `ai` only through
 * the paper she co-authored (a person carries no tags of their own), and
 * `software:tool` belongs to the other area although a person of the first
 * one is a member — so filtering must drop it together with the link.
 */
const rows: GraphRows = {
  nodes: [
    { id: 'person:ada', type: 'person', label: 'Ada Lovelace', detail: 'PostDoc', href: '/people/#person-modal-ada', image: '/assets/image/graph/people/ada.webp', topics: ['ai'], value: 3 },
    { id: 'person:bob', type: 'person', label: 'Bob Stone', detail: 'PhD student', href: '/people/#person-modal-bob', image: null, topics: ['pharmacometrics'], value: 1 },
    { id: 'project:atlas', type: 'project', label: 'Atlas', detail: 'Atlas', href: '/projects/#project-modal-atlas', image: '/assets/image/graph/projects/atlas.webp', topics: ['ai'], value: 2 },
    { id: 'software:tool', type: 'software', label: 'tool', detail: 'A tool for models', href: '/research/#software-tool', image: null, topics: ['pharmacometrics'], value: 3 },
    { id: 'publication:p1', type: 'publication', label: 'A paper on AI', detail: '2026 · Nature', href: '/publications/#pub-p1', image: null, topics: ['ai'], value: 17 },
    { id: 'publication:p2', type: 'publication', label: 'A paper on PK', detail: '2020 · JPKPD', href: '/publications/#pub-p2', image: null, topics: ['pharmacometrics'], value: 0 },
    { id: 'publication:p3', type: 'publication', label: 'An untagged paper', detail: '2019 · Other', href: '/publications/#pub-p3', image: null, topics: [], value: 5 },
  ],
  links: [
    { source: 'publication:p1', target: 'person:ada', kind: 'author' },
    { source: 'publication:p2', target: 'person:bob', kind: 'author' },
    { source: 'software:tool', target: 'publication:p3', kind: 'software' },
    { source: 'person:ada', target: 'project:atlas', kind: 'member' },
    { source: 'person:ada', target: 'software:tool', kind: 'member' },
  ],
};

const series = (topic: string | null, settled?: boolean) => networkOption(rows, topic, settled).series[0]!;
const node = (topic: string | null, id: string) => series(topic).data.find((n) => n.id === id)!;
const ids = (topic: string | null) => series(topic).data.map((n) => n.id);

describe('filterRows', () => {
  it('keeps the nodes of one research area, including a person who got it from a paper', () => {
    expect(filterRows(rows, 'ai').nodes.map((n) => n.id)).toEqual(['person:ada', 'project:atlas', 'publication:p1']);
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

  it('returns the rows unchanged without a slug', () => {
    expect(filterRows(rows, null)).toBe(rows);
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
    expect(s.draggable).toBe(true);
    expect(s.force.repulsion).toBe(200);
    expect(s.force.gravity).toBe(0.03);
    expect(s.force.edgeLength).toEqual([60, 220]);
    expect(s.labelLayout).toEqual({ hideOverlap: true });
  });

  it('lays the graph out once and only settles afterwards', () => {
    expect(series(null).force.friction).toBe(LAYOUT_FRICTION);
    expect(series(null, true).force.friction).toBe(SETTLE_FRICTION);
    // 0: a re-render cannot move a node, so a filter keeps the positions
    expect(SETTLE_FRICTION).toBe(0);
  });

  it('holds only the nodes and links of a filtered research area', () => {
    expect(ids(null)).toHaveLength(rows.nodes.length);
    expect(ids('ai')).toEqual(['person:ada', 'project:atlas', 'publication:p1']);
    expect(series('ai').links.map((l) => l.source)).toEqual(['publication:p1', 'person:ada']);
    expect(ids('nope')).toEqual([]);
  });

  it('has the four node categories in legend order, with their colours', () => {
    const s = series(null);
    expect(CATEGORY_ORDER).toEqual(['person', 'project', 'software', 'publication']);
    expect(s.categories.map((c) => c.name)).toEqual(CATEGORY_ORDER.map((t) => CATEGORY_LABEL[t]));
    expect(s.categories.map((c) => c.itemStyle.color)).toEqual(CATEGORY_ORDER.map((t) => CATEGORY_COLOR[t]));
    expect(node(null, 'person:ada').category).toBe(CATEGORY_ORDER.indexOf('person'));
    expect(node(null, 'publication:p1').category).toBe(CATEGORY_ORDER.indexOf('publication'));
    expect(networkOption(rows, null).legend.data).toEqual(s.categories.map((c) => c.name));
  });

  it('draws a thumbnail as an image symbol and everything else as a circle', () => {
    expect(node(null, 'person:ada').symbol).toBe('image:///assets/image/graph/people/ada.webp');
    expect(node(null, 'project:atlas').symbol).toBe('image:///assets/image/graph/projects/atlas.webp');
    expect(node(null, 'person:bob').symbol).toBe('circle');
    expect(node(null, 'publication:p1').symbol).toBe('circle');
    expect(series(null).symbolKeepAspect).toBe(true);
  });

  it('sizes a publication by its citation count and the rest by type', () => {
    expect(publicationSymbolSize(0)).toBe(6);
    expect(publicationSymbolSize(1e6)).toBe(PUBLICATION_SIZE_CAP);
    expect(PUBLICATION_SIZE_CAP).toBe(20);
    expect(publicationSymbolSize(17)).toBeCloseTo(6 + 3 * Math.log(18), 6);
    expect(node(null, 'publication:p2').symbolSize).toBe(6);
    expect(node(null, 'publication:p1').symbolSize).toBeCloseTo(publicationSymbolSize(17), 6);
    // the other types carry a degree in `value` — never a size
    expect(node(null, 'person:ada').symbolSize).toBeGreaterThan(PUBLICATION_SIZE_CAP);
    expect(node(null, 'project:atlas').symbolSize).toBe(36);
  });

  it('colours a publication by its first research area and falls back to the category colour', () => {
    expect(node(null, 'publication:p1').itemStyle.color).toBe(TAG_PALETTE.ai);
    expect(node(null, 'publication:p2').itemStyle.color).toBe(TAG_PALETTE.pharmacometrics);
    expect(node(null, 'publication:p3').itemStyle.color).toBe(CATEGORY_COLOR.publication);
    // an image node keeps its category colour (it only shows through a circle fallback)
    expect(node(null, 'person:ada').itemStyle.color).toBeUndefined();
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
    expect(n.href).toBe('/projects/#project-modal-atlas');
    expect(n.type).toBe('project');
    expect(n.value).toBe(2);
    // every link endpoint resolves to a node id
    const known = new Set(ids(null));
    for (const l of series(null).links) {
      expect(known.has(l.source)).toBe(true);
      expect(known.has(l.target)).toBe(true);
    }
  });

  it('renders the tooltip inside the canvas as "label\\ntype · detail"', () => {
    const { tooltip } = networkOption(rows, null);
    expect(tooltip.renderMode).toBe('richText');
    // a publication also gets its citation count, the only `value` that means
    // something to a reader (every other type carries a degree)
    expect(tooltip.formatter({ dataType: 'node', data: node(null, 'publication:p1') }))
      .toBe('A paper on AI\nPublication · 2026 · Nature\n17 citations');
    expect(tooltip.formatter({ dataType: 'node', data: node(null, 'publication:p2') }))
      .toBe('A paper on PK\nPublication · 2020 · JPKPD\n0 citations');
    expect(tooltip.formatter({ dataType: 'node', data: node(null, 'person:ada') }))
      .toBe('Ada Lovelace\nPerson · PostDoc');
    // a project's detail is its title, which is already the label: no second time
    expect(tooltip.formatter({ dataType: 'node', data: node(null, 'project:atlas') })).toBe('Atlas\nProject');
    // edges have no tooltip
    expect(tooltip.formatter({ dataType: 'edge', data: undefined })).toBe('');
  });
});
