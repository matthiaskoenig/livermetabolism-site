<script setup lang="ts">
// The network graph of /network/ (client:load island): the five research
// topics as hubs plus every person, publication, project and software entry,
// with the topic buttons above the canvas.
//
// The rows come from the page's frontmatter (graphRows.ts) and only change
// when the YAML does; the buttons live inside the component rather than in the
// page because this island is hydrated anyway (see CLAUDE.md, "Site chrome",
// for why static chrome is done the other way round).
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useChart } from './useChart';
import type { GraphRows } from '../lib/graphRows';
import { networkOption } from '../lib/networkOptions';

const props = defineProps<{
  rows: GraphRows;
  /** The research areas, in homepage order: the buttons and what `?topic=` matches. */
  topics: { tag: string; slug: string }[];
  /** Pre-selected topic (tag or slug), overridden by `?topic=` on mount. */
  initialTopic?: string | null;
}>();

/** Tag name or slug -> slug; null for anything unknown (a stale `?topic=`). */
function slugOf(value: string | null | undefined): string | null {
  if (!value) return null;
  const wanted = value.trim().toLowerCase();
  const topic = props.topics.find((t) => t.tag.toLowerCase() === wanted || t.slug === wanted);
  return topic ? topic.slug : null;
}

/** The focused topic slug, or null for the whole graph. */
const focus = ref<string | null>(slugOf(props.initialTopic));
/** Set before the chart mounts and on every resize, applied through the CSSOM. */
const height = ref(560);
/** False until the chart is up, so the static render carries a short note. */
const ready = ref(false);

const chartHeight = () => Math.max(480, Math.round(window.innerHeight * 0.7));
const onResize = () => { height.value = chartHeight(); };

// registered before useChart()'s own onMounted, so the height and a `?topic=`
// focus are in place by the time the chart draws for the first time
onMounted(() => {
  height.value = chartHeight();
  const slug = slugOf(new URLSearchParams(window.location.search).get('topic'));
  if (slug) focus.value = slug;
  ready.value = true;
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => window.removeEventListener('resize', onResize));

/** A topic button, or a click on a hub: the active topic toggles off again. */
function toggle(slug: string): void {
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

const el = useChart(
  () => networkOption(props.rows, focus.value),
  () => height.value,
  onClick,
);
</script>

<template>
  <figure class="network-plot">
    <div class="chart-modes" role="group" aria-label="Focus one research area">
      <button v-for="topic in props.topics" :key="topic.slug" type="button" class="chart-mode-btn"
        :class="{ active: focus === topic.slug }" :aria-pressed="focus === topic.slug" @click="toggle(topic.slug)">
        {{ topic.tag }}
      </button>
    </div>
    <p v-if="!ready" class="chart-note">Loading the network…</p>
    <div ref="el" class="network-graph" role="img"
      aria-label="Network of the research areas, people, publications, projects and software of the group"></div>
    <figcaption class="chart-note">
      Drag a node, scroll to zoom, drag the background to pan. Click a research area to focus it, any other node to open it.
    </figcaption>
  </figure>
</template>
