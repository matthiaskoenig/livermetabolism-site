import { onMounted, ref } from 'vue';

/**
 * Port of the .tag-filter handler in main.js: 'all' or one tag name; ?tag=
 * pre-applies on load. `knownTags`, when given, guards that: a `?tag=` value
 * that isn't one of them is ignored and the filter stays on 'all', matching
 * the old site's behaviour.
 */
export function useTagFilter(knownTags?: string[]) {
  const activeTag = ref('all');
  onMounted(() => {
    const urlTag = new URLSearchParams(window.location.search).get('tag');
    if (urlTag && (!knownTags || knownTags.includes(urlTag))) activeTag.value = urlTag;
  });
  function setTag(tag: string) { activeTag.value = tag; }
  function matches(tags: string[]) { return activeTag.value === 'all' || tags.includes(activeTag.value); }
  return { activeTag, setTag, matches };
}
