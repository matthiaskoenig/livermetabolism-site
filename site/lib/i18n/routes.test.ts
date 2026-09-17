import { describe, expect, it } from 'vitest';
import { localeFromParams, localePaths, localeUrl, stripLocale, switchPath, urlFor } from './routes';

describe('localePaths', () => {
  it('yields undefined for the default locale and the code for the others', () => {
    expect(localePaths()).toEqual([{ params: { locale: undefined } }, { params: { locale: 'de' } }]);
  });
});

describe('localeFromParams', () => {
  it('reads a prefixed locale', () => {
    expect(localeFromParams({ locale: 'de' })).toBe('de');
  });
  it('treats a missing param as the default locale', () => {
    expect(localeFromParams({})).toBe('en');
  });
  it('treats an unknown param as the default locale', () => {
    expect(localeFromParams({ locale: 'fr' })).toBe('en');
  });
});

describe('localeUrl', () => {
  it('leaves the default locale unprefixed', () => {
    expect(localeUrl('en', '/publications/')).toBe('/publications/');
  });
  it('prefixes a non-default locale', () => {
    expect(localeUrl('de', '/publications/')).toBe('/de/publications/');
  });
  it('builds the German homepage', () => {
    expect(localeUrl('de', '/')).toBe('/de/');
  });
  it('accepts a path without a leading slash', () => {
    expect(localeUrl('de', 'news/')).toBe('/de/news/');
  });
});

describe('stripLocale', () => {
  it('reads English from an unprefixed path', () => {
    expect(stripLocale('/publications/')).toEqual({ locale: 'en', path: '/publications/' });
  });
  it('reads German from a prefixed path', () => {
    expect(stripLocale('/de/publications/')).toEqual({ locale: 'de', path: '/publications/' });
  });
  it('reads the German homepage', () => {
    expect(stripLocale('/de/')).toEqual({ locale: 'de', path: '/' });
  });
  it('reads the German homepage without a trailing slash', () => {
    expect(stripLocale('/de')).toEqual({ locale: 'de', path: '/' });
  });
  it('does not mistake a page whose name starts with the locale code', () => {
    expect(stripLocale('/design/')).toEqual({ locale: 'en', path: '/design/' });
  });
});

describe('switchPath', () => {
  it('switches English to German', () => {
    expect(switchPath('de', '/publications/')).toBe('/de/publications/');
  });
  it('switches German back to English', () => {
    expect(switchPath('en', '/de/publications/')).toBe('/publications/');
  });
  it('is idempotent for the locale already in the path', () => {
    expect(switchPath('de', '/de/news/')).toBe('/de/news/');
  });
});

describe('urlFor', () => {
  it('binds a locale', () => {
    expect(urlFor('de')('/people/')).toBe('/de/people/');
  });
});
