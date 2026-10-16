/**
 * File handling and the plausibility guard shared by the three daily snapshot
 * writers (`scripts/fetch-github.ts`, `fetch-scholar.ts`, `fetch-citations.ts`).
 *
 * Each writer is given the path of the previous snapshot as its output (the
 * `github-data` worktree in `.github/workflows/github-data.yml`). A source that
 * changes its format usually fails the writer's own parsing or schema; a source
 * that answers well-formed but empty or truncated does not. The guard catches
 * that second case: a headline figure that falls by more than `MAX_DROP` since
 * the previous snapshot makes the writer throw before it writes, so the site
 * keeps showing the last good figures with their "updated …" date instead of
 * publishing an empty list or a zero. A genuine drop is accepted for one run
 * with `SNAPSHOT_ACCEPT_DROP=1` (the workflow's `accept_drop` input).
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';

/** The largest relative fall of a headline figure accepted without `SNAPSHOT_ACCEPT_DROP`. */
export const MAX_DROP = 0.1;

/** A headline figure of the previous and the new snapshot, over the same items. */
export interface Figure {
  label: string;
  previous: number;
  next: number;
}

/** The previous snapshot at `path`, or null when there is none or it does not validate. */
export function readPrevious<T>(path: string, schema: { parse(data: unknown): T }): T | null {
  if (!existsSync(path)) return null;
  try {
    return schema.parse(JSON.parse(readFileSync(path, 'utf8')));
  } catch (err) {
    console.warn(`Ignoring the previous snapshot at ${path}: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

/** Write to a temp file and rename, so a failed run never leaves a half-written snapshot. */
export function writeJsonAtomic(path: string, data: unknown): number {
  const text = `${JSON.stringify(data)}\n`;
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, text);
  renameSync(tmp, path);
  return Buffer.byteLength(text);
}

/** One message per figure that fell by more than `maxDrop` (to zero included). Pure. */
export function implausibleDrops(figures: Figure[], maxDrop = MAX_DROP): string[] {
  return figures
    .filter(({ previous, next }) => previous > 0 && next < previous * (1 - maxDrop))
    .map(({ label, previous, next }) => `${label} fell from ${previous} to ${next}`);
}

/**
 * Throws an error starting with `implausible` when `figures` fell too far, so
 * the writer writes nothing; with `accept` it only warns. `figures` is empty
 * when there is no previous snapshot, which is always accepted.
 */
export function assertPlausible(figures: Figure[], accept = process.env.SNAPSHOT_ACCEPT_DROP === '1'): void {
  const problems = implausibleDrops(figures);
  if (!problems.length) return;
  const message =
    `implausible: ${problems.join('; ')} since the previous snapshot - the source may have changed its format or ` +
    'answered empty, so the previous snapshot is kept (set SNAPSHOT_ACCEPT_DROP=1 to accept a real drop)';
  if (!accept) throw new Error(message);
  console.warn(`SNAPSHOT_ACCEPT_DROP is set, writing anyway: ${message}`);
}

/** The sum of `value` over `items`. */
export function sum<T>(items: Iterable<T>, value: (item: T) => number): number {
  let total = 0;
  for (const item of items) total += value(item);
  return total;
}
