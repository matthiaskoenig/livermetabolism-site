<script setup lang="ts">
// Stars per repository, coloured by primary language (client:visible island,
// see ReleaseTimeline.vue for the pattern).
import { computed, onMounted, ref } from 'vue';
import { openInNewTab, useChart } from './useChart';
// the legend swatches take their colour from .chart-swatch-<i> in global.css
// (same palette, in the same order) — no style= attribute, see CLAUDE.md
import { starsHeight, starsLanguages, starsOption } from '../lib/chartOptions';
import { isFresherThan, loadLiveSnapshot } from '../lib/githubLive';
import { starsRows, type StarRow } from '../lib/githubRows';
import type { UiSlices } from '../lib/i18n/slices';

const props = defineProps<{ rows: StarRow[]; repos: string[]; fetchedAt: string; strings: UiSlices['starsChart'] }>();
const rows = ref<StarRow[]>(props.rows);

onMounted(async () => {
  const live = await loadLiveSnapshot();
  if (isFresherThan(live, props.fetchedAt)) rows.value = starsRows(live, props.repos);
});

const languages = computed(() => starsLanguages(rows.value));
const el = useChart(
  () => starsOption(rows.value),
  () => starsHeight(rows.value.length),
  (params) => openInNewTab(rows.value[(params as { dataIndex: number }).dataIndex]?.url),
);
</script>

<template>
  <figure class="github-figure">
    <div ref="el" class="github-chart" role="img" :aria-label="strings.ariaLabel"></div>
    <ul class="chart-legend" :aria-label="strings.primaryLanguage">
      <li v-for="(l, i) in languages" :key="l"><span class="chart-legend-swatch" :class="`chart-swatch-${i}`"></span>{{ l }}</li>
    </ul>
    <figcaption>{{ strings.caption }}</figcaption>
  </figure>
</template>
