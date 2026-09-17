import { describe, expect, it } from 'vitest';
import { fmt } from './format';

describe('fmt', () => {
  it('returns a template without placeholders unchanged', () => {
    expect(fmt('Publications')).toBe('Publications');
  });
  it('substitutes a placeholder', () => {
    expect(fmt('No results for {query}.', { query: 'liver' })).toBe('No results for liver.');
  });
  it('substitutes the same placeholder twice', () => {
    expect(fmt('{a} and {a}', { a: 'x' })).toBe('x and x');
  });
  it('accepts a number', () => {
    expect(fmt('cited {n}', { n: 12 })).toBe('cited 12');
  });
  it('leaves an unknown placeholder in place rather than printing undefined', () => {
    expect(fmt('Release {tag}', {})).toBe('Release {tag}');
  });
});
