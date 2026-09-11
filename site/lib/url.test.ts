import { describe, expect, it } from 'vitest';
import { asset, link, url } from './url';

describe('url', () => {
  it('prefixes a root-relative path with the base (base is "/" under Vitest)', () => {
    expect(url('/people/')).toBe('/people/');
  });
});

describe('asset', () => {
  it('builds an /assets/ path', () => {
    expect(asset('image/x.webp')).toBe('/assets/image/x.webp');
  });
});

describe('link', () => {
  it('routes a root-absolute site path through url()', () => {
    expect(link('/assets/pdf/x.pdf')).toBe('/assets/pdf/x.pdf');
  });
  it('leaves an external https URL unchanged', () => {
    expect(link('https://a.b/c')).toBe('https://a.b/c');
  });
  it('leaves a mailto: link unchanged', () => {
    expect(link('mailto:x@y')).toBe('mailto:x@y');
  });
  it('leaves an in-page anchor unchanged', () => {
    expect(link('#top')).toBe('#top');
  });
  it('leaves a protocol-relative URL unchanged', () => {
    expect(link('//a.b/c')).toBe('//a.b/c');
  });
});
