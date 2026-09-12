<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';
import Modal from './Modal.vue';
import TagList from './TagList.vue';
import { link } from '../lib/url';
import type { NewsData } from '../lib/schemas';
import { stripHtml } from '../lib/text';
import type { Entry, TagInfo } from '../lib/views';

const props = defineProps<{ item: Entry<NewsData>; tagInfo: TagInfo[]; people: { id: string; name: string }[]; imageBase: string; peopleUrl: string }>();
const persons = computed(() => props.item.people.map((id) => props.people.find((p) => p.id === id)).filter(Boolean) as { id: string; name: string }[]);
</script>

<template>
  <Modal :id="`news-modal-${item.id}`" :title="item.title">
    <p class="news-date">{{ item.date }}</p>
    <div v-if="item.video" class="modal-video-embed"><iframe :src="item.video" :title="item.title" loading="lazy" allowfullscreen></iframe></div>
    <img v-else-if="item.image" :src="imageBase + item.image" :alt="item.title" loading="lazy" decoding="async" class="modal-image-single" />
    <TagList :tags="item.tags" :tag-info="tagInfo" />
    <p class="person-modal-description">{{ stripHtml(item.abstract ?? item.short) }}</p>
    <template v-if="persons.length">
      <h6>People</h6>
      <ul class="person-modal-list"><li v-for="p in persons" :key="p.id"><a :href="`${peopleUrl}#person-modal-${p.id}`">{{ p.name }}</a></li></ul>
    </template>
    <div v-if="item.link" class="member-links"><a :href="link(item.link)" target="_blank" rel="noopener noreferrer" title="Read more"><Icon name="globe" /></a></div>
  </Modal>
</template>
