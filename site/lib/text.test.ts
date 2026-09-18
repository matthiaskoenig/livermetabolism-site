import { describe, expect, it } from 'vitest';
import { capitalize, escapeHtml, slugify, stripHtml, tagSlugs, truncateWords } from './text';

describe('tagSlugs', () => {
  // The `data-tags` attribute topicApply.ts sweeps. Slugs, not tag names:
  // the filter, the CSS tokens and TAG_PALETTE are all slug-keyed.
  it('joins an entry’s research areas as slugs', () => {
    expect(tagSlugs(['Digital Twins', 'Open & FAIR'])).toBe('digital-twins|open-fair');
  });
  it('is an empty string for an entry with no areas', () => {
    expect(tagSlugs([])).toBe('');
  });
  it('never emits a pipe from inside a tag name, which would split it in two', () => {
    expect(tagSlugs(['A|B'])).toBe('a-b');
  });
});

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
