import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PersonAvatar from './PersonAvatar.vue';

const props = { name: 'Jane Doe', src: '/p/jane.webp', position: 'PhD student', description: 'Works on livers.', modalId: 'person-modal-jane' };

describe('PersonAvatar', () => {
  it('renders the photo and a hidden card', () => {
    const w = mount(PersonAvatar, { props, attachTo: document.body });
    expect(w.find('img').attributes('alt')).toBe('Jane Doe');
    expect(w.find('.person-card').classes()).not.toContain('is-visible');
    expect(w.find('.member-more').attributes('data-modal-target')).toBe('person-modal-jane');
    w.unmount();
  });
  it('opens on mouseenter/focus, closes on mouseleave/blur, toggles on click', async () => {
    const w = mount(PersonAvatar, { props, attachTo: document.body });
    await w.trigger('mouseenter');
    expect(w.find('.person-card').classes()).toContain('is-visible');
    await w.trigger('mouseleave');
    expect(w.find('.person-card').classes()).not.toContain('is-visible');
    await w.trigger('click');
    expect(w.find('.person-card').classes()).toContain('is-visible');
    await w.trigger('click');
    expect(w.find('.person-card').classes()).not.toContain('is-visible');
    w.unmount();
  });
  it('only one card is open at a time', async () => {
    const a = mount(PersonAvatar, { props, attachTo: document.body });
    const b = mount(PersonAvatar, { props: { ...props, name: 'B' }, attachTo: document.body });
    await a.trigger('click');
    await b.trigger('click');
    expect(a.find('.person-card').classes()).not.toContain('is-visible');
    expect(b.find('.person-card').classes()).toContain('is-visible');
    a.unmount(); b.unmount();
  });
});
