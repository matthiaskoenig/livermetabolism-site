<script setup lang="ts">
// The network graph of /network/ (client:load island): the five research
// topics as pinned hubs plus every person, publication, project and software
// entry, with the topic buttons and the zoom controls above the canvas.
//
// The rows come from the page's frontmatter (graphRows.ts) and only change
// when the YAML does; the buttons live inside the component rather than in the
// page because this island is hydrated anyway (see CLAUDE.md, "Site chrome",
// for why static chrome is done the other way round).
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { resetChart, roamChart, useChart } from './useChart';
import type { GraphRows } from '../lib/graphRows';
import { networkOption, type NetworkSize } from '../lib/networkOptions';

const props = defineProps<{
  rows: GraphRows;
  /** The research areas, in homepage order: the buttons and what `?topic=` matches. */
  topics: { tag: string; slug: string }[];
}>();

/** Tag name or slug -> slug; null for anything unknown (a stale `?topic=`). */
function slugOf(value: string | null | undefined): string | null {
  if (!value) return null;
  const wanted = value.trim().toLowerCase();
  const topic = props.topics.find((t) => t.tag.toLowerCase() === wanted || t.slug === wanted);
  return topic ? topic.slug : null;
}

/** The focused topic slug, or null for the whole graph. */
const focus = ref<string | null>(null);
/** Set before the chart mounts and on every resize, applied through the CSSOM. */
const height = ref(560);
/** The container in pixels: where the topic hubs are pinned (null = not yet measured). */
const size = ref<NetworkSize | null>(null);
/** False until the chart is up, so the static render carries a short note. */
const ready = ref(false);
/**
 * False for the very first draw only: from then on a re-render must keep the
 * arrangement the layout found instead of simulating it again (see
 * `SETTLE_FRICTION` in networkOptions.ts).
 */
const settled = ref(false);

const chartHeight = () => Math.max(480, Math.round(window.innerHeight * 0.7));

/**
 * Height and container size in one step, from the same path: the width is the
 * element's, the height the one `useChart` is about to write onto it — reading
 * the rect's height instead would give the CSS `min-height` before the first
 * mount.
 */
function measure(): void {
  // a re-measure is always a re-render of a graph that already has its shape
  if (ready.value) settled.value = true;
  height.value = chartHeight();
  const width = el.value?.getBoundingClientRect().width ?? 0;
  size.value = width > 0 ? { width, height: height.value } : null;
}

/**
 * Resizing is debounced: a drag-resize — or a mobile address bar appearing
 * while scrolling, which changes `window.innerHeight` — would otherwise
 * re-render a 213-node simulation on every event.
 */
let resizeTimer: ReturnType<typeof setTimeout> | undefined;
const onResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(measure, 200);
};

// registered before useChart()'s own onMounted, so the height, the container
// size and a `?topic=` focus are in place by the time the chart draws
onMounted(() => {
  measure();
  const slug = slugOf(new URLSearchParams(window.location.search).get('topic'));
  if (slug) focus.value = slug;
  ready.value = true;
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  clearTimeout(resizeTimer);
  window.removeEventListener('resize', onResize);
});

/** A topic button, or a click on a hub: the active topic toggles off again. */
function toggle(slug: string): void {
  // set first: both refs change in one tick, so the graph re-renders once,
  // dimming without moving anything
  settled.value = true;
  focus.value = focus.value === slug ? null : slug;
}

/**
 * Click on a node: a topic hub focuses its neighbourhood, every other node
 * goes to its item. The href was built at build time from ids the schemas
 * restrict (graphRows.ts), and only a site-internal one is followed.
 */
function onClick(params: unknown): void {
  const p = (params ?? {}) as { dataType?: string; data?: { type?: string; id?: string; href?: string } };
  if (p.dataType !== 'node' || !p.data) return;
  const { type, id, href } = p.data;
  if (type === 'topic') {
    toggle(String(id ?? '').replace(/^topic:/, ''));
    return;
  }
  if (typeof href === 'string' && href.startsWith(import.meta.env.BASE_URL)) location.assign(href);
}

// notMerge: false — a focus or height change must not restart the force
// layout, which would rescramble every node (see useChart's ChartOptions)
const el = useChart(
  () => networkOption(props.rows, focus.value, size.value ?? undefined, settled.value),
  () => height.value,
  onClick,
  { notMerge: false },
);

/** Zoom around the middle of the canvas: the wheel is left to the page. */
function zoom(factor: number): void {
  const rect = el.value?.getBoundingClientRect();
  roamChart(el.value, { type: 'graphRoam', zoom: factor, originX: (rect?.width ?? 0) / 2, originY: (rect?.height ?? 0) / 2 });
}

/** Throw the zoom and the panning away and lay the items out afresh. */
function reset(): void {
  settled.value = false;
  resetChart(el.value, networkOption(props.rows, focus.value, size.value ?? undefined));
}
</script>

<template>
  <figure class="network-plot">
    <div class="chart-modes" role="group" aria-label="Focus one research area">
      <button v-for="topic in props.topics" :key="topic.slug" type="button" class="chart-mode-btn network-topic-btn"
        :class="{ active: focus === topic.slug }" :aria-pressed="focus === topic.slug" @click="toggle(topic.slug)">
        {{ topic.tag }}
      </button>
      <span class="chart-mode-gap"></span>
      <button type="button" class="chart-mode-btn network-zoom-btn" aria-label="Zoom in" title="Zoom in" @click="zoom(1.25)">+</button>
      <button type="button" class="chart-mode-btn network-zoom-btn" aria-label="Zoom out" title="Zoom out" @click="zoom(0.8)">−</button>
      <button type="button" class="chart-mode-btn" @click="reset()">Reset</button>
    </div>
    <p v-if="!ready" class="chart-note">Loading the network…</p>
    <div ref="el" class="network-graph" role="img"
      aria-label="Network of the research areas, people, publications, projects and software of the group"></div>
    <figcaption class="chart-note">
      The five research areas are pinned; everything else finds its place around them. Drag a node to move it, drag the
      background to pan, use the buttons to zoom. Click a research area to focus it, any other node to open it. A
      publication is a dot in its research area's colour, sized by its citation count.
    </figcaption>
  </figure>
</template>
