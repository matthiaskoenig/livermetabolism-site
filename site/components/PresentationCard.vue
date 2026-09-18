<script setup lang="ts">
import { tagSlugs } from '../lib/text';
import Icon from './Icon.vue';
import PeopleAvatars from './PeopleAvatars.vue';
import TagList from './TagList.vue';
import type { UiSlices } from '../lib/i18n/slices';
import { link } from '../lib/url';
import type { PeopleMap } from '../lib/people';
import type { PresentationData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ item: Entry<PresentationData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; pdfBase: string; avatarBase: string; strings: UiSlices['links'] }>();
</script>

<template>
  <div class="project-card" :id="`presentation-${item.id}`" :data-tags="tagSlugs(item.tags)">
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
        <a v-if="item.slides" :href="link(item.slides)" target="_blank" rel="noopener noreferrer" :title="strings.slides"><Icon name="desktop" /></a>
        <a v-if="item.video" :href="item.video" target="_blank" rel="noopener noreferrer" :title="strings.video"><Icon name="video-camera" /></a>
        <a v-if="item.repository" :href="item.repository" target="_blank" rel="noopener noreferrer" :title="strings.repository"><Icon name="github" /></a>
        <a v-if="item.event_page" :href="item.event_page" target="_blank" rel="noopener noreferrer" :title="strings.eventPage"><Icon name="globe" /></a>
      </div>
    </div>
  </div>
</template>
