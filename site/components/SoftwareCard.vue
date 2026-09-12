<script setup lang="ts">
import Icon from './Icon.vue';
import PeopleAvatars from './PeopleAvatars.vue';
import TagList from './TagList.vue';
import type { PeopleMap } from '../lib/people';
import { relativeDate, type RepoStats } from '../lib/githubRows';
import type { SoftwareData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

// `stats` is the build-time snapshot row for this card's repository (null for
// an entry without one); the bundled script of SoftwareLive.astro patches the
// [data-field] spans below in place from a newer snapshot.
const props = defineProps<{ item: Entry<SoftwareData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; imageBase: string; avatarBase: string; stats?: RepoStats | null }>();
const releaseTitle = () => (props.stats?.release ? `Release ${props.stats.release.tag}, ${relativeDate(props.stats.release.publishedAt)}` : 'Releases');
</script>

<template>
  <div class="project-card" :id="`software-${item.id}`" :data-tags="item.tags.join('|')">
    <img v-if="item.image" :src="imageBase + item.image" :alt="item.name" loading="lazy" decoding="async" class="project-image project-image-contain" />
    <div class="project-body">
      <h3>{{ item.name }}</h3>
      <TagList :tags="item.tags" :tag-info="tagInfo" />
      <p><strong>{{ item.title }}</strong><br />{{ item.description }}</p>
      <p v-if="stats" class="software-stats" :data-repo="stats.fullName">
        <a class="software-stat" :hidden="!stats.release" :href="stats.release ? stats.release.htmlUrl : stats.htmlUrl" :title="releaseTitle()" target="_blank" rel="noopener noreferrer"
          ><span data-field="release">{{ stats.release ? stats.release.tag : '' }}</span></a
        >
        <span class="software-stat" title="Stars">★&nbsp;<span data-field="stars">{{ stats.stars }}</span></span>
        <span class="software-stat" title="Open issues"><span data-field="issues">{{ stats.openIssues }} open</span></span>
        <span class="software-stat" title="Last push"><span data-field="pushed" :data-iso="stats.pushedAt">{{ relativeDate(stats.pushedAt) }}</span></span>
        <span class="software-stat" :hidden="!stats.language" title="Main language"><span data-field="language">{{ stats.language }}</span></span>
        <span class="software-stat" :hidden="!stats.license" title="License"><span data-field="license">{{ stats.license }}</span></span>
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
