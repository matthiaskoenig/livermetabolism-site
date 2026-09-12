/**
 * Writes the OpenAlex citation snapshot (`citations.json`) read by the
 * publications page: the exact citation count, the open-access status and the
 * citations-per-year histogram of every publication of `data/publications.yml`
 * that carries a DOI.
 *
 * Usage:
 *   npm run fetch:citations -- citations.json
 *   OPENALEX_MAILTO=you@example.org npm run fetch:citations -- citations.json
 *
 * OpenAlex needs no key; `OPENALEX_MAILTO` (the repository variable of the same
 * name in the workflow) only puts the requests into OpenAlex's polite pool and
 * is optional. The DOIs are queried in batches of 50, the result is validated
 * with `citationsSchema` and written atomically, so a failed run leaves the
 * previous snapshot in place — see .github/workflows/github-data.yml, where the
 * step is `continue-on-error` and must never fail the other two snapshots.
 *
 * The output path defaults to ./citations.json, which is gitignored on the
 * source branches.
 */
import { renameSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { citationsSchema, type Citations } from '../site/lib/citationsSchema.ts';
import { buildCitations, BATCH_SIZE, chunk, doisFromPublications, fetchWorks, type ApiWork } from './lib/openalex.ts';

/** Write to a temp file and rename, so a failed run never leaves a half-written snapshot. */
function writeJsonAtomic(path: string, data: unknown): number {
  const text = `${JSON.stringify(data)}\n`;
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, text);
  renameSync(tmp, path);
  return Buffer.byteLength(text);
}

export async function runFetch(opts: {
  publicationsPath: string;
  outPath: string;
  now?: Date;
  mailto?: string;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}): Promise<Citations> {
  const now = opts.now ?? new Date();
  const dois = doisFromPublications(readFileSync(opts.publicationsPath, 'utf8'));
  const batches = chunk(dois, BATCH_SIZE);
  console.log(`Fetching ${dois.length} DOIs from OpenAlex in ${batches.length} batches as of ${now.toISOString()}${opts.mailto?.trim() ? ' (polite pool)' : ''}`);

  const works: ApiWork[] = [];
  for (const [i, batch] of batches.entries()) {
    const found = await fetchWorks(batch, opts.fetchImpl ?? fetch, opts.mailto, opts.sleep);
    console.log(`  batch ${i + 1}/${batches.length}: ${found.length} works for ${batch.length} DOIs`);
    works.push(...found);
  }

  // Parsing our own output catches a drift between the writer and the site,
  // which reads the file through the very same schema.
  const citations = citationsSchema.parse(buildCitations(works, now));
  const entries = Object.values(citations.works);
  const total = entries.reduce((sum, entry) => sum + entry.citedByCount, 0);
  const bytes = writeJsonAtomic(opts.outPath, citations);
  console.log(
    `Wrote ${opts.outPath}: ${entries.length} of ${dois.length} DOIs found, ${total} citations in total, ` +
      `${entries.filter((entry) => entry.isOa).length} open access (${(bytes / 1024).toFixed(1)} kB)`,
  );
  return citations;
}

if (import.meta.main) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  runFetch({
    publicationsPath: `${root}data/publications.yml`,
    outPath: process.argv[2] ?? './citations.json',
    mailto: process.env.OPENALEX_MAILTO,
  }).catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
