<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps<{ name: string; src: string; position: string; description?: string | null; modalId?: string; imgClass?: string }>();
const root = ref<HTMLElement | null>(null);
const card = ref<HTMLElement | null>(null);
const open = ref(false);

declare global {
  var __personAvatarCloseAll: Set<() => void> | undefined;
}

// module-level registry so only one card is visible across all islands
globalThis.__personAvatarCloseAll ??= new Set();
const registry: Set<() => void> = globalThis.__personAvatarCloseAll;

function close() { open.value = false; if (card.value) { card.value.style.transform = ''; card.value.style.removeProperty('--arrow-shift'); } }
function closeOthers() { for (const fn of registry) if (fn !== close) fn(); }

/** keep the card inside the viewport by shifting it off its centered position */
function clampToViewport() {
  const el = card.value; if (!el) return;
  const margin = 8;
  el.style.transform = 'translateX(-50%)';
  const rect = el.getBoundingClientRect();
  let shift = 0;
  if (rect.left < margin) shift = margin - rect.left;
  else if (rect.right > window.innerWidth - margin) shift = window.innerWidth - margin - rect.right;
  if (shift !== 0) { el.style.transform = `translateX(calc(-50% + ${shift}px))`; el.style.setProperty('--arrow-shift', `${-shift}px`); }
}
function show() { closeOthers(); open.value = true; requestAnimationFrame(clampToViewport); }
function toggle() { const was = open.value; closeOthers(); if (was) close(); else show(); }
function onDocClick(e: MouseEvent) { if (!(e.target as HTMLElement).closest('.person-avatar')) close(); }

onMounted(() => { registry.add(close); document.addEventListener('click', onDocClick); });
onBeforeUnmount(() => { registry.delete(close); document.removeEventListener('click', onDocClick); });
</script>

<template>
  <div ref="root" class="person-avatar" tabindex="0" @mouseenter="show" @mouseleave="close" @focus="show" @blur="close" @click="toggle">
    <img :src="src" :alt="name" loading="lazy" decoding="async" :width="imgClass === 'alumni-photo' ? 40 : 52" :height="imgClass === 'alumni-photo' ? 40 : 52" :class="imgClass" />
    <div ref="card" class="person-card" :class="{ 'is-visible': open }">
      <strong>{{ name }}</strong>
      <span class="person-position">{{ position }}</span>
      <p v-if="description">{{ description }}</p>
      <a v-if="modalId" :href="`#${modalId}`" :data-modal-target="modalId" class="member-more">Full profile &rarr;</a>
    </div>
  </div>
</template>
