/**
 * Shape of the Google Scholar snapshot (`scholar.json`), shared by the fetch
 * script that writes it (`scripts/fetch-scholar.ts`) and the site that reads
 * it.
 *
 * The snapshot is refreshed daily by `.github/workflows/github-data.yml` and
 * committed to the orphan branch `github-data` next to `github.json`, so the
 * publications page shows fresh citation metrics without a redeploy. Every
 * read — at build time and in the browser — is parsed through `scholarSchema`,
 * so a malformed or tampered file is rejected instead of rendered. The schemas
 * are `.strict()`: an unknown key means the writer and the reader have drifted
 * apart.
 *
 * Text only: the single free-text field is the profile name, rendered with
 * textContent / Vue interpolation, never as HTML.
 */
import { z } from 'astro/zod';
import { snapshotUrl } from './snapshotUrl.ts';

/** Raw URL of the daily snapshot on the `github-data` branch. */
export const SCHOLAR_URL = 'https://raw.githubusercontent.com/matthiaskoenig/livermetabolism-site/github-data/scholar.json';

/** The Google Scholar profile of the group leader. */
export const SCHOLAR_USER_ID = 'xD9IjnYAAAAJ';

/** Public profile page of a Scholar user (the page the fetch script parses). */
export function scholarProfileUrl(userId: string = SCHOLAR_USER_ID): string {
  return `https://scholar.google.com/citations?user=${userId}&hl=en`;
}

/** A metric as Scholar shows it: over all years, and over the last five ("Since YYYY"). */
export const metricSchema = z
  .object({
    all: z.number(),
    since: z.number(),
  })
  .strict();

/** One bar of Scholar's citations-per-year histogram. */
export const yearCountSchema = z
  .object({
    year: z.number(),
    count: z.number(),
  })
  .strict();

/** One daily reading, accumulated across runs so the site can plot a trend. */
export const historyPointSchema = z
  .object({
    date: z.string(),
    citations: z.number(),
    hIndex: z.number(),
    i10Index: z.number(),
  })
  .strict();

export const scholarProfileSchema = z
  .object({
    userId: z.string(),
    name: z.string(),
    htmlUrl: snapshotUrl,
  })
  .strict();

export const scholarSchema = z
  .object({
    fetchedAt: z.string(),
    profile: scholarProfileSchema,
    /** The year of Scholar's "Since YYYY" column. */
    sinceYear: z.number(),
    citations: metricSchema,
    hIndex: metricSchema,
    i10Index: metricSchema,
    /** Ascending by year. */
    citationsPerYear: z.array(yearCountSchema),
    /** One point per UTC day, ascending by date. */
    history: z.array(historyPointSchema),
  })
  .strict();

export type Metric = z.output<typeof metricSchema>;
export type YearCount = z.output<typeof yearCountSchema>;
export type HistoryPoint = z.output<typeof historyPointSchema>;
export type ScholarProfile = z.output<typeof scholarProfileSchema>;
export type Scholar = z.output<typeof scholarSchema>;

/**
 * The fallback when no snapshot can be read. `fetchedAt` is the epoch, so any
 * real snapshot fetched later always compares as newer.
 */
export function emptyScholar(): Scholar {
  return {
    fetchedAt: new Date(0).toISOString(),
    profile: { userId: SCHOLAR_USER_ID, name: '', htmlUrl: scholarProfileUrl() },
    sinceYear: 0,
    citations: { all: 0, since: 0 },
    hIndex: { all: 0, since: 0 },
    i10Index: { all: 0, since: 0 },
    citationsPerYear: [],
    history: [],
  };
}
