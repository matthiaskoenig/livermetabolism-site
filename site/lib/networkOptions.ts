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
 * Category colours, which are also the legend swatches and the fallback
 * circle of a node without a thumbnail — so they are the colours actually
 * drawn: the theme's primary for the hubs (the ring around every topic
 * thumbnail), `PALETTE` entries for people, projects and software, and grey
 * for the publications, whose dots each take their first topic's
 * `TAG_PALETTE` colour (the figcaption says so).
 */
export const CATEGORY_COLOR: Record<NodeType, string> = {
  topic: PALETTE[0]!, person: PALETTE[1]!, project: PALETTE[2]!, software: PALETTE[5]!, publication: PALETTE[9]!,
};

/** Symbol size of the types that have no citation count: the hubs are the largest. */
export const SYMBOL_SIZE: Record<Exclude<NodeType, 'publication'>, number> = {
  topic: 72, person: 32, project: 36, software: 36,
};

/** Largest publication symbol, however often the paper was cited. */
export const PUBLICATION_SIZE_CAP = 20;

/** Opacity of everything outside the focused topic's neighbourhood. */
export const DIM_OPACITY = 0.15;

/** Radius of the pinned topic pentagon, as a fraction of the shorter canvas side. */
export const HUB_RADIUS = 0.38;

/**
 * `force.friction` of the first layout: ECharts scales every step by it and
 * decays it by 0.992 per tick until the simulation finishes, so this is how
 * energetically the graph arranges itself from its seed positions.
 */
export const LAYOUT_FRICTION = 0.6;

/**
 * `force.friction` of every later render. A re-render (a topic focus, a
 * height change) builds a *new* force instance, which starts at
 * `force.friction` again: with the full 0.6 every node would swing right
 * across the canvas even though ECharts seeds it from the positions it
 * preserved, which is the opposite of the "a focus keeps the layout" the
 * design asks for.
 *
 * The value is deliberately just under ECharts' own convergence threshold
 * (`finished = friction < 0.01` in `forceHelper.js`): the restarted
 * simulation reports itself finished after a single step whose displacement
 * is scaled by 0.009, so the arrangement is kept to well under a pixel and
 * only the styling changes.
 */
export const SETTLE_FRICTION = 0.009;

/** `6 + 3·ln(1 + citations)`, capped: visible at 0 citations, never crowding the rest. */
export function publicationSymbolSize(citations: number): number {
  return Math.min(PUBLICATION_SIZE_CAP, 6 + 3 * Math.log(1 + Math.max(0, citations)));
}

/** The chart container in pixels; without it the hubs are not pinned. */
export interface NetworkSize { width: number; height: number }

/**
 * Where each topic hub is pinned: on a circle of `HUB_RADIUS · min(width,
 * height)` around the centre of the canvas, the first one at 12 o'clock.
 *
 * The force layout seeds a node from its `x`/`y` and writes a `fixed` node's
 * position back on every tick (`simpleLayoutHelper.js`, `forceLayout.js`), so
 * the hubs stay spread out while their items relax around them; the
 * coordinates are container pixels, the same rect the simulation uses.
 */
function pinnedHubs(rows: GraphRows, size?: NetworkSize): Map<string, { x: number; y: number; fixed: true }> {
  const pinned = new Map<string, { x: number; y: number; fixed: true }>();
  if (!size || size.width <= 0 || size.height <= 0) return pinned;
  const hubs = rows.nodes.filter((n) => n.type === 'topic');
  const radius = HUB_RADIUS * Math.min(size.width, size.height);
  hubs.forEach((hub, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / hubs.length;
    pinned.set(hub.id, {
      x: size.width / 2 + radius * Math.cos(angle),
      y: size.height / 2 + radius * Math.sin(angle),
      fixed: true,
    });
  });
  return pinned;
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
  label?: { show: boolean; position: 'bottom'; fontSize: number; fontWeight: 'bold'; color: string; backgroundColor: string; padding: [number, number]; borderRadius: number };
  itemStyle: { color?: string; opacity: number };
  /** Pinned hubs only: the pentagon position the force layout keeps them at. */
  x?: number;
  y?: number;
  fixed?: true;
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
 *
 * `size` pins the topic hubs (see `pinnedHubs()`), and `settled` says this is
 * a re-render of a graph that has already found its shape, so the layout must
 * only settle rather than start over (see `SETTLE_FRICTION`).
 */
export function networkOption(rows: GraphRows, focus: string | null, size?: NetworkSize, settled = false) {
  const inside = focus ? neighbourhood(rows, focus) : new Set<string>();
  // an unknown slug (a stale ?topic=) leaves the graph undimmed
  const dimming = inside.size > 0;
  const opacity = (id: string) => (dimming && !inside.has(id) ? DIM_OPACITY : 1);
  const pinned = pinnedHubs(rows, size);

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
    // the hubs are the only permanent labels: bold, below the node and on a
    // white pill, so they read over the artwork and over the edges
    ...(n.type === 'topic'
      ? { label: { show: true, position: 'bottom' as const, fontSize: 13, fontWeight: 'bold' as const, color: INK, backgroundColor: '#fff', padding: [2, 6] as [number, number], borderRadius: 4 } }
      : {}),
    ...(pinned.get(n.id) ?? {}),
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
      const second = n.detail && n.detail !== n.name ? `${type} · ${n.detail}` : type;
      // `value` is a citation count on a publication and a degree elsewhere,
      // which means nothing to a reader — only the citations are shown
      return n.type === 'publication'
        ? `${n.name}\n${second}\n${n.value} citation${n.value === 1 ? '' : 's'}`
        : `${n.name}\n${second}`;
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
        // 'move' and not true: a wheel over a 630 px canvas would zoom instead
        // of scrolling the page, so panning is by drag and zooming by button
        roam: 'move',
        draggable: true,
        // the force layout spreads the nodes over the whole canvas and the
        // outermost ones would sit half outside it
        zoom: 0.82,
        symbolKeepAspect: true,
        // with the hubs pinned on the pentagon, a weak gravity and a strong
        // repulsion pull each item out towards its own topic
        force: { repulsion: 200, gravity: 0.03, friction: settled ? SETTLE_FRICTION : LAYOUT_FRICTION, edgeLength: [60, 220] },
        // safety net for the hover labels (the hub labels cannot collide now)
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
