<script setup lang="ts">
// Every release of every repository as one dot per release, one lane per
// repository. Needs a canvas, so this island (client:visible) is what renders
// it; the rows it starts from are computed at build time and replaced when a
// newer snapshot is available.
import { onMounted, ref } from 'vue';
import { openInNewTab, useChart } from './useChart';
import { releaseTimelineHeight, releaseTimelineOption } from '../lib/chartOptions';
import { isFresherThan, loadLiveSnapshot } from '../lib/githubLive';
import { releaseTimelineRows, type TimelineRow } from '../lib/githubRows';

const props = defineProps<{ rows: TimelineRow[]; repos: string[]; fetchedAt: string }>();
const rows = ref<TimelineRow[]>(props.rows);

onMounted(async () => {
  const live = await loadLiveSnapshot();
  if (isFresherThan(live, props.fetchedAt)) rows.value = releaseTimelineRows(live, props.repos);
});

const el = useChart(
  () => releaseTimelineOption(rows.value),
  () => releaseTimelineHeight(rows.value.length),
  (params) => openInNewTab((params as { value?: unknown[] }).value?.[3]),
);
</script>

<template>
  <figure class="github-figure">
    <div ref="el" class="github-chart" role="img" aria-label="Release dates per repository"></div>
    <figcaption>One dot per release; drag the slider to zoom, click a dot to open it on GitHub.</figcaption>
  </figure>
</template>
