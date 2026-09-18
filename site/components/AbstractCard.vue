<script setup lang="ts">
import Icon from './Icon.vue';
import TagList from './TagList.vue';
import type { UiSlices } from '../lib/i18n/slices';
import type { AbstractData } from '../lib/schemas';
import { stripHtml, tagSlugs } from '../lib/text';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ item: Entry<AbstractData>; tagInfo: TagInfo[]; pdfBase: string; strings: UiSlices['links'] }>();
</script>

<template>
  <div class="project-card" :id="`abstract-${item.id}`" :data-tags="tagSlugs(item.tags)">
    <div class="project-body">
      <p class="news-date">{{ item.date ?? item.year }}</p>
      <h3>{{ item.title }}</h3>
      <p>{{ item.event }}<template v-if="item.authors"><br />{{ stripHtml(item.authors) }}</template></p>
      <TagList :tags="item.tags" :tag-info="tagInfo" />
      <div class="project-links">
        <span class="project-links-spacer"></span>
        <a v-if="item.pdf" :href="pdfBase + item.pdf" target="_blank" rel="noopener noreferrer" :title="strings.pdf"><Icon name="file-pdf-o" /></a>
        <a v-if="item.homepage" :href="item.homepage" target="_blank" rel="noopener noreferrer" :title="strings.homepage"><Icon name="globe" /></a>
        <a v-if="item.repository" :href="item.repository" target="_blank" rel="noopener noreferrer" :title="strings.repository"><Icon name="github" /></a>
        <a v-if="item.event_page" :href="item.event_page" target="_blank" rel="noopener noreferrer" :title="strings.eventPage"><Icon name="globe" /></a>
      </div>
    </div>
  </div>
</template>
