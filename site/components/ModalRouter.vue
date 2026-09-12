<script setup lang="ts">
import { onMounted } from 'vue';
import { installModalRouter } from '../lib/modals';

/**
 * The document-level modal router, mounted once from Base.astro. Every
 * <dialog class="modal"> on a list page is static HTML now (no island
 * props), so a single install - which also runs the initial hash check
 * for /people/#person-modal-<id> style deep links - covers the whole
 * page. Renders nothing visible; it exists only to own that onMounted.
 */
onMounted(installModalRouter);
</script>

<template>
  <span hidden></span>
</template>
