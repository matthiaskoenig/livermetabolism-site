import { onMounted, ref } from 'vue';

/** Port of the .tag-filter handler in main.js: 'all' or one tag name; ?tag= pre-applies on load. */
export function useTagFilter() {
  const activeTag = ref('all');
  onMounted(() => {
    const urlTag = new URLSearchParams(window.location.search).get('tag');
    if (urlTag) activeTag.value = urlTag;
  });
  function setTag(tag: string) { activeTag.value = tag; }
  function matches(tags: string[]) { return activeTag.value === 'all' || tags.includes(activeTag.value); }
  return { activeTag, setTag, matches };
}
