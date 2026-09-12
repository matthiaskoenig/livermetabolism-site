/**
 * OpenAlex client and transform for the daily `citations.json` snapshot
 * (`scripts/fetch-citations.ts`): the exact citation count and open-access
 * status of every publication of `data/publications.yml` that has a DOI.
 *
 * OpenAlex needs no key. One request covers a batch of up to 50 DOIs
 * (`filter=doi:<a>|<b>|…`), and only the five fields the snapshot uses are
 * selected. An optional contact address (the repository variable
 * `OPENALEX_MAILTO`) puts the request into OpenAlex's polite pool; it is never
 * hard-coded here.
 *
 * `fetch` and `sleep` are injectable so the tests never touch the network; the
 * fixture `tests/fixtures/openalex/works.json` is a recorded response for four
 * real DOIs. The API objects are parsed through Zod, as in `github-client.ts`,
 * so an API change fails the fetch instead of the website.
 */
import { load } from 'js-yaml';
import { z } from 'astro/zod';
import type { CitationEntry, Citations } from '../../site/lib/citationsSchema.ts';

const API = 'https://api.openalex.org/works';
/** OpenAlex asks unauthenticated clients to identify themselves. */
const USER_AGENT = 'livermetabolism-site data workflow';
const SELECT = 'id,doi,cited_by_count,open_access,counts_by_year';
/** DOIs per request. */
export const BATCH_SIZE = 50;
/**
 * The page size, deliberately larger than `BATCH_SIZE`: OpenAlex sometimes
 * holds two work records for one DOI (a publisher version and a repository
 * copy), so a batch of 50 DOIs can match more than 50 works and `per-page=50`
 * would silently drop the overflow — it did, for two DOIs, when this was first
 * run against the real file. 200 is the maximum OpenAlex allows.
 */
const PER_PAGE = 200;
const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const BACKOFF_MS = [1000, 2000, 4000];
const TIMEOUT_MS = 30_000;

export class OpenAlexHttpError extends Error {
  status: number;
  retryAfterSeconds = 0;
  constructor(status: number, url: string, body: string) {
    super(`OpenAlex ${status} for ${url}: ${body.slice(0, 200)}`);
    this.status = status;
  }
}

/** Network-level failure (DNS, reset, timeout): retried like a 5xx. */
export class OpenAlexNetworkError extends Error {
  constructor(url: string, cause: unknown) {
    super(`Network error for ${url}: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
  }
}

// ---------------------------------------------------------------------------
// OpenAlex API shapes — only the selected fields.
// ---------------------------------------------------------------------------
export const apiWorkSchema = z.object({
  /** `https://openalex.org/W…`. */
  id: z.string(),
  /** `https://doi.org/10.…`, or null for a work without a DOI. */
  doi: z.string().nullable(),
  cited_by_count: z.number(),
  open_access: z.object({
    is_oa: z.boolean(),
    oa_status: z.string(),
  }),
  /** Descending by year as OpenAlex returns it, and only years with citations. */
  counts_by_year: z.array(z.object({ year: z.number(), cited_by_count: z.number() })).default([]),
});

export const apiWorksResponseSchema = z.object({
  /** Total matches; compared with `results.length` to detect a truncated page. */
  meta: z.object({ count: z.number() }).optional(),
  results: z.array(apiWorkSchema),
});

export type ApiWork = z.output<typeof apiWorkSchema>;

/**
 * `10.1515/JIB-2026-0006`, `https://doi.org/10.1/x`, `doi:10.1/x` and a padded
 * ` 10.1/x ` all normalise to the lowercase bare DOI; anything that is not a
 * DOI (empty, a note, a prefix without a suffix) yields null. The snapshot and
 * every lookup use this form.
 */
export function normalizeDoi(raw: string): string | null {
  const bare = String(raw ?? '')
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .trim()
    .toLowerCase();
  return /^10\.\d+\/\S+$/.test(bare) ? bare : null;
}

/**
 * The DOIs of `data/publications.yml`, normalised, unique and in file order.
 * An entry without a `doi` is skipped; a value that is not a DOI is skipped
 * with a warning, so a typo shows up in the workflow log rather than becoming
 * a filter OpenAlex cannot answer.
 */
export function doisFromPublications(yamlText: string): string[] {
  const rows = (load(yamlText) ?? []) as Array<{ id?: string; doi?: string | null }>;
  const dois: string[] = [];
  for (const row of rows) {
    if (!row?.doi) continue;
    const doi = normalizeDoi(String(row.doi));
    if (!doi) {
      console.warn(`publications.yml entry ${row.id ?? '?'}: not a DOI, skipped: ${row.doi}`);
      continue;
    }
    if (!dois.includes(doi)) dois.push(doi);
  }
  return dois;
}

/** Splits a list into batches of at most `size`, in order. */
export function chunk<T>(list: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < list.length; i += size) batches.push(list.slice(i, i + size));
  return batches;
}

function worksUrl(dois: string[], mailto?: string): string {
  // The DOIs are matched against /^10\.\d+\/\S+$/, so they carry no `|`,
  // `&` or space that would need escaping inside the filter value; OpenAlex
  // takes the slashes unencoded (verified against the live API).
  let url = `${API}?filter=doi:${dois.join('|')}&select=${SELECT}&per-page=${PER_PAGE}`;
  if (mailto?.trim()) url += `&mailto=${encodeURIComponent(mailto.trim())}`;
  return url;
}

/**
 * One request for one batch of up to 50 DOIs, retried up to three times on
 * 429/5xx (honouring `retry-after`) and on a network failure; a 4xx other than
 * 429 is not transient and is thrown immediately. DOIs OpenAlex does not know
 * are simply missing from the result.
 */
export async function fetchWorks(
  dois: string[],
  fetchImpl: typeof fetch = fetch,
  mailto?: string,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<ApiWork[]> {
  if (!dois.length) return [];
  const url = worksUrl(dois, mailto);

  let last: Error | null = null;
  for (let attempt = 0; attempt < BACKOFF_MS.length; attempt++) {
    try {
      let res: Response;
      try {
        res = await fetchImpl(url, {
          method: 'GET',
          headers: { accept: 'application/json', 'user-agent': USER_AGENT },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch (err) {
        throw new OpenAlexNetworkError(url, err);
      }
      if (!res.ok) {
        const err = new OpenAlexHttpError(res.status, url, await res.text());
        err.retryAfterSeconds = Number(res.headers.get('retry-after')) || 0;
        throw err;
      }
      const { meta, results } = apiWorksResponseSchema.parse(await res.json());
      if (meta && meta.count > results.length) {
        console.warn(`OpenAlex matched ${meta.count} works for ${dois.length} DOIs but returned only ${results.length} — the page is truncated`);
      }
      return results;
    } catch (err) {
      const retryable = err instanceof OpenAlexNetworkError || (err instanceof OpenAlexHttpError && RETRY_STATUS.has(err.status));
      if (!retryable) throw err;
      last = err as Error;
      const retryAfter = err instanceof OpenAlexHttpError ? err.retryAfterSeconds : 0;
      await sleep(retryAfter > 0 ? retryAfter * 1000 : BACKOFF_MS[attempt]);
    }
  }
  throw last!;
}

/**
 * One API work as the snapshot stores it: `[normalised DOI, entry]`, with the
 * work id reduced to `W…` and `counts_by_year` turned into `{year, count}`
 * ascending. A work without a usable DOI, or whose id is not a work id, yields
 * null and is left out of the snapshot.
 */
export function toCitationEntry(work: ApiWork): [doi: string, entry: CitationEntry] | null {
  const doi = work.doi ? normalizeDoi(work.doi) : null;
  const openalexId = work.id.replace(/^https?:\/\/openalex\.org\//i, '');
  if (!doi || !/^W\d+$/.test(openalexId)) return null;
  return [
    doi,
    {
      openalexId,
      citedByCount: work.cited_by_count,
      isOa: work.open_access.is_oa,
      oaStatus: work.open_access.oa_status,
      countsByYear: work.counts_by_year
        .map((c) => ({ year: c.year, count: c.cited_by_count }))
        .sort((a, b) => a.year - b.year),
    },
  ];
}

/**
 * The snapshot written to `citations.json`, keyed by normalised DOI. OpenAlex
 * occasionally holds two work records for the same DOI (a publisher version
 * and a repository copy); the more-cited one wins, so the badge never shows
 * the lower of two counts.
 */
export function buildCitations(works: ApiWork[], now: Date): Citations {
  const entries: Record<string, CitationEntry> = {};
  for (const work of works) {
    const mapped = toCitationEntry(work);
    if (!mapped) continue;
    const [doi, entry] = mapped;
    const previous = entries[doi];
    if (!previous || entry.citedByCount > previous.citedByCount) entries[doi] = entry;
  }
  return { fetchedAt: now.toISOString(), works: entries };
}
