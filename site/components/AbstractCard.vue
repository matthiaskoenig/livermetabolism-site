<script setup lang="ts">
import Icon from './Icon.vue';
import type { AbstractData } from '../lib/schemas';
import { stripHtml } from '../lib/text';
import type { Entry } from '../lib/views';

defineProps<{ item: Entry<AbstractData>; pdfBase: string }>();
</script>

<template>
  <div class="project-card" :id="`abstract-${item.id}`">
    <div class="project-body">
      <p class="news-date">{{ item.date ?? item.year }}</p>
      <h3>{{ item.title }}</h3>
      <p>{{ item.event }}<template v-if="item.authors"><br />{{ stripHtml(item.authors) }}</template></p>
      <div class="project-links">
        <span class="project-links-spacer"></span>
        <a v-if="item.pdf" :href="pdfBase + item.pdf" target="_blank" rel="noopener noreferrer" title="PDF"><Icon name="file-pdf-o" /></a>
        <a v-if="item.homepage" :href="item.homepage" target="_blank" rel="noopener noreferrer" title="Homepage"><Icon name="globe" /></a>
        <a v-if="item.repository" :href="item.repository" target="_blank" rel="noopener noreferrer" title="Repository"><Icon name="github" /></a>
        <a v-if="item.event_page" :href="item.event_page" target="_blank" rel="noopener noreferrer" title="Event page"><Icon name="globe" /></a>
      </div>
    </div>
  </div>
</template>
