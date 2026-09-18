import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { peopleTopics, type TopicPerson, type TopicPublication } from './peopleTopics';
import * as s from './schemas';
import { slugify } from './text';

const people: TopicPerson[] = [{ id: 'ada' }, { id: 'bob' }, { id: 'cleo' }];

const publications: TopicPublication[] = [
  { people: ['ada', 'bob'], tags: ['AI'] },
  { people: ['bob', 'ghost'], tags: ['Digital Twins', 'AI'] },
  { people: ['ada'], tags: [] },
];

describe('peopleTopics', () => {
  const topics = peopleTopics(people, publications);

  it('unions the areas of every publication a person co-authored, deduplicated', () => {
    expect(topics.get('ada')).toEqual(['ai']);
    // 'ai' again from the second paper, and in first-seen order across papers
    expect(topics.get('bob')).toEqual(['ai', 'digital-twins']);
  });

  it('gives a person without publications an empty list rather than no entry', () => {
    expect(topics.get('cleo')).toEqual([]);
    expect(topics.size).toBe(people.length);
  });

  it('knows only the people it was given', () => {
    // 'ghost' authors a paper but is not in people.yml (an external co-author)
    expect(topics.has('ghost')).toBe(false);
  });

  it('returns slugs, not the tag names the YAML carries', () => {
    const one = peopleTopics([{ id: 'x' }], [{ people: ['x'], tags: ['Open & FAIR', 'Digital Pathology'] }]);
    expect(one.get('x')).toEqual(['open-fair', 'digital-pathology']);
  });

  it('hands out a fresh list per person, so a caller cannot leak areas into another', () => {
    const own = peopleTopics(people, publications);
    own.get('ada')!.push('pharmacometrics');
    expect(peopleTopics(people, publications).get('ada')).toEqual(['ai']);
  });
});

describe('peopleTopics over the real data', () => {
  const rows = (name: string) => load(readFileSync(`data/${name}.yml`, 'utf8')) as Record<string, unknown>[];
  const parse = <T>(name: string, schema: { array: () => { parse: (v: unknown) => T[] } }): T[] => schema.array().parse(rows(name));
  const withIds = <T extends { id?: string }>(items: T[]): (T & { id: string })[] => items.map((i) => ({ ...i, id: i.id as string }));

  const data = {
    people: withIds(parse('people', s.personSchema)),
    publications: parse('publications', s.publicationSchema),
    tags: parse('tags', s.tagSchema),
  };
  const topics = peopleTopics(data.people, data.publications);

  it('covers every person of people.yml exactly once', () => {
    expect(topics.size).toBe(data.people.length);
    expect(topics.size).toBe(61);
    for (const person of data.people) expect(topics.has(person.id)).toBe(true);
  });

  it('only ever yields slugs of the five research areas', () => {
    const slugs = new Set(data.tags.map((t) => slugify(t.tag)));
    expect(slugs.size).toBe(5);
    for (const areas of topics.values()) for (const slug of areas) expect(slugs.has(slug)).toBe(true);
  });

  it('puts the group leader in every research area and leaves people without a paper empty', () => {
    // sorted: the order follows publications.yml, the set is what matters here
    expect([...(topics.get('matthias_koenig') ?? [])].sort()).toEqual(
      ['ai', 'digital-pathology', 'digital-twins', 'open-fair', 'pharmacometrics'],
    );
    // 27 of the 61 are students and alumni with no paper of their own; the
    // team page hides their cards under any active area, which is what an
    // empty `data-tags` means
    const empty = [...topics.values()].filter((areas) => areas.length === 0);
    expect(empty).toHaveLength(27);
  });
});
