import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AbstractCard from './AbstractCard.vue';
import type { AbstractData } from '../lib/schemas';
import type { Entry } from '../lib/views';

const strings = {
  pdf: 'PDF', homepage: 'Homepage', projectHomepage: 'Project homepage', meetingHomepage: 'Meeting homepage',
  repository: 'Repository', repositoryHomepage: 'Repository homepage', eventPage: 'Event page',
  slides: 'Slides', video: 'Video', readMore: 'Read more',
};
const item: Entry<AbstractData> = {
  id: 'Doe2026_meeting2026_abstract_liver', tags: [], people: [], year: 2026, date: null,
  title: 'A liver abstract', pdf: null, authors: 'J. Doe, <b>M. König</b>', affiliations: null,
  abstract: null, keywords: [], event: 'Liver Meeting 2026', event_page: null, journal: null,
  doi: null, homepage: null, repository: null,
};

const mountCard = (overrides: Partial<Entry<AbstractData>> = {}) =>
  mount(AbstractCard, { props: { item: { ...item, ...overrides }, tagInfo: [], pdfBase: '/pdf/', strings } });

describe('AbstractCard', () => {
  it('puts the event above the plain-text authors', () => {
    expect(mountCard().find('h3 + p').html()).toContain('Liver Meeting 2026<br>J. Doe, M. König');
  });
  it('starts with the authors when there is no event', () => {
    const p = mountCard({ event: null }).find('h3 + p');
    expect(p.find('br').exists()).toBe(false);
    expect(p.text()).toBe('J. Doe, M. König');
  });
});
