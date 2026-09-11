<script setup lang="ts">
import { computed } from 'vue';
import { personChips, type PeopleMap } from '../lib/people';

const props = defineProps<{ text: string; people: string[]; peopleMap: PeopleMap; avatarBase: string }>();
const html = computed(() => personChips(props.text, props.people, props.peopleMap, props.avatarBase));
</script>

<template>
  <span v-html="html"></span>
</template>
