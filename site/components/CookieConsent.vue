<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { clearConsent, deleteGoogleAnalyticsCookies, getConsent, loadGoogleAnalytics, setConsent } from '../lib/consent';

const props = defineProps<{ gaId: string; privacyUrl: string }>();
const visible = ref(false);

function accept() { setConsent('accepted'); loadGoogleAnalytics(props.gaId); visible.value = false; }
function decline() { setConsent('declined'); deleteGoogleAnalyticsCookies(); visible.value = false; }
function reset() { clearConsent(); deleteGoogleAnalyticsCookies(); window.gaLoaded = false; visible.value = true; }

onMounted(() => {
  const consent = getConsent();
  if (consent === 'accepted') loadGoogleAnalytics(props.gaId);
  else if (consent !== 'declined') visible.value = true;
  // "Cookie-Einstellungen ändern" button on /privacy/ — withdrawing must be as easy as giving
  document.getElementById('cookie-consent-reset')?.addEventListener('click', reset);
});
</script>

<template>
  <div id="cookie-consent-banner" class="cookie-consent" :hidden="!visible">
    <p class="cookie-consent-text">
      This site uses Google Analytics to understand how it's used. It only runs if you accept — see the <a :href="privacyUrl">privacy policy</a> for details.
    </p>
    <div class="cookie-consent-actions">
      <button type="button" id="cookie-consent-decline" class="btn btn-outline-secondary btn-sm" @click="decline">Decline</button>
      <button type="button" id="cookie-consent-accept" class="btn btn-primary btn-sm" @click="accept">Accept</button>
    </div>
  </div>
</template>
