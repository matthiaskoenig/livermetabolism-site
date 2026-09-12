import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { thumbJobs, PERSON_RING, PERSON_THUMB_SIZE } from './graph-thumbs.ts';

const ROOT = 'img';

const input = {
  imageRoot: ROOT,
  people: [
    { id: 'matthias_koenig', image: 'matthias_koenig.webp' },
    { id: 'no_photo', image: null },
  ],
};

describe('thumbJobs', () => {
  const jobs = thumbJobs(input);

  it('maps a person to a circular 96px thumbnail of their 128px avatar, ringed in white', () => {
    expect(jobs).toContainEqual({
      source: `${ROOT}/people/128/matthias_koenig.webp`,
      target: `${ROOT}/graph/people/matthias_koenig.webp`,
      size: PERSON_THUMB_SIZE,
      shape: 'circle',
      ring: PERSON_RING,
    });
    expect(PERSON_THUMB_SIZE).toBe(96);
    expect(PERSON_RING).toEqual({ width: 2, color: '#ffffff' });
  });

  it('maps nothing but people: every other node type is drawn as a symbol', () => {
    for (const dir of ['/graph/projects/', '/graph/software/', '/graph/topics/']) {
      expect(jobs.some((j) => j.target.includes(dir))).toBe(false);
    }
  });

  it('skips a person without a photo', () => {
    expect(jobs.map((j) => j.target)).not.toContain(`${ROOT}/graph/people/no_photo.webp`);
    expect(jobs).toHaveLength(1);
  });

  it('produces unique targets', () => {
    const targets = jobs.map((j) => j.target);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it('joins paths without a leading slash when imageRoot is empty', () => {
    const [job] = thumbJobs({ imageRoot: '', people: [input.people[0]] });
    expect(job.source).toBe('people/128/matthias_koenig.webp');
    expect(job.target).toBe('graph/people/matthias_koenig.webp');
  });
});

describe('thumbJobs over the real data', () => {
  const rows = (name: string) => load(readFileSync(`data/${name}.yml`, 'utf8')) as Record<string, string | string[] | null>[];
  const jobs = thumbJobs({
    imageRoot: 'public/assets/image',
    people: rows('people') as { id: string; image?: string | null }[],
  });

  it('has one job per person with a photo, and nothing else', () => {
    expect(jobs.filter((j) => j.target.includes('/graph/people/'))).toHaveLength(61);
    expect(jobs).toHaveLength(61);
  });

  it('reads every source from under public/assets/image', () => {
    for (const job of jobs) expect(job.source.startsWith('public/assets/image/')).toBe(true);
  });
});
