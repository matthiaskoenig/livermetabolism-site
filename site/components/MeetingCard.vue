<script setup lang="ts">
import { tagSlugs } from '../lib/text';
import Icon from './Icon.vue';
import PeopleAvatars from './PeopleAvatars.vue';
import TagList from './TagList.vue';
import type { UiSlices } from '../lib/i18n/slices';
import type { PeopleMap } from '../lib/people';
import type { MeetingData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ item: Entry<MeetingData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; imageBase: string; pdfBase: string; avatarBase: string; strings: UiSlices['links'] }>();
</script>

<template>
  <div class="project-card" :id="`meeting-${item.id}`" :data-tags="tagSlugs(item.tags)">
    <img v-if="item.image" :src="imageBase + item.image" :alt="item.title" loading="lazy" decoding="async" class="project-image" />
    <div class="project-body">
      <p class="news-date">{{ item.date_display ?? item.date }}<template v-if="item.location"> &middot; {{ item.location }}</template></p>
      <h3>{{ item.title }}</h3>
      <TagList :tags="item.tags" :tag-info="tagInfo" />
      <p>{{ item.description }}</p>
      <div class="project-links">
        <PeopleAvatars :people="item.people" :people-map="peopleMap" :avatar-base="avatarBase" />
        <span class="project-links-spacer"></span>
        <a v-if="item.pdf" :href="pdfBase + item.pdf" target="_blank" rel="noopener noreferrer" :title="strings.pdf"><Icon name="file-pdf-o" /></a>
        <a v-if="item.homepage" :href="item.homepage" target="_blank" rel="noopener noreferrer" :title="strings.meetingHomepage"><Icon name="globe" /></a>
        <a v-if="item.repository" :href="item.repository" target="_blank" rel="noopener noreferrer" :title="strings.repository"><Icon name="github" /></a>
      </div>
    </div>
  </div>
</template>
