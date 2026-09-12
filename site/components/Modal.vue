<script setup lang="ts">
import { onMounted, ref } from 'vue';

defineProps<{ id: string; title: string; centered?: boolean }>();
const emit = defineEmits<{ open: []; close: [] }>();
const el = ref<HTMLDialogElement | null>(null);

// Most modals render statically (no client directive), so this never runs
// for them - they need no JS of their own: ModalRouter.vue installs the
// document-level router once from Base.astro and opens/closes them. Only a
// hydrated user of these emits (SiteSearch) gets the listeners.
onMounted(() => {
  el.value?.addEventListener('modal:open', () => emit('open'));
  el.value?.addEventListener('close', () => emit('close'));
});
</script>

<template>
  <dialog ref="el" :id="id" class="modal" :class="{ 'modal-centered': centered }" :aria-labelledby="`${id}-label`">
    <div class="modal-header">
      <h5 class="modal-title" :id="`${id}-label`">{{ title }}</h5>
      <button type="button" class="btn-close" data-modal-close aria-label="Close"></button>
    </div>
    <div class="modal-body">
      <slot />
    </div>
  </dialog>
</template>
