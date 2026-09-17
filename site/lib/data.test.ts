// @vitest-environment node
//
// astro:content is a server-only virtual module (getCollection() throws
// "ServerOnlyModule" under happy-dom, the suite's default environment,
// because Astro's content plugin only registers it for the SSR/node
// environment) - data.ts is build-time only by design (see CLAUDE.md), so
// this file overrides the environment rather than relaxing that boundary.
import { describe, expect, it } from 'vitest';
import { getNews, getPublications } from './data';

describe('the locale-aware getters', () => {
  it('returns English rows for the default locale', async () => {
    const news = await getNews('en');
    expect(news.length).toBeGreaterThan(0);
  });
  it('returns the same number of rows for German', async () => {
    const [en, de] = await Promise.all([getNews('en'), getNews('de')]);
    expect(de).toHaveLength(en.length);
  });
  it('keeps row order between locales', async () => {
    const [en, de] = await Promise.all([getNews('en'), getNews('de')]);
    expect(de.map((r) => r.id)).toEqual(en.map((r) => r.id));
  });
  it('leaves a bibliographic title in English on the German tree', async () => {
    const [en, de] = await Promise.all([getPublications('en'), getPublications('de')]);
    expect(de.map((p) => p.title)).toEqual(en.map((p) => p.title));
  });
});
