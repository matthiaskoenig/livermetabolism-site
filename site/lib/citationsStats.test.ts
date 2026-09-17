import { beforeEach, describe, expect, it } from 'vitest';
import { applyCitations, DEFAULT_CITED_TEMPLATE, DEFAULT_OPEN_ACCESS_TEMPLATE, refreshNote } from './citationsStats';
import { emptyCitations, type Citations } from './citationsSchema';
import { en } from './i18n/ui.en';

const now = new Date('2026-09-13T00:00:00Z');

const citations: Citations = {
  fetchedAt: '2026-09-12T14:08:46.378Z',
  works: {
    '10.3389/fphar.2021.752826': { openalexId: 'W4226455100', citedByCount: 101, isOa: true, oaStatus: 'gold', countsByYear: [{ year: 2022, count: 7 }] },
    '10.1515/jib-2026-0006': { openalexId: 'W999', citedByCount: 0, isOa: false, oaStatus: 'closed', countsByYear: [] },
  },
};

/** The badge skeleton `PublicationRow.vue` renders for a build without a snapshot. */
const badge = (id: string, doi: string) => `
  <tr id="pub-${id}" data-tags="AI" data-cited="0"><td>
    <span class="pub-cites" data-doi="${doi}">
      <a class="pub-badge pub-badge-cited" data-field="cited" target="_blank" rel="noopener noreferrer" hidden></a>
      <span class="pub-badge pub-badge-oa" data-field="oa" hidden>open access</span>
    </span>
  </td></tr>`;

const markup = `
  <table><tbody>
    ${badge('cited', '10.3389/fphar.2021.752826')}
    ${badge('zero', '10.1515/jib-2026-0006')}
    ${badge('unknown', '10.1234/not-in-the-snapshot')}
    <tr id="pub-nodoi" data-tags="AI" data-cited="0"><td><span class="pub-links"></span></td></tr>
  </tbody></table>
  <p class="citations-note" data-citations-note>
    Citations from <a href="https://openalex.org/">OpenAlex</a>, updated
    <time data-field="updated" data-empty="never" data-iso="${new Date(0).toISOString()}">never</time>.
  </p>`;

const el = (selector: string) => document.querySelector<HTMLElement>(selector)!;
const row = (id: string) => document.getElementById(`pub-${id}`)!;
const field = (id: string, name: string) => row(id).querySelector<HTMLElement>(`[data-field="${name}"]`)!;
const note = () => el('[data-citations-note] [data-field="updated"]');

beforeEach(() => { document.body.innerHTML = markup; });

describe('applyCitations', () => {
  it('fills in a hidden badge, its link and the row order key', () => {
    applyCitations(document, citations);
    const cited = field('cited', 'cited');
    expect(cited.textContent).toBe('cited 101');
    expect(cited.getAttribute('href')).toBe('https://openalex.org/W4226455100');
    expect(cited.hidden).toBe(false);
    expect(field('cited', 'oa').hidden).toBe(false);
    expect(row('cited').dataset.cited).toBe('101');
  });

  it('keeps the "cited" badge hidden at zero citations and the OA badge hidden when closed', () => {
    applyCitations(document, citations);
    expect(field('zero', 'cited').hidden).toBe(true);
    expect(field('zero', 'oa').hidden).toBe(true);
    expect(row('zero').dataset.cited).toBe('0');
  });

  it('leaves a row the snapshot does not cover, and a row without a DOI, alone', () => {
    applyCitations(document, citations);
    expect(field('unknown', 'cited').hidden).toBe(true);
    expect(field('unknown', 'cited').textContent).toBe('');
    expect(row('unknown').dataset.cited).toBe('0');
    expect(row('nodoi').dataset.cited).toBe('0');
    expect(row('nodoi').querySelector('.pub-cites')).toBeNull();
  });

  it('never writes HTML: the OA status reaches the page as text only', () => {
    const evil: Citations = {
      ...citations,
      works: { '10.3389/fphar.2021.752826': { ...citations.works['10.3389/fphar.2021.752826'], oaStatus: '<img src=x onerror=alert(1)>' } },
    };
    applyCitations(document, evil);
    const oa = field('cited', 'oa');
    expect(oa.querySelector('img')).toBeNull();
    expect(oa.title).toContain('<img src=x onerror=alert(1)>');
    expect(oa.textContent).toBe('open access');
  });

  it('changes nothing for an empty snapshot and does not throw on a page without badges', () => {
    applyCitations(document, emptyCitations());
    expect(field('cited', 'cited').hidden).toBe(true);
    expect(row('cited').dataset.cited).toBe('0');
    document.body.innerHTML = '<p>nothing here</p>';
    expect(() => applyCitations(document, citations)).not.toThrow();
  });

  it('reads its templates from #publication-order, so a German page stays German after a live refresh', () => {
    document.body.insertAdjacentHTML(
      'afterbegin',
      '<div id="publication-order" data-cited-template="{count} Zitationen" data-open-access-template="Open Access ({status})"></div>',
    );
    applyCitations(document, citations);
    expect(field('cited', 'cited').textContent).toBe('101 Zitationen');
    expect(field('cited', 'oa').title).toBe('Open Access (gold)');
  });

  it('falls back to the English templates without a #publication-order element', () => {
    applyCitations(document, citations);
    expect(field('cited', 'cited').textContent).toBe('cited 101');
    expect(field('cited', 'oa').title).toBe('Open access (gold)');
  });
});

describe('the English defaults', () => {
  // markup with no #publication-order (older cached HTML, a test fixture)
  // falls back to these - pinned to the catalog so the two can never
  // quietly drift apart
  it('match their catalog counterparts', () => {
    expect(DEFAULT_CITED_TEMPLATE).toBe(en.pub.cited);
    expect(DEFAULT_OPEN_ACCESS_TEMPLATE).toBe(en.pub.openAccessWith);
  });
});

describe('refreshNote', () => {
  it('re-dates the note from a timestamp', () => {
    refreshNote(note(), citations.fetchedAt, now);
    expect(note().textContent).toBe('yesterday');
    expect(note().dataset.iso).toBe(citations.fetchedAt);
    expect((note() as HTMLTimeElement).dateTime).toBe(citations.fetchedAt);
  });

  it('reads the epoch of an empty snapshot as "no data yet", not as 56 years ago', () => {
    refreshNote(note(), emptyCitations().fetchedAt, now);
    expect(note().textContent).toBe('never');
    expect((note() as HTMLTimeElement).dateTime).toBe('');
  });

  it('does nothing without a note element', () => {
    expect(() => refreshNote(null, citations.fetchedAt, now)).not.toThrow();
  });
});
