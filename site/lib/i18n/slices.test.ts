import { describe, expect, it } from 'vitest';
import { uiFor } from './catalog';
import { slices } from './slices';

describe('slices', () => {
  it('bundles the software card strings', () => {
    const s = slices(uiFor('en').t);
    expect(s.softwareCard.stars).toBe('Stars');
    expect(s.softwareCard.issues).toBe('Open issues');
  });
  it('yields only serialisable values, so an island can take one as a prop', () => {
    const s = slices(uiFor('en').t);
    for (const [name, slice] of Object.entries(s)) {
      expect(JSON.parse(JSON.stringify(slice)), name).toEqual(slice);
    }
  });
  it('keeps a parameterised string as a template for the component to format', () => {
    const s = slices(uiFor('en').t);
    expect(s.softwareCard.release).toContain('{tag}');
  });
});
