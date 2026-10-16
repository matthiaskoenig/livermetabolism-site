import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'astro/zod';
import { assertPlausible, implausibleDrops, MAX_DROP, readPrevious, sum, writeJsonAtomic } from './snapshot.ts';

const schema = z.object({ n: z.number() }).strict();

describe('implausibleDrops', () => {
  it('accepts a rise, an unchanged figure and a fall of at most MAX_DROP', () => {
    expect(MAX_DROP).toBe(0.1);
    expect(
      implausibleDrops([
        { label: 'up', previous: 100, next: 120 },
        { label: 'same', previous: 100, next: 100 },
        { label: 'ten percent', previous: 100, next: 90 },
      ]),
    ).toEqual([]);
  });

  it('reports a fall of more than MAX_DROP and a fall to zero', () => {
    expect(
      implausibleDrops([
        { label: 'citations', previous: 100, next: 89 },
        { label: 'stars', previous: 5, next: 0 },
      ]),
    ).toEqual(['citations fell from 100 to 89', 'stars fell from 5 to 0']);
  });

  it('never reports a figure that was zero before', () => {
    expect(implausibleDrops([{ label: 'releases', previous: 0, next: 0 }])).toEqual([]);
  });
});

describe('assertPlausible', () => {
  const drop = [{ label: 'citations', previous: 3891, next: 0 }];

  it('passes without figures, as on the very first run', () => {
    expect(() => assertPlausible([], false)).not.toThrow();
  });

  it('throws an "implausible" error naming the figure', () => {
    expect(() => assertPlausible(drop, false)).toThrow(/^implausible: citations fell from 3891 to 0 /);
  });

  it('only warns when the drop is accepted', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => assertPlausible(drop, true)).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('citations fell from 3891 to 0'));
    warn.mockRestore();
  });

  it('reads the acceptance from SNAPSHOT_ACCEPT_DROP by default', () => {
    vi.stubEnv('SNAPSHOT_ACCEPT_DROP', '1');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => assertPlausible(drop)).not.toThrow();
    vi.stubEnv('SNAPSHOT_ACCEPT_DROP', '');
    expect(() => assertPlausible(drop)).toThrow(/^implausible/);
    vi.unstubAllEnvs();
    warn.mockRestore();
  });
});

describe('readPrevious and writeJsonAtomic', () => {
  const dir = mkdtempSync(join(tmpdir(), 'snapshot-'));

  it('round-trips a snapshot through the schema', () => {
    const path = join(dir, 'ok.json');
    expect(writeJsonAtomic(path, { n: 1 })).toBe(Buffer.byteLength('{"n":1}\n'));
    expect(readFileSync(path, 'utf8')).toBe('{"n":1}\n');
    expect(readPrevious(path, schema)).toEqual({ n: 1 });
  });

  it('is null for a missing file and, with a warning, for an invalid one', () => {
    expect(readPrevious(join(dir, 'missing.json'), schema)).toBeNull();
    const path = join(dir, 'bad.json');
    writeFileSync(path, '{"n":"one"}');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(readPrevious(path, schema)).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Ignoring the previous snapshot'));
    warn.mockRestore();
  });
});

describe('sum', () => {
  it('adds up a projection, zero for nothing', () => {
    expect(sum([{ n: 2 }, { n: 3 }], (x) => x.n)).toBe(5);
    expect(sum([], () => 1)).toBe(0);
  });
});
