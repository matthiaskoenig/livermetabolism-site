<script setup lang="ts">
import EditorCard from './EditorCard.vue';
import FilteredGrid from './FilteredGrid.vue';
import type { EditorData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ items: Entry<EditorData>[]; tagInfo: TagInfo[]; imageBase: string }>();
</script>

<template>
  <FilteredGrid filter-id="editors" grid-id="editors-grid" :tags="tagInfo" :items="items">
    <template #item="{ item }"><EditorCard :item="item" :tag-info="tagInfo" :image-base="imageBase" /></template>
  </FilteredGrid>
</template>
