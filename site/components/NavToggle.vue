<script setup lang="ts">
import { ref } from 'vue';

const open = ref(false);
function toggle() {
  open.value = !open.value;
  document.getElementById('navbar')?.classList.toggle('show', open.value);
}
</script>

<template>
  <button type="button" class="navbar-toggler" id="navbar-toggler" aria-controls="navbar" :aria-expanded="open ? 'true' : 'false'" aria-label="Toggle navigation" @click="toggle">
    <span class="navbar-toggler-icon"></span>
  </button>
</template>
