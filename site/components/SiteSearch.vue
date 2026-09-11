<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Icon from './Icon.vue';
import Modal from './Modal.vue';
import { closeModal, openModal } from '../lib/modals';
import { rankRecords, SEARCH_TYPE_ICONS, type SearchRecord } from '../lib/search';

const props = defineProps<{ searchUrl: string }>();
const MODAL_ID = 'site-search-modal';

const input = ref<HTMLInputElement | null>(null);
const query = ref('');
const records = ref<SearchRecord[] | null>(null);
const failed = ref(false);
const results = ref<SearchRecord[]>([]);
let loading: Promise<void> | null = null;

function load(): Promise<void> {
  if (!loading) {
    loading = fetch(props.searchUrl)
      .then((r) => r.json())
      .then((data: SearchRecord[]) => { records.value = data; })
      .catch(() => { failed.value = true; });
  }
  return loading;
}

function render() {
  results.value = records.value ? rankRecords(records.value, query.value) : [];
}

function onOpen() {
  input.value?.focus();
  load().then(render);
}

function onClose() {
  query.value = '';
  results.value = [];
}

onMounted(() => {
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    const inField = tag === 'INPUT' || tag === 'TEXTAREA';
    const isSlash = e.key === '/' && !inField;
    const isCtrlK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
    if (isSlash || isCtrlK) { e.preventDefault(); openModal(MODAL_ID); }
  });
});
</script>

<template>
  <Modal :id="MODAL_ID" title="Search" centered @open="onOpen" @close="onClose">
    <input ref="input" v-model="query" type="search" id="site-search-input" class="form-control site-search-input"
      placeholder="Search publications, people, projects, software, news, ..." autocomplete="off" aria-label="Search" @input="render" />
    <div id="site-search-results" class="site-search-results">
      <p v-if="failed" class="site-search-empty">Search is temporarily unavailable.</p>
      <p v-else-if="!query.trim()" class="site-search-hint">Start typing to search publications, people, projects, software, news, and more.</p>
      <p v-else-if="results.length === 0" class="site-search-empty">No results for &ldquo;{{ query.trim() }}&rdquo;.</p>
      <a v-else v-for="r in results" :key="r.url" class="site-search-result" :href="r.url" @click="closeModal(MODAL_ID)">
        <Icon :name="SEARCH_TYPE_ICONS[r.type] ?? 'file-o'" />
        <span class="site-search-result-body">
          <span class="site-search-result-title">{{ r.title }}</span>
          <span class="site-search-result-type">{{ r.type }}</span>
        </span>
      </a>
    </div>
  </Modal>
</template>
