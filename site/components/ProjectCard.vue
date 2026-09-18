<script setup lang="ts">
import { tagSlugs } from '../lib/text';
import { computed } from 'vue';
import Icon from './Icon.vue';
import PeopleAvatars from './PeopleAvatars.vue';
import TagList from './TagList.vue';
import type { UiSlices } from '../lib/i18n/slices';
import type { PeopleMap } from '../lib/people';
import type { ProjectData, PublicationData } from '../lib/schemas';
import { stripHtml } from '../lib/text';
import type { Entry, TagInfo } from '../lib/views';

export type PubLite = Pick<Entry<PublicationData>, 'id' | 'title' | 'year' | 'pdf'>;

const props = defineProps<{ project: Entry<ProjectData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; publications: PubLite[]; imageBase: string; pdfBase: string; avatarBase: string; strings: UiSlices['links'] }>();
const pdfs = computed(() => props.project.publications.map((id) => props.publications.find((p) => p.id === id)).filter((p): p is PubLite => !!p && !!p.pdf));
</script>

<template>
  <div class="project-card is-clickable" :id="`project-${project.id}`" :data-tags="tagSlugs(project.tags)" :data-detail="`project:${project.id}`" role="button" tabindex="0" aria-haspopup="dialog">
    <img v-if="project.images[0]" :src="imageBase + project.images[0]" :alt="project.title" loading="lazy" decoding="async" class="project-image" />
    <div class="project-body">
      <h3>{{ project.title }}</h3>
      <TagList :tags="project.tags" :tag-info="tagInfo" />
      <p>{{ stripHtml(project.abstract) }}</p>
      <div class="project-links">
        <PeopleAvatars :people="project.people" :people-map="peopleMap" :avatar-base="avatarBase" />
        <span class="project-links-spacer"></span>
        <a v-for="p in pdfs" :key="p.id" :href="pdfBase + p.pdf" :title="p.title"><Icon name="file-pdf-o" /></a>
        <a v-if="project.homepage" :href="project.homepage" target="_blank" rel="noopener noreferrer" :title="strings.projectHomepage"><Icon name="globe" /></a>
        <a v-if="project.repository" :href="project.repository" target="_blank" rel="noopener noreferrer" :title="strings.repositoryHomepage"><Icon name="github" /></a>
      </div>
    </div>
  </div>
</template>
