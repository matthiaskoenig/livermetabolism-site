/**
 * Writes the GitHub snapshot (`github.json`) read by the research page: one
 * entry per repository listed in `data/software.yml` with its metadata, latest
 * commit, releases and weekly commit activity.
 *
 * Usage:
 *   GITHUB_TOKEN=$(gh auth token) npm run fetch:github -- github.json
 *
 * Only public data is read, so the Action's default GITHUB_TOKEN is enough
 * (see .github/workflows/github-data.yml, which commits the result to the
 * `github-data` branch). The output path defaults to ./github.json, which is
 * gitignored on the source branches.
 */
import { renameSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { snapshotSchema, type Snapshot } from '../site/lib/githubSchema.ts';
import { GitHubClient } from './lib/github-client.ts';
import { reposFromSoftware } from './lib/repos.ts';
import { buildSnapshot, type RepoFetch } from './lib/transform.ts';

const CONCURRENCY = 4;

/** Runs `fn` over `items` with at most `limit` in flight, keeping the input order. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Write to a temp file and rename, so a failed run never leaves a half-written snapshot. */
function writeJsonAtomic(path: string, data: unknown): number {
  const text = `${JSON.stringify(data)}\n`;
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, text);
  renameSync(tmp, path);
  return Buffer.byteLength(text);
}

export async function runFetch(opts: {
  token: string;
  softwarePath: string;
  outPath: string;
  now?: Date;
  client?: Pick<GitHubClient, 'repo' | 'releases' | 'latestCommit' | 'commitActivity'>;
}): Promise<Snapshot> {
  const fetchedAt = (opts.now ?? new Date()).toISOString();
  const client = opts.client ?? new GitHubClient({ token: opts.token });
  const repos = reposFromSoftware(readFileSync(opts.softwarePath, 'utf8'));
  console.log(`Fetching ${repos.length} repositories as of ${fetchedAt}`);

  const fetches = await mapLimit(repos, CONCURRENCY, async (fullName): Promise<RepoFetch> => {
    // Sequential per repository: four workers are already enough concurrency
    // to stay well inside the secondary rate limits.
    const repo = await client.repo(fullName);
    const releases = await client.releases(fullName);
    const latestCommit = await client.latestCommit(fullName);
    const commitActivity = await client.commitActivity(fullName);
    console.log(`  ${fullName}: ${repo.stargazers_count} stars, ${releases.length} releases, ${commitActivity.length} activity weeks`);
    return { fullName, repo, releases, latestCommit, commitActivity };
  });

  // Parsing our own output catches a drift between the writer and the site,
  // which reads the file through the very same schema.
  const snapshot = snapshotSchema.parse(buildSnapshot(fetches, fetchedAt));
  const bytes = writeJsonAtomic(opts.outPath, snapshot);
  console.log(`Wrote ${opts.outPath} (${Object.keys(snapshot.repos).length} repositories, ${(bytes / 1024).toFixed(1)} kB)`);
  return snapshot;
}

if (import.meta.main) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN is not set. Locally: GITHUB_TOKEN=$(gh auth token) npm run fetch:github -- github.json');
    process.exit(2);
  }
  const root = fileURLToPath(new URL('..', import.meta.url));
  runFetch({ token, softwarePath: `${root}data/software.yml`, outPath: process.argv[2] ?? './github.json' }).catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
