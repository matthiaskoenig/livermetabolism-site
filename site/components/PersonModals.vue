<script setup lang="ts">
import PersonModal, { type PersonRefs } from './PersonModal.vue';
import type { PersonData } from '../lib/schemas';
import type { Entry } from '../lib/views';

defineProps<{ items: { person: Entry<PersonData>; refs: PersonRefs }[]; avatarBase: string; publicationsUrl: string }>();
</script>

<template>
  <PersonModal v-for="it in items" :key="it.person.id" :person="it.person" :refs="it.refs" :avatar-base="avatarBase" :publications-url="publicationsUrl" />
</template>
