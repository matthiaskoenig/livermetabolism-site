<script setup lang="ts">
import FilteredGrid from './FilteredGrid.vue';
import FundingCard from './FundingCard.vue';
import type { FundingData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ items: Entry<FundingData>[]; tagInfo: TagInfo[]; imageBase: string }>();
</script>

<template>
  <FilteredGrid filter-id="funding" grid-id="funding-grid" :tags="tagInfo" :items="items">
    <template #item="{ item }"><FundingCard :item="item" :tag-info="tagInfo" :image-base="imageBase" /></template>
  </FilteredGrid>
</template>
