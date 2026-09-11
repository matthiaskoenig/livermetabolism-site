<script setup lang="ts">
import Icon from './Icon.vue';
import Modal from './Modal.vue';
import type { PersonData } from '../lib/schemas';
import type { Entry } from '../lib/views';

export interface PersonRefs {
  publications: { id: string; title: string; year: number }[];
  projects: { id: string; title: string; homepage: string | null | undefined }[];
  software: { id: string; name: string; title: string; homepage: string | null | undefined }[];
}
defineProps<{ person: Entry<PersonData>; refs: PersonRefs; avatarBase: string; publicationsUrl: string }>();
</script>

<template>
  <Modal :id="`person-modal-${person.id}`" :title="person.name">
    <div class="person-modal-header">
      <img v-if="person.image" :src="avatarBase + person.image" :alt="person.name" loading="lazy" class="person-modal-photo" />
      <div>
        <span v-if="person.role.length" class="person-position">{{ person.role.join(' · ') }}</span>
        <span class="person-tenure">{{ person.tenure }}<template v-if="person.affiliation"> &middot; {{ person.affiliation }}</template></span>
        <div class="member-links">
          <a v-if="person.homepage" :href="person.homepage" target="_blank" rel="noopener noreferrer" title="Homepage"><Icon name="home" /></a>
          <a v-if="person.orcid" :href="`https://orcid.org/${person.orcid}`" target="_blank" rel="noopener noreferrer" title="ORCID"><Icon name="orcid" /></a>
          <a v-if="person.repository" :href="person.repository" target="_blank" rel="noopener noreferrer" title="Repository"><Icon name="github" /></a>
        </div>
      </div>
    </div>
    <p v-if="person.description" class="person-modal-description" v-html="person.description"></p>
    <template v-if="refs.publications.length">
      <h6>Publications ({{ refs.publications.length }})</h6>
      <ul class="person-modal-list">
        <li v-for="p in refs.publications" :key="p.id"><a :href="`${publicationsUrl}#pub-${p.id}`">{{ p.title }}</a> <span class="text-muted">({{ p.year }})</span></li>
      </ul>
    </template>
    <template v-if="refs.projects.length">
      <h6>Projects ({{ refs.projects.length }})</h6>
      <ul class="person-modal-list">
        <li v-for="p in refs.projects" :key="p.id"><a v-if="p.homepage" :href="p.homepage" target="_blank" rel="noopener noreferrer">{{ p.title }}</a><template v-else>{{ p.title }}</template></li>
      </ul>
    </template>
    <template v-if="refs.software.length">
      <h6>Software ({{ refs.software.length }})</h6>
      <ul class="person-modal-list">
        <li v-for="s in refs.software" :key="s.id"><a v-if="s.homepage" :href="s.homepage" target="_blank" rel="noopener noreferrer">{{ s.name }}</a><template v-else>{{ s.name }}</template> &mdash; {{ s.title }}</li>
      </ul>
    </template>
  </Modal>
</template>
