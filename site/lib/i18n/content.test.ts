import { describe, expect, it } from 'vitest';
import { localize, type Catalog } from './content';

const rows = [
  { id: 'koenig', name: 'Matthias König', description: 'Group leader.', role: ['Group Leader'] },
  { id: 'other', name: 'Other Person', description: 'Postdoc.', role: ['Postdoc'] },
];

const catalog: Catalog = {
  koenig: {
    description: { sha: 'aaaa000000000000', text: 'Gruppenleiter.' },
    role: { sha: 'bbbb000000000000', text: ['Gruppenleiter'] },
  },
};

describe('localize', () => {
  it('substitutes a translated field', () => {
    expect(localize(rows, catalog, ['description', 'role'])[0].description).toBe('Gruppenleiter.');
  });
  it('substitutes a list field', () => {
    expect(localize(rows, catalog, ['description', 'role'])[0].role).toEqual(['Gruppenleiter']);
  });
  it('falls back to English for a row with no catalog entry', () => {
    expect(localize(rows, catalog, ['description'])[1].description).toBe('Postdoc.');
  });
  it('leaves a field outside the registry untouched', () => {
    expect(localize(rows, catalog, ['description'])[0].name).toBe('Matthias König');
  });
  it('does not mutate the input rows', () => {
    localize(rows, catalog, ['description']);
    expect(rows[0].description).toBe('Group leader.');
  });
  it('preserves row order', () => {
    expect(localize(rows, catalog, ['description']).map((r) => r.id)).toEqual(['koenig', 'other']);
  });
  it('falls back to English when a field is missing from the catalog entry', () => {
    const partial: Catalog = {
      koenig: {
        role: { sha: 'bbbb000000000000', text: ['Gruppenleiter'] },
      },
    };
    expect(localize(rows, partial, ['description', 'role'])[0].description).toBe('Group leader.');
  });
  it('falls back to English when an entry has an empty string', () => {
    const empty: Catalog = {
      koenig: {
        description: { sha: 'aaaa000000000000', text: '' },
      },
    };
    expect(localize(rows, empty, ['description'])[0].description).toBe('Group leader.');
  });
  it('falls back to English when an entry has an empty array', () => {
    const emptyArray: Catalog = {
      koenig: {
        role: { sha: 'bbbb000000000000', text: [] },
      },
    };
    expect(localize(rows, emptyArray, ['role'])[0].role).toEqual(['Group Leader']);
  });
  it('copies array values to avoid sharing references', () => {
    const result = localize(rows, catalog, ['role']);
    expect(result[0].role).toEqual(['Gruppenleiter']);
    result[0].role.push('new item');
    expect(result[0].role).toContain('new item');
    const result2 = localize(rows, catalog, ['role']);
    expect(result2[0].role).toEqual(['Gruppenleiter']);
  });
});
