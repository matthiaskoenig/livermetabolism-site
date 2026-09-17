import { createHash } from 'node:crypto';

/**
 * The fingerprint of an English source value, stored beside its German
 * translation so `npm run i18n:check` can tell a stale translation from a
 * current one without calling anything. 16 hex characters is enough to
 * detect an edit and short enough to keep the catalog diffs readable.
 */
export function sourceSha(value: string | string[]): string {
  const canonical = typeof value === 'string' ? value : JSON.stringify(value);
  return createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 16);
}
