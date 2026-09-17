import { describe, expect, it } from 'vitest';
import { isTranslatable, TRANSLATABLE } from './fields';
import {
  tagSchema, personSchema, projectSchema, softwareSchema, editorSchema, fundingSchema,
  newsSchema, teachingSchema, meetingSchema,
} from '../schemas';

const BIBLIOGRAPHIC = ['publications', 'posters', 'presentations', 'abstracts', 'panels'];

describe('TRANSLATABLE', () => {
  it('never lists a bibliographic table', () => {
    for (const table of BIBLIOGRAPHIC) expect(Object.keys(TRANSLATABLE)).not.toContain(table);
  });
  it('never lists a structural field', () => {
    const structural = ['id', 'order', 'doi', 'pmid', 'orcid', 'date', 'year', 'image', 'pdf', 'homepage', 'repository', 'people', 'tags'];
    for (const fields of Object.values(TRANSLATABLE)) {
      for (const f of fields) expect(structural).not.toContain(f);
    }
  });
  it('never lists tags.tag, which is a reference key and a slug', () => {
    expect(TRANSLATABLE.tags).not.toContain('tag');
  });
  it('recognises a translatable table', () => {
    expect(isTranslatable('people')).toBe(true);
  });
  it('rejects a bibliographic table', () => {
    expect(isTranslatable('publications')).toBe(false);
  });
  it('cross-checks all fields exist in the Zod schemas', () => {
    const schemas = {
      tags: tagSchema,
      people: personSchema,
      projects: projectSchema,
      software: softwareSchema,
      editors: editorSchema,
      funding: fundingSchema,
      news: newsSchema,
      teaching: teachingSchema,
      meetings: meetingSchema,
    };
    for (const [table, fields] of Object.entries(TRANSLATABLE)) {
      const schema = schemas[table as keyof typeof schemas];
      expect(schema).toBeDefined();
      const schemaKeys = Object.keys(schema.shape);
      for (const field of fields) {
        expect(schemaKeys).toContain(field);
      }
    }
  });
});
