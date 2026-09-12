/**
 * Build-time read of the OpenAlex citation snapshot: `astro build` fetches
 * `CITATIONS_URL` once for the publications page and server-renders the "cited
 * N" / "open access" badge of every row from it, so the page is complete (and
 * sortable by citation count) without JavaScript. The browser then refreshes
 * the same badges from a possibly newer snapshot (`site/lib/citationsLive.ts`).
 *
 * Never throws: a network failure, a slow response (10 s timeout) or a file
 * that does not match `citationsSchema` yields `emptyCitations()` plus a
 * warning, so neither GitHub nor OpenAlex being unreachable can fail the
 * build — every row then renders its badge skeleton hidden and the runtime
 * fetch fills it in.
 */
import { emptyCitations, citationsSchema, CITATIONS_URL, normalizeDoi, type CitationEntry, type Citations } from './citationsSchema';

const TIMEOUT_MS = 10_000;

/** The snapshot, or `emptyCitations()` if it cannot be read or does not validate. */
export async function loadCitations(fetchImpl: typeof fetch = globalThis.fetch, url: string = CITATIONS_URL): Promise<Citations> {
  try {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return citationsSchema.parse(await res.json());
  } catch (e) {
    console.warn(`[citations] no snapshot from ${url}: ${e instanceof Error ? e.message : String(e)} — building without live citation data`);
    return emptyCitations();
  }
}

/**
 * The entry for a publication's raw `doi` field, or null when it has no DOI or
 * OpenAlex does not know it (24 of the 110 entries have no DOI at all). The
 * snapshot is keyed by the normalised DOI, so the lookup normalises too.
 */
export function citationFor(citations: Citations, doi: string | null | undefined): CitationEntry | null {
  if (!doi) return null;
  const key = normalizeDoi(doi);
  return (key && citations.works[key]) || null;
}
