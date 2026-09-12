import { describe, expect, it } from 'vitest';
import { avatarPeople, personChips, type PeopleMap } from './people';

const people: PeopleMap = {
  matthias_koenig: { id: 'matthias_koenig', name: 'Prof. Dr. Matthias König', image: 'matthias_koenig.webp' },
  jane_doe: { id: 'jane_doe', name: 'Jane Doe', image: 'jane_doe.webp' },
  no_photo: { id: 'no_photo', name: 'No Photo', image: null },
};

describe('personChips', () => {
  it('splices an avatar + bold name for "Initial. Surname" first', () => {
    const html = personChips('J. Doe, M. König and X. Y', ['jane_doe', 'matthias_koenig'], people, '/assets/image/people/128/');
    expect(html).toBe(
      '<span class="person-chip"><img src="/assets/image/people/128/jane_doe.webp" decoding="async" width="18" height="18" class="author-avatar" alt="" title="Jane Doe"/><strong>J. Doe</strong></span>, ' +
      '<span class="person-chip"><img src="/assets/image/people/128/matthias_koenig.webp" decoding="async" width="18" height="18" class="author-avatar" alt="" title="Prof. Dr. Matthias König"/><strong>M. König</strong></span> and X. Y',
    );
  });
  it('falls back to "Given Surname" and replaces every occurrence', () => {
    const html = personChips('Jane Doe; Jane Doe', ['jane_doe'], people, '/p/');
    expect(html.match(/person-chip/g)).toHaveLength(2);
    expect(html).toContain('<strong>Jane Doe</strong>');
  });
  it('skips people without an image or unknown ids', () => {
    expect(personChips('No Photo, Z. Z', ['no_photo', 'ghost'], people, '/p/')).toBe('No Photo, Z. Z');
  });
});

describe('avatarPeople', () => {
  it('keeps order, drops missing/imageless, moves matthias_koenig last', () => {
    expect(avatarPeople(['matthias_koenig', 'no_photo', 'jane_doe', 'ghost'], people).map((p) => p.id)).toEqual(['jane_doe', 'matthias_koenig']);
  });
});
