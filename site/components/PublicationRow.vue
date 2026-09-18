<script setup lang="ts">
import { tagSlugs } from '../lib/text';
import Icon from './Icon.vue';
import PersonChips from './PersonChips.vue';
import TagList from './TagList.vue';
import { normalizeDoi, openalexWorkUrl, type CitationEntry } from '../lib/citationsSchema';
import { fmt } from '../lib/i18n/format';
import type { UiSlices } from '../lib/i18n/slices';
import type { PeopleMap } from '../lib/people';
import type { PublicationData } from '../lib/schemas';
import { slugify } from '../lib/text';
import type { Entry, TagInfo } from '../lib/views';

/**
 * `citation` is the entry of the build's OpenAlex snapshot for this paper, or
 * null when it has no DOI or the snapshot does not cover it. The badge
 * skeleton is rendered for every row **with** a DOI even when the build had no
 * snapshot at all, so `citationsStats.ts` can fill it in from the live file in
 * the browser; `data-cited` is what the Year / Most cited toggle sorts by.
 */
const props = defineProps<{ pub: Entry<PublicationData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; pdfBase: string; avatarBase: string; citation?: CitationEntry | null; strings: UiSlices['publicationRow'] }>();
// the snapshot is keyed by the normalised DOI, and so is the row's data-doi
const doi = normalizeDoi(props.pub.doi ?? '');
const cites = props.citation ?? null;
</script>

<template>
  <tr :id="`pub-${pub.id}`" :data-tags="tagSlugs(pub.tags)" :data-cited="cites ? cites.citedByCount : 0">
    <td class="publication-status">
      <!-- the class name is built from the raw status value (never translated, a CSS/lookup key);
           only the text shown to the reader comes from the catalog -->
      <span class="status-badge" :class="`status-${slugify(pub.status)}`">{{ strings.statusLabels[pub.status] }}</span>
      <div class="pub-links">
        <a v-if="pub.pdf" :href="pdfBase + pub.pdf" :title="strings.pdf"><Icon name="file-pdf-o" /></a>
        <a v-if="pub.homepage" :href="pub.homepage" :title="strings.homepage"><Icon name="globe" /></a>
        <a v-if="pub.repository" :href="pub.repository" :title="strings.repository"><Icon name="github" /></a>
        <span v-if="doi" class="pub-cites" :data-doi="doi">
          <a class="pub-badge pub-badge-cited" data-field="cited" :href="cites ? openalexWorkUrl(cites.openalexId) : undefined"
            target="_blank" rel="noopener noreferrer" :title="strings.citations"
            :hidden="!cites || cites.citedByCount === 0">{{ cites && cites.citedByCount ? fmt(cites.citedByCount === 1 ? strings.cited.one : strings.cited.other, { count: cites.citedByCount }) : '' }}</a>
          <span class="pub-badge pub-badge-oa" data-field="oa" :title="cites ? fmt(strings.openAccessWith, { status: cites.oaStatus }) : strings.openAccessTitle" :hidden="!cites || !cites.isOa">{{ strings.openAccess }}</span>
        </span>
      </div>
    </td>
    <td>
      <TagList :tags="pub.tags" :tag-info="tagInfo" />
      <p class="pub-title"><a class="pub-title-link" :href="`#publication/${pub.id}`" :data-detail="`publication:${pub.id}`"><i>{{ pub.title }}</i></a></p>
      <p class="pub-meta">
        <PersonChips :text="pub.authors" :people="pub.people" :people-map="peopleMap" :avatar-base="avatarBase" />; {{ pub.journal }}<template v-if="pub.doi">. doi:<a :href="`https://doi.org/${pub.doi}`">{{ pub.doi }}</a></template><template v-if="pub.pmid">. pmid:<a :href="`https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}`">{{ pub.pmid }}</a></template>
      </p>
      <details v-if="pub.abstract || pub.keywords.length" class="pub-abstract" :id="`abstract-${pub.id}`">
        <summary class="small"><Icon name="caret-down" /> {{ strings.abstract }}</summary>
        <p v-if="pub.abstract" class="abstract text-justify small" v-html="pub.abstract"></p>
        <p v-if="pub.keywords.length" class="small"><strong class="small">{{ strings.keywords }}</strong> {{ pub.keywords.join(', ') }}</p>
      </details>
    </td>
  </tr>
</template>
