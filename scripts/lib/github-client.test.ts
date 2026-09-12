import { describe, expect, it, vi } from 'vitest';
import { GitHubClient, GitHubHttpError, GitHubNetworkError, GitHubNotFoundError } from './github-client.ts';

type Reply = { status: number; body?: unknown; text?: string; headers?: Record<string, string>; throws?: unknown };

/** A fetch stub replying with the given responses in order (500 once exhausted). */
function stubFetch(replies: Reply[]) {
  const calls: string[] = [];
  const impl = (async (url: string | URL | Request) => {
    calls.push(String(url));
    const r = replies.shift() ?? { status: 500 };
    if (r.throws) throw r.throws;
    const body = r.text ?? (r.body === undefined ? '' : JSON.stringify(r.body));
    return new Response(body || null, { status: r.status, headers: { 'content-type': 'application/json', ...(r.headers ?? {}) } });
  }) as typeof fetch;
  return { impl, calls };
}

const noSleep = async () => {};
const client = (replies: Reply[]) => {
  const f = stubFetch(replies);
  return { f, c: new GitHubClient({ token: 't', fetchImpl: f.impl, sleep: noSleep }) };
};

const REPO = {
  full_name: 'o/r', name: 'r', owner: { login: 'o' }, description: null, html_url: 'https://github.com/o/r', homepage: null,
  stargazers_count: 3, forks_count: 1, open_issues_count: 0, language: null, topics: [], license: null,
  pushed_at: '2026-09-01T00:00:00Z', archived: false, default_branch: 'main',
};

describe('GitHubClient.repo', () => {
  it('calls the API with the token and parses the response', async () => {
    const captured: RequestInit[] = [];
    const impl = (async (_url: string | URL | Request, init: RequestInit) => {
      captured.push(init);
      return new Response(JSON.stringify(REPO), { status: 200 });
    }) as typeof fetch;
    const c = new GitHubClient({ token: 'secret', fetchImpl: impl, sleep: noSleep });
    await expect(c.repo('o/r')).resolves.toMatchObject({ full_name: 'o/r', stargazers_count: 3 });
    expect((captured[0].headers as Record<string, string>).authorization).toBe('Bearer secret');
  });

  it('rejects a response that does not match the expected API shape', async () => {
    const { c } = client([{ status: 200, body: { ...REPO, stargazers_count: 'many' } }]);
    await expect(c.repo('o/r')).rejects.toThrow();
  });

  it('retries a 503 and then succeeds', async () => {
    const { c, f } = client([{ status: 503 }, { status: 200, body: REPO }]);
    await expect(c.repo('o/r')).resolves.toMatchObject({ name: 'r' });
    expect(f.calls).toHaveLength(2);
  });

  it('gives up after three attempts on repeated server errors', async () => {
    const { c, f } = client([{ status: 500 }, { status: 502 }, { status: 503 }]);
    await expect(c.repo('o/r')).rejects.toBeInstanceOf(GitHubHttpError);
    expect(f.calls).toHaveLength(3);
  });

  it('does not retry a 404 and names the repository', async () => {
    const { c, f } = client([{ status: 404 }]);
    await expect(c.repo('o/gone')).rejects.toBeInstanceOf(GitHubNotFoundError);
    expect(f.calls).toEqual(['https://api.github.com/repos/o/gone']);
  });

  it('turns a network failure into a retryable GitHubNetworkError', async () => {
    const { c, f } = client([{ status: 0, throws: new TypeError('fetch failed') }, { status: 200, body: REPO }]);
    await expect(c.repo('o/r')).resolves.toMatchObject({ name: 'r' });
    expect(f.calls).toHaveLength(2);

    const failing = client([{ status: 0, throws: new TypeError('x') }, { status: 0, throws: new TypeError('x') }, { status: 0, throws: new TypeError('x') }]);
    await expect(failing.c.repo('o/r')).rejects.toBeInstanceOf(GitHubNetworkError);
  });
});

describe('GitHubClient.releases and latestCommit', () => {
  it('requests at most `perPage` releases', async () => {
    const { c, f } = client([{ status: 200, body: [] }]);
    await expect(c.releases('o/r', 20)).resolves.toEqual([]);
    expect(f.calls[0]).toBe('https://api.github.com/repos/o/r/releases?per_page=20');
  });

  it('returns the first commit of the list', async () => {
    const commit = { sha: 'abc', html_url: 'https://github.com/o/r/commit/abc', commit: { message: 'fix\n\nbody', author: { date: '2026-09-01T10:00:00Z' }, committer: null } };
    const { c, f } = client([{ status: 200, body: [commit] }]);
    await expect(c.latestCommit('o/r')).resolves.toMatchObject({ sha: 'abc' });
    expect(f.calls[0]).toBe('https://api.github.com/repos/o/r/commits?per_page=1');
  });

  it('returns null for an empty repository (409) and for an empty list', async () => {
    await expect(client([{ status: 409 }]).c.latestCommit('o/r')).resolves.toBeNull();
    await expect(client([{ status: 200, body: [] }]).c.latestCommit('o/r')).resolves.toBeNull();
  });
});

describe('GitHubClient.commitActivity', () => {
  const week = { week: 1757808000, total: 4, days: [0, 1, 1, 2, 0, 0, 0] };

  it('retries while GitHub is still computing the statistics (202)', async () => {
    const { c, f } = client([{ status: 202, text: '{}' }, { status: 202, text: '{}' }, { status: 200, body: [week] }]);
    await expect(c.commitActivity('o/r')).resolves.toEqual([week]);
    expect(f.calls).toHaveLength(3);
  });

  it('gives up after eight attempts and returns an empty list', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { c, f } = client(Array.from({ length: 8 }, () => ({ status: 202, text: '{}' })));
    await expect(c.commitActivity('o/r')).resolves.toEqual([]);
    expect(f.calls).toHaveLength(8);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('o/r'));
    warn.mockRestore();
  });

  it('falls back to the participation endpoint, which is cached separately', async () => {
    const { c, f } = client([{ status: 200, body: { all: [1, 2, 3], owner: [1, 0, 0] } }]);
    await expect(c.participation('o/r')).resolves.toEqual([1, 2, 3]);
    expect(f.calls[0]).toBe('https://api.github.com/repos/o/r/stats/participation');
  });

  it('reports participation as unavailable after three 202s', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { c, f } = client(Array.from({ length: 3 }, () => ({ status: 202, text: '{}' })));
    await expect(c.participation('o/r')).resolves.toBeNull();
    expect(f.calls).toHaveLength(3);
    warn.mockRestore();
  });

  it('treats the empty 204 of a repository without commits as no activity', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { c } = client(Array.from({ length: 8 }, () => ({ status: 204 })));
    await expect(c.commitActivity('o/r')).resolves.toEqual([]);
    warn.mockRestore();
  });
});
