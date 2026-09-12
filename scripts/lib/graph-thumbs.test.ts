import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { thumbJobs, PERSON_RING, PERSON_THUMB_SIZE, ITEM_THUMB_SIZE } from './graph-thumbs.ts';

const ROOT = 'img';

const input = {
  imageRoot: ROOT,
  people: [
    { id: 'matthias_koenig', image: 'matthias_koenig.webp' },
    { id: 'no_photo', image: null },
  ],
  projects: [
    { id: 'atlas', images: ['atlas.webp', 'atlas2.webp'] },
    { id: 'imageless', images: [] },
  ],
  software: [
    { id: 'sbmlutils', image: 'sbmlutils.webp' },
    { id: 'livermetabolism-site', image: null },
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

  it('maps a project to a square thumbnail of its first image', () => {
    expect(jobs).toContainEqual({
      source: `${ROOT}/projects/atlas.webp`,
      target: `${ROOT}/graph/projects/atlas.webp`,
      size: ITEM_THUMB_SIZE,
      shape: 'square',
    });
    expect(ITEM_THUMB_SIZE).toBe(96);
  });

  it('maps a software entry with an image to a square thumbnail', () => {
    expect(jobs).toContainEqual({
      source: `${ROOT}/software/sbmlutils.webp`,
      target: `${ROOT}/graph/software/sbmlutils.webp`,
      size: ITEM_THUMB_SIZE,
      shape: 'square',
    });
  });

  it('maps no research area: they filter the graph instead of being in it', () => {
    expect(jobs.some((j) => j.target.includes('/graph/topics/'))).toBe(false);
  });

  it('skips entries without a source image', () => {
    const targets = jobs.map((j) => j.target);
    expect(targets).not.toContain(`${ROOT}/graph/people/no_photo.webp`);
    expect(targets).not.toContain(`${ROOT}/graph/projects/imageless.webp`);
    expect(targets).not.toContain(`${ROOT}/graph/software/livermetabolism-site.webp`);
    expect(jobs).toHaveLength(3);
  });

  it('produces unique targets', () => {
    const targets = jobs.map((j) => j.target);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it('joins paths without a leading slash when imageRoot is empty', () => {
    const [job] = thumbJobs({ ...input, imageRoot: '', people: [input.people[0]], projects: [], software: [] });
    expect(job.source).toBe('people/128/matthias_koenig.webp');
    expect(job.target).toBe('graph/people/matthias_koenig.webp');
  });
});

describe('thumbJobs over the real data', () => {
  const rows = (name: string) => load(readFileSync(`data/${name}.yml`, 'utf8')) as Record<string, string | string[] | null>[];
  const jobs = thumbJobs({
    imageRoot: 'public/assets/image',
    people: rows('people') as { id: string; image?: string | null }[],
    projects: rows('projects') as { id: string; images?: string | string[] | null }[],
    software: rows('software') as { id: string; image?: string | null }[],
  });

  it('has a source image for every person, and none for a research area', () => {
    expect(jobs.filter((j) => j.target.includes('/graph/people/'))).toHaveLength(61);
    expect(jobs.filter((j) => j.target.includes('/graph/topics/'))).toHaveLength(0);
    expect(jobs).toHaveLength(97);
  });

  it('covers every project and all but the one image-less software entry', () => {
    expect(jobs.filter((j) => j.target.includes('/graph/projects/'))).toHaveLength(25);
    expect(jobs.filter((j) => j.target.includes('/graph/software/'))).toHaveLength(11);
  });

  it('reads every source from under public/assets/image', () => {
    for (const job of jobs) expect(job.source.startsWith('public/assets/image/')).toBe(true);
  });
});
