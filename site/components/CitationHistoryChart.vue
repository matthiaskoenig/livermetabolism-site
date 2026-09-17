<script setup lang="ts">
// Total citations over time (client:visible island, see
// CitationsPerYearChart.vue for the refresh pattern): year-end totals derived
// from Scholar's histogram, then one point per daily snapshot. The caption
// says where the points come from.
import { computed, onMounted, ref } from 'vue';
import { useChart } from './useChart';
import { citationHistoryOption, HISTORY_HEIGHT } from '../lib/chartOptions';
import type { UiSlices } from '../lib/i18n/slices';
import { isScholarFresherThan, loadLiveScholar } from '../lib/scholarLive';
import { historyNote, historyRows, type HistoryRow } from '../lib/scholarRows';

const props = defineProps<{ rows: HistoryRow[]; fetchedAt: string; strings: UiSlices['citationHistoryChart'] }>();
const rows = ref<HistoryRow[]>(props.rows);

onMounted(async () => {
  const live = await loadLiveScholar();
  if (isScholarFresherThan(live, props.fetchedAt)) rows.value = historyRows(live);
});

const note = computed(() => historyNote(rows.value));
const el = useChart(
  () => citationHistoryOption(rows.value),
  () => HISTORY_HEIGHT,
);
</script>

<template>
  <figure class="scholar-plot">
    <div ref="el" class="scholar-chart" role="img" :aria-label="strings.ariaLabel"></div>
    <figcaption>{{ strings.ariaLabel }}<span v-if="note"> ({{ note }})</span>.</figcaption>
  </figure>
</template>
