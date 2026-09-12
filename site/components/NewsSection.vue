<script setup lang="ts">
import FilteredGrid from './FilteredGrid.vue';
import NewsCard from './NewsCard.vue';
import NewsModal from './NewsModal.vue';
import type { PeopleMap } from '../lib/people';
import type { NewsData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

const props = defineProps<{ items: Entry<NewsData>[]; tagInfo: TagInfo[]; peopleMap: PeopleMap; people: { id: string; name: string }[]; imageBase: string; avatarBase: string; peopleUrl: string }>();
</script>

<template>
  <FilteredGrid filter-id="news" grid-id="news-grid" :tags="tagInfo" :items="items">
    <template #item="{ item: n }">
      <NewsCard :item="n" :tag-info="tagInfo" :people-map="peopleMap" :image-base="imageBase" :avatar-base="avatarBase" />
    </template>
    <template #modal="{ item: n }">
      <NewsModal :item="n" :tag-info="tagInfo" :people="people" :image-base="imageBase" :people-url="peopleUrl" />
    </template>
  </FilteredGrid>
</template>
