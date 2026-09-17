/**
 * Pure projection of `data/publications.yml` into the stacked bars of the
 * publications-over-time chart: one bar per year, split either by research
 * area (`tags.yml`) or by publication status.
 *
 * Free of DOM, Vue and ECharts imports, like `githubRows.ts` and
 * `scholarRows.ts`. Unlike those two this has no live part at all: the chart
 * is computed once in `publications.astro`'s frontmatter and handed to the
 * island as props (the numbers only change when the YAML does, i.e. on a
 * rebuild), so nothing here ever runs in the browser.
 */
import type { TFn } from './i18n/catalog';
import type { UiKey } from './i18n/ui.en';
import type { PublicationData } from './schemas';
import type { TagInfo } from './views';

/** The publication fields the chart needs. */
export type ChartPublication = Pick<PublicationData, 'year' | 'status' | 'tags'>;

/** The tag fields the chart needs (label plus the slug that picks the colour). */
export type ChartTag = Pick<TagInfo, 'tag' | 'slug'>;

/** One stacked series of the research-area split. */
export interface TagSeries { tag: string; slug: string; counts: number[] }

/** One stacked series of the status split. */
export interface StatusSeries { status: ChartPublication['status']; counts: number[] }

/** Years plus both splits; every `counts` array is aligned with `years`. */
export interface PublicationYearRows {
  years: number[];
  byTag: TagSeries[];
  byStatus: StatusSeries[];
}

/**
 * The stacking order of the status split, most to least prominent (the same
 * idea as the `.status-*` badges in global.css, where `publication` is the
 * solid one). It also fixes each status' colour: `chartOptions.ts` takes the
 * palette entry at the status' index here, so a status missing from the data
 * does not shift the colours of the others.
 */
export const STATUS_ORDER = ['publication', 'review', 'proceeding', 'chapter', 'preprint', 'abstract', 'thesis', 'report'] as const;

/**
 * The display label of a publication status - `status` itself is a machine
 * value (a lookup key and a `.status-{status}` CSS class, see `PublicationRow.vue`
 * and `details.ts`) and is never translated on its own; only this label is.
 * Shared so the chart legend (`chartOptions.ts`) and the detail badge
 * (`details.ts`) can never drift apart.
 */
const STATUS_KEY: Record<ChartPublication['status'], UiKey> = {
  publication: 'status.publication', review: 'status.review', proceeding: 'status.proceeding',
  chapter: 'status.chapter', preprint: 'status.preprint', abstract: 'status.abstract',
  thesis: 'status.thesis', report: 'status.report',
};

export function publicationStatusLabel(status: ChartPublication['status'], t: TFn): string {
  return t(STATUS_KEY[status]);
}

const zeros = (n: number) => Array.from({ length: n }, () => 0);

/**
 * Papers per year, stacked by research area and by status.
 *
 * `years` runs from the earliest to the latest publication year without gaps,
 * so an empty year is drawn as an empty slot rather than skipped. A paper with
 * several research areas is counted once per area (the page says so in the
 * chart caption), which makes the tag totals larger than the number of papers;
 * the status totals are exactly the number of papers. Series that would be all
 * zeros — a tag no paper carries, a status no paper has — are left out, so the
 * legend only lists what is actually drawn.
 */
export function publicationsPerYear(publications: ChartPublication[], tags: ChartTag[]): PublicationYearRows {
  if (publications.length === 0) return { years: [], byTag: [], byStatus: [] };

  const min = Math.min(...publications.map((p) => p.year));
  const max = Math.max(...publications.map((p) => p.year));
  const years = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const slot = (year: number) => year - min;

  const byTag = tags.map((t) => ({ tag: t.tag, slug: t.slug, counts: zeros(years.length) }));
  const tagIndex = new Map(byTag.map((s, i) => [s.tag, i]));
  const byStatus = STATUS_ORDER.map((status) => ({ status, counts: zeros(years.length) }));
  const statusIndex = new Map(byStatus.map((s, i) => [s.status as string, i]));

  for (const p of publications) {
    const at = slot(p.year);
    for (const tag of p.tags) {
      const i = tagIndex.get(tag);
      // a tag that is not in tags.yml cannot happen (both schemas reject it)
      if (i !== undefined) byTag[i]!.counts[at]! += 1;
    }
    const s = statusIndex.get(p.status);
    if (s !== undefined) byStatus[s]!.counts[at]! += 1;
  }

  const used = <T extends { counts: number[] }>(series: T[]) => series.filter((s) => s.counts.some((c) => c > 0));
  return { years, byTag: used(byTag), byStatus: used(byStatus) };
}
