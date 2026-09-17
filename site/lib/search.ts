/** `kind` is a stable machine slug, never translated; `type` is the display label, which is. */
export interface SearchRecord { kind: string; type: string; title: string; text: string; url: string }

/** icon per record kind (Font Awesome 4 names, see site/icons). Keyed by the
 *  stable slug, never by the display label, which is translated. */
export const SEARCH_TYPE_ICONS: Record<string, string> = {
  publication: 'file-pdf-o', presentation: 'desktop', poster: 'image', abstract: 'file-text-o',
  project: 'cogs', software: 'code', funding: 'money', editorialRole: 'pencil', news: 'newspaper-o',
  meeting: 'users', teaching: 'graduation-cap', person: 'user', researchArea: 'flask', page: 'compass',
};

/** every token must appear; title-start 15, title 10, text 1; -1 when any token is missing */
function scoreRecord(record: SearchRecord, tokens: string[]): number {
  const title = record.title.toLowerCase();
  const text = record.text.toLowerCase();
  let total = 0;
  for (const token of tokens) {
    if (title.startsWith(token)) total += 15;
    else if (title.includes(token)) total += 10;
    else if (text.includes(token)) total += 1;
    else return -1;
  }
  return total;
}

export function rankRecords(records: SearchRecord[], query: string, limit = 30): SearchRecord[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  return records
    .map((record) => ({ record, score: scoreRecord(record, tokens) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.record);
}
