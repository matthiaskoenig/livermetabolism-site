<script setup lang="ts">
import Icon from './Icon.vue';
import type { PersonData } from '../lib/schemas';
import { stripHtml, truncateWords } from '../lib/text';
import type { Entry } from '../lib/views';

defineProps<{ person: Entry<PersonData>; avatarBase: string }>();
</script>

<template>
  <div class="member-card" :id="`person-${person.id}`">
    <a v-if="person.image" :href="`#person/${person.id}`" :data-detail="`person:${person.id}`" class="member-photo-link" :aria-label="`View full profile of ${person.name}`">
      <img :src="avatarBase + person.image" :alt="person.name" loading="lazy" decoding="async" width="56" height="56" class="member-photo" />
    </a>
    <div class="member-info">
      <a :href="`#person/${person.id}`" :data-detail="`person:${person.id}`" class="member-name-link"><strong>{{ person.name }}</strong></a>
      <span class="person-position">{{ person.role[person.role.length - 1] }}</span>
      <p v-if="person.description">{{ truncateWords(stripHtml(person.description), 20) }}</p>
      <a :href="`#person/${person.id}`" :data-detail="`person:${person.id}`" class="member-more">Full profile &rarr;</a>
      <div class="member-links">
        <a v-if="person.homepage" :href="person.homepage" target="_blank" rel="noopener noreferrer" title="Homepage"><Icon name="home" /></a>
        <a v-if="person.orcid" :href="`https://orcid.org/${person.orcid}`" target="_blank" rel="noopener noreferrer" title="ORCID"><Icon name="orcid" /></a>
        <a v-if="person.repository" :href="person.repository" target="_blank" rel="noopener noreferrer" title="Repository homepage"><Icon name="github" /></a>
      </div>
    </div>
  </div>
</template>
