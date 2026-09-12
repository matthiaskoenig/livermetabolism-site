<script setup lang="ts">
import Icon from './Icon.vue';
import type { TagFilterEntry } from '../lib/views';

defineProps<{ id: string; tags: TagFilterEntry[]; modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [tag: string] }>();
</script>

<template>
  <div class="tag-filter" :id="`${id}-tag-filter`">
    <button type="button" class="tag-filter-btn" :class="{ active: modelValue === 'all' }" data-tag="all" @click="emit('update:modelValue', 'all')">All</button>
    <button v-for="t in tags" :key="t.tag" type="button" class="tag-filter-btn" :class="[`tag-${t.slug}`, { active: modelValue === t.tag }]"
      :data-tag="t.tag" :title="t.short_description" @click="emit('update:modelValue', t.tag)">
      <Icon :name="t.icon.replace(/^fa-/, '')" /> {{ t.tag }}
    </button>
  </div>
</template>
