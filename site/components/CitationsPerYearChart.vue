<script setup lang="ts">
// Citations per year from the Google Scholar histogram (client:visible island;
// same refresh pattern as the GitHub charts: the bars are server-rendered as
// props and recomputed on mount when the snapshot on the `github-data` branch
// is newer than the one this page was built from).
import { onMounted, ref } from 'vue';
import { useChart } from './useChart';
import { citationsPerYearOption, PER_YEAR_HEIGHT } from '../lib/chartOptions';
import type { UiSlices } from '../lib/i18n/slices';
import { isScholarFresherThan, loadLiveScholar } from '../lib/scholarLive';
import { perYearRows, type PerYearRow } from '../lib/scholarRows';
import { DEFAULT_LOCALE, type Locale } from '../lib/i18n/locales';

const props = defineProps<{ rows: PerYearRow[]; fetchedAt: string; strings: UiSlices['citationsPerYearChart']; locale?: Locale }>();
const rows = ref<PerYearRow[]>(props.rows);

onMounted(async () => {
  const live = await loadLiveScholar();
  if (isScholarFresherThan(live, props.fetchedAt)) rows.value = perYearRows(live);
});

const el = useChart(
  () => citationsPerYearOption(rows.value, props.strings.citation, props.locale ?? DEFAULT_LOCALE),
  () => PER_YEAR_HEIGHT,
);
</script>

<template>
  <figure class="scholar-plot">
    <div ref="el" class="scholar-chart" role="img" :aria-label="strings.ariaLabel"></div>
    <figcaption>{{ strings.caption }}</figcaption>
  </figure>
</template>
