<script setup lang="ts">
import Icon from './Icon.vue';
import TagList from './TagList.vue';
import type { EditorData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ item: Entry<EditorData>; tagInfo: TagInfo[]; imageBase: string }>();
</script>

<template>
  <div class="project-card" :id="`editor-${item.id}`" :data-tags="item.tags.join('|')">
    <img v-if="item.image" :src="imageBase + item.image" :alt="item.name" loading="lazy" class="project-image project-image-contain" />
    <div class="project-body">
      <h3>{{ item.name }}</h3>
      <TagList :tags="item.tags" :tag-info="tagInfo" />
      <p><strong>{{ item.tenure }}</strong><br />{{ item.description }}</p>
      <div class="project-links">
        <span class="project-links-spacer"></span>
        <a v-if="item.homepage" :href="item.homepage" target="_blank" rel="noopener noreferrer" title="Project homepage"><Icon name="globe" /></a>
        <a v-if="item.repository" :href="item.repository" target="_blank" rel="noopener noreferrer" title="Repository homepage"><Icon name="github" /></a>
      </div>
    </div>
  </div>
</template>
