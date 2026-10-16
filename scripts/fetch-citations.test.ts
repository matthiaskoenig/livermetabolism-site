import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runFetch } from './fetch-citations.ts';

/** The recorded OpenAlex response for four DOIs, one of them unknown to OpenAlex. */
const fixture = readFileSync('tests/fixtures/openalex/works.json', 'utf8');
const empty = JSON.stringify({ meta: { count: 0, page: 1, per_page: 200 }, results: [] });

function setup() {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  const dir = mkdtempSync(join(tmpdir(), 'citations-'));
  const publicationsPath = join(dir, 'publications.yml');
  writeFileSync(
    publicationsPath,
    ['10.1038/msb.2010.62', '10.1371/journal.pcbi.1002577', '10.1038/s41540-026-00651-0', '10.1515/jib-2026-0006']
      .map((doi, i) => `- id: p${i}\n  doi: ${doi}\n`)
      .join(''),
  );
  return { publicationsPath, outPath: join(dir, 'citations.json') };
}

const answer = (body: string) => vi.fn(async () => new Response(body, { status: 200, headers: { 'content-type': 'application/json' } }));

describe('runFetch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('keeps the previous snapshot when OpenAlex answers empty', async () => {
    const paths = setup();
    await runFetch({ ...paths, fetchImpl: answer(fixture) });
    const previous = readFileSync(paths.outPath, 'utf8');

    await expect(runFetch({ ...paths, fetchImpl: answer(empty) })).rejects.toThrow(/^implausible: DOIs found fell from 3 to 0; citations fell from \d+ to 0 /);
    expect(readFileSync(paths.outPath, 'utf8')).toBe(previous);
  });

  it('writes the same answer again, and an empty one when the drop is accepted', async () => {
    const paths = setup();
    await runFetch({ ...paths, fetchImpl: answer(fixture) });
    expect(Object.keys((await runFetch({ ...paths, fetchImpl: answer(fixture) })).works)).toHaveLength(3);

    vi.stubEnv('SNAPSHOT_ACCEPT_DROP', '1');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await runFetch({ ...paths, fetchImpl: answer(empty) });
    expect(JSON.parse(readFileSync(paths.outPath, 'utf8')).works).toEqual({});
  });
});
