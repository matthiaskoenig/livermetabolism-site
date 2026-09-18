<script setup lang="ts">
// Publications per year, stacked by research area or by status (client:visible
// island). Unlike the GitHub and Scholar charts this one has no live part: the
// rows come from data/publications.yml through the page's frontmatter
// (publicationRows.ts) and only change when the YAML does.
//
// The two mode buttons live inside the component rather than in the page: this
// island is hydrated anyway, so the switch needs no second script and no
// data-* channel (see CLAUDE.md, "Site chrome", for why static chrome is done
// the other way round).
import { ref } from 'vue';
import { useChart } from './useChart';
import { publicationsOption, PUBLICATIONS_HEIGHT, type PublicationsMode } from '../lib/chartOptions';
import type { UiSlices } from '../lib/i18n/slices';
import { DEFAULT_LOCALE, type Locale } from '../lib/i18n/locales';
import type { PublicationYearRows } from '../lib/publicationRows';
import { setTopic } from '../lib/topicFilter';

const props = defineProps<{ rows: PublicationYearRows; strings: UiSlices['publicationsChart']; locale?: Locale }>();
const mode = ref<PublicationsMode>('tag');

/** Scroll to the publication list, or to one year group inside it. */
function scrollTo(target: HTMLElement | null | undefined): void {
  // scrollIntoView only — nothing here writes a style attribute (CSP)
  (target ?? document.getElementById('publication-list'))?.scrollIntoView({ block: 'start' });
}

/**
 * The year group whose heading is `year`, if it is currently rendered: in
 * "Most cited" order the groups are hidden (pubOrder.ts) and scrolling to one
 * would do nothing, so the caller falls back to the list itself.
 */
function yearGroup(year: string): HTMLElement | null {
  const groups = document.querySelectorAll<HTMLElement>('#publication-list .pub-year-group');
  const group = [...groups].find((g) => g.querySelector('h3.year-heading')?.textContent?.trim() === year);
  return group && !group.hidden ? group : null;
}

/**
 * Click on a bar segment: in research-area mode narrow the site to that area
 * and scroll to the list. In status mode a segment only scrolls, there is no
 * status filter. Click on a year label (xAxis, `triggerEvent`): scroll to that
 * year's group.
 *
 * The filter is the site-wide one (`topicFilter.ts`, issue #68), so this sets
 * a value rather than reaching into another island's DOM as it had to when
 * every page kept its own `TagFilter`: whoever renders the rows - the bar's
 * sweep here, the graph on /network/ - follows the same store.
 */
function onClick(params: unknown): void {
  const p = (params ?? {}) as { componentType?: string; seriesName?: string; name?: string; value?: unknown };
  if (p.componentType === 'xAxis') {
    scrollTo(yearGroup(String(p.value ?? '')));
    return;
  }
  // a series is named after the machine tag value ("Open & FAIR", never a
  // slug - see chartOptions.ts); setTopic() resolves either spelling
  if (mode.value === 'tag' && p.seriesName) setTopic(p.seriesName);
  scrollTo(null);
}

const el = useChart(
  () => publicationsOption(props.rows, mode.value, { total: props.strings.total, status: props.strings.statusLabels }, props.locale ?? DEFAULT_LOCALE),
  () => PUBLICATIONS_HEIGHT,
  onClick,
);
</script>

<template>
  <figure class="publications-plot">
    <div class="chart-modes" role="group" :aria-label="strings.stackBy">
      <button type="button" class="chart-mode-btn" :class="{ active: mode === 'tag' }" :aria-pressed="mode === 'tag'" @click="mode = 'tag'">{{ strings.researchArea }}</button>
      <button type="button" class="chart-mode-btn" :class="{ active: mode === 'status' }" :aria-pressed="mode === 'status'" @click="mode = 'status'">{{ strings.status }}</button>
    </div>
    <div ref="el" class="publications-chart" role="img" :aria-label="strings.ariaLabel"></div>
  </figure>
</template>
