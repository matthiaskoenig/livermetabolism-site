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
 * Node identity: ECharts resolves a link's `source`/`target` against a node's
 * `id` before its `name` (`createGraphFromNodeEdge`), so a node keeps the row
 * id (`person:ada`) as its `id` and the human label as its `name` — labels are
 * what the canvas draws and need not be unique.
 *
 * The node objects carry the row's `type`, `detail` and `href` along, which is
 * what the component's click handler and the tooltip read back out of
 * `params.data`; nothing of that is markup.
 */
import { FONT, INK, MUTED, PALETTE, TAG_PALETTE, tooltip } from './chartOptions';
import type { GraphRows, NodeType } from './graphRows';

/** Node types in the order of the legend and of the `categories` array. */
export const CATEGORY_ORDER: NodeType[] = ['topic', 'person', 'project', 'software', 'publication'];

/** Legend entry per node type (the legend toggles a whole type, edges included). */
export const CATEGORY_LABEL: Record<NodeType, string> = {
  topic: 'Research areas', person: 'People', project: 'Projects', software: 'Software', publication: 'Publications',
};

/** Second tooltip line per node type (singular, unlike the legend label). */
export const TYPE_LABEL: Record<NodeType, string> = {
  topic: 'Research area', person: 'Person', project: 'Project', software: 'Software', publication: 'Publication',
};

/**
 * Category colours: `PALETTE` order for people, projects and software, the
 * dark ink of the theme for the topic hubs, and grey for the publications,
 * whose nodes each take their first topic's `TAG_PALETTE` colour instead.
 */
export const CATEGORY_COLOR: Record<NodeType, string> = {
  topic: PALETTE[4]!, person: PALETTE[0]!, project: PALETTE[1]!, software: PALETTE[2]!, publication: PALETTE[9]!,
};

/** Symbol size of the types that have no citation count: the hubs are the largest. */
export const SYMBOL_SIZE: Record<Exclude<NodeType, 'publication'>, number> = {
  topic: 64, person: 34, project: 32, software: 32,
};

/** Largest publication symbol, however often the paper was cited. */
export const PUBLICATION_SIZE_CAP = 28;

/** Opacity of everything outside the focused topic's neighbourhood. */
export const DIM_OPACITY = 0.15;

/** `8 + 4·ln(1 + citations)`, capped: readable at 0 citations, bounded at the top. */
export function publicationSymbolSize(citations: number): number {
  return Math.min(PUBLICATION_SIZE_CAP, 8 + 4 * Math.log(1 + Math.max(0, citations)));
}

/** A topic edge is drawn long, every other edge short (see `force.edgeLength`). */
const LINK_VALUE = (kind: GraphRows['links'][number]['kind']) => (kind === 'topic' ? 1 : 2);

export interface NetworkNode {
  /** The row id (`person:ada`); links resolve against this. */
  id: string;
  /** The label ECharts draws — not necessarily unique. */
  name: string;
  category: number;
  symbol: string;
  symbolSize: number;
  value: number;
  type: NodeType;
  detail: string;
  href: string;
  /** Only the topic hubs carry a label on the canvas; the rest show theirs on hover. */
  label?: { show: boolean; fontSize?: number; fontWeight?: 'bold'; backgroundColor?: string; padding?: [number, number] };
  itemStyle: { color?: string; opacity: number };
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number;
  lineStyle: { opacity: number };
}

/**
 * The ids a topic focus keeps bright: the topic hub, every node tagged with
 * it, and the direct neighbours of those nodes. Empty for an unknown slug,
 * which `networkOption()` reads as "no focus".
 */
export function neighbourhood(rows: GraphRows, slug: string): Set<string> {
  const inside = new Set<string>();
  const hub = `topic:${slug}`;
  if (!rows.nodes.some((n) => n.id === hub)) return inside;
  inside.add(hub);
  for (const n of rows.nodes) if (n.topics.includes(slug)) inside.add(n.id);
  // one hop out from the topic's own items (the set above stays the core)
  const core = new Set(inside);
  for (const l of rows.links) {
    if (core.has(l.source)) inside.add(l.target);
    if (core.has(l.target)) inside.add(l.source);
  }
  return inside;
}

/**
 * The force-directed graph of all node types, optionally focused on one topic
 * slug: a focus keeps the layout and dims everything outside
 * `neighbourhood()` to `DIM_OPACITY` instead of removing it.
 */
export function networkOption(rows: GraphRows, focus: string | null) {
  const inside = focus ? neighbourhood(rows, focus) : new Set<string>();
  // an unknown slug (a stale ?topic=) leaves the graph undimmed
  const dimming = inside.size > 0;
  const opacity = (id: string) => (dimming && !inside.has(id) ? DIM_OPACITY : 1);

  const data: NetworkNode[] = rows.nodes.map((n) => ({
    id: n.id,
    name: n.label,
    category: CATEGORY_ORDER.indexOf(n.type),
    symbol: n.image ? `image://${n.image}` : 'circle',
    symbolSize: n.type === 'publication' ? publicationSymbolSize(n.value) : SYMBOL_SIZE[n.type],
    value: n.value,
    type: n.type,
    detail: n.detail,
    href: n.href,
    // the hubs are the only permanent labels, and they overlap in the middle
    // of the graph: bold, dark and over a light plate to stay readable
    ...(n.type === 'topic' ? { label: { show: true, fontSize: 13, fontWeight: 'bold' as const, backgroundColor: 'rgba(255,255,255,0.82)', padding: [2, 4] as [number, number] } } : {}),
    itemStyle: {
      // a publication has no thumbnail: it is a dot in its first topic's colour
      ...(n.type === 'publication' ? { color: TAG_PALETTE[n.topics[0] ?? ''] ?? CATEGORY_COLOR.publication } : {}),
      opacity: opacity(n.id),
    },
  }));

  const links: NetworkLink[] = rows.links.map((l) => ({
    source: l.source,
    target: l.target,
    value: LINK_VALUE(l.kind),
    // an edge stays bright only while both of its endpoints do
    lineStyle: { opacity: Math.min(opacity(l.source), opacity(l.target)) },
  }));

  const categories = CATEGORY_ORDER.map((type) => ({ name: CATEGORY_LABEL[type], itemStyle: { color: CATEGORY_COLOR[type] } }));

  return {
    animation: false,
    tooltip: tooltip((p: { dataType?: string; data?: NetworkNode }) => {
      const n = p.data;
      if (p.dataType !== 'node' || !n) return '';
      const type = TYPE_LABEL[n.type];
      // a project's detail is its title, which is the label already
      return `${n.name}\n${n.detail && n.detail !== n.name ? `${type} · ${n.detail}` : type}`;
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
        roam: true,
        draggable: true,
        // the force layout spreads the nodes over the whole canvas and the
        // outermost ones would sit half outside it; roam zooms back in
        zoom: 0.82,
        symbolKeepAspect: true,
        force: { repulsion: 120, gravity: 0.08, friction: 0.6, edgeLength: [60, 160] },
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
