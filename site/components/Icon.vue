<script setup lang="ts">
import { computed } from 'vue';
import { iconSvg } from '../lib/icons';

const props = defineProps<{ name: string; extraClass?: string; title?: string }>();
const html = computed(() => iconSvg(props.name, props.extraClass ?? ''));
</script>

<template>
  <span v-if="title" class="icon-wrap" :title="title" v-html="html"></span>
  <span v-else class="icon-wrap" v-html="html"></span>
</template>
