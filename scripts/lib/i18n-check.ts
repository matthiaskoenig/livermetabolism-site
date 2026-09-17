import type { Catalog } from '../../site/lib/i18n/content.ts';
import { sourceSha } from '../../site/lib/i18n/sha.ts';

export interface Issue {
  kind: 'stale' | 'missing' | 'orphaned' | 'unknown-field';
  table: string;
  id: string;
  field: string;
}

/**
 * Compare one table's English rows against its German catalog. Pure: the
 * caller reads the YAML. No network, so this is safe to run in CI on every
 * pull request.
 */
export function auditTable(
  rows: Record<string, unknown>[],
  catalog: Catalog,
  fields: readonly string[],
  table: string,
): Issue[] {
  const issues: Issue[] = [];
  const ids = new Set<string>();

  for (const row of rows) {
    const id = String(row.id);
    ids.add(id);
    const entries = catalog[id] ?? {};
    for (const field of fields) {
      const source = row[field];
      // An empty English source needs no translation.
      if (source == null || source === '' || (Array.isArray(source) && source.length === 0)) continue;
      const entry = entries[field];
      if (!entry) issues.push({ kind: 'missing', table, id, field });
      else if (entry.sha !== sourceSha(source as string | string[])) issues.push({ kind: 'stale', table, id, field });
    }
    for (const field of Object.keys(entries)) {
      if (!fields.includes(field)) issues.push({ kind: 'unknown-field', table, id, field });
    }
  }

  for (const [id, entries] of Object.entries(catalog)) {
    if (ids.has(id)) continue;
    for (const field of Object.keys(entries)) issues.push({ kind: 'orphaned', table, id, field });
  }

  return issues;
}

export function formatIssues(issues: Issue[]): string {
  if (issues.length === 0) return 'i18n: every German catalog entry is up to date.';
  const byKind = new Map<Issue['kind'], Issue[]>();
  for (const issue of issues) byKind.set(issue.kind, [...(byKind.get(issue.kind) ?? []), issue]);
  const lines = [`i18n: ${issues.length} issue(s).`];
  for (const [kind, list] of byKind) {
    lines.push(`\n  ${kind} (${list.length}):`);
    for (const i of list) lines.push(`    ${i.table}/${i.id}.${i.field}`);
  }
  lines.push('\n  Run the translate-de skill to regenerate the affected entries.');
  return lines.join('\n');
}
