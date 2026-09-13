<script setup lang="ts">
import Icon from './Icon.vue';
import PeopleAvatars from './PeopleAvatars.vue';
import TagList from './TagList.vue';
import type { PeopleMap } from '../lib/people';
import { relativeDate, shortDate, type RepoStats } from '../lib/githubRows';
import type { SoftwareData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

// `repo` is this card's snapshot key (`owner/name` from `item.repository`) and
// `stats` the build-time row for it, null when the build had no snapshot for
// it. The line is rendered whenever there is a key — with every field hidden
// if there is no data yet — so the bundled script of SoftwareLive.astro can
// fill it in from the live snapshot even when the build fell back to
// emptySnapshot(). `data-repo` must stay the key, not GitHub's current
// `fullName`, or that lookup misses a renamed repository.
const props = defineProps<{
  item: Entry<SoftwareData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; imageBase: string; avatarBase: string;
  repo?: string | null; stats?: RepoStats | null;
}>();
// absolute, so it stays right without being re-rendered by refreshRelativeDates()
const releaseTitle = () => (props.stats?.release ? `Release ${props.stats.release.tag} · ${shortDate(props.stats.release.publishedAt)}` : 'Releases');
</script>

<template>
  <div class="project-card" :id="`software-${item.id}`" :data-tags="item.tags.join('|')">
    <img v-if="item.image" :src="imageBase + item.image" :alt="item.name" loading="lazy" decoding="async" class="project-image project-image-contain" />
    <div class="project-body">
      <h3><a class="software-name-link" :href="`#software/${item.id}`" :data-detail="`software:${item.id}`">{{ item.name }}</a></h3>
      <TagList :tags="item.tags" :tag-info="tagInfo" />
      <p><strong>{{ item.title }}</strong><br />{{ item.description }}</p>
      <p v-if="repo" class="software-stats" :data-repo="repo">
        <a class="software-stat" :hidden="!stats?.release" :href="stats?.release?.htmlUrl ?? stats?.htmlUrl ?? item.repository ?? undefined" :title="releaseTitle()" target="_blank" rel="noopener noreferrer"
          ><span data-field="release">{{ stats?.release?.tag ?? '' }}</span></a
        >
        <span class="software-stat" :hidden="!stats" title="Stars">★&nbsp;<span data-field="stars">{{ stats?.stars ?? '' }}</span></span>
        <span class="software-stat" :hidden="!stats" title="Open issues"><span data-field="issues">{{ stats ? `${stats.openIssues} open` : '' }}</span></span>
        <span class="software-stat" :hidden="!stats" title="Last push"><span data-field="pushed" :data-iso="stats?.pushedAt">{{ stats ? relativeDate(stats.pushedAt) : '' }}</span></span>
        <span class="software-stat" :hidden="!stats?.language" title="Main language"><span data-field="language">{{ stats?.language ?? '' }}</span></span>
        <span class="software-stat" :hidden="!stats?.license" title="License"><span data-field="license">{{ stats?.license ?? '' }}</span></span>
      </p>
      <div class="project-links">
        <PeopleAvatars :people="item.people" :people-map="peopleMap" :avatar-base="avatarBase" />
        <span class="project-links-spacer"></span>
        <a v-if="item.homepage" :href="item.homepage" target="_blank" rel="noopener noreferrer" title="Project homepage"><Icon name="globe" /></a>
        <a v-if="item.repository" :href="item.repository" target="_blank" rel="noopener noreferrer" title="Repository homepage"><Icon name="github" /></a>
      </div>
    </div>
  </div>
</template>
