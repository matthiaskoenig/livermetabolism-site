<script setup lang="ts">
import { computed } from 'vue';
import PublicationRow from './PublicationRow.vue';
import TagFilterBar from './TagFilterBar.vue';
import type { PeopleMap } from '../lib/people';
import type { PublicationData } from '../lib/schemas';
import { useTagFilter } from '../lib/tagFilter';
import { groupByYear, type Entry, type TagInfo } from '../lib/views';

const props = defineProps<{ publications: Entry<PublicationData>[]; tagInfo: TagInfo[]; peopleMap: PeopleMap; pdfBase: string; avatarBase: string }>();
const { activeTag, setTag, matches } = useTagFilter(props.tagInfo.map((t) => t.tag));
const groups = computed(() => groupByYear(props.publications).map((g) => ({ ...g, visible: g.items.filter((p) => matches(p.tags)) })));
</script>

<template>
  <TagFilterBar id="publication" :tags="tagInfo" :model-value="activeTag" @update:model-value="setTag" />
  <div id="publication-list">
    <div v-for="g in groups" :key="g.year" class="pub-year-group" v-show="g.visible.length > 0">
      <h3 class="year-heading">{{ g.year }}</h3>
      <table class="table publication-table">
        <colgroup><col class="publication-status-col" /><col /></colgroup>
        <tbody>
          <PublicationRow v-for="p in g.items" :key="p.id" v-show="matches(p.tags)" :pub="p" :tag-info="tagInfo" :people-map="peopleMap" :pdf-base="pdfBase" :avatar-base="avatarBase" />
        </tbody>
      </table>
    </div>
  </div>
</template>
