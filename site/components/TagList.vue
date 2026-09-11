<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';
import { slugify } from '../lib/text';
import type { TagInfo } from '../lib/views';

const props = defineProps<{ tags: string[]; tagInfo: TagInfo[] }>();
const items = computed(() => props.tags.map((tag) => ({ tag, slug: slugify(tag), icon: props.tagInfo.find((t) => t.tag === tag)?.icon ?? null })));
</script>

<template>
  <div v-if="items.length" class="tag-list">
    <span v-for="t in items" :key="t.tag" class="tag-badge" :class="`tag-${t.slug}`"><Icon v-if="t.icon" :name="t.icon.replace(/^fa-/, '')" /> {{ t.tag }}</span>
  </div>
</template>
