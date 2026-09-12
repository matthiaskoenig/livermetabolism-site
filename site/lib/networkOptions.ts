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
import { FONT, INK, MUTED, PALETTE, TAG_PALETTE, tooltip } from './chartOptions';
import type { GraphRows, NodeType } from './graphRows';

/** Node types in the order of the legend and of the `categories` array. */
export const CATEGORY_ORDER: NodeType[] = ['person', 'project', 'software', 'publication'];

/** Legend entry per node type (the legend toggles a whole type, edges included). */
export const CATEGORY_LABEL: Record<NodeType, string> = {
  person: 'People', project: 'Projects', software: 'Software', publication: 'Publications',
};

/** Second tooltip line per node type (singular, unlike the legend label). */
export const TYPE_LABEL: Record<NodeType, string> = {
  person: 'Person', project: 'Project', software: 'Software', publication: 'Publication',
};

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

/** Symbol size of the types that have no citation count. */
export const SYMBOL_SIZE: Record<Exclude<NodeType, 'publication'>, number> = {
  person: 32, project: 36, software: 36,
};

/** Largest publication symbol, however often the paper was cited. */
export const PUBLICATION_SIZE_CAP = 20;

/**
 * `force.friction` of the first layout: ECharts scales every step by it and
 * decays it by 0.992 per tick until the simulation finishes, so this is how
 * energetically the graph arranges itself from its seed positions.
 */
export const LAYOUT_FRICTION = 0.6;

/**
 * `force.friction` of every later render. A re-render (a research-area
 * filter, a height change) builds a *new* force instance, which starts at
 * `force.friction` again: at the full 0.6 every node would swing right across
 * the canvas even though ECharts seeds it from the positions it preserved.
 * At 0 the restarted simulation moves nothing at all and stops after its
 * first step, so the nodes that survive a filter keep their places.
 */
export const SETTLE_FRICTION = 0;

/** `6 + 3·ln(1 + citations)`, capped: visible at 0 citations, never crowding the rest. */
export function publicationSymbolSize(citations: number): number {
  return Math.min(PUBLICATION_SIZE_CAP, 6 + 3 * Math.log(1 + Math.max(0, citations)));
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
  value: number;
  type: NodeType;
  detail: string;
  href: string;
  itemStyle: { color?: string };
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number;
}

/**
 * The rows of one research area: every node whose `topics` include `slug`
 * (a person's are derived from their publications, so a co-author of an AI
 * paper stays in the AI graph) and every link between two of them. `null`
 * returns the rows unchanged.
 */
export function filterRows(rows: GraphRows, slug: string | null): GraphRows {
  if (!slug) return rows;
  const nodes = rows.nodes.filter((n) => n.topics.includes(slug));
  const kept = new Set(nodes.map((n) => n.id));
  return { nodes, links: rows.links.filter((l) => kept.has(l.source) && kept.has(l.target)) };
}

/**
 * The force-directed graph, either whole (`topic` null) or narrowed to one
 * research area.
 *
 * `settled` says this is a re-render of a graph that has already found its
 * shape, so the layout must not start over (see `SETTLE_FRICTION`).
 */
export function networkOption(rows: GraphRows, topic: string | null, settled = false) {
  const shown = filterRows(rows, topic);

  const data: NetworkNode[] = shown.nodes.map((n) => ({
    id: n.id,
    name: n.label,
    category: CATEGORY_ORDER.indexOf(n.type),
    symbol: n.image ? `image://${n.image}` : 'circle',
    symbolSize: n.type === 'publication' ? publicationSymbolSize(n.value) : SYMBOL_SIZE[n.type],
    value: n.value,
    type: n.type,
    detail: n.detail,
    href: n.href,
    itemStyle: {
      // a publication has no thumbnail: it is a dot in its first area's colour
      ...(n.type === 'publication' ? { color: TAG_PALETTE[n.topics[0] ?? ''] ?? CATEGORY_COLOR.publication } : {}),
    },
  }));

  const links: NetworkLink[] = shown.links.map((l) => ({ source: l.source, target: l.target, value: LINK_VALUE }));

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
        // without the research areas as anchors the graph is one wide star
        // around the most prolific author, so it is drawn well zoomed out;
        // the zoom buttons take it from there
        zoom: 0.6,
        symbolKeepAspect: true,
        force: { repulsion: 200, gravity: 0.03, friction: settled ? SETTLE_FRICTION : LAYOUT_FRICTION, edgeLength: [60, 220] },
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
