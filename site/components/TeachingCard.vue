<script setup lang="ts">
import Icon from './Icon.vue';
import PersonChips from './PersonChips.vue';
import TagList from './TagList.vue';
import type { PeopleMap } from '../lib/people';
import type { TeachingData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ item: Entry<TeachingData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; imageBase: string; avatarBase: string }>();
const TYPE_ICONS: Record<string, string> = { lecture: 'person-chalkboard', course: 'laptop-code', seminar: 'book' };
</script>

<template>
  <div :id="`teaching-${item.id}`">
    <h3>{{ item.title }}</h3>
    <h4>
      <template v-for="(t, i) in item.type" :key="t"><Icon :name="TYPE_ICONS[t]" />&nbsp;{{ t }}<template v-if="i < item.type.length - 1">, </template></template>
    </h4>
    <TagList :tags="item.tags" :tag-info="tagInfo" />
    <h4><PersonChips :text="item.authors" :people="item.people" :people-map="peopleMap" :avatar-base="avatarBase" /></h4>
    <h5>{{ item.date }} - {{ item.location }}</h5>
    <div class="grid md:grid-cols-4 gap-x-6">
      <div>
        <img v-if="item.image" :src="imageBase + item.image" :alt="item.title" loading="lazy" decoding="async" class="img-fluid" />
        <span v-if="item.caption" v-html="item.caption"></span>
      </div>
      <div class="md:col-span-3">
        <div v-html="item.content"></div>
        <p v-if="item.funding" v-html="item.funding"></p>
      </div>
    </div>
  </div>
</template>
