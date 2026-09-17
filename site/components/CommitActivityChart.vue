<script setup lang="ts">
// Commits per week over the last year, stacked per repository
// (client:visible island, see ReleaseTimeline.vue for the pattern).
import { onMounted, ref } from 'vue';
import { useChart } from './useChart';
import { ACTIVITY_HEIGHT, commitActivityOption } from '../lib/chartOptions';
import { isFresherThan, loadLiveSnapshot } from '../lib/githubLive';
import { activityRows, type ActivityRows } from '../lib/githubRows';
import type { UiSlices } from '../lib/i18n/slices';

const props = defineProps<{ data: ActivityRows; repos: string[]; fetchedAt: string; strings: UiSlices['commitActivityChart'] }>();
const data = ref<ActivityRows>(props.data);

onMounted(async () => {
  const live = await loadLiveSnapshot();
  if (isFresherThan(live, props.fetchedAt)) data.value = activityRows(live, props.repos);
});

const el = useChart(
  () => commitActivityOption(data.value, props.strings),
  () => ACTIVITY_HEIGHT,
);
</script>

<template>
  <figure class="github-figure">
    <div ref="el" class="github-chart" role="img" :aria-label="strings.ariaLabel"></div>
    <figcaption>{{ strings.caption }}</figcaption>
  </figure>
</template>
