<script setup lang="ts">
defineProps<{ id: string; title: string; centered?: boolean }>();

// Every Modal renders statically (no client directive) and needs no JS of
// its own: Base.astro installs the document-level router once and opens
// and closes them. The site search dialog - the last component that
// listened to this one's open/close events - is plain markup in
// SiteSearch.astro now.
</script>

<template>
  <dialog :id="id" class="modal" :class="{ 'modal-centered': centered }" :aria-labelledby="`${id}-label`">
    <div class="modal-header">
      <h5 class="modal-title" :id="`${id}-label`">{{ title }}</h5>
      <button type="button" class="btn-close" data-modal-close aria-label="Close"></button>
    </div>
    <div class="modal-body">
      <slot />
    </div>
  </dialog>
</template>
