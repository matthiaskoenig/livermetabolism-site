import { describe, expect, it } from 'vitest';
import { capitalize, escapeHtml, slugify, stripHtml, truncateWords } from './text';

describe('text helpers (Liquid parity)', () => {
  it('slugify matches Jekyll default mode', () => {
    expect(slugify('Open & FAIR')).toBe('open-fair');
    expect(slugify('Digital Twins')).toBe('digital-twins');
    expect(slugify('first_equal')).toBe('first-equal');
    expect(slugify('  AI ')).toBe('ai');
  });
  it('stripHtml removes tags only', () => {
    expect(stripHtml('<b>Matthias König</b>, A. B')).toBe('Matthias König, A. B');
  });
  it('truncateWords appends an ellipsis only when cutting', () => {
    expect(truncateWords('one two three', 2)).toBe('one two...');
    expect(truncateWords('one two', 2)).toBe('one two');
    expect(truncateWords('  one   two three ', 2)).toBe('one two...');
  });
  it('capitalize uppercases the first letter', () => {
    expect(capitalize('publication')).toBe('Publication');
  });
  it('escapeHtml escapes the five characters', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });
});
