/**
 * The ECharts option of the network graph (`/network/`, `NetworkGraph.vue`).
 *
 * Same rules as `chartOptions.ts`, whose `PALETTE`, `TAG_PALETTE` and
 * `tooltip()` this module reuses: pure functions over the rows from
 * `graphRows.ts`, no ECharts import (the library is pulled in by
 * `useChart.ts` alone) and a `renderMode: 'richText'` tooltip, which draws
 * inside the canvas instead of injecting an HTML element with inline styles
 * (the site's CSP has no 'unsafe-inline', see CLAUDE.md).
 *
 * The five research areas are not in the graph: they **filter** it, which is
 * what `filterRows()` does — the option then holds only the nodes of one area
 * and the links between two of them.
 *
 * Node identity: ECharts resolves a link's `source`/`target` against a node's
 * `id` before its `name` (`createGraphFromNodeEdge`), so a node keeps the row
 * id (`person:ada`) as its `id` and the human label as its `name` — labels are
 * what the canvas draws and need not be unique.
 *
 * The node objects carry the row's `type`, `detail` and `href` along, which is
 * what the component's click handler and the tooltip read back out of
 * `params.data`; nothing of that is markup.
 */
import { FONT, INK, MUTED, PALETTE, TAG_PALETTE, tooltip, type CitationCountStrings } from './chartOptions';
import { fmt } from './i18n/format';
import type { GraphRows, NodeType } from './graphRows';

/** Node types in the order of the legend and of the `categories` array. */
export const CATEGORY_ORDER: NodeType[] = ['person', 'project', 'software', 'publication'];

/**
 * The legend label and the tooltip's second line per node type - a narrow,
 * serialisable bundle (`NetworkGraph.vue` is a `client:load` island, so its
 * props, and therefore what `networkOption()` takes, must serialise into
 * `astro-island`), built by `network.astro` from the UI catalog. The legend
 * label is plural ("People"), the tooltip line singular ("Person").
 */
export interface NetworkLabels {
  category: Record<NodeType, string>;
  type: Record<NodeType, string>;
  citation: CitationCountStrings;
}

/**
 * Category colours, which are also the legend swatches and the fallback
 * circle of a node without a thumbnail — so they are the colours actually
 * drawn: `PALETTE` entries for people, projects and software, and grey for
 * the publications, whose dots each take their first research area's
 * `TAG_PALETTE` colour (the figcaption says so).
 */
export const CATEGORY_COLOR: Record<NodeType, string> = {
  person: PALETTE[1]!, project: PALETTE[2]!, software: PALETTE[5]!, publication: PALETTE[9]!,
};

/**
 * The symbol per node type. A person is drawn as their photo (the `image://`
 * symbol below) and falls back to a circle without one; nothing else has a
 * thumbnail, so projects are rounded squares, software diamonds and
 * publications circles, each in its category colour.
 */
export const SYMBOL: Record<NodeType, string> = {
  person: 'circle', project: 'roundRect', software: 'diamond', publication: 'circle',
};

/**
 * How a node's size follows its degree — the number of nodes it is connected
 * to *in the view being drawn*, so a filtered graph re-sizes with it:
 * `min + k · sqrt(degree)`, capped. An isolated node is drawn at `min`.
 */
export const SIZE: Record<NodeType, { min: number; k: number; cap: number }> = {
  person: { min: 24, k: 6, cap: 56 },
  project: { min: 10, k: 4, cap: 32 },
  software: { min: 10, k: 4, cap: 32 },
  publication: { min: 6, k: 3, cap: 22 },
};

/**
 * How the view may be roamed: 'move' and not `true`, because a wheel over a
 * 630 px canvas would zoom the graph instead of scrolling the page (the
 * component has zoom buttons, and it switches roaming off while a node is
 * dragged — see `enableNodeDragging()`).
 */
export const ROAM = 'move';

/** Zoom of the initial view: the whole graph is wide, one research area is not. */
export const ZOOM_ALL = 0.6;
export const ZOOM_TOPIC = 1;

/**
 * `force.friction` of the first layout: ECharts scales every step by it and
 * decays it by 0.992 per tick until the simulation finishes, so this is how
 * energetically the graph arranges itself from its seed positions.
 */
export const LAYOUT_FRICTION = 0.6;

/**
 * `force.friction` of a render that must not move anything: a re-render
 * builds a *new* force instance, which starts at `force.friction` again, so
 * at the full 0.6 a mere height change would swing every node right across
 * the canvas even though ECharts seeds it from the positions it preserved.
 * At 0 the restarted simulation moves nothing at all and stops after its
 * first step. Used for resizes only — a filter change is meant to
 * re-arrange (see `NetworkRender.relayout`).
 */
export const SETTLE_FRICTION = 0;

/** `min + k · sqrt(degree)` for the type, capped (see `SIZE`). */
export function symbolSize(type: NodeType, degree: number): number {
  const { min, k, cap } = SIZE[type];
  return Math.min(cap, min + k * Math.sqrt(Math.max(0, degree)));
}

/** How many links of `rows` touch each node id (0 is simply absent). */
export function degrees(rows: GraphRows): Map<string, number> {
  const degree = new Map<string, number>();
  for (const l of rows.links) {
    degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
    degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
  }
  return degree;
}

/** Every edge is drawn at the same length (see `force.edgeLength`). */
const LINK_VALUE = 2;

export interface NetworkNode {
  /** The row id (`person:ada`); links resolve against this. */
  id: string;
  /** The label ECharts draws — not necessarily unique. */
  name: string;
  category: number;
  symbol: string;
  symbolSize: number;
  /** The node's degree in the view being drawn — what its size comes from. */
  value: number;
  type: NodeType;
  detail: string;
  href: string;
  /** Citations of a publication, for the tooltip; null for every other type. */
  citations: number | null;
  itemStyle: { color?: string };
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number;
}

/**
 * The drawn graph: with a `slug`, every node whose `topics` include it (a
 * person's are derived from their publications, so a co-author of an AI paper
 * stays in the AI graph) and every link between two of them; without one, the
 * whole graph.
 *
 * Either way only *connected* nodes are kept: a node whose links all went to
 * another research area would be a lone symbol in the void, so the view
 * always is a network.
 */
export function filterRows(rows: GraphRows, slug: string | null): GraphRows {
  const inArea = slug ? rows.nodes.filter((n) => n.topics.includes(slug)) : rows.nodes;
  const kept = new Set(inArea.map((n) => n.id));
  const links = rows.links.filter((l) => kept.has(l.source) && kept.has(l.target));
  const connected = new Set(links.flatMap((l) => [l.source, l.target]));
  return { nodes: inArea.filter((n) => connected.has(n.id)), links };
}

export interface NetworkRender {
  /**
   * True — the default — runs the force layout: the first draw and every
   * filter change, where the remaining nodes must find a new arrangement and
   * spread over the canvas. False keeps the positions the layout found (a
   * resize, which must not reshuffle the graph); see `SETTLE_FRICTION`.
   */
  relayout?: boolean;
}

/**
 * The force-directed graph, either whole (`topic` null) or narrowed to one
 * research area.
 *
 * Node sizes come from the degree *within the drawn view*, so filtering to
 * one area re-sizes every node by how much of that area it connects to.
 */
export function networkOption(rows: GraphRows, topic: string | null, labels: NetworkLabels, { relayout = true }: NetworkRender = {}) {
  const shown = filterRows(rows, topic);
  const degree = degrees(shown);

  const data: NetworkNode[] = shown.nodes.map((n) => ({
    id: n.id,
    name: n.label,
    category: CATEGORY_ORDER.indexOf(n.type),
    // only a person carries a photo; everything else is a plain symbol
    symbol: n.image ? `image://${n.image}` : SYMBOL[n.type],
    symbolSize: symbolSize(n.type, degree.get(n.id) ?? 0),
    value: degree.get(n.id) ?? 0,
    type: n.type,
    detail: n.detail,
    href: n.href,
    citations: n.citations,
    itemStyle: {
      // a publication is a dot in its first research area's colour
      ...(n.type === 'publication' ? { color: TAG_PALETTE[n.topics[0] ?? ''] ?? CATEGORY_COLOR.publication } : {}),
    },
  }));

  const links: NetworkLink[] = shown.links.map((l) => ({ source: l.source, target: l.target, value: LINK_VALUE }));

  const categories = CATEGORY_ORDER.map((type) => ({ name: labels.category[type], itemStyle: { color: CATEGORY_COLOR[type] } }));

  return {
    animation: false,
    tooltip: tooltip((p: { dataType?: string; data?: NetworkNode }) => {
      const n = p.data;
      if (p.dataType !== 'node' || !n) return '';
      const type = labels.type[n.type];
      // a project's detail is its title, which is the label already
      const second = n.detail && n.detail !== n.name ? `${type} · ${n.detail}` : type;
      // the size is the degree; a paper's citation count is worth a line of
      // its own, and it is the only number a reader can interpret
      return n.citations === null
        ? `${n.name}\n${second}`
        : `${n.name}\n${second}\n${fmt(n.citations === 1 ? labels.citation.one : labels.citation.other, { count: n.citations })}`;
    }),
    legend: {
      data: categories.map((c) => c.name),
      bottom: 0,
      itemHeight: 8,
      itemWidth: 12,
      textStyle: { color: MUTED, fontFamily: FONT, fontSize: 11 },
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: ROAM,
        // the whole canvas pans, not only the graph's own bounding rect
        // (ECharts' default), so a drag on empty space always works
        roamTrigger: 'global',
        draggable: true,
        // the whole graph is one wide star around the most prolific author, so
        // it is drawn zoomed out; one research area fills the canvas at 1
        zoom: topic ? ZOOM_TOPIC : ZOOM_ALL,
        // only matters for the photo symbols of the people
        symbolKeepAspect: true,
        force: {
          repulsion: 200, gravity: 0.03, edgeLength: [60, 220],
          friction: relayout ? LAYOUT_FRICTION : SETTLE_FRICTION,
          // seeds a fresh layout (one drawn without the previous positions,
          // i.e. after a filter change) on a circle instead of at random
          initLayout: 'circular',
        },
        // safety net for the labels, which are shown on hover
        labelLayout: { hideOverlap: true },
        categories,
        data,
        links,
        label: { show: false, position: 'right', color: INK, fontFamily: FONT, fontSize: 11, width: 180, overflow: 'truncate' },
        lineStyle: { color: '#bdc3c7', width: 1, curveness: 0.1 },
        emphasis: { focus: 'adjacency', label: { show: true, width: 260, overflow: 'truncate' }, lineStyle: { width: 2 } },
      },
    ],
  };
}
