<script setup lang="ts">
import Icon from './Icon.vue';
import { fmt } from '../lib/i18n/format';
import type { UiSlices } from '../lib/i18n/slices';
import type { PersonData } from '../lib/schemas';
import { stripHtml, truncateWords } from '../lib/text';
import type { Entry } from '../lib/views';

// `topics` are the person's research-area slugs, which `peopleTopics()`
// derives from their publications: people have no `tags:` of their own, so
// unlike every other card this one cannot build its `data-tags` from the
// record alone and has to be handed the slugs. Defaulted so a caller on a
// page without the global filter bar need not compute them.
withDefaults(defineProps<{ person: Entry<PersonData>; avatarBase: string; strings: UiSlices['personCard']; topics?: string[] }>(), { topics: () => [] });
</script>

<template>
  <div class="member-card" :id="`person-${person.id}`" :data-tags="topics.join('|')">
    <a v-if="person.image" :href="`#person/${person.id}`" :data-detail="`person:${person.id}`" class="member-photo-link" :aria-label="fmt(strings.viewProfile, { name: person.name })">
      <img :src="avatarBase + person.image" :alt="person.name" loading="lazy" decoding="async" width="56" height="56" class="member-photo" />
    </a>
    <div class="member-info">
      <a :href="`#person/${person.id}`" :data-detail="`person:${person.id}`" class="member-name-link"><strong>{{ person.name }}</strong></a>
      <span class="person-position">{{ person.role[person.role.length - 1] }}</span>
      <p v-if="person.description">{{ truncateWords(stripHtml(person.description), 20) }}</p>
      <a :href="`#person/${person.id}`" :data-detail="`person:${person.id}`" class="member-more">{{ strings.fullProfile }} &rarr;</a>
      <div class="member-links">
        <a v-if="person.homepage" :href="person.homepage" target="_blank" rel="noopener noreferrer" :title="strings.homepage"><Icon name="home" /></a>
        <a v-if="person.orcid" :href="`https://orcid.org/${person.orcid}`" target="_blank" rel="noopener noreferrer" :title="strings.orcid"><Icon name="orcid" /></a>
        <a v-if="person.repository" :href="person.repository" target="_blank" rel="noopener noreferrer" :title="strings.repository"><Icon name="github" /></a>
      </div>
    </div>
  </div>
</template>
