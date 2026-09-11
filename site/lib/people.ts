import { escapeHtml } from './text';

export interface PersonLite { id: string; name: string; image: string | null }
export type PeopleMap = Record<string, PersonLite>;

/**
 * Port of _includes/person_chips.html: splice a small avatar + bold name
 * into a free-text author string. "Initial. Surname" is tried first, then
 * "Given Surname"; like Liquid's `replace`, every occurrence is replaced.
 * Returns HTML (the author string itself is trusted YAML content).
 */
export function personChips(text: string, peopleIds: string[], people: PeopleMap, avatarBase: string): string {
  let html = text;
  for (const pid of peopleIds) {
    const person = people[pid];
    if (!person || !person.image) continue;
    const parts = person.name.split(' ');
    const given = parts[parts.length - 2] ?? '';
    const surname = parts[parts.length - 1] ?? '';
    const avatar = `<img src="${avatarBase}${person.image}" class="author-avatar" alt="" title="${escapeHtml(person.name)}"/>`;
    const chip = (label: string) => `<span class="person-chip">${avatar}<strong>${label}</strong></span>`;
    const short = `${given.charAt(0)}. ${surname}`;
    if (html.includes(short)) {
      html = html.replaceAll(short, chip(short));
    } else {
      const full = `${given} ${surname}`;
      html = html.replaceAll(full, chip(full));
    }
  }
  return html;
}

/** Port of _includes/people_avatars.html: everyone with a photo, matthias_koenig last. */
export function avatarPeople(peopleIds: string[], people: PeopleMap): PersonLite[] {
  const out = peopleIds.filter((id) => id !== 'matthias_koenig').map((id) => people[id]).filter((p): p is PersonLite => !!p && !!p.image);
  const koenig = peopleIds.includes('matthias_koenig') ? people['matthias_koenig'] : undefined;
  if (koenig && koenig.image) out.push(koenig);
  return out;
}
