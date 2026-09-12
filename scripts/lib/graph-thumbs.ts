/**
 * Pure path mapping of the network graph's node thumbnails: which source
 * image under `public/assets/image/` becomes which file under
 * `public/assets/image/graph/`, at what size and in what shape.
 *
 * No filesystem and no `sharp` here — `scripts/graph-thumbs.ts` does the
 * reading, resizing and writing, so the mapping (and with it the file names
 * `site/lib/graphRows.ts` expects) stays unit-testable against the real YAML.
 *
 * A row without a source image yields no job at all: the script never
 * warns about it and the graph node falls back to a plain circle.
 */
import { TAG_GRAPHICS } from '../../site/lib/tagGraphics.ts';

/** Round photos for people, centre-cropped squares for everything else. */
export type ThumbShape = 'circle' | 'square';

export interface ThumbJob {
  /** Source image, `imageRoot`-relative. */
  source: string;
  /** Destination `.webp`, `imageRoot`-relative, under `graph/<type>/`. */
  target: string;
  /** Edge length in pixels; the thumbnail is always square. */
  size: number;
  shape: ThumbShape;
}

/** Person photos: the graph draws them at ~40 px, 96 px covers retina zoom. */
export const PERSON_THUMB_SIZE = 96;
/** Project and software thumbnails. */
export const ITEM_THUMB_SIZE = 96;
/** The five topic hubs are the largest nodes of the graph. */
export const TOPIC_THUMB_SIZE = 160;

export interface ThumbInput {
  /** `public/assets/image` for the real run; both sources and targets are relative to it. */
  imageRoot: string;
  people: { id: string; image?: string | null }[];
  /** `images` may be a bare scalar in the YAML (pydantic/Zod coerce it to a list). */
  projects: { id: string; images?: string | string[] | null }[];
  software: { id: string; image?: string | null }[];
  /** Topics by tag slug; the artwork comes from `TAG_GRAPHICS`. */
  tags: { slug: string }[];
}

function join(root: string, rest: string): string {
  return root ? `${root.replace(/\/+$/, '')}/${rest}` : rest;
}

function first(images: string | string[] | null | undefined): string | null {
  if (!images) return null;
  const list = Array.isArray(images) ? images : [images];
  return list.find((i) => !!i) ?? null;
}

/** Every thumbnail the graph needs, in the order people, projects, software, topics. */
export function thumbJobs(input: ThumbInput): ThumbJob[] {
  const { imageRoot: root } = input;
  const jobs: ThumbJob[] = [];

  for (const person of input.people) {
    if (!person.image) continue;
    jobs.push({
      source: join(root, `people/128/${person.image}`),
      target: join(root, `graph/people/${person.id}.webp`),
      size: PERSON_THUMB_SIZE,
      shape: 'circle',
    });
  }
  for (const project of input.projects) {
    const image = first(project.images);
    if (!image) continue;
    jobs.push({
      source: join(root, `projects/${image}`),
      target: join(root, `graph/projects/${project.id}.webp`),
      size: ITEM_THUMB_SIZE,
      shape: 'square',
    });
  }
  for (const entry of input.software) {
    if (!entry.image) continue;
    jobs.push({
      source: join(root, `software/${entry.image}`),
      target: join(root, `graph/software/${entry.id}.webp`),
      size: ITEM_THUMB_SIZE,
      shape: 'square',
    });
  }
  for (const tag of input.tags) {
    const graphic = TAG_GRAPHICS[tag.slug];
    if (!graphic) continue;
    jobs.push({
      source: join(root, `tags/${graphic}`),
      target: join(root, `graph/topics/${tag.slug}.webp`),
      size: TOPIC_THUMB_SIZE,
      shape: 'square',
    });
  }
  return jobs;
}
