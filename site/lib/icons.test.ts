import { describe, expect, it } from 'vitest';
import { iconNames, iconSvg } from './icons';

describe('icons', () => {
  it('knows every icon the templates use', () => {
    for (const n of ['cube', 'heartbeat', 'picture-o', 'line-chart', 'unlock-alt', 'cogs', 'file-pdf-o', 'code', 'globe', 'github', 'orcid', 'search', 'chevron-down', 'chevron-up', 'caret-down', 'compass', 'file-o']) {
      expect(iconNames()).toContain(n);
    }
  });
  it('renders a sprite reference carrying the legacy fa classes', () => {
    const svg = iconSvg('globe');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('class="fa fa-globe icon"');
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).toContain('fill="currentColor"');
    expect(svg).toContain('<use href="#icon-globe"></use>');
    expect(svg).not.toContain('<!--');
  });
  it('throws on unknown names so a typo fails the build', () => {
    expect(() => iconSvg('nope')).toThrow(/nope/);
  });
});
