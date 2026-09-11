export interface SearchRecord { type: string; title: string; text: string; url: string }

/** icon per record type (Font Awesome 4 names, see site/icons) */
export const SEARCH_TYPE_ICONS: Record<string, string> = {
  Publication: 'file-pdf-o', Presentation: 'desktop', Poster: 'image', Abstract: 'file-text-o',
  Project: 'cogs', Software: 'code', Funding: 'money', 'Editorial role': 'pencil', News: 'newspaper-o',
  Meeting: 'users', Teaching: 'graduation-cap', Person: 'user', 'Research area': 'flask', Page: 'compass',
};

/** every token must appear; title-start 15, title 10, text 1; -1 when any token is missing */
export function scoreRecord(record: SearchRecord, tokens: string[]): number {
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
