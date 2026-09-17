/**
 * The six figures of the homepage's at-a-glance strip (`HomeStats.astro`).
 *
 * Pure and build-time only: the strip is static markup with no script and no
 * runtime fetch, so unlike the publications page's Scholar strip these numbers
 * are whatever the build saw. The daily scheduled build of `site.yml` is what
 * keeps them current (see CLAUDE.md, "Live GitHub and Scholar data").
 *
 * The inputs are structural, not the collection types: `publicationRows.ts`
 * does the same, and it keeps the unit test's fixtures to the fields that are
 * actually read.
 */
import { hasData } from './githubRows';
import type { TFn } from './i18n/catalog';
import { fmt } from './i18n/format';
import { url } from './url';

/** A `url()`-shaped path builder, e.g. `urlFor(locale)` for a locale-bound one. */
export type UrlBuilder = (path: string) => string;

/** Publication statuses that count as peer-reviewed for the site's own count. */
const PEER_REVIEWED = new Set(['publication', 'review', 'proceeding', 'chapter']);

/**
 * The site's own publication count: peer-reviewed entries of
 * `data/publications.yml` (theses, reports, preprints and abstracts excluded).
 * Shared by the homepage strip and the publications page's Scholar strip so
 * the two can never disagree.
 */
export function countPeerReviewed(publications: { status: string }[]): number {
  return publications.filter((p) => PEER_REVIEWED.has(p.status)).length;
}

/** One tile of the strip: a number, a label, an optional muted second line. */
export interface HomeFigure {
  id: string;
  value: number;
  label: string;
  sub?: string;
  href: string;
}

/** What `homeFigures` reads, per source. */
export interface HomeStatsInput {
  publications: { status: string }[];
  people: { status: string }[];
  software: unknown[];
  funding: unknown[];
  github: { fetchedAt: string; repos: Record<string, { stars: number }> };
  scholar: { fetchedAt: string; citations: { all: number }; hIndex: { all: number } };
}

/**
 * The strip in display order: publications, citations, h-index, team,
 * software, funded projects.
 *
 * A figure that comes from a snapshot the build could not read is left out
 * rather than shown as 0 — `emptyScholar()`/`emptySnapshot()` date themselves
 * to the epoch, which `hasData` detects. A 0 that comes from `data/*.yml` is a
 * real number and is shown.
 *
 * `buildUrl` defaults to the base-only `url()` (English); pass a locale-bound
 * builder (`urlFor(locale)`) so the German strip links into `/de/...` rather
 * than the English tree.
 */
export function homeFigures(input: HomeStatsInput, t: TFn, buildUrl: UrlBuilder = url): HomeFigure[] {
  const { publications, people, software, funding, github, scholar } = input;
  const scholarKnown = hasData(scholar.fetchedAt);
  const githubKnown = hasData(github.fetchedAt);
  const stars = Object.values(github.repos).reduce((sum, r) => sum + r.stars, 0);
  const alumni = people.filter((p) => p.status === 'alumni').length;

  const figures: (HomeFigure | null)[] = [
    { id: 'publications', value: countPeerReviewed(publications), label: t('nav.publications'), href: buildUrl('/publications/') },
    scholarKnown ? { id: 'citations', value: scholar.citations.all, label: t('scholar.citations'), href: buildUrl('/publications/#scholar') } : null,
    scholarKnown ? { id: 'h-index', value: scholar.hIndex.all, label: t('scholar.hIndex'), href: buildUrl('/publications/#scholar') } : null,
    {
      id: 'team',
      value: people.filter((p) => p.status === 'current').length,
      label: t('home.teamMembers'),
      sub: fmt(t('home.alumniCount'), { count: alumni }),
      href: buildUrl('/people/'),
    },
    {
      id: 'software',
      value: software.length,
      label: t('home.softwarePackages'),
      ...(githubKnown ? { sub: fmt(stars === 1 ? t('home.starOne') : t('home.starOther'), { count: stars }) } : {}),
      href: buildUrl('/research/#software'),
    },
    { id: 'funding', value: funding.length, label: t('home.fundedProjects'), href: buildUrl('/research/#funding') },
  ];
  return figures.filter((f): f is HomeFigure => f !== null);
}
