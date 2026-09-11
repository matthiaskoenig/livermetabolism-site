<script setup lang="ts">
import Icon from './Icon.vue';
import PersonChips from './PersonChips.vue';
import TagList from './TagList.vue';
import type { PeopleMap } from '../lib/people';
import type { PublicationData } from '../lib/schemas';
import { capitalize, slugify } from '../lib/text';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ pub: Entry<PublicationData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; pdfBase: string; avatarBase: string }>();
</script>

<template>
  <tr :id="`pub-${pub.id}`" :data-tags="pub.tags.join('|')">
    <td class="publication-status">
      <span class="status-badge" :class="`status-${slugify(pub.status)}`">{{ capitalize(pub.status) }}</span>
      <div class="pub-links">
        <a v-if="pub.pdf" :href="pdfBase + pub.pdf" title="PDF"><Icon name="file-pdf-o" /></a>
        <a v-if="pub.homepage" :href="pub.homepage" title="Project homepage"><Icon name="globe" /></a>
        <a v-if="pub.repository" :href="pub.repository" title="Repository homepage"><Icon name="github" /></a>
      </div>
    </td>
    <td>
      <TagList :tags="pub.tags" :tag-info="tagInfo" />
      <p class="pub-title"><i>{{ pub.title }}</i></p>
      <p class="pub-meta">
        <PersonChips :text="pub.authors" :people="pub.people" :people-map="peopleMap" :avatar-base="avatarBase" />; {{ pub.journal }}<template v-if="pub.doi">. doi:<a :href="`https://doi.org/${pub.doi}`">{{ pub.doi }}</a></template><template v-if="pub.pmid">. pmid:<a :href="`https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}`">{{ pub.pmid }}</a></template>
      </p>
      <details v-if="pub.abstract || pub.keywords.length" class="pub-abstract" :id="`abstract-${pub.id}`">
        <summary class="small"><Icon name="caret-down" /> Abstract</summary>
        <p v-if="pub.abstract" class="abstract text-justify small" v-html="pub.abstract"></p>
        <p v-if="pub.keywords.length" class="small"><strong class="small">Keywords:</strong> {{ pub.keywords.join(', ') }}</p>
      </details>
    </td>
  </tr>
</template>
