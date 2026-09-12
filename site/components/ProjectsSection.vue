<script setup lang="ts">
import FilteredGrid from './FilteredGrid.vue';
import ProjectCard, { type PubLite } from './ProjectCard.vue';
import ProjectModal from './ProjectModal.vue';
import type { PeopleMap } from '../lib/people';
import type { PersonData, ProjectData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

const props = defineProps<{ projects: Entry<ProjectData>[]; tagInfo: TagInfo[]; peopleMap: PeopleMap; people: Entry<PersonData>[]; publications: PubLite[]; imageBase: string; pdfBase: string; avatarBase: string; peopleUrl: string; publicationsUrl: string }>();
</script>

<template>
  <FilteredGrid filter-id="project" grid-id="project-grid" :tags="tagInfo" :items="projects">
    <template #item="{ item: p }">
      <ProjectCard :project="p" :tag-info="tagInfo" :people-map="peopleMap" :publications="publications" :image-base="imageBase" :pdf-base="pdfBase" :avatar-base="avatarBase" />
    </template>
    <template #modal="{ item: p }">
      <ProjectModal :project="p" :tag-info="tagInfo" :people-map="peopleMap" :people="people" :publications="publications" :image-base="imageBase" :people-url="peopleUrl" :publications-url="publicationsUrl" />
    </template>
  </FilteredGrid>
</template>
