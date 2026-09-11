<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { installModalRouter, openModal } from '../lib/modals';

const props = defineProps<{ id: string; title: string; centered?: boolean }>();
const emit = defineEmits<{ open: []; close: [] }>();
const el = ref<HTMLDialogElement | null>(null);

onMounted(() => {
  installModalRouter();
  el.value?.addEventListener('modal:open', () => emit('open'));
  el.value?.addEventListener('close', () => emit('close'));
  // installModalRouter() only checks the URL hash on its own first call, so
  // whichever Modal island hydrates first decides which deep link opens;
  // re-check here on every mount (openModal is a no-op if already open).
  if (window.location.hash === `#${props.id}`) openModal(props.id);
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
