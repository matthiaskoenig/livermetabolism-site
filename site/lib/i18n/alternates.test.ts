import { describe, expect, it } from 'vitest';
import { alternates } from './alternates';

const site = new URL('https://livermetabolism.com');

describe('alternates', () => {
  it('lists both languages plus x-default for an English page', () => {
    expect(alternates('/publications/', site)).toEqual([
      { hreflang: 'en-US', href: 'https://livermetabolism.com/publications/' },
      { hreflang: 'de-DE', href: 'https://livermetabolism.com/de/publications/' },
      { hreflang: 'x-default', href: 'https://livermetabolism.com/publications/' },
    ]);
  });
  it('produces the same set for the German page', () => {
    expect(alternates('/de/publications/', site)).toEqual(alternates('/publications/', site));
  });
  it('handles the homepage', () => {
    expect(alternates('/de/', site)).toEqual([
      { hreflang: 'en-US', href: 'https://livermetabolism.com/' },
      { hreflang: 'de-DE', href: 'https://livermetabolism.com/de/' },
      { hreflang: 'x-default', href: 'https://livermetabolism.com/' },
    ]);
  });
  it('returns nothing without a site URL, since hreflang must be absolute', () => {
    expect(alternates('/publications/', undefined)).toEqual([]);
  });
});
