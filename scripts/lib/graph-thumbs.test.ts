import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { TAG_GRAPHICS } from '../../site/lib/tagGraphics.ts';
import { thumbJobs, PERSON_THUMB_SIZE, ITEM_THUMB_SIZE, TOPIC_THUMB_SIZE } from './graph-thumbs.ts';

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
  tags: [{ slug: 'ai' }, { slug: 'unknown-topic' }],
};

describe('thumbJobs', () => {
  const jobs = thumbJobs(input);

  it('maps a person to a circular 96px thumbnail of their 128px avatar', () => {
    expect(jobs).toContainEqual({
      source: `${ROOT}/people/128/matthias_koenig.webp`,
      target: `${ROOT}/graph/people/matthias_koenig.webp`,
      size: PERSON_THUMB_SIZE,
      shape: 'circle',
    });
    expect(PERSON_THUMB_SIZE).toBe(96);
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

  it('maps a topic to a 160px square thumbnail of its artwork', () => {
    expect(jobs).toContainEqual({
      source: `${ROOT}/tags/${TAG_GRAPHICS['ai']}`,
      target: `${ROOT}/graph/topics/ai.webp`,
      size: TOPIC_THUMB_SIZE,
      shape: 'square',
    });
    expect(TOPIC_THUMB_SIZE).toBe(160);
  });

  it('skips entries without a source image', () => {
    const targets = jobs.map((j) => j.target);
    expect(targets).not.toContain(`${ROOT}/graph/people/no_photo.webp`);
    expect(targets).not.toContain(`${ROOT}/graph/projects/imageless.webp`);
    expect(targets).not.toContain(`${ROOT}/graph/software/livermetabolism-site.webp`);
    expect(targets).not.toContain(`${ROOT}/graph/topics/unknown-topic.webp`);
    expect(jobs).toHaveLength(4);
  });

  it('produces unique targets', () => {
    const targets = jobs.map((j) => j.target);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it('joins paths without a leading slash when imageRoot is empty', () => {
    const [job] = thumbJobs({ ...input, imageRoot: '', people: [input.people[0]], projects: [], software: [], tags: [] });
    expect(job.source).toBe('people/128/matthias_koenig.webp');
    expect(job.target).toBe('graph/people/matthias_koenig.webp');
  });
});

describe('thumbJobs over the real data', () => {
  const rows = (name: string) => load(readFileSync(`data/${name}.yml`, 'utf8')) as Record<string, string | string[] | null>[];
  const tags = rows('tags').map((t) => ({
    slug: String(t.tag).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, ''),
  }));
  const jobs = thumbJobs({
    imageRoot: 'public/assets/image',
    people: rows('people') as { id: string; image?: string | null }[],
    projects: rows('projects') as { id: string; images?: string | string[] | null }[],
    software: rows('software') as { id: string; image?: string | null }[],
    tags,
  });

  it('has a source image for every person and every topic', () => {
    expect(jobs.filter((j) => j.target.includes('/graph/people/'))).toHaveLength(61);
    expect(jobs.filter((j) => j.target.includes('/graph/topics/'))).toHaveLength(5);
  });

  it('covers every project and all but the one image-less software entry', () => {
    expect(jobs.filter((j) => j.target.includes('/graph/projects/'))).toHaveLength(25);
    expect(jobs.filter((j) => j.target.includes('/graph/software/'))).toHaveLength(11);
  });

  it('reads every source from under public/assets/image', () => {
    for (const job of jobs) expect(job.source.startsWith('public/assets/image/')).toBe(true);
  });
});
