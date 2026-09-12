/**
 * Shape of the OpenAlex citation snapshot (`citations.json`), shared by the
 * fetch script that writes it (`scripts/fetch-citations.ts`) and the site that
 * reads it.
 *
 * The snapshot is refreshed daily by `.github/workflows/github-data.yml` and
 * committed to the orphan branch `github-data` next to `github.json` and
 * `scholar.json`, so the per-paper citation counts on the publications page
 * stay current without a redeploy. Every read — at build time and in the
 * browser — is parsed through `citationsSchema`, so a malformed or tampered
 * file is rejected instead of rendered. The schemas are `.strict()`: an unknown
 * key means the writer and the reader have drifted apart.
 *
 * It is keyed by the **normalised** DOI (lowercase, no resolver prefix; see
 * `normalizeDoi()` in `scripts/lib/openalex.ts`), which is how the publications
 * page looks an entry up from `data/publications.yml`. A DOI OpenAlex does not
 * know is absent rather than zero.
 *
 * Numbers and two short strings only: `openalexId` is constrained to `^W\d+$`
 * so it can be interpolated into an `openalex.org` link, and `oaStatus` is a
 * short label rendered as text — never as HTML.
 */
import { z } from 'astro/zod';

/** Raw URL of the daily snapshot on the `github-data` branch. */
export const CITATIONS_URL = 'https://raw.githubusercontent.com/matthiaskoenig/livermetabolism-site/github-data/citations.json';

/** Landing page of an OpenAlex work, e.g. `https://openalex.org/W1969067437`. */
export function openalexWorkUrl(openalexId: string): string {
  return `https://openalex.org/${openalexId}`;
}

/** One year of a work's citation history. */
export const citationYearSchema = z
  .object({
    year: z.number(),
    count: z.number(),
  })
  .strict();

export const citationEntrySchema = z
  .object({
    /** OpenAlex work id without the URL prefix; the regex keeps it link-safe. */
    openalexId: z.string().regex(/^W\d+$/),
    citedByCount: z.number(),
    isOa: z.boolean(),
    /** OpenAlex's `oa_status`: `gold`, `green`, `hybrid`, `bronze`, `diamond`, `closed`, … */
    oaStatus: z.string(),
    /** Ascending by year. */
    countsByYear: z.array(citationYearSchema),
  })
  .strict();

export const citationsSchema = z
  .object({
    fetchedAt: z.string(),
    /** Keyed by the normalised DOI. */
    works: z.record(z.string(), citationEntrySchema),
  })
  .strict();

export type CitationYear = z.output<typeof citationYearSchema>;
export type CitationEntry = z.output<typeof citationEntrySchema>;
export type Citations = z.output<typeof citationsSchema>;

/**
 * The fallback when no snapshot can be read. `fetchedAt` is the epoch, so any
 * real snapshot fetched later always compares as newer.
 */
export function emptyCitations(): Citations {
  return { fetchedAt: new Date(0).toISOString(), works: {} };
}
