import { beforeEach, describe, expect, it } from 'vitest';
import { applyScholar } from './scholarStats';
import { emptyScholar, type Scholar } from './scholarSchema';

const now = new Date('2026-09-13T00:00:00Z');

const scholar: Scholar = {
  fetchedAt: '2026-09-12T12:08:55.725Z',
  profile: { userId: 'xD9IjnYAAAAJ', name: 'Matthias König', htmlUrl: 'https://scholar.google.com/citations?user=xD9IjnYAAAAJ&hl=en' },
  sinceYear: 2021,
  citations: { all: 3827, since: 2659 },
  hIndex: { all: 26, since: 23 },
  i10Index: { all: 36, since: 33 },
  citationsPerYear: [{ year: 2026, count: 382 }],
  history: [{ date: '2026-09-12', citations: 3827, hIndex: 26, i10Index: 36 }],
};

/** What ScholarStats.astro renders when the build had no snapshot. */
const skeleton = `
  <div class="scholar-strip" data-scholar-strip>
    <div class="scholar-figure" data-scholar-metric hidden>
      <span class="scholar-value" data-field="citations"></span>
      <span class="scholar-since"><span data-since-year>since</span>: <span data-field="citations-since"></span></span>
    </div>
    <div class="scholar-figure" data-scholar-metric hidden>
      <span class="scholar-value" data-field="h-index"></span>
      <span class="scholar-since"><span data-since-year>since</span>: <span data-field="h-index-since"></span></span>
    </div>
    <div class="scholar-figure" data-scholar-metric hidden>
      <span class="scholar-value" data-field="i10-index"></span>
      <span class="scholar-since"><span data-since-year>since</span>: <span data-field="i10-index-since"></span></span>
    </div>
    <div class="scholar-figure"><span class="scholar-value">116</span></div>
  </div>
  <p class="scholar-note" data-scholar-note>
    from <a href="https://scholar.google.com/citations?user=xD9IjnYAAAAJ&amp;hl=en">Google Scholar</a><span data-scholar-name hidden> (<span data-field="profile-name"></span>)</span>, last update
    <time data-field="updated" data-empty="none yet" data-iso="${new Date(0).toISOString()}">none yet</time>.
  </p>`;

const el = (selector: string) => document.querySelector<HTMLElement>(selector)!;
const text = (selector: string) => el(selector).textContent;

beforeEach(() => { document.body.innerHTML = skeleton; });

describe('applyScholar', () => {
  it('fills in every field, the since labels and the note', () => {
    applyScholar(scholar, document, now);
    expect(text('[data-field="citations"]')).toBe('3827');
    expect(text('[data-field="citations-since"]')).toBe('2659');
    expect(text('[data-field="h-index"]')).toBe('26');
    expect(text('[data-field="h-index-since"]')).toBe('23');
    expect(text('[data-field="i10-index"]')).toBe('36');
    expect(text('[data-field="i10-index-since"]')).toBe('33');
    expect([...document.querySelectorAll('[data-since-year]')].map((e) => e.textContent)).toEqual(['since 2021', 'since 2021', 'since 2021']);
    expect(text('[data-field="profile-name"]')).toBe('Matthias König');
    expect(el('[data-scholar-name]').hidden).toBe(false);
    expect(text('[data-field="updated"]')).toBe('yesterday');
    expect(el('[data-field="updated"]').dataset.iso).toBe(scholar.fetchedAt);
    expect((el('[data-field="updated"]') as HTMLTimeElement).dateTime).toBe(scholar.fetchedAt);
  });

  // shared refreshNote(): the machine-readable date must not keep the value a
  // weeks-old build rendered once a newer snapshot arrives in the browser
  it("refreshes the note's datetime, not only its text", () => {
    const stale = '2026-08-01T05:00:00.000Z';
    const note = el('[data-field="updated"]') as HTMLTimeElement;
    note.dateTime = stale;
    note.dataset.iso = stale;
    applyScholar(scholar, document, now);
    expect(note.dateTime).toBe(scholar.fetchedAt);
    expect(note.dataset.iso).toBe(scholar.fetchedAt);
    expect(note.textContent).toBe('yesterday');
  });

  it('reveals the metric figures the build left hidden', () => {
    expect([...document.querySelectorAll<HTMLElement>('[data-scholar-metric]')].every((e) => e.hidden)).toBe(true);
    applyScholar(scholar, document, now);
    expect([...document.querySelectorAll<HTMLElement>('[data-scholar-metric]')].some((e) => e.hidden)).toBe(false);
  });

  it('leaves the figures hidden and empty for a snapshot without data', () => {
    applyScholar(emptyScholar(), document, now);
    expect(text('[data-field="citations"]')).toBe('');
    expect([...document.querySelectorAll<HTMLElement>('[data-scholar-metric]')].every((e) => e.hidden)).toBe(true);
    expect(el('[data-scholar-name]').hidden).toBe(true);
    // "56 years ago" is not what an epoch timestamp means
    expect(text('[data-field="updated"]')).toBe('none yet');
  });

  it('inserts the profile name as text, never as markup, and never touches the href', () => {
    const evil: Scholar = { ...scholar, profile: { ...scholar.profile, name: '<img src=x onerror=alert(1)>', htmlUrl: 'javascript:alert(1)' } };
    applyScholar(evil, document, now);
    const name = el('[data-field="profile-name"]');
    expect(name.querySelector('img')).toBeNull();
    expect(name.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(el('[data-scholar-note] a').getAttribute('href')).toBe('https://scholar.google.com/citations?user=xD9IjnYAAAAJ&hl=en');
  });

  it('does nothing when the page has no strip or note', () => {
    document.body.innerHTML = '<p>nothing here</p>';
    expect(() => applyScholar(scholar, document, now)).not.toThrow();
  });
});
