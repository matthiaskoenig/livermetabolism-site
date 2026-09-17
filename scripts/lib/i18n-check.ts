import type { Catalog, CatalogEntry } from '../../site/lib/i18n/content.ts';
import { sourceSha } from '../../site/lib/i18n/sha.ts';

export interface Issue {
  kind: 'stale' | 'missing' | 'orphaned' | 'unknown-field';
  locale: string;
  table: string;
  id: string;
  field: string;
}

/**
 * Tables/fields whose value is markup, rendered via Vue's v-html rather
 * than as plain text - see i18n/TRANSLATION.md's "Some data fields keep
 * their HTML" section, which is the authority this list is kept in sync
 * with by hand. A translation of one of these must carry the exact same
 * tags, in the exact same order, with byte-identical attributes (a `href`,
 * a `class`) as its English source - only the text nodes between tags may
 * change - because the German catalog is machine-generated text fed
 * straight to v-html with no further validation downstream.
 */
const MARKUP_FIELDS: Record<string, readonly string[]> = {
  news: ['abstract', 'short'],
  people: ['description'],
  projects: ['abstract'],
  software: ['description'],
  teaching: ['content', 'caption', 'funding'],
};

/** Every HTML tag in a string, in order, tag name and attributes verbatim (not just the name) - so a translation that drops, adds, reorders a tag, or edits an attribute, is caught. */
function tagSequence(html: string): string[] {
  return [...html.matchAll(/<[^>]+>/g)].map((m) => m[0]);
}

function hasMatchingMarkup(table: string, field: string, source: unknown, text: unknown): boolean {
  if (!MARKUP_FIELDS[table]?.includes(field)) return true;
  if (typeof source !== 'string' || typeof text !== 'string') return true;
  const a = tagSequence(source);
  const b = tagSequence(text);
  return a.length === b.length && a.every((tag, i) => tag === b[i]);
}

export class CatalogParseError extends Error {
  file: string;
  inner: Error;

  constructor(file: string, inner: Error) {
    super(`Failed to parse ${file}: ${inner.message}`);
    this.file = file;
    this.inner = inner;
  }
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
  locale: string,
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
      // An entry with empty text is functionally untranslated - both
      // loaders (localize() in content.ts, uiFor()'s `t` in catalog.ts)
      // fall back to English for it - but a naive "does an entry exist"
      // check would miss it: {sha: <correct>, text: ''} has a real entry
      // whose sha can even match the source, so it would pass silently and
      // render English forever. Treat it the same as no entry at all.
      const isEmpty = (text: unknown) => text === '' || text == null || (Array.isArray(text) && text.length === 0);
      if (!entry || isEmpty(entry.text)) issues.push({ kind: 'missing', locale, table, id, field });
      else if (entry.sha !== sourceSha(source as string | string[])) issues.push({ kind: 'stale', locale, table, id, field });
      // A matching sha only says the translation was generated against the
      // current English text - it says nothing about whether the German
      // text itself still carries the same markup, since the sha is a hash
      // of the English source, never of the German output. Report a broken
      // tag sequence the same way as 'stale': it needs re-translating.
      else if (!hasMatchingMarkup(table, field, source, entry.text)) issues.push({ kind: 'stale', locale, table, id, field });
    }
    for (const field of Object.keys(entries)) {
      if (!fields.includes(field)) issues.push({ kind: 'unknown-field', locale, table, id, field });
    }
  }

  for (const [id, entries] of Object.entries(catalog)) {
    if (ids.has(id)) continue;
    for (const field of Object.keys(entries)) issues.push({ kind: 'orphaned', locale, table, id, field });
  }

  return issues;
}

/**
 * Flatten the nested `en` object of site/lib/i18n/ui.en.ts into the same
 * dotted keys ('nav.publications', 'tags.label.digitalTwins', ...) that
 * i18n/de/ui.yml uses - the identical transform as site/lib/i18n/catalog.ts's
 * flatten(), duplicated here rather than imported: catalog.ts also imports
 * format.ts and locales.ts with bare (no ".ts") specifiers, which Vite
 * resolves but Node's direct execution of this script cannot (the same
 * reason readCatalogYaml() in scripts/i18n-check.ts duplicates loadCatalog()
 * instead of importing content.ts's version - see the NOTE there).
 * ui.en.ts itself has no imports, so importing *that* module directly is
 * safe and is what scripts/i18n-check.ts does.
 */
export function flatten(tree: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree as Record<string, unknown>)) {
    const dotted = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[dotted] = value;
    else Object.assign(out, flatten(value, dotted));
  }
  return out;
}

/**
 * i18n/de/ui.yml has no per-row id the way a data table's catalog does -
 * it is one flat map of dotted key -> {sha, text}. auditTable() expects
 * `Catalog[id][field]`, so this wraps the flat UI catalog and its flattened
 * English source in a single synthetic row before delegating to it: that
 * reuses auditTable's missing/stale/unknown-field comparisons unchanged
 * (this is the "one table, one row" shape that actually matches the data;
 * a per-prefix-group row split was considered and rejected - see the
 * translate-de skill and i18n/TRANSLATION.md for why).
 *
 * Because each "field" here is a whole dotted key rather than a short
 * per-row field name, a field is unique by construction, so there is no
 * risk of e.g. `nav.digitalTwins` (not a real key) being mistaken for the
 * unrelated, but similarly-suffixed, `tags.label.digitalTwins`.
 *
 * `orphaned` cannot be produced by this shape: there is only ever the one
 * synthetic row, and it always exists (it *is* the English source), so
 * the "row disappeared" case a data table can hit never applies here - a
 * stray key in ui.yml that ui.en.ts no longer has is exactly what
 * `unknown-field` already means once fields are full dotted keys.
 */
const UI_ROW_ID = '(ui.en.ts)';

export function auditUi(en: Record<string, string>, catalog: Record<string, CatalogEntry>, locale: string): Issue[] {
  // `rows = [{ id: UI_ROW_ID, ...en }]` spreads every flattened UI key onto
  // one object that also carries the synthetic row id under the same `id`
  // property auditTable() uses to identify the row. A UI key literally
  // named "id" would collide with it - silently, since object spread just
  // overwrites - and either misroute the whole row (id lost) or shadow that
  // one field's real English value (id kept), producing a confusing false
  // positive with no indication why. Refuse instead of guessing: no such
  // key exists today, so this only ever fires if one is added later, at
  // which point it needs a real decision (rename the UI key, or rename
  // UI_ROW_ID's carrier property), not a silently wrong audit.
  if (Object.hasOwn(en, 'id')) {
    throw new Error(
      'site/lib/i18n/ui.en.ts has a flattened key literally named "id", which ' +
        'collides with the synthetic row id auditUi() uses to audit it - rename ' +
        'that UI key, or rename UI_ROW_ID\'s carrier property in scripts/lib/i18n-check.ts.',
    );
  }
  const fields = Object.keys(en);
  const rows = [{ id: UI_ROW_ID, ...en }];
  const nested: Catalog = { [UI_ROW_ID]: catalog };
  return auditTable(rows, nested, fields, locale, 'ui');
}

export function formatIssues(issues: Issue[]): string {
  if (issues.length === 0) return 'i18n: every German catalog entry is up to date.';
  const byKind = new Map<Issue['kind'], Issue[]>();
  for (const issue of issues) byKind.set(issue.kind, [...(byKind.get(issue.kind) ?? []), issue]);
  const lines = [`i18n: ${issues.length} issue(s).`];
  for (const [kind, list] of byKind) {
    lines.push(`\n  ${kind} (${list.length}):`);
    for (const i of list) {
      // ui rows carry no meaningful id (see auditUi/UI_ROW_ID above) - the
      // dotted key in `field` already names the entry uniquely on its own.
      const locator = i.table === 'ui' ? i.field : `${i.id}.${i.field}`;
      lines.push(`    ${i.locale}/${i.table}/${locator}`);
    }
  }
  lines.push('\n  Run the translate-de skill to regenerate the affected entries.');
  return lines.join('\n');
}
