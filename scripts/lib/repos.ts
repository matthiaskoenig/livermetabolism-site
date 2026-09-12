/**
 * The list of GitHub repositories the snapshot covers: the `repository` URL of
 * every entry in `data/software.yml`, normalised to `owner/name`.
 */
import { load } from 'js-yaml';

const HOSTS = new Set(['github.com', 'www.github.com']);
const SEGMENT = /^[A-Za-z0-9._-]+$/;

/**
 * `https://github.com/sys-bio/roadrunner/` -> `sys-bio/roadrunner`.
 * Trailing slashes, a `.git` suffix, `www.` and deeper paths (`/tree/main`)
 * are normalised away; anything that is not a GitHub repository URL (another
 * host, a gist, a user page, not a URL at all) yields null.
 */
export function repoFullName(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (!HOSTS.has(parsed.hostname.toLowerCase())) return null;
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length < 2) return null;
  const owner = segments[0];
  const name = segments[1].replace(/\.git$/, '');
  if (!SEGMENT.test(owner) || !SEGMENT.test(name)) return null;
  return `${owner}/${name}`;
}

/**
 * The repositories of `data/software.yml`, in file order and without
 * duplicates (two entries may share a repository). An entry without a
 * `repository` is skipped; a `repository` that is not a GitHub repository URL
 * is an error, so a typo fails the fetch instead of silently dropping a card.
 */
export function reposFromSoftware(yamlText: string): string[] {
  const rows = (load(yamlText) ?? []) as Array<{ id?: string; repository?: string | null }>;
  const names: string[] = [];
  for (const row of rows) {
    if (!row?.repository) continue;
    const fullName = repoFullName(row.repository);
    if (!fullName) throw new Error(`software.yml entry ${row.id ?? '?'}: not a GitHub repository URL: ${row.repository}`);
    if (!names.includes(fullName)) names.push(fullName);
  }
  return names;
}
