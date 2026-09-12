<script setup lang="ts">
// Total citations over time, one point per daily snapshot (client:visible
// island, see CitationsPerYearChart.vue for the refresh pattern). The series
// only grows with the snapshots, so it starts as a single point — the symbol
// is shown and the caption says when the history began.
import { computed, onMounted, ref } from 'vue';
import { useChart } from './useChart';
import { citationHistoryOption, HISTORY_HEIGHT } from '../lib/chartOptions';
import { isScholarFresherThan, loadLiveScholar } from '../lib/scholarLive';
import { historyNote, historyRows, type HistoryRow } from '../lib/scholarRows';

const props = defineProps<{ rows: HistoryRow[]; fetchedAt: string }>();
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
    <div ref="el" class="scholar-chart" role="img" aria-label="Total citations over time"></div>
    <figcaption>Total citations over time, from the daily snapshots<span v-if="note"> ({{ note }})</span>.</figcaption>
  </figure>
</template>
