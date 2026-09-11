import { defineCollection, reference } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { load } from 'js-yaml';
import * as s from './lib/schemas';

// tags.yml rows have no `id`; the tag name itself is the id so that the
// `tags: ['Digital Twins']` lists on other tables resolve with reference().
const tagsLoader = file('data/tags.yml', {
  parser: (text) => (load(text) as { tag: string }[]).map((t) => ({ id: t.tag, ...t })),
});
// country_flags.yml is a map country -> emoji, not a list.
const countryFlagsLoader = file('data/country_flags.yml', {
  parser: (text) => Object.entries(load(text) as Record<string, string>).map(([id, flag]) => ({ id, flag })),
});
const yml = (name: string) => file(`data/${name}.yml`);

const refList = (collection: 'people' | 'tags' | 'publications') =>
  z.preprocess((v) => (v == null || v === '' ? [] : v), z.array(reference(collection)));

const withPeopleTags = { tags: refList('tags'), people: refList('people') };

export const collections = {
  tags: defineCollection({ loader: tagsLoader, schema: s.tagSchema }),
  countryFlags: defineCollection({ loader: countryFlagsLoader, schema: s.countryFlagSchema }),
  people: defineCollection({ loader: yml('people'), schema: s.personSchema }),
  publications: defineCollection({ loader: yml('publications'), schema: s.publicationSchema.extend(withPeopleTags) }),
  projects: defineCollection({ loader: yml('projects'), schema: s.projectSchema.extend({ ...withPeopleTags, publications: refList('publications') }) }),
  software: defineCollection({ loader: yml('software'), schema: s.softwareSchema.extend({ ...withPeopleTags, publications: refList('publications') }) }),
  editors: defineCollection({ loader: yml('editors'), schema: s.editorSchema.extend({ tags: refList('tags') }) }),
  funding: defineCollection({ loader: yml('funding'), schema: s.fundingSchema.extend({ tags: refList('tags') }) }),
  news: defineCollection({ loader: yml('news'), schema: s.newsSchema.extend(withPeopleTags) }),
  teaching: defineCollection({ loader: yml('teaching'), schema: s.teachingSchema.extend(withPeopleTags) }),
  presentations: defineCollection({ loader: yml('presentations'), schema: s.presentationSchema.extend({ ...withPeopleTags, publications: refList('publications') }) }),
  posters: defineCollection({ loader: yml('posters'), schema: s.posterSchema.extend(withPeopleTags) }),
  panels: defineCollection({ loader: yml('panels'), schema: s.panelSchema.extend({ people: refList('people'), publications: refList('publications') }) }),
  abstracts: defineCollection({ loader: yml('abstracts'), schema: s.abstractSchema.extend({ people: refList('people') }) }),
  meetings: defineCollection({ loader: yml('meetings'), schema: s.meetingSchema.extend(withPeopleTags) }),
  activities: defineCollection({ loader: yml('activities'), schema: s.activitySchema }),
  linkedin: defineCollection({ loader: yml('linkedin'), schema: s.linkedInSchema }),
};
