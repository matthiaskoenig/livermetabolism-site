<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';
import Modal from './Modal.vue';
import TagList from './TagList.vue';
import type { PubLite } from './ProjectCard.vue';
import type { PeopleMap } from '../lib/people';
import type { PersonData, ProjectData } from '../lib/schemas';
import { stripHtml } from '../lib/text';
import type { Entry, TagInfo } from '../lib/views';

const props = defineProps<{ project: Entry<ProjectData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; people: Entry<PersonData>[]; publications: PubLite[]; imageBase: string; peopleUrl: string; publicationsUrl: string }>();
const persons = computed(() => props.project.people.map((id) => props.people.find((p) => p.id === id)).filter((p): p is Entry<PersonData> => !!p));
const pubs = computed(() => props.project.publications.map((id) => props.publications.find((p) => p.id === id)).filter((p): p is PubLite => !!p));
</script>

<template>
  <Modal :id="`project-modal-${project.id}`" :title="project.title">
    <template v-if="project.images.length">
      <div class="modal-image-gallery">
        <img v-for="img in project.images" :key="img" :src="imageBase + img" :alt="project.image_title ?? project.title" loading="lazy" />
      </div>
      <p v-if="project.image_title" class="modal-image-caption">{{ project.image_title }}</p>
    </template>
    <TagList :tags="project.tags" :tag-info="tagInfo" />
    <p class="person-modal-description">{{ stripHtml(project.abstract) }}</p>
    <template v-if="persons.length">
      <h6>People</h6>
      <ul class="person-modal-list">
        <li v-for="p in persons" :key="p.id"><a :href="`${peopleUrl}#person-modal-${p.id}`">{{ p.name }}</a><span v-if="p.role.length" class="text-muted"> &middot; {{ p.role[p.role.length - 1] }}</span></li>
      </ul>
    </template>
    <template v-if="project.cooperation_partners">
      <h6>Cooperation partners</h6>
      <p>{{ project.cooperation_partners }}</p>
    </template>
    <template v-if="pubs.length">
      <h6>Publications</h6>
      <ul class="person-modal-list">
        <li v-for="p in pubs" :key="p.id"><a :href="`${publicationsUrl}#pub-${p.id}`">{{ p.title }}</a> <span class="text-muted">({{ p.year }})</span></li>
      </ul>
    </template>
    <div v-if="project.homepage || project.repository" class="member-links">
      <a v-if="project.homepage" :href="project.homepage" target="_blank" rel="noopener noreferrer" title="Project homepage"><Icon name="globe" /></a>
      <a v-if="project.repository" :href="project.repository" target="_blank" rel="noopener noreferrer" title="Repository"><Icon name="github" /></a>
    </div>
  </Modal>
</template>
