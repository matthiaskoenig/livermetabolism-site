/**
 * Shape of the GitHub snapshot (`github.json`), shared by the fetch script
 * that writes it (`scripts/fetch-github.ts`) and the site that reads it.
 *
 * The snapshot is refreshed daily by `.github/workflows/github-data.yml` and
 * committed to the orphan branch `github-data`, so the site shows fresh
 * GitHub data without a redeploy. Every read — at build time and in the
 * browser — is parsed through `snapshotSchema`, so a malformed or tampered
 * file is rejected instead of rendered. The schemas are `.strict()`: an
 * unknown key means the writer and the reader have drifted apart.
 *
 * Text only: release summaries are plain text (markdown stripped by the fetch
 * script), never HTML, and are inserted with textContent / Vue interpolation.
 */
import { z } from 'astro/zod';

/** Raw URL of the daily snapshot on the `github-data` branch. */
export const SNAPSHOT_URL = 'https://raw.githubusercontent.com/matthiaskoenig/livermetabolism-site/github-data/github.json';

export const commitEntrySchema = z
  .object({
    sha: z.string(),
    date: z.string(),
    message: z.string(),
    htmlUrl: z.string(),
  })
  .strict();

export const latestReleaseSchema = z
  .object({
    tag: z.string(),
    name: z.string(),
    publishedAt: z.string(),
    htmlUrl: z.string(),
  })
  .strict();

/** One week of the commit-activity histogram (`week` is the ISO date of its Sunday). */
export const commitWeekSchema = z
  .object({
    week: z.string(),
    total: z.number(),
  })
  .strict();

export const repoEntrySchema = z
  .object({
    name: z.string(),
    owner: z.string(),
    fullName: z.string(),
    description: z.string().nullable(),
    htmlUrl: z.string(),
    homepage: z.string().nullable(),
    stars: z.number(),
    forks: z.number(),
    openIssues: z.number(),
    language: z.string().nullable(),
    license: z.string().nullable(),
    topics: z.array(z.string()),
    pushedAt: z.string(),
    archived: z.boolean(),
    defaultBranch: z.string(),
    latestCommit: commitEntrySchema.nullable(),
    latestRelease: latestReleaseSchema.nullable(),
    commitActivity: z.array(commitWeekSchema),
  })
  .strict();

export const releaseEntrySchema = z
  .object({
    tag: z.string(),
    name: z.string(),
    publishedAt: z.string(),
    htmlUrl: z.string(),
    prerelease: z.boolean(),
    summary: z.string(),
  })
  .strict();

/** Repositories and their releases, both keyed by `owner/name`. */
export const snapshotSchema = z
  .object({
    fetchedAt: z.string(),
    repos: z.record(z.string(), repoEntrySchema),
    releases: z.record(z.string(), z.array(releaseEntrySchema)),
  })
  .strict();

export type CommitEntry = z.output<typeof commitEntrySchema>;
export type LatestRelease = z.output<typeof latestReleaseSchema>;
export type CommitWeek = z.output<typeof commitWeekSchema>;
export type RepoEntry = z.output<typeof repoEntrySchema>;
export type ReleaseEntry = z.output<typeof releaseEntrySchema>;
export type Snapshot = z.output<typeof snapshotSchema>;

/**
 * The fallback when no snapshot can be read. `fetchedAt` is the epoch, so any
 * real snapshot fetched later always compares as newer.
 */
export function emptySnapshot(): Snapshot {
  return { fetchedAt: new Date(0).toISOString(), repos: {}, releases: {} };
}
