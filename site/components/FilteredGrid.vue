<script setup lang="ts" generic="T extends { id: string; tags: string[] }">
import TagFilterBar from './TagFilterBar.vue';
import { useTagFilter } from '../lib/tagFilter';
import type { TagInfo } from '../lib/views';

const props = defineProps<{ filterId: string; gridId: string; tags: TagInfo[]; items: T[] }>();
defineSlots<{ item(props: { item: T }): unknown; modal?(props: { item: T }): unknown }>();
const { activeTag, setTag, matches } = useTagFilter(props.tags.map((t) => t.tag));
</script>

<template>
  <TagFilterBar :id="filterId" :tags="tags" :model-value="activeTag" @update:model-value="setTag" />
  <div class="project-grid" :id="gridId">
    <template v-for="it in items" :key="it.id">
      <div v-show="matches(it.tags)" class="contents"><slot name="item" :item="it" /></div>
    </template>
  </div>
  <template v-for="it in items" :key="`m-${it.id}`">
    <slot name="modal" :item="it" />
  </template>
</template>
