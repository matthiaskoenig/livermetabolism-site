<script setup lang="ts">
import { computed } from 'vue';
import { avatarPeople, type PeopleMap } from '../lib/people';

const props = defineProps<{ people: string[]; peopleMap: PeopleMap; avatarBase: string }>();
const list = computed(() => avatarPeople(props.people, props.peopleMap));
</script>

<template>
  <img v-for="p in list" :key="p.id" :src="avatarBase + p.image" :alt="p.name" class="project-avatar" :title="p.name" />
</template>
