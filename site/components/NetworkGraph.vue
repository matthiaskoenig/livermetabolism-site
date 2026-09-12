<script setup lang="ts">
// The network graph of /network/ (client:load island): every person,
// publication, project and software entry of the lab, with the research-area
// filter and the zoom controls above the canvas.
//
// The rows come from the page's frontmatter (graphRows.ts) and only change
// when the YAML does; the buttons live inside the component rather than in the
// page because this island is hydrated anyway (see CLAUDE.md, "Site chrome",
// for why static chrome is done the other way round).
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { enableNodeDragging, resetChart, roamChart, useChart } from './useChart';
import type { GraphRows } from '../lib/graphRows';
import { ROAM, networkOption } from '../lib/networkOptions';

const props = defineProps<{
  rows: GraphRows;
  /** The research areas, in homepage order: the filter buttons and what `?topic=` matches. */
  topics: { tag: string; slug: string }[];
}>();

/** Tag name or slug -> slug; null for anything unknown (a stale `?topic=`). */
function slugOf(value: string | null | undefined): string | null {
  if (!value) return null;
  const wanted = value.trim().toLowerCase();
  const topic = props.topics.find((t) => t.tag.toLowerCase() === wanted || t.slug === wanted);
  return topic ? topic.slug : null;
}

/** The research area the graph is narrowed to, or null for all of it. */
const topic = ref<string | null>(null);
/** Set before the chart mounts and on every resize, applied through the CSSOM. */
const height = ref(560);
/** False until the chart is up, so the static render carries a short note. */
const ready = ref(false);
/**
 * Whether the next render re-runs the force layout. A filter change does (the
 * remaining nodes find a new arrangement and spread over the canvas, drawn
 * from scratch so ECharts seeds them afresh); a resize does not, or a changed
 * viewport height would reshuffle the graph.
 */
const relayout = ref(true);

const chartHeight = () => Math.max(480, Math.round(window.innerHeight * 0.7));

function measure(): void {
  // a re-measure must keep the arrangement the layout already found
  if (ready.value) relayout.value = false;
  height.value = chartHeight();
}

/**
 * Resizing is debounced: a drag-resize — or a mobile address bar appearing
 * while scrolling, which changes `window.innerHeight` — would otherwise
 * re-render a 208-node graph on every event.
 */
let resizeTimer: ReturnType<typeof setTimeout> | undefined;
const onResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(measure, 200);
};

// registered before useChart()'s own onMounted, so the height and a `?topic=`
// selection are in place by the time the chart draws
onMounted(() => {
  measure();
  topic.value = slugOf(new URLSearchParams(window.location.search).get('topic'));
  ready.value = true;
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  clearTimeout(resizeTimer);
  window.removeEventListener('resize', onResize);
});

/** A filter button: `null` is "All". */
function select(slug: string | null): void {
  if (slug === topic.value) return;
  // set first: both refs change in one tick, so the graph re-renders once —
  // from scratch, so the remaining nodes are laid out afresh
  relayout.value = true;
  topic.value = slug;
}

/**
 * Click on a node: go to its item. The href was built at build time from ids
 * the schemas restrict (graphRows.ts), and only a site-internal one is
 * followed.
 */
function onClick(params: unknown): void {
  const p = (params ?? {}) as { dataType?: string; data?: { href?: string } };
  if (p.dataType !== 'node' || !p.data) return;
  const { href } = p.data;
  if (typeof href === 'string' && href.startsWith(import.meta.env.BASE_URL)) location.assign(href);
}

// notMerge follows `relayout`: a filter change is drawn from scratch, so the
// force layout starts over and re-arranges what is left; a resize merges, so
// the preserved node positions survive it (see useChart's ChartOptions)
const el = useChart(
  () => networkOption(props.rows, topic.value, { relayout: relayout.value }),
  () => height.value,
  onClick,
  { notMerge: () => relayout.value },
);

// after useChart's own onMounted, so the chart instance exists
let unbindDrag: () => void = () => {};
onMounted(() => { unbindDrag = enableNodeDragging(el.value, ROAM); });
onBeforeUnmount(() => unbindDrag());

/** Zoom around the middle of the canvas: the wheel is left to the page. */
function zoom(factor: number): void {
  const rect = el.value?.getBoundingClientRect();
  roamChart(el.value, { type: 'graphRoam', zoom: factor, originX: (rect?.width ?? 0) / 2, originY: (rect?.height ?? 0) / 2 });
}

/** Throw the zoom and the panning away and lay the nodes out afresh. */
function reset(): void {
  resetChart(el.value, networkOption(props.rows, topic.value));
}
</script>

<template>
  <figure class="network-plot">
    <div class="chart-modes" role="group" aria-label="Show one research area">
      <button type="button" class="chart-mode-btn network-topic-btn" :class="{ active: topic === null }"
        :aria-pressed="topic === null" @click="select(null)">All</button>
      <button v-for="area in props.topics" :key="area.slug" type="button" class="chart-mode-btn network-topic-btn"
        :class="{ active: topic === area.slug }" :aria-pressed="topic === area.slug" @click="select(area.slug)">
        {{ area.tag }}
      </button>
      <span class="chart-mode-gap"></span>
      <button type="button" class="chart-mode-btn network-zoom-btn" aria-label="Zoom in" title="Zoom in" @click="zoom(1.25)">+</button>
      <button type="button" class="chart-mode-btn network-zoom-btn" aria-label="Zoom out" title="Zoom out" @click="zoom(0.8)">−</button>
      <button type="button" class="chart-mode-btn" @click="reset()">Reset</button>
    </div>
    <p v-if="!ready" class="chart-note">Loading the network…</p>
    <div ref="el" class="network-graph" role="img"
      aria-label="Network of the people, publications, projects and software of the group"></div>
    <figcaption class="chart-note">
      Pick a research area to show only its people, publications, projects and software; the graph re-arranges itself
      around what is left. Drag a node to move it, drag the background to pan, use the buttons to zoom. Clicking a node
      opens it on the site. People carry their photo, projects are squares and software diamonds; a publication is a
      dot in its research area's colour. Every node is sized by how many people, papers, projects and tools it
      connects to.
    </figcaption>
  </figure>
</template>
