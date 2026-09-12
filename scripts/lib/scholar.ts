/**
 * Fetching and parsing of a public Google Scholar profile page for the daily
 * `scholar.json` snapshot (`scripts/fetch-scholar.ts`).
 *
 * Scholar has no API, so the profile page is parsed. The parsing is regex-based
 * on the few stable ids and classes the page uses (`gsc_prf_in`, `gsc_rsb_st`,
 * `gsc_g_t`/`gsc_g_a`) — no HTML library, no dependency. Every part that is
 * missing throws with a precise message, so a layout change shows up in the
 * workflow log instead of silently writing zeros.
 *
 * `fetch` is injectable so the tests never touch the network, and the fixture
 * `tests/fixtures/scholar/profile.html` is a recorded copy of the real page.
 */
import { scholarProfileUrl, type HistoryPoint, type Metric, type Scholar, type YearCount } from '../../site/lib/scholarSchema.ts';

/** A browser-like identity; Scholar answers a bare script UA with a CAPTCHA. */
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0';
const TIMEOUT_MS = 30_000;
/** A bar sits 5 px right of its year label; half the 32 px year spacing is the tolerance. */
const BAR_OFFSET_PX = 5;
const BAR_TOLERANCE_PX = 16;

export interface ParsedProfile {
  name: string;
  /** The year of Scholar's "Since YYYY" column. */
  sinceYear: number;
  citations: Metric;
  hIndex: Metric;
  i10Index: Metric;
  /** Ascending by year; a year Scholar draws no bar for counts as 0. */
  citationsPerYear: YearCount[];
}

/** Public profile page of a Scholar user. */
export function profileUrl(userId: string): string {
  return scholarProfileUrl(userId);
}

/**
 * GETs the profile page. Throws with a message starting with `blocked` when
 * Google refuses (any non-200, a redirect into `/sorry/`, or the CAPTCHA form),
 * and with `no stats table` when the answer is not a profile page at all — the
 * caller must never write a snapshot from either.
 */
export async function fetchProfileHtml(userId: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  const url = profileUrl(userId);
  const res = await fetchImpl(url, {
    method: 'GET',
    headers: { 'user-agent': USER_AGENT, 'accept-language': 'en' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status !== 200) throw new Error(`blocked: HTTP ${res.status} for ${url}`);
  if (res.url?.includes('/sorry/')) throw new Error(`blocked: redirected to ${res.url}`);
  const html = await res.text();
  if (html.includes('id="gs_captcha_f"')) throw new Error(`blocked: Google served the CAPTCHA page for ${url}`);
  if (!html.includes('id="gsc_rsb_st"')) throw new Error(`no stats table (id="gsc_rsb_st") in ${url} — the page layout may have changed`);
  return html;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(text: string): string {
  return text.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) return String.fromCodePoint(parseInt(entity.slice(2), 16));
    if (entity.startsWith('#')) return String.fromCodePoint(Number(entity.slice(1)));
    return ENTITIES[entity] ?? match;
  });
}

function textOf(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

/** The `right:<n>px` of an inline style, used to line the histogram bars up with their labels. */
function rightPx(attributes: string): number | null {
  const match = /right:\s*(-?\d+(?:\.\d+)?)px/.exec(attributes);
  return match ? Number(match[1]) : null;
}

/** The three metric rows of the `gsc_rsb_st` table, keyed by their label. */
function parseMetrics(table: string): Record<string, Metric> {
  const metrics: Record<string, Metric> = {};
  for (const [, row] of table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const label = /<td class="gsc_rsb_sc1">([\s\S]*?)<\/td>/.exec(row);
    if (!label) continue;
    const values = [...row.matchAll(/<td class="gsc_rsb_std">\s*(-?\d+)\s*<\/td>/g)].map((m) => Number(m[1]));
    if (values.length < 2) continue;
    metrics[textOf(label[1]).toLowerCase()] = { all: values[0], since: values[1] };
  }
  return metrics;
}

function metric(metrics: Record<string, Metric>, label: string): Metric {
  const value = metrics[label];
  if (!value) throw new Error(`no "${label}" row in the Scholar stats table (found: ${Object.keys(metrics).join(', ') || 'nothing'})`);
  return value;
}

/**
 * The citations-per-year histogram: `gsc_g_t` year labels and `gsc_g_a` bars
 * carrying a `gsc_g_al` count. Normally there is one bar per label in the same
 * order, so they pair by index; when Scholar omits the bar of a year without
 * citations the lists differ in length, and the bars are then matched to the
 * labels by their `right:<n>px` position (a bar sits 5 px right of its label).
 */
function parseHistogram(html: string): YearCount[] {
  const labels = [...html.matchAll(/<span class="gsc_g_t"([^>]*)>\s*(\d{4})\s*<\/span>/g)].map((m) => ({
    year: Number(m[2]),
    right: rightPx(m[1]),
  }));
  if (!labels.length) throw new Error('no citations-per-year histogram (no gsc_g_t year labels) in the profile page');

  const bars = [...html.matchAll(/<a\b([^>]*class="gsc_g_a"[^>]*)>[\s\S]*?<span class="gsc_g_al">\s*(-?\d+)\s*<\/span>/g)].map((m) => ({
    count: Number(m[2]),
    right: rightPx(m[1]),
  }));

  if (bars.length === labels.length) {
    return labels.map((label, i) => ({ year: label.year, count: bars[i].count })).sort((a, b) => a.year - b.year);
  }

  const taken = new Set<number>();
  const rows = labels.map((label) => {
    let best = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    bars.forEach((bar, i) => {
      if (taken.has(i) || bar.right == null || label.right == null) return;
      const distance = Math.abs(bar.right - (label.right + BAR_OFFSET_PX));
      if (distance < bestDistance) {
        best = i;
        bestDistance = distance;
      }
    });
    if (best < 0 || bestDistance > BAR_TOLERANCE_PX) return { year: label.year, count: 0 };
    taken.add(best);
    return { year: label.year, count: bars[best].count };
  });
  return rows.sort((a, b) => a.year - b.year);
}

/** Parses a profile page into the numbers the snapshot carries. Pure. */
export function parseProfile(html: string): ParsedProfile {
  const table = /<table id="gsc_rsb_st">([\s\S]*?)<\/table>/.exec(html);
  if (!table) throw new Error('no stats table (id="gsc_rsb_st") in the profile page — the page layout may have changed');

  const name = /<div id="gsc_prf_in">([\s\S]*?)<\/div>/.exec(html);
  if (!name) throw new Error('no profile name (id="gsc_prf_in") in the profile page');

  const since = /<th class="gsc_rsb_sth">\s*Since\s+(\d{4})\s*<\/th>/.exec(table[1]);
  if (!since) throw new Error('no "Since YYYY" column header in the Scholar stats table');

  const metrics = parseMetrics(table[1]);
  return {
    name: textOf(name[1]),
    sinceYear: Number(since[1]),
    citations: metric(metrics, 'citations'),
    hIndex: metric(metrics, 'h-index'),
    i10Index: metric(metrics, 'i10-index'),
    citationsPerYear: parseHistogram(html),
  };
}

/**
 * Adds `point` to the accumulated history: at most one point per UTC day (a
 * second run the same day replaces the earlier one), ascending by date, never
 * dropping an older point.
 */
export function mergeHistory(previous: HistoryPoint[], point: HistoryPoint): HistoryPoint[] {
  return [...previous.filter((p) => p.date !== point.date), point].sort((a, b) => a.date.localeCompare(b.date));
}

/** The snapshot written to `scholar.json`, carrying the previous run's history forward. */
export function buildScholarSnapshot(parsed: ParsedProfile, previous: Scholar | null, now: Date, userId: string): Scholar {
  const point: HistoryPoint = {
    date: now.toISOString().slice(0, 10),
    citations: parsed.citations.all,
    hIndex: parsed.hIndex.all,
    i10Index: parsed.i10Index.all,
  };
  return {
    fetchedAt: now.toISOString(),
    profile: { userId, name: parsed.name, htmlUrl: profileUrl(userId) },
    sinceYear: parsed.sinceYear,
    citations: parsed.citations,
    hIndex: parsed.hIndex,
    i10Index: parsed.i10Index,
    citationsPerYear: parsed.citationsPerYear,
    history: mergeHistory(previous?.history ?? [], point),
  };
}
