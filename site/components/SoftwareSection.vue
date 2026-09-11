<script setup lang="ts">
import FilteredGrid from './FilteredGrid.vue';
import SoftwareCard from './SoftwareCard.vue';
import type { PeopleMap } from '../lib/people';
import type { SoftwareData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ items: Entry<SoftwareData>[]; tagInfo: TagInfo[]; peopleMap: PeopleMap; imageBase: string; avatarBase: string }>();
</script>

<template>
  <FilteredGrid filter-id="software" grid-id="software-grid" :tags="tagInfo" :items="items">
    <template #item="{ item }"><SoftwareCard :item="item" :tag-info="tagInfo" :people-map="peopleMap" :image-base="imageBase" :avatar-base="avatarBase" /></template>
  </FilteredGrid>
</template>
