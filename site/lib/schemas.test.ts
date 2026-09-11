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
