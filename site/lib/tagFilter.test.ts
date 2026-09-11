import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import { useTagFilter } from './tagFilter';

function mountWith(search: string, knownTags?: string[]) {
  window.history.replaceState({}, '', `/x/${search}`);
  const Comp = defineComponent({ setup() { return useTagFilter(knownTags); }, render() { return h('div'); } });
  // the vm proxy unwraps the returned refs: vm.activeTag is a string
  return mount(Comp).vm as unknown as { activeTag: string; setTag(t: string): void; matches(tags: string[]): boolean };
}

describe('useTagFilter', () => {
  it('defaults to all and matches everything', () => {
    const f = mountWith('');
    expect(f.activeTag).toBe('all');
    expect(f.matches([])).toBe(true);
    expect(f.matches(['AI'])).toBe(true);
  });
  it('reads ?tag= on mount and filters by it', () => {
    const f = mountWith('?tag=Open%20%26%20FAIR');
    expect(f.activeTag).toBe('Open & FAIR');
    expect(f.matches(['Open & FAIR', 'AI'])).toBe(true);
    expect(f.matches(['AI'])).toBe(false);
  });
  it('ignores a ?tag= value not present in knownTags, keeping all', () => {
    const f = mountWith('?tag=Bogus', ['AI', 'Open & FAIR']);
    expect(f.activeTag).toBe('all');
    expect(f.matches(['AI'])).toBe(true);
  });
  it('still applies a ?tag= value that is in knownTags', () => {
    const f = mountWith('?tag=AI', ['AI', 'Open & FAIR']);
    expect(f.activeTag).toBe('AI');
    expect(f.matches(['AI'])).toBe(true);
    expect(f.matches(['Open & FAIR'])).toBe(false);
  });
  it('setTag switches the filter', () => {
    const f = mountWith('');
    f.setTag('AI');
    expect(f.matches(['AI'])).toBe(true);
    expect(f.matches(['Digital Twins'])).toBe(false);
    f.setTag('all');
    expect(f.matches([])).toBe(true);
  });
});
