/**
 * Thin GitHub REST client for the snapshot fetch: auth headers, JSON parsing
 * through Zod, retry with backoff, and the 202 dance of the statistics
 * endpoints. `fetch` and `sleep` are injectable so the tests never touch the
 * network.
 *
 * Only public data is read, so the Action's default `GITHUB_TOKEN` (or a
 * token from `gh auth token` locally) is enough.
 */
import { z } from 'astro/zod';

export class GitHubHttpError extends Error {
  status: number;
  path: string;
  retryAfterSeconds = 0;
  constructor(status: number, path: string, body: string) {
    super(`GitHub ${status} for ${path}: ${body.slice(0, 200)}`);
    this.status = status;
    this.path = path;
  }
}

export class GitHubNotFoundError extends GitHubHttpError {
  constructor(path: string) {
    super(404, path, 'not found');
  }
}

/** Network-level failure (DNS, reset, timeout): retried like a 5xx. */
export class GitHubNetworkError extends Error {
  constructor(url: string, cause: unknown) {
    super(`Network error for ${url}: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
  }
}

const RETRY_STATUS = new Set([403, 429, 500, 502, 503, 504]);
const BACKOFF_MS = [1000, 2000, 4000];
/**
 * GitHub computes the statistics endpoints asynchronously and answers 202
 * meanwhile. A repository pushed to recently (this one is, every day, by the
 * snapshot commit itself) has a cold cache on every run, and computing it can
 * take the better part of a minute, so the wait is generous.
 */
const STATS_ATTEMPTS = 8;
const PARTICIPATION_ATTEMPTS = 3;
const STATS_BACKOFF_MS = [2000, 4000, 6000, 8000, 8000, 8000, 8000];
const TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// GitHub API shapes — only the fields the snapshot uses. Parsing every
// response makes an API change fail the fetch instead of the website.
// ---------------------------------------------------------------------------
export const apiRepoSchema = z.object({
  full_name: z.string(),
  name: z.string(),
  owner: z.object({ login: z.string() }),
  description: z.string().nullable(),
  html_url: z.string(),
  homepage: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  open_issues_count: z.number(),
  language: z.string().nullable(),
  topics: z.array(z.string()).default([]),
  license: z.object({ spdx_id: z.string().nullable() }).nullable(),
  pushed_at: z.string(),
  archived: z.boolean(),
  default_branch: z.string(),
});

export const apiReleaseSchema = z.object({
  tag_name: z.string(),
  name: z.string().nullable(),
  published_at: z.string().nullable(),
  html_url: z.string(),
  body: z.string().nullable(),
  draft: z.boolean(),
  prerelease: z.boolean(),
});

export const apiCommitSchema = z.object({
  sha: z.string(),
  html_url: z.string(),
  commit: z.object({
    message: z.string(),
    author: z.object({ date: z.string() }).nullable(),
    committer: z.object({ date: z.string() }).nullable(),
  }),
});

/** One week of `/stats/commit_activity`: `week` is a Unix timestamp (seconds). */
export const apiCommitActivitySchema = z.object({
  week: z.number(),
  total: z.number(),
  days: z.array(z.number()).default([]),
});

/** `/stats/participation`: weekly commit totals of the last 52 weeks, without dates. */
export const apiParticipationSchema = z.object({
  all: z.array(z.number()),
  owner: z.array(z.number()).default([]),
});

export type ApiRepo = z.output<typeof apiRepoSchema>;
export type ApiRelease = z.output<typeof apiReleaseSchema>;
export type ApiCommit = z.output<typeof apiCommitSchema>;
export type ApiCommitActivity = z.output<typeof apiCommitActivitySchema>;

export class GitHubClient {
  private fetchImpl: typeof fetch;
  private sleep: (ms: number) => Promise<void>;
  private token: string;

  constructor(opts: { token: string; fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void> }) {
    this.token = opts.token;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  private headers(): Record<string, string> {
    return {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${this.token}`,
      'user-agent': 'livermetabolism-site-fetch',
      'x-github-api-version': '2022-11-28',
    };
  }

  /** fetch with a timeout; a thrown network error becomes a GitHubNetworkError. */
  private async doFetch(url: string): Promise<Response> {
    try {
      return await this.fetchImpl(url, { method: 'GET', headers: this.headers(), signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (err) {
      throw new GitHubNetworkError(url, err);
    }
  }

  /** Runs `fn` up to three times, backing off on retryable HTTP and network errors. */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let last: Error | null = null;
    for (let attempt = 0; attempt < BACKOFF_MS.length; attempt++) {
      try {
        return await fn();
      } catch (err) {
        const retryable = err instanceof GitHubNetworkError || (err instanceof GitHubHttpError && RETRY_STATUS.has(err.status));
        if (!retryable) throw err;
        last = err as Error;
        const retryAfter = err instanceof GitHubHttpError ? err.retryAfterSeconds : 0;
        await this.sleep(retryAfter > 0 ? retryAfter * 1000 : BACKOFF_MS[attempt]);
      }
    }
    throw last!;
  }

  /** One GET; 404 and any other non-2xx throw, the body is returned unparsed. */
  private request(path: string): Promise<{ status: number; body: unknown }> {
    const url = `https://api.github.com${path}`;
    return this.withRetry(async () => {
      const res = await this.doFetch(url);
      if (res.status === 404) throw new GitHubNotFoundError(path);
      if (!res.ok) {
        const err = new GitHubHttpError(res.status, path, await res.text());
        err.retryAfterSeconds = Number(res.headers.get('retry-after')) || 0;
        throw err;
      }
      // 202 (statistics still being computed) and 204 (nothing to report) have no body.
      const text = await res.text();
      return { status: res.status, body: text ? JSON.parse(text) : null };
    });
  }

  /** Repository metadata. */
  async repo(fullName: string): Promise<ApiRepo> {
    const { body } = await this.request(`/repos/${fullName}`);
    return apiRepoSchema.parse(body);
  }

  /** The most recent releases, as GitHub returns them (drafts included). */
  async releases(fullName: string, perPage = 20): Promise<ApiRelease[]> {
    const { body } = await this.request(`/repos/${fullName}/releases?per_page=${perPage}`);
    return z.array(apiReleaseSchema).parse(body);
  }

  /** The default branch's last commit, or null for an empty repository. */
  async latestCommit(fullName: string): Promise<ApiCommit | null> {
    let body: unknown;
    try {
      ({ body } = await this.request(`/repos/${fullName}/commits?per_page=1`));
    } catch (err) {
      // 409 Conflict is how GitHub reports an empty repository here.
      if (err instanceof GitHubHttpError && err.status === 409) return null;
      throw err;
    }
    const commits = z.array(apiCommitSchema).parse(body);
    return commits[0] ?? null;
  }

  /**
   * One of the statistics endpoints, which GitHub computes asynchronously and
   * answers with 202 and an empty body while the cache is cold (204 when the
   * repository has no commits at all). Returns null if it never warms up.
   */
  private async stats(fullName: string, endpoint: string, attempts: number): Promise<unknown | null> {
    for (let attempt = 0; attempt < attempts; attempt++) {
      const { status, body } = await this.request(`/repos/${fullName}/stats/${endpoint}`);
      if (status !== 202 && body != null) return body;
      if (attempt < attempts - 1) await this.sleep(STATS_BACKOFF_MS[Math.min(attempt, STATS_BACKOFF_MS.length - 1)]);
    }
    console.warn(`${endpoint} for ${fullName} was still being computed after ${attempts} attempts`);
    return null;
  }

  /**
   * Commits per week for the last year, week by week. An empty list is
   * returned when GitHub does not produce the statistics in time — the caller
   * then falls back to `participation()`, which is computed separately and is
   * usually ready when this one is not.
   */
  async commitActivity(fullName: string): Promise<ApiCommitActivity[]> {
    const body = await this.stats(fullName, 'commit_activity', STATS_ATTEMPTS);
    return body == null ? [] : z.array(apiCommitActivitySchema).parse(body);
  }

  /**
   * The weekly commit totals of the last 52 weeks (`all`), oldest first and
   * ending with the current week, without the week dates. GitHub's second,
   * independently cached view of the same numbers; null when unavailable.
   */
  async participation(fullName: string): Promise<number[] | null> {
    const body = await this.stats(fullName, 'participation', PARTICIPATION_ATTEMPTS);
    return body == null ? null : apiParticipationSchema.parse(body).all;
  }

}
