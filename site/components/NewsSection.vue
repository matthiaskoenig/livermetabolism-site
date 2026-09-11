<script setup lang="ts">
import NewsCard from './NewsCard.vue';
import NewsModal from './NewsModal.vue';
import TagFilterBar from './TagFilterBar.vue';
import type { PeopleMap } from '../lib/people';
import type { NewsData } from '../lib/schemas';
import { useTagFilter } from '../lib/tagFilter';
import type { Entry, TagInfo } from '../lib/views';

const props = defineProps<{ items: Entry<NewsData>[]; tagInfo: TagInfo[]; peopleMap: PeopleMap; people: { id: string; name: string }[]; imageBase: string; avatarBase: string; peopleUrl: string }>();
const { activeTag, setTag, matches } = useTagFilter(props.tagInfo.map((t) => t.tag));
</script>

<template>
  <TagFilterBar id="news" :tags="tagInfo" :model-value="activeTag" @update:model-value="setTag" />
  <div class="project-grid" id="news-grid">
    <NewsCard v-for="n in items" :key="n.id" v-show="matches(n.tags)" :item="n" :tag-info="tagInfo" :people-map="peopleMap" :image-base="imageBase" :avatar-base="avatarBase" />
  </div>
  <NewsModal v-for="n in items" :key="`m-${n.id}`" :item="n" :tag-info="tagInfo" :people="people" :image-base="imageBase" :people-url="peopleUrl" />
</template>
