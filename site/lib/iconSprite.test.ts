import { describe, expect, it } from 'vitest';
import { iconSprite } from './iconSprite';
import { iconNames } from './icons';

describe('iconSprite', () => {
  it('builds one hidden svg with a symbol per known icon', () => {
    const sprite = iconSprite();
    expect(sprite.startsWith('<svg xmlns="http://www.w3.org/2000/svg" class="icon-sprite" aria-hidden="true">')).toBe(true);
    expect(sprite).toContain('<symbol id="icon-globe"');
    expect(sprite).toMatch(/<symbol id="icon-globe" viewBox="[^"]+">/);
    expect(sprite).not.toContain('<!--');
    for (const n of iconNames()) {
      expect(sprite).toContain(`<symbol id="icon-${n}"`);
    }
  });

  it('has exactly one icon source file per name in iconNames(), and vice versa', () => {
    const files = import.meta.glob('../icons/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    const stems = new Set(Object.keys(files).map((path) => path.slice(path.lastIndexOf('/') + 1, -'.svg'.length)));
    expect(stems).toEqual(new Set(iconNames()));
  });
});
