import { beforeEach, describe, expect, it } from 'vitest';
import { clearConsent, deleteGoogleAnalyticsCookies, disableGoogleAnalytics, getConsent, loadGoogleAnalytics, setConsent } from './consent';

describe('consent storage', () => {
  beforeEach(() => { localStorage.clear(); (window as any).gaLoaded = false; document.head.innerHTML = ''; });

  it('round-trips the choice', () => {
    expect(getConsent()).toBeNull();
    setConsent('accepted');
    expect(getConsent()).toBe('accepted');
    clearConsent();
    expect(getConsent()).toBeNull();
  });

  it('loads gtag once and only when asked', () => {
    loadGoogleAnalytics('G-TEST');
    loadGoogleAnalytics('G-TEST');
    const scripts = document.head.querySelectorAll('script[src*="googletagmanager.com/gtag/js?id=G-TEST"]');
    expect(scripts).toHaveLength(1);
    expect((window as any).dataLayer.length).toBeGreaterThan(0);
  });

  it('deletes _ga cookies', () => {
    document.cookie = '_ga=1; path=/';
    document.cookie = '_ga_X=2; path=/';
    deleteGoogleAnalyticsCookies();
    expect(document.cookie).not.toMatch(/_ga/);
  });
});


it('withdraws consent without loading a second tag on reacceptance', () => {
  window.gaLoaded = false;
  document.head.innerHTML = '';
  loadGoogleAnalytics('G-REVIEW');
  disableGoogleAnalytics('G-REVIEW');
  expect(window['ga-disable-G-REVIEW']).toBe(true);
  loadGoogleAnalytics('G-REVIEW');
  expect(window['ga-disable-G-REVIEW']).toBe(false);
  expect(document.head.querySelectorAll('script')).toHaveLength(1);
});

it('queues Google commands using the documented Arguments format', () => {
  window.gaLoaded = false;
  window.dataLayer = [];
  loadGoogleAnalytics('G-REVIEW');
  expect(Object.prototype.toString.call(window.dataLayer[0])).toBe('[object Arguments]');
  expect(Array.from(window.dataLayer[1] as IArguments)).toEqual(['config', 'G-REVIEW']);
});
