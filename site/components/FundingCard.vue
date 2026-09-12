<script setup lang="ts">
import Icon from './Icon.vue';
import TagList from './TagList.vue';
import type { FundingData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ item: Entry<FundingData>; tagInfo: TagInfo[]; imageBase: string }>();
</script>

<template>
  <div class="project-card" :id="`funding-${item.id}`" :data-tags="item.tags.join('|')">
    <img v-if="item.funder_logo" :src="imageBase + item.funder_logo" :alt="item.funder" loading="lazy" decoding="async" class="project-image project-image-contain" />
    <div class="project-body">
      <h3>{{ item.title }}</h3>
      <TagList :tags="item.tags" :tag-info="tagInfo" />
      <p><strong>{{ item.funder_short }}</strong>, {{ item.role }}, {{ item.start }}&ndash;{{ item.end }}<br />{{ item.description }}</p>
      <div class="project-links">
        <span class="project-links-spacer"></span>
        <a v-if="item.homepage" :href="item.homepage" target="_blank" rel="noopener noreferrer" title="Project homepage"><Icon name="globe" /></a>
        <a v-if="item.repository" :href="item.repository" target="_blank" rel="noopener noreferrer" title="Repository homepage"><Icon name="github" /></a>
        <a v-if="item.funder_link" :href="item.funder_link" target="_blank" rel="noopener noreferrer" :title="item.funder"><Icon name="globe" /></a>
      </div>
    </div>
  </div>
</template>
