import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import * as s from './schemas';

const TABLES = {
  people: s.personSchema,
  publications: s.publicationSchema,
  projects: s.projectSchema,
  software: s.softwareSchema,
  editors: s.editorSchema,
  funding: s.fundingSchema,
  news: s.newsSchema,
  teaching: s.teachingSchema,
  presentations: s.presentationSchema,
  posters: s.posterSchema,
  panels: s.panelSchema,
  abstracts: s.abstractSchema,
  meetings: s.meetingSchema,
  activities: s.activitySchema,
  linkedin: s.linkedInSchema,
  tags: s.tagSchema,
} as const;

function rows(name: string): Record<string, unknown>[] {
  return load(readFileSync(`data/${name}.yml`, 'utf8')) as Record<string, unknown>[];
}

describe('schemas mirror data/*.yml', () => {
  for (const [name, schema] of Object.entries(TABLES)) {
    it(`parses every row of ${name}.yml`, () => {
      const raw = rows(name);
      const parsed = schema.array().parse(raw);
      expect(parsed).toHaveLength(raw.length);
    });
  }

  it('parses country_flags.yml as a map', () => {
    const raw = load(readFileSync('data/country_flags.yml', 'utf8')) as Record<string, string>;
    expect(s.countryFlagsSchema.parse(raw)).toEqual(raw);
  });

  // content.config.ts's `yml`/tags loaders inject a row-position `order`
  // field into every parsed row so lib/data.ts can restore a YAML file's
  // original order (getCollection() doesn't preserve it). That field is
  // bookkeeping only: every path that returns data to a page (all()'s
  // plain(), and getTags(), which now shares plain()) must strip it back
  // out before the row reaches a page or an island prop, or it leaks into
  // the serialised HTML (e.g. `tagInfo` props on the homepage's *Section
  // islands). This mirrors that strip so a regression is caught without
  // needing astro:content.
  it('order (injected for file-order sorting) never survives past the strip lib/data.ts applies', () => {
    const raw = rows('tags').map((row, order) => ({ order, ...row }));
    const parsed = s.tagSchema.array().parse(raw);
    expect(parsed.length).toBeGreaterThan(0);
    for (const row of parsed) {
      expect(row).toHaveProperty('order');
      const { order: _order, ...stripped } = row;
      expect(stripped).not.toHaveProperty('order');
    }
  });

  it('renders dates as YYYY-MM-DD strings', () => {
    const pub = s.publicationSchema.parse({
      id: 'x', year: 2026, date: new Date('2026-09-05T00:00:00Z'), authors: 'A', title: 'T',
      journal: 'J', status: 'publication', position: 'first',
    });
    expect(pub.date).toBe('2026-09-05');
    const pub2 = s.publicationSchema.parse({ ...pub, date: '2026-01-02' });
    expect(pub2.date).toBe('2026-01-02');
  });

  it('turns blank and null list fields into []', () => {
    const p = s.projectSchema.parse({ id: 'p', title: 't', status: 'current', abstract: 'a', tags: null, people: null, images: 'one.webp' });
    expect(p.tags).toEqual([]);
    expect(p.people).toEqual([]);
    expect(p.images).toEqual(['one.webp']);
  });

  it('rejects a bare scalar for a plain list field, but still coerces Project.images', () => {
    expect(() =>
      s.projectSchema.parse({ id: 'p', title: 't', status: 'current', abstract: 'a', tags: 'AI' }),
    ).toThrow();
    const p = s.projectSchema.parse({ id: 'p', title: 't', status: 'current', abstract: 'a', images: 'one.webp' });
    expect(p.images).toEqual(['one.webp']);
  });

  it('coerces a numeric string to int for required int fields', () => {
    const pub = s.publicationSchema.parse({
      id: 'x', year: '2024', authors: 'A', title: 'T', journal: 'J', status: 'publication', position: 'first',
    });
    expect(pub.year).toBe(2024);
  });

  it('rejects unknown keys like the pydantic StrictModel', () => {
    expect(() => s.personSchema.parse({ id: 'a', status: 'current', tenure: '2020-', name: 'A', flag: 'x' })).toThrow();
  });

  it('cross-references resolve (people, tags, publications)', () => {
    const personIds = new Set(rows('people').map((r) => r.id as string));
    const tagNames = new Set(rows('tags').map((r) => r.tag as string));
    const pubIds = new Set(rows('publications').map((r) => r.id as string));
    const peopleLinked = ['publications', 'projects', 'software', 'news', 'teaching', 'presentations', 'posters', 'panels', 'abstracts', 'meetings'];
    const tagged = ['publications', 'projects', 'software', 'editors', 'funding', 'news', 'teaching', 'meetings', 'presentations', 'posters'];
    const pubLinked = ['projects', 'software', 'presentations', 'panels'];
    for (const t of peopleLinked) for (const r of rows(t)) for (const id of (r.people as string[] | null) ?? []) expect(personIds, `${t}:${r.id} person ${id}`).toContain(id);
    for (const t of tagged) for (const r of rows(t)) for (const tag of (r.tags as string[] | null) ?? []) expect(tagNames, `${t}:${r.id} tag ${tag}`).toContain(tag);
    for (const t of pubLinked) for (const r of rows(t)) for (const id of (r.publications as string[] | null) ?? []) expect(pubIds, `${t}:${r.id} publication ${id}`).toContain(id);
  });
});
