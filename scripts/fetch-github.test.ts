import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'astro/zod';
import { apiCommitActivitySchema, apiCommitSchema, apiReleaseSchema, apiRepoSchema } from './lib/github-client.ts';
import { runFetch } from './fetch-github.ts';

const fixture = (name: string) => JSON.parse(readFileSync(`tests/fixtures/github/${name}.json`, 'utf8'));
const repo = apiRepoSchema.parse(fixture('repo'));
const releases = z.array(apiReleaseSchema).parse(fixture('releases'));
const commit = apiCommitSchema.parse(fixture('commits')[0]);
const activity = z.array(apiCommitActivitySchema).parse(fixture('commit-activity'));

/** A client answering the recorded responses, with the given overrides. */
function client(over: { stars?: number; releases?: unknown[]; activity?: unknown[] } = {}) {
  return {
    repo: async () => ({ ...repo, stargazers_count: over.stars ?? repo.stargazers_count }),
    releases: async () => (over.releases ?? releases) as typeof releases,
    latestCommit: async () => commit,
    commitActivity: async () => (over.activity ?? activity) as typeof activity,
    participation: async () => null,
  };
}

function setup() {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  const dir = mkdtempSync(join(tmpdir(), 'github-'));
  const softwarePath = join(dir, 'software.yml');
  writeFileSync(softwarePath, '- id: sbmlutils\n  repository: https://github.com/matthiaskoenig/sbmlutils\n');
  return { token: 't', softwarePath, outPath: join(dir, 'github.json') };
}

describe('runFetch', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps the previous snapshot when GitHub answers without releases', async () => {
    const opts = setup();
    await runFetch({ ...opts, client: client() });
    const previous = readFileSync(opts.outPath, 'utf8');

    await expect(runFetch({ ...opts, client: client({ releases: [] }) })).rejects.toThrow(/^implausible: releases fell from \d+ to 0 /);
    await expect(runFetch({ ...opts, client: client({ stars: 0 }) })).rejects.toThrow(/^implausible: stars fell from \d+ to 0 /);
    expect(readFileSync(opts.outPath, 'utf8')).toBe(previous);
  });

  it('keeps the previous commit activity when the statistics are still being computed', async () => {
    const opts = setup();
    const first = await runFetch({ ...opts, client: client() });
    const next = await runFetch({ ...opts, client: client({ activity: [] }) });
    expect(next.repos['matthiaskoenig/sbmlutils'].commitActivity).toEqual(first.repos['matthiaskoenig/sbmlutils'].commitActivity);
    expect(next.repos['matthiaskoenig/sbmlutils'].commitActivity.length).toBeGreaterThan(0);
  });
});
