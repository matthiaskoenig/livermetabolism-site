import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TAG_GRAPHICS, TAG_PALETTE } from './tagGraphics';

// repo-root-relative, the way scripts/lib/repos.test.ts reads data/software.yml
const css = readFileSync('site/styles/global.css', 'utf8');

/** The `--color-tag-<slug>: #rrggbb;` declarations of the `@theme` block. */
function tokens(prefix: string): Record<string, string> {
  const found: Record<string, string> = {};
  for (const [, slug, hex] of css.matchAll(new RegExp(`--color-${prefix}-([a-z-]+):\\s*(#[0-9a-f]{6})\\s*;`, 'g'))) {
    found[slug] = hex;
  }
  return found;
}

describe('TAG_PALETTE', () => {
  // tagGraphics.ts says "keep the two in sync" because a canvas cannot read
  // CSS custom properties. Saying it is not enough: this is the check.
  it('matches the --color-tag-* tokens of global.css exactly', () => {
    expect(TAG_PALETTE).toEqual(tokens('tag'));
  });

  it('covers the same five areas as TAG_GRAPHICS', () => {
    expect(Object.keys(TAG_PALETTE).sort()).toEqual(Object.keys(TAG_GRAPHICS).sort());
  });

  // Issue #68: Pharmacometrics used to be #18bc9c, which is also
  // --color-link, --color-success, PALETTE[0] and the brand mark - so a
  // green pill, a green badge and a green link all meant different things.
  it('gives no area the site accent colour, which already means "link"', () => {
    const accent = /--color-link:\s*(#[0-9a-f]{6})/.exec(css)?.[1];
    expect(accent).toBe('#18bc9c');
    expect(Object.values(TAG_PALETTE)).not.toContain(accent);
  });

  it('pairs every area with a darker hero colour for its homepage section', () => {
    expect(Object.keys(tokens('hero')).sort()).toEqual(Object.keys(TAG_PALETTE).sort());
  });
});
