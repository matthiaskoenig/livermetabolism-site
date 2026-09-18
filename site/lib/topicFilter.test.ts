import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY, getTopic, initTopic, resolveTopic, setTopic, subscribe } from './topicFilter';

const SLUGS = ['digital-twins', 'ai', 'digital-pathology', 'pharmacometrics', 'open-fair'];
const NAMES: Record<string, string> = {
  'digital-twins': 'Digital Twins',
  ai: 'AI',
  'digital-pathology': 'Digital Pathology',
  pharmacometrics: 'Pharmacometrics',
  'open-fair': 'Open & FAIR',
};

/**
 * Puts the module back in the state a fresh page load would give it.
 * `initTopic` deliberately does not drop existing subscribers (an island can
 * hydrate before the bar's script runs), so the tests own that cleanup.
 */
const offs: (() => void)[] = [];
function reset(search = '') {
  for (const off of offs.splice(0)) off();
  localStorage.clear();
  window.history.replaceState(null, '', `/projects/${search}`);
  initTopic(SLUGS, NAMES);
}
/** `subscribe` that unsubscribes at the end of the test. */
function listen(fn: (topic: string | null) => void) {
  const off = subscribe(fn);
  offs.push(off);
  return off;
}
afterEach(() => { for (const off of offs.splice(0)) off(); });

describe('resolveTopic', () => {
  beforeEach(() => reset());

  it('accepts a slug', () => {
    expect(resolveTopic('open-fair')).toBe('open-fair');
  });

  it('accepts the tag name the homepage links with, case- and space-insensitively', () => {
    expect(resolveTopic('Open & FAIR')).toBe('open-fair');
    expect(resolveTopic('  open & fair  ')).toBe('open-fair');
  });

  it('rejects an unknown value rather than filtering everything away', () => {
    expect(resolveTopic('Bogus')).toBeNull();
    expect(resolveTopic('')).toBeNull();
    expect(resolveTopic(null)).toBeNull();
  });
});

describe('initTopic', () => {
  it('starts unfiltered when neither the URL nor storage says otherwise', () => {
    reset();
    expect(getTopic()).toBeNull();
  });

  it('reads ?tag= on load', () => {
    reset('?tag=pharmacometrics');
    expect(getTopic()).toBe('pharmacometrics');
  });

  it('accepts a tag name in ?tag= (the links the homepage sections already emit)', () => {
    reset('?tag=Open%20%26%20FAIR');
    expect(getTopic()).toBe('open-fair');
  });

  it('accepts ?topic=, the network page’s legacy parameter', () => {
    reset('?topic=ai');
    expect(getTopic()).toBe('ai');
  });

  it('restores the topic a previous page stored', () => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY, 'digital-twins');
    window.history.replaceState(null, '', '/publications/');
    initTopic(SLUGS, NAMES);
    expect(getTopic()).toBe('digital-twins');
  });

  it('lets an explicit ?tag= win over the stored topic, so a shared link shows what it says', () => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY, 'digital-twins');
    window.history.replaceState(null, '', '/publications/?tag=ai');
    initTopic(SLUGS, NAMES);
    expect(getTopic()).toBe('ai');
  });

  it('canonicalises a tag-name link to the slug spelling in the URL', () => {
    reset('?tag=Open%20%26%20FAIR');
    expect(new URL(window.location.href).searchParams.get('tag')).toBe('open-fair');
  });

  it('rewrites the legacy ?topic= to ?tag=, so one parameter survives', () => {
    reset('?topic=ai');
    const url = new URL(window.location.href);
    expect(url.searchParams.get('tag')).toBe('ai');
    expect(url.searchParams.has('topic')).toBe(false);
  });

  it('puts a topic restored from storage into the URL, so what is shared is what is shown', () => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY, 'digital-twins');
    window.history.replaceState(null, '', '/publications/');
    initTopic(SLUGS, NAMES);
    expect(new URL(window.location.href).searchParams.get('tag')).toBe('digital-twins');
  });

  it('adds no parameter at all when nothing is filtered', () => {
    reset('?order=cited');
    const url = new URL(window.location.href);
    expect(url.searchParams.has('tag')).toBe(false);
    expect(url.searchParams.get('order')).toBe('cited');
  });

  it('keeps a subscriber that registered before the bar\u2019s script ran', () => {
    // NetworkGraph is client:load and can hydrate (and subscribe) before
    // TopicFilter.astro's own script calls initTopic. If init dropped
    // subscribers, that island would never hear another change.
    for (const off of offs.splice(0)) off();
    const seen: (string | null)[] = [];
    listen((t) => seen.push(t));
    localStorage.clear();
    window.history.replaceState(null, '', '/network/');
    initTopic(SLUGS, NAMES);
    setTopic('ai');
    expect(seen).toContain('ai');
  });

  it('ignores a stored value that is no longer a known tag', () => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY, 'retired-area');
    window.history.replaceState(null, '', '/projects/');
    initTopic(SLUGS, NAMES);
    expect(getTopic()).toBeNull();
  });
});

describe('setTopic', () => {
  beforeEach(() => reset());

  it('stores the choice so the next page starts filtered', () => {
    setTopic('ai');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('ai');
  });

  it('writes the canonical slug into ?tag= without touching other parameters', () => {
    window.history.replaceState(null, '', '/publications/?order=cited');
    setTopic('open-fair');
    expect(new URL(window.location.href).searchParams.get('tag')).toBe('open-fair');
    expect(new URL(window.location.href).searchParams.get('order')).toBe('cited');
  });

  it('drops ?tag= and the stored value when the reader goes back to All', () => {
    setTopic('ai');
    setTopic(null);
    expect(new URL(window.location.href).searchParams.has('tag')).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(getTopic()).toBeNull();
  });

  it('replaces the history entry instead of pushing, so Back leaves the page', () => {
    const push = vi.spyOn(window.history, 'pushState');
    setTopic('ai');
    expect(push).not.toHaveBeenCalled();
    push.mockRestore();
  });

  it('survives storage being blocked', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(() => setTopic('ai')).not.toThrow();
    expect(getTopic()).toBe('ai');
    setItem.mockRestore();
  });
});

describe('subscribe', () => {
  beforeEach(() => reset());

  it('calls a new subscriber immediately with the current topic', () => {
    reset('?tag=ai');
    const seen: (string | null)[] = [];
    listen((t) => seen.push(t));
    expect(seen).toEqual(['ai']);
  });

  it('notifies every subscriber when the topic changes', () => {
    const a: (string | null)[] = [];
    const b: (string | null)[] = [];
    listen((t) => a.push(t));
    listen((t) => b.push(t));
    setTopic('pharmacometrics');
    expect(a).toEqual([null, 'pharmacometrics']);
    expect(b).toEqual([null, 'pharmacometrics']);
  });

  it('does not notify when the topic is set to what it already is', () => {
    setTopic('ai');
    const seen: (string | null)[] = [];
    listen((t) => seen.push(t));
    setTopic('ai');
    expect(seen).toEqual(['ai']);
  });

  it('stops notifying after unsubscribe', () => {
    const seen: (string | null)[] = [];
    const off = listen((t) => seen.push(t));
    off();
    setTopic('ai');
    expect(seen).toEqual([null]);
  });

  it('keeps notifying the others when one subscriber throws', () => {
    const seen: (string | null)[] = [];
    listen(() => { throw new Error('island blew up'); });
    listen((t) => seen.push(t));
    expect(() => setTopic('ai')).not.toThrow();
    expect(seen).toEqual([null, 'ai']);
  });
});
