/**
 * Writes the node thumbnails of the network graph (`/network/`) into
 * `public/assets/image/graph/`: one round 96 px photo per person, ringed in
 * white. Nothing else has a thumbnail — the research areas filter the graph
 * instead of appearing in it, and projects, software and publications are
 * drawn as plain symbols.
 *
 * Usage:
 *   npm run graph:thumbs
 *
 * The output is committed (like the 128 px avatars) — the graph page reads it
 * as a static asset, so nothing is generated at build time. The run is
 * idempotent: every target is rewritten from its source, so re-running after
 * a new person only adds files. Which
 * source maps to which target lives in `scripts/lib/graph-thumbs.ts` (pure,
 * unit-tested against the real YAML); this script only reads, resizes and
 * writes. A job whose source image is missing is skipped with a warning and
 * its node falls back to a plain circle in the graph.
 *
 * `sharp` comes in as a dependency of Astro; it is not imported anywhere in
 * the site itself.
 */
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import sharp, { type OverlayOptions } from 'sharp';
import { thumbJobs, type ThumbJob, type ThumbRing } from './lib/graph-thumbs.ts';

/** `sharp`'s webp quality; 82 keeps a 96 px photo at a few kB. */
const WEBP_QUALITY = 82;

/** An SVG circle the size of the thumbnail, used as a `dest-in` alpha mask. */
function circleMask(size: number): Buffer {
  const r = size / 2;
  return Buffer.from(
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/></svg>`,
  );
}

/**
 * An SVG ring just inside the edge of the thumbnail: the stroke is centred on
 * its radius, so the radius is inset by half the stroke width to keep all of
 * it on the canvas.
 */
function ringOverlay(size: number, ring: ThumbRing): Buffer {
  const r = size / 2;
  return Buffer.from(
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<circle cx="${r}" cy="${r}" r="${r - ring.width / 2}" fill="none" ` +
      `stroke="${ring.color}" stroke-width="${ring.width}"/></svg>`,
  );
}

/**
 * One thumbnail: centre-cropped to `size`×`size`, for a circle masked with an
 * SVG circle (`blend: 'dest-in'` keeps only the pixels under the circle, so
 * the corners come out transparent) and then ringed with an SVG outline
 * (drawn over the image, which is why it comes after the mask), written as
 * webp.
 */
export async function renderThumb(job: ThumbJob): Promise<number> {
  mkdirSync(dirname(job.target), { recursive: true });
  const resized = sharp(job.source).resize(job.size, job.size, { fit: 'cover' });
  const layers: OverlayOptions[] = [];
  if (job.shape === 'circle') layers.push({ input: circleMask(job.size), blend: 'dest-in' });
  if (job.ring) layers.push({ input: ringOverlay(job.size, job.ring), blend: 'over' });
  const composed = layers.length ? resized.composite(layers) : resized;
  const { size } = await composed.webp({ quality: WEBP_QUALITY }).toFile(job.target);
  return size;
}

export interface ThumbRun { written: number; skipped: string[]; bytes: number }

/** Render every job whose source exists; the rest are reported as skipped. */
export async function runThumbs(jobs: ThumbJob[]): Promise<ThumbRun> {
  const run: ThumbRun = { written: 0, skipped: [], bytes: 0 };
  for (const job of jobs) {
    if (!existsSync(job.source)) {
      console.warn(`  ! missing source, skipped: ${job.source}`);
      run.skipped.push(job.source);
      continue;
    }
    run.bytes += await renderThumb(job);
    run.written += 1;
  }
  return run;
}

/** The people of `data/people.yml`, as `thumbJobs()` wants them. */
export function jobsFromData(dataRoot: string, imageRoot: string): ThumbJob[] {
  const rows = <T>(name: string): T[] => (load(readFileSync(`${dataRoot}${name}.yml`, 'utf8')) ?? []) as T[];
  return thumbJobs({ imageRoot, people: rows<{ id: string; image?: string | null }>('people') });
}

if (import.meta.main) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const imageRoot = `${root}public/assets/image`;
  const jobs = jobsFromData(`${root}data/`, imageRoot);
  console.log(`Rendering ${jobs.length} graph thumbnails (people) into ${imageRoot}/graph/people/`);
  const run = await runThumbs(jobs);
  const existing = jobs.filter((j) => existsSync(j.target)).reduce((sum, j) => sum + statSync(j.target).size, 0);
  console.log(
    `Wrote ${run.written} files, ${(run.bytes / 1024).toFixed(1)} kB total ` +
      `(${(run.bytes / Math.max(1, run.written) / 1024).toFixed(1)} kB average, ${(existing / 1024).toFixed(1)} kB on disk)` +
      (run.skipped.length ? `, ${run.skipped.length} skipped for a missing source` : ''),
  );
}
