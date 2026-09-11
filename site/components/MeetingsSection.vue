<script setup lang="ts">
import FilteredGrid from './FilteredGrid.vue';
import MeetingCard from './MeetingCard.vue';
import type { PeopleMap } from '../lib/people';
import type { MeetingData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ items: Entry<MeetingData>[]; tagInfo: TagInfo[]; peopleMap: PeopleMap; imageBase: string; pdfBase: string; avatarBase: string }>();
</script>

<template>
  <FilteredGrid filter-id="meeting" grid-id="meetings-grid" :tags="tagInfo" :items="items">
    <template #item="{ item }"><MeetingCard :item="item" :tag-info="tagInfo" :people-map="peopleMap" :image-base="imageBase" :pdf-base="pdfBase" :avatar-base="avatarBase" /></template>
  </FilteredGrid>
</template>
