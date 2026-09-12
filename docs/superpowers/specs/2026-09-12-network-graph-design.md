# Network graph of people, publications, projects, and software: design

Date: 2026-09-12
Status: approved; implemented by `docs/superpowers/plans/2026-09-12-network-graph.md`

## Goal

A navigable graph on a new `/network/` page that connects the five research topics, the people, the publications, the projects, and the software of the lab, with images as nodes; every node leads to the item where it lives on the site.

## Decisions

| Topic | Decision |
|---|---|
| Page | `/network/` (`site/pages/network.astro`): one full-width graph island (`NetworkGraph.vue`, `client:load`, ~70 vh), the five topic buttons above it, the legend inside the chart. "Network" is a top-level navbar entry after "Research"; each topic section on the homepage links to `/network/?topic=<tag>`. |
| Library | ECharts `GraphChart` (`echarts/charts`), force layout, `roam` (zoom and pan), categories per node type for the legend, `emphasis.focus: 'adjacency'`, tooltips `renderMode: 'richText'`. Registered in `useChart.ts` beside the existing charts. |
| Nodes | Five topics (hub artwork, largest), people (round photos), projects and software (square thumbnails), publications (circles coloured by their first topic, sized by citation count, `symbolSize = 8 + 4·ln(1 + citations)` capped at 28). Image nodes use `symbol: 'image://<asset url>'` with `symbolKeepAspect`; a node without an image is a circle in its category colour. |
| Edges | item → topic from `tags` (people have no tags: their topics are the union of their publications' tags, no edge drawn); publication → each id in `people`; project → each id in `publications`; software → each id in `publications`; person → project and person → software from their `people` lists. Deduplicated; only between existing nodes. |
| Density | About 210 nodes and 800 edges. The legend toggles node types (ECharts hides their edges with them). A topic focus (click a hub or a topic button, or `?topic=<tag>`) keeps the layout and dims every node and edge outside the topic's items and their direct neighbours to 15 % opacity; clicking the active topic again releases. |
| Navigation | Hover: name, type, and a detail line (year and journal; role; project title; software name; topic description). Click: `location.assign(node.href)` where `href` was built at build time through `url()`: topic → `/#<slug>`, person → `/people/#person-modal-<id>`, project → `/projects/#project-modal-<id>`, software → `/research/#software-<id>`, publication → `/publications/#pub-<id>`. The modal router and the anchor highlight of those pages do the rest; the browser's back button returns to the graph. |
| Thumbnails | `scripts/graph-thumbs.ts` (Node 24 + `sharp`, which Astro already depends on) writes once into `public/assets/image/graph/`: `people/<id>.webp` 96×96 circular (transparent corners) from `public/assets/image/people/128/`, `projects/<id>.webp` and `software/<id>.webp` 96×96 centre-cropped from the first image of the entry, `topics/<slug>.webp` 160×160 centre-cropped from `public/assets/image/tags/`. Output is committed (like the 128 px avatars); `npm run graph:thumbs` regenerates it and is idempotent; a missing source image is skipped with a warning and the node falls back to a circle. |
| Data | `site/lib/graphRows.ts`: `graphRows({ tags, people, publications, projects, software, citations, base })` → `{ nodes: GraphNode[], links: GraphLink[] }`, pure and unit-tested, computed in the page frontmatter; the island receives the rows as props (about 60 KB before compression — acceptable for a page whose content is the graph). |
| Security | Node hrefs are internal paths built by `url()` from ids that the schemas restrict; the click handler only navigates to an `href` that starts with `import.meta.env.BASE_URL`. Labels and detail lines are text (richText tooltip). No new CSP host. |
| Release | 0.8.0 with `release-notes/0.8.0.md`, tagged after the page merges. |

## Rows

```ts
type NodeType = 'topic' | 'person' | 'project' | 'software' | 'publication';
interface GraphNode { id: string; type: NodeType; label: string; detail: string; href: string; image: string | null; topics: string[]; value: number }
interface GraphLink { source: string; target: string; kind: 'topic' | 'author' | 'project' | 'software' | 'member' }
```

Ids are `<type>:<data id>` (`topic:<slug>`). `value` is the citation count for publications, the number of connected items for the rest (used for the tooltip only). `image` is the asset URL of the thumbnail or `null`.

## Chart

`site/lib/networkOptions.ts`: `networkOption(rows, focus: string | null)` (pure, no ECharts import) returns the option: `series[0]` of `type: 'graph'`, `layout: 'force'` (`repulsion` 120, `gravity` 0.08, `edgeLength` by kind: topic 160, others 60, `friction` 0.6), `roam: true`, `draggable: true`, `categories` in the order topic, person, project, software, publication with the category colours (`PALETTE` order for person/project/software, `TAG_PALETTE` per publication node's first topic via `itemStyle`), `label` shown for topics only (people and projects on hover), `lineStyle` grey with `curveness` 0.1, `emphasis.focus: 'adjacency'`; when `focus` is a topic slug, nodes and links outside `neighbourhood(rows, slug)` get `itemStyle.opacity`/`lineStyle.opacity` 0.15. `neighbourhood()` is exported and tested. `NETWORK_HEIGHT` is a fraction of the viewport computed in the component (`Math.max(480, window.innerHeight * 0.7)`), applied through the CSSOM as the other charts do.

## Testing

Vitest: `graphRows` (node ids unique; every link endpoint exists; counts: 5 topics, one node per person/project/software/publication; a publication's authors, a project's publications, and a software's publications become links; people topics derived; citation sizing; hrefs carry the base path), `networkOption`/`neighbourhood` (categories order, dimming outside the focus, richText tooltip, image symbol strings), the thumbnail script's path mapping (pure helper) with the real data (every person has a source image). Playwright: `/network/` renders a canvas and the five topic buttons, `?topic=AI` marks the AI button active, zero console errors; the navbar entry exists; the existing suites stay green.
