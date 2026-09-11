<script setup lang="ts">
import ProjectCard, { type PubLite } from './ProjectCard.vue';
import ProjectModal from './ProjectModal.vue';
import TagFilterBar from './TagFilterBar.vue';
import type { PeopleMap } from '../lib/people';
import type { PersonData, ProjectData } from '../lib/schemas';
import { useTagFilter } from '../lib/tagFilter';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ projects: Entry<ProjectData>[]; tagInfo: TagInfo[]; peopleMap: PeopleMap; people: Entry<PersonData>[]; publications: PubLite[]; imageBase: string; pdfBase: string; avatarBase: string; peopleUrl: string; publicationsUrl: string }>();
const { activeTag, setTag, matches } = useTagFilter();
</script>

<template>
  <TagFilterBar id="project" :tags="tagInfo" :model-value="activeTag" @update:model-value="setTag" />
  <div class="project-grid" id="project-grid">
    <ProjectCard v-for="p in projects" :key="p.id" v-show="matches(p.tags)" :project="p" :tag-info="tagInfo" :people-map="peopleMap" :publications="publications" :image-base="imageBase" :pdf-base="pdfBase" :avatar-base="avatarBase" />
  </div>
  <ProjectModal v-for="p in projects" :key="`m-${p.id}`" :project="p" :tag-info="tagInfo" :people-map="peopleMap" :people="people" :publications="publications" :image-base="imageBase" :people-url="peopleUrl" :publications-url="publicationsUrl" />
</template>
