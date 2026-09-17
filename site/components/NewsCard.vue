<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';
import PeopleAvatars from './PeopleAvatars.vue';
import TagList from './TagList.vue';
import type { UiSlices } from '../lib/i18n/slices';
import { link } from '../lib/url';
import type { PeopleMap } from '../lib/people';
import type { NewsData } from '../lib/schemas';
import { stripHtml, truncateWords } from '../lib/text';
import type { Entry, TagInfo } from '../lib/views';

const props = defineProps<{ item: Entry<NewsData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; imageBase: string; avatarBase: string; strings: Pick<UiSlices['links'], 'readMore'> }>();
const thumb = computed(() => {
  if (props.item.image) return props.imageBase + props.item.image;
  if (props.item.video) return `https://img.youtube.com/vi/${props.item.video.split('/embed/').pop()}/hqdefault.jpg`;
  return null;
});
</script>

<template>
  <div class="project-card is-clickable" :id="`news-${item.id}`" :data-tags="item.tags.join('|')" :data-detail="`news:${item.id}`" role="button" tabindex="0" aria-haspopup="dialog">
    <img v-if="thumb" :src="thumb" :alt="item.title" loading="lazy" decoding="async" class="project-image" />
    <div class="project-body">
      <p class="news-date">{{ item.date }}</p>
      <h3>{{ item.title }}</h3>
      <TagList :tags="item.tags" :tag-info="tagInfo" />
      <p>{{ truncateWords(stripHtml(item.short), 30) }}</p>
      <div v-if="item.people.length || item.link" class="project-links">
        <PeopleAvatars :people="item.people" :people-map="peopleMap" :avatar-base="avatarBase" />
        <span class="project-links-spacer"></span>
        <a v-if="item.link" :href="link(item.link)" target="_blank" rel="noopener noreferrer" :title="strings.readMore"><Icon name="globe" /></a>
      </div>
    </div>
  </div>
</template>
