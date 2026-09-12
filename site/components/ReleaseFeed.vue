<script setup lang="ts">
// The newest release of every lab repository, server-rendered from the
// build's snapshot; the island hydrates (client:visible) only to replace the
// rows when the snapshot on the `github-data` branch has moved on since.
// Release summaries are plain text from the snapshot and are interpolated,
// never inserted as HTML.
import { onMounted, ref } from 'vue';
import { isFresherThan, loadLiveSnapshot } from '../lib/githubLive';
import { latestReleases, shortDate, type ReleaseRow } from '../lib/githubRows';

const props = defineProps<{ rows: ReleaseRow[]; repos: string[]; fetchedAt: string }>();
const rows = ref<ReleaseRow[]>(props.rows);

onMounted(async () => {
  const live = await loadLiveSnapshot();
  if (isFresherThan(live, props.fetchedAt)) rows.value = latestReleases(live, props.repos);
});
</script>

<template>
  <ol class="release-feed">
    <li v-for="r in rows" :key="r.repo" class="release-row">
      <div class="release-head">
        <span class="release-repo">{{ r.name }}</span>
        <a class="release-tag" :href="r.htmlUrl" target="_blank" rel="noopener noreferrer">{{ r.tag }}</a>
        <span v-if="r.prerelease" class="release-pre">pre-release</span>
        <time class="release-date" :datetime="r.publishedAt">{{ shortDate(r.publishedAt) }}</time>
      </div>
      <p v-if="r.summary" class="release-summary">{{ r.summary }}</p>
    </li>
  </ol>
  <p v-if="rows.length === 0" class="github-empty">No releases in the last two years.</p>
</template>
