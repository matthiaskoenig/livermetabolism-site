<script setup lang="ts">
import Icon from './Icon.vue';
import PersonChips from './PersonChips.vue';
import TagList from './TagList.vue';
import { type DetailModel, type RelatedRow } from '../lib/details';
import { DETAIL_TYPES } from '../lib/detailTypes';
import type { UiSlices } from '../lib/i18n/slices';
import type { PeopleMap } from '../lib/people';
import type { TagInfo } from '../lib/views';

/**
 * The one standard detail view of a person, publication, project, software
 * entry or news item (`site/lib/details.ts` builds the model). Rendered
 * **statically** by `site/pages/detail/[type]/[id].astro` into a page partial
 * — one fragment per entity — which the modal shell fetches and adopts, so
 * this component never hydrates and must not rely on lifecycle hooks.
 *
 * `tagInfo`, `peopleMap` and `avatarBase` are what `TagList` and
 * `PersonChips` need to render the same badges and author chips as the cards;
 * everything else comes from the model, whose hrefs already carry the deploy's
 * base path.
 *
 * The only HTML inserted as HTML is `model.body` — the data's own
 * `description`/`abstract` field, which the cards and the retired modals
 * already render the same way (`data/*.yml` is closed to outside input and
 * validated by both schemas). Every other value is interpolated as text.
 */
defineProps<{ model: DetailModel; tagInfo: TagInfo[]; peopleMap: PeopleMap; avatarBase: string; strings: UiSlices['detailView'] }>();

/** A row of one of the five modal types opens its own detail; a presentation or poster row just links to its card. */
const detailTarget = (row: RelatedRow): string | undefined =>
  (DETAIL_TYPES as readonly string[]).includes(row.type) ? `${row.type}:${row.id}` : undefined;
</script>

<template>
  <div class="detail" :data-detail-type="model.type" :data-detail-id="model.id">
    <div class="detail-header">
      <img v-if="model.image" :src="model.image" :alt="model.title" decoding="async"
        class="detail-image" :class="`detail-image-${model.imageShape}`" />
      <div class="detail-heading">
        <p v-if="model.badge" class="detail-badge">
          <span class="status-badge" :class="model.badge.cls">{{ model.badge.text }}</span>
        </p>
        <h3 class="detail-title">{{ model.title }}</h3>
        <p class="detail-subtitle">
          <PersonChips v-if="model.authors" :text="model.authors.text" :people="model.authors.people" :people-map="peopleMap" :avatar-base="avatarBase" /><template
            v-if="model.authors && model.subtitle"> &middot; </template>{{ model.subtitle }}
        </p>
        <TagList :tags="model.tags" :tag-info="tagInfo" />
        <div v-if="model.links.length" class="detail-links member-links">
          <a v-for="l in model.links" :key="l.label" :href="l.href" :title="l.label"
            :target="l.external ? '_blank' : undefined" :rel="l.external ? 'noopener noreferrer' : undefined"><Icon :name="l.icon" /></a>
        </div>
      </div>
    </div>

    <p v-if="model.figures.length" class="detail-figures">
      <span v-for="f in model.figures" :key="f.label" class="detail-figure">
        <a v-if="f.href" class="detail-figure-value" :href="f.href" target="_blank" rel="noopener noreferrer">{{ f.value }}</a><span
          v-else class="detail-figure-value">{{ f.value }}</span>
        <span class="detail-figure-label">{{ f.label }}</span>
      </span>
    </p>

    <template v-if="model.media">
      <div v-if="model.media.kind === 'video'" class="detail-media detail-video">
        <iframe :src="model.media.src" :title="model.media.title" loading="lazy" allowfullscreen></iframe>
      </div>
      <template v-else>
        <div class="detail-media detail-gallery">
          <img v-for="img in model.media.images" :key="img" :src="img" :alt="model.title" loading="lazy" decoding="async" />
        </div>
        <p v-if="model.media.caption" class="detail-media-caption">{{ model.media.caption }}</p>
      </template>
    </template>

    <div v-if="model.body" class="detail-body" v-html="model.body"></div>
    <p v-if="model.keywords.length" class="detail-keywords"><strong>{{ strings.keywords }}</strong> {{ model.keywords.join(', ') }}</p>

    <div v-for="s in model.related" :key="s.label" class="detail-related-group">
      <h6 class="detail-related-label">{{ s.label }} ({{ s.rows.length }})</h6>
      <ul class="detail-related">
        <li v-for="row in s.rows" :key="`${row.type}:${row.id}`">
          <a class="related-row" :href="row.href" :data-detail="detailTarget(row)">
            <img v-if="row.image" :src="row.image" alt="" loading="lazy" decoding="async"
              class="related-row-image" :class="{ 'related-row-image-round': row.type === 'person', 'related-row-image-logo': row.type === 'software' }" />
            <span v-else class="related-row-image related-row-image-blank"></span>
            <span class="related-row-text">
              <span class="related-row-title">{{ row.title }}</span>
              <span v-if="row.line" class="related-row-line">{{ row.line }}</span>
            </span>
          </a>
        </li>
      </ul>
    </div>

    <p class="detail-footer"><a class="detail-list-link" :href="model.listHref">{{ strings.showInList }} &rarr;</a></p>
  </div>
</template>
