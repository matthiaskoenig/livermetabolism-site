<script setup lang="ts">
import { onMounted, watch } from 'vue';
import TagFilterBar from './TagFilterBar.vue';
import { useTagFilter } from '../lib/tagFilter';
import type { TagFilterEntry } from '../lib/views';

/**
 * The only interactive part of a list page: the cards/rows themselves are
 * static HTML (no island props, no second copy of the data), so filtering
 * means walking the already-rendered `[data-tags]` elements inside
 * `#<target>` and toggling the `hidden` attribute on them - plus on any
 * `groupSelector` wrapper (publications' per-year groups) whose items all
 * went away.
 */
const props = withDefaults(
  defineProps<{ id: string; tags: TagFilterEntry[]; target: string; groupSelector?: string }>(),
  { groupSelector: '.pub-year-group' },
);

// useTagFilter registers its own onMounted first (it runs in setup, above
// ours), so by the time apply() runs on mount, ?tag= has been read.
const { activeTag, setTag, matches } = useTagFilter(props.tags.map((t) => t.tag));

function apply(): void {
  const root = document.getElementById(props.target);
  if (!root) return;
  for (const el of root.querySelectorAll<HTMLElement>('[data-tags]')) {
    el.hidden = !matches(el.dataset.tags ? el.dataset.tags.split('|') : []);
  }
  for (const group of root.querySelectorAll<HTMLElement>(props.groupSelector)) {
    group.hidden = !group.querySelector('[data-tags]:not([hidden])');
  }
}

onMounted(apply);
watch(activeTag, apply);
</script>

<template>
  <TagFilterBar :id="id" :tags="tags" :model-value="activeTag" @update:model-value="setTag" />
</template>
