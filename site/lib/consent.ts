const STORAGE_KEY = 'cookie_consent';
export type Consent = 'accepted' | 'declined';

export function getConsent(): Consent | null {
  try { return localStorage.getItem(STORAGE_KEY) as Consent | null; } catch { return null; }
}
export function setConsent(value: Consent): void {
  try { localStorage.setItem(STORAGE_KEY, value); } catch { /* storage blocked: banner shows again next visit */ }
}
export function clearConsent(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function deleteGoogleAnalyticsCookies(): void {
  const labels = window.location.hostname.split('.');
  const domains = labels.map((_, index) => labels.slice(index).join('.'));
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim() ?? '';
    if (!/^_ga(?:_|$)/.test(name)) continue;
    const expired = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = expired;
    // Analytics uses parent-domain cookies. Host-only deletion misses these.
    // Browsers reject public suffixes and domains outside this hostname.
    for (const domain of domains) document.cookie = `${expired} domain=${domain};`;
  }
}

declare global { interface Window { gaLoaded?: boolean; dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; [key: `ga-disable-${string}`]: boolean } }

/** Disable both running and still-downloading tags before clearing cookies. */
export function disableGoogleAnalytics(gaId: string): void {
  if (gaId) window[`ga-disable-${gaId}`] = true;
  deleteGoogleAnalyticsCookies();
}

/** Requests gtag.js from Google — only ever called after opt-in. */
export function loadGoogleAnalytics(gaId: string): void {
  if (!gaId) return;
  window[`ga-disable-${gaId}`] = false;
  if (window.gaLoaded) return;
  window.gaLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(..._args: unknown[]) { window.dataLayer!.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', gaId);
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  document.head.appendChild(script);
}
