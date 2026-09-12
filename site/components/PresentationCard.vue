<script setup lang="ts">
import Icon from './Icon.vue';
import PeopleAvatars from './PeopleAvatars.vue';
import TagList from './TagList.vue';
import { link } from '../lib/url';
import type { PeopleMap } from '../lib/people';
import type { PresentationData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ item: Entry<PresentationData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; pdfBase: string; avatarBase: string }>();
</script>

<template>
  <div class="project-card" :id="`presentation-${item.id}`" :data-tags="item.tags.join('|')">
    <template v-if="item.image">
      <a v-if="item.slides" :href="link(item.slides)" target="_blank" rel="noopener noreferrer"><img :src="pdfBase + item.image" :alt="item.title" loading="lazy" decoding="async" class="project-image" /></a>
      <img v-else :src="pdfBase + item.image" :alt="item.title" loading="lazy" decoding="async" class="project-image" />
    </template>
    <div class="project-body">
      <p class="news-date">{{ item.date }}</p>
      <h3>{{ item.title }}</h3>
      <p>{{ item.event }}<template v-if="item.location"><br />{{ item.location }}</template></p>
      <TagList :tags="item.tags" :tag-info="tagInfo" />
      <div class="project-links">
        <PeopleAvatars :people="item.people" :people-map="peopleMap" :avatar-base="avatarBase" />
        <span class="project-links-spacer"></span>
        <a v-if="item.slides" :href="link(item.slides)" target="_blank" rel="noopener noreferrer" title="Slides"><Icon name="desktop" /></a>
        <a v-if="item.video" :href="item.video" target="_blank" rel="noopener noreferrer" title="Video"><Icon name="video-camera" /></a>
        <a v-if="item.repository" :href="item.repository" target="_blank" rel="noopener noreferrer" title="Repository"><Icon name="github" /></a>
        <a v-if="item.event_page" :href="item.event_page" target="_blank" rel="noopener noreferrer" title="Event page"><Icon name="globe" /></a>
      </div>
    </div>
  </div>
</template>
