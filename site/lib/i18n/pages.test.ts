import { describe, expect, it } from 'vitest';
import { loadPage } from './pages';

describe('loadPage', () => {
  it('loads the German legal source', () => {
    expect(loadPage('de', 'impressum').heading).toBeTruthy();
  });
  it('loads the generated English rendering', () => {
    expect(loadPage('en', 'impressum').heading).toBeTruthy();
  });
  it('carries the binding-version notice in English', () => {
    expect(loadPage('en', 'impressum').bindingNotice).toContain('German');
  });
  it('returns an empty record for an unknown page rather than throwing', () => {
    expect(loadPage('en', 'nope')).toEqual({});
  });
});
