/**
 * Pure path mapping of the network graph's node thumbnails: which source
 * image under `public/assets/image/` becomes which file under
 * `public/assets/image/graph/`, at what size and in what shape.
 *
 * Only people have thumbnails: the research areas filter the graph rather
 * than appear in it, and projects, software and publications are drawn as
 * plain symbols (see `networkOptions.ts`).
 *
 * No filesystem and no `sharp` here — `scripts/graph-thumbs.ts` does the
 * reading, resizing and writing, so the mapping (and with it the file names
 * `site/lib/graphRows.ts` expects) stays unit-testable against the real YAML.
 *
 * A person without a photo yields no job at all: the script never warns
 * about it and their node falls back to a plain circle.
 */
/** Round photos for people (the only thumbnails the graph has). */
export type ThumbShape = 'circle';

/** A ring drawn inside the edge of a circular thumbnail. */
export interface ThumbRing {
  /** Stroke width in pixels. */
  width: number;
  /** Any CSS colour. */
  color: string;
}

export interface ThumbJob {
  /** Source image, `imageRoot`-relative. */
  source: string;
  /** Destination `.webp`, `imageRoot`-relative, under `graph/<type>/`. */
  target: string;
  /** Edge length in pixels; the thumbnail is always square. */
  size: number;
  shape: ThumbShape;
  /** Outline around a circular thumbnail; absent for a plain square. */
  ring?: ThumbRing;
}

/**
 * The outline of a person node. ECharts cannot stroke an `image://` symbol, so
 * the ring is part of the thumbnail: the people colour of the graph
 * (`CATEGORY_COLOR.person` in `site/lib/networkOptions.ts`, which this module
 * cannot import - Node runs it without a bundler; the test keeps the two
 * equal). 6 px of the 96 px thumbnail is the 2 px outline of the other nodes
 * at a typical 32 px photo.
 */
export const PERSON_RING: ThumbRing = { width: 6, color: '#3498db' };

/** Person photos: the graph draws them at 24-56 px, 96 px covers retina zoom. */
export const PERSON_THUMB_SIZE = 96;

export interface ThumbInput {
  /** `public/assets/image` for the real run; both sources and targets are relative to it. */
  imageRoot: string;
  people: { id: string; image?: string | null }[];
}

function join(root: string, rest: string): string {
  return root ? `${root.replace(/\/+$/, '')}/${rest}` : rest;
}

/** Every thumbnail the graph needs: one round photo per person who has one. */
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
      ring: PERSON_RING,
    });
  }
  return jobs;
}
