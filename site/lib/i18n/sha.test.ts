import { describe, expect, it } from 'vitest';
import { sourceSha } from './sha';

describe('sourceSha', () => {
  it('is 16 hex characters', () => {
    expect(sourceSha('hello')).toMatch(/^[0-9a-f]{16}$/);
  });
  it('is stable for the same input', () => {
    expect(sourceSha('hello')).toBe(sourceSha('hello'));
  });
  it('changes when the source changes', () => {
    expect(sourceSha('hello')).not.toBe(sourceSha('hello.'));
  });
  it('hashes a list field by its JSON form', () => {
    expect(sourceSha(['a', 'b'])).toBe(sourceSha(['a', 'b']));
    expect(sourceSha(['a', 'b'])).not.toBe(sourceSha(['b', 'a']));
  });
});
