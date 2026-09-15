import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { repoFullName, reposFromSoftware } from './repos.ts';

describe('repoFullName', () => {
  it('extracts owner/name from a plain repository URL', () => {
    expect(repoFullName('https://github.com/matthiaskoenig/sbmlutils')).toBe('matthiaskoenig/sbmlutils');
  });

  it('drops a trailing slash', () => {
    expect(repoFullName('https://github.com/sys-bio/roadrunner/')).toBe('sys-bio/roadrunner');
  });

  it('drops a .git suffix', () => {
    expect(repoFullName('https://github.com/opencobra/cobrapy.git')).toBe('opencobra/cobrapy');
  });

  it('accepts www and http', () => {
    expect(repoFullName('http://www.github.com/matthiaskoenig/pkdb')).toBe('matthiaskoenig/pkdb');
  });

  it('ignores deeper paths', () => {
    expect(repoFullName('https://github.com/sys-bio/tellurium/tree/develop')).toBe('sys-bio/tellurium');
  });

  it('trims surrounding whitespace', () => {
    expect(repoFullName('  https://github.com/matthiaskoenig/visfem  ')).toBe('matthiaskoenig/visfem');
  });

  it('returns null for non-GitHub hosts', () => {
    expect(repoFullName('https://gitlab.com/owner/repo')).toBeNull();
    expect(repoFullName('https://libroadrunner.readthedocs.io/en/latest/')).toBeNull();
    expect(repoFullName('https://raw.githubusercontent.com/owner/repo/main/x.json')).toBeNull();
  });

  it('returns null for a user page, gist or malformed URL', () => {
    expect(repoFullName('https://github.com/matthiaskoenig')).toBeNull();
    expect(repoFullName('https://gist.github.com/owner/abc')).toBeNull();
    expect(repoFullName('not a url')).toBeNull();
    expect(repoFullName('')).toBeNull();
  });
});

describe('reposFromSoftware', () => {
  it('keeps file order and drops duplicates and entries without a repository', () => {
    const yamlText = [
      "- id: 'a'",
      '  repository: https://github.com/owner/one',
      "- id: 'b'",
      '  repository: https://github.com/owner/two/',
      "- id: 'c'",
      '  repository: https://github.com/owner/one',
      "- id: 'd'",
      '  repository:',
      "- id: 'e'",
      '  homepage: https://example.org',
    ].join('\n');
    expect(reposFromSoftware(yamlText)).toEqual(['owner/one', 'owner/two']);
  });

  it('throws on a repository URL that is not a GitHub repository', () => {
    expect(() => reposFromSoftware("- id: 'a'\n  repository: https://gitlab.com/owner/repo\n")).toThrow(/gitlab\.com/);
  });

  it('reads the real data/software.yml', () => {
    // Every software entry carries its own GitHub repository.
    const names = reposFromSoftware(readFileSync('data/software.yml', 'utf8'));
    expect(names).toHaveLength(13);
    expect(names).toContain('matthiaskoenig/sbml4humans');
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain('matthiaskoenig/sbmlutils');
    expect(names).toContain('sys-bio/roadrunner');
    expect(names).toContain('opencobra/cobrapy');
    expect(names.at(-1)).toBe('matthiaskoenig/livermetabolism-site');
  });
});
