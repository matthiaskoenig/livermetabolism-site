/**
 * The site's one research-area filter (issue #68).
 *
 * Before this module every filterable page owned its own filter state: five
 * `TagFilter` islands keyed by tag *name*, plus a sixth, hand-rolled one
 * inside `NetworkGraph.vue` keyed by *slug* and reading a differently named
 * query parameter. Picking an area on one page meant nothing on the next,
 * and `/research/`'s three bars did not even agree with each other.
 *
 * Now there is a single value, held here, that the sticky bar
 * (`TopicFilter.astro`), the DOM sweep (`topicApply.ts`) and the two chart
 * islands all read and write. It is a **slug** (`open-fair`), not a tag name
 * (`Open & FAIR`): the CSS tokens, `TAG_PALETTE` and the network graph's
 * `filterRows()` are slug-keyed already, and a slug needs no URL escaping.
 * `resolveTopic()` still accepts either spelling, so the `?tag=Open & FAIR`
 * links the homepage sections emit keep working.
 *
 * This module has **no imports on purpose**. It is pulled into the site
 * chrome bundle on every page, so it must not drag in the YAML/Zod/snapshot
 * side of the build - the same reason `detailTypes.ts` is its own leaf
 * module. The tag vocabulary is injected by `initTopic()` from the bar's
 * `data-*` attributes instead of imported.
 */

export const STORAGE_KEY = 'km.topic';

/** `?tag=` is canonical; `?topic=` is what `/network/` used before #68. */
const PARAMS = ['tag', 'topic'] as const;

type Listener = (topic: string | null) => void;

let known: string[] = [];
/** lower-cased tag name -> slug, so `?tag=Open & FAIR` still resolves */
let byName = new Map<string, string>();
let current: string | null = null;
const listeners = new Set<Listener>();

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* storage blocked (private window, blocked site data): the filter still works, it just will not outlive the page */ }
}

/**
 * The one place a value from outside becomes a topic: a slug, or a tag name
 * in any casing. Anything else is `null` (= no filter) rather than a topic
 * that matches nothing, so a stale link or a retired area shows the full
 * site instead of an empty page.
 */
export function resolveTopic(value: string | null | undefined): string | null {
  if (!value) return null;
  const wanted = value.trim().toLowerCase();
  if (!wanted) return null;
  if (known.includes(wanted)) return wanted;
  return byName.get(wanted) ?? null;
}

export function getTopic(): string | null {
  return current;
}

/**
 * Establishes the vocabulary and the starting topic for this page load.
 *
 * Precedence is URL, then storage. An explicit `?tag=` has to win: a link
 * someone shares must show what it says, not whatever area the reader last
 * happened to pick here.
 */
export function initTopic(slugs: string[], names: Record<string, string>): void {
  known = slugs;
  byName = new Map(Object.entries(names).map(([slug, name]) => [name.trim().toLowerCase(), slug]));

  // Subscribers are deliberately left alone. An island that hydrates before
  // the bar's own script runs has already subscribed by this point, and
  // dropping it here would leave that island deaf to every later change -
  // the network graph, which is `client:load`, is exactly that case.
  const params = new URLSearchParams(window.location.search);
  let next: string | null = null;
  for (const param of PARAMS) {
    next = resolveTopic(params.get(param));
    if (next) break;
  }
  const before = current;
  current = next ?? resolveTopic(read(STORAGE_KEY));

  // An area that arrived in the URL is a choice like any other, so it is
  // stored too. Without this, following a homepage link to
  // /publications/?tag=ai and then clicking "Projects" in the navbar dropped
  // the area again, while picking the same area from the bar carried it -
  // two entry points, two behaviours.
  write(STORAGE_KEY, current);

  // The URL always shows the area in effect, in one canonical spelling: a
  // `?tag=Open & FAIR` or `?topic=ai` link normalises on arrival, and a
  // topic restored from storage appears too, so what a reader copies out of
  // the address bar is what they are actually looking at.
  syncUrl();

  // An island that hydrated before this ran (NetworkGraph is client:load)
  // was handed the pre-init value by subscribe(). Tell it what was actually
  // restored, or the bar would show an area the graph never applied.
  if (current !== before) notify();
}

/** Mirrors `current` into `?tag=`, leaving every other parameter alone. */
function syncUrl(): void {
  const url = new URL(window.location.href);
  const before = url.search;
  url.searchParams.delete('topic');
  if (current) url.searchParams.set('tag', current);
  else url.searchParams.delete('tag');
  if (url.search === before) return;
  // replaceState, never pushState: the filter is a view preference, not a
  // destination. Pushing would make the browser Back button walk through
  // every pill the reader tried instead of leaving the page.
  window.history.replaceState(window.history.state, '', url);
}

/** Notifies every listener, so one broken island cannot freeze the filter. */
function notify(): void {
  for (const listener of [...listeners]) {
    try { listener(current); } catch { /* a subscriber's own failure is not the filter's */ }
  }
}

export function setTopic(topic: string | null): void {
  const next = topic === null ? null : resolveTopic(topic);
  if (next === current) return;
  current = next;
  write(STORAGE_KEY, next);
  syncUrl();
  notify();
}

/**
 * Subscribes to the topic, and calls back immediately with its current
 * value - so a caller has one code path for "set up" and "changed" instead
 * of having to apply the initial state itself.
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  try { listener(current); } catch { /* see notify() */ }
  return () => { listeners.delete(listener); };
}
