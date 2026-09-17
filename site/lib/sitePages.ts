import type { TFn } from './i18n/catalog';

/**
 * The site's static pages with a one-line description each — the records
 * the site search indexes as "Page" (`search.json.ts`) and the page list of
 * `/llms.txt` (`llms.ts`). Paths are site paths without the base; callers
 * pass them through `url()`/`urlFor(locale)` or an absolute-URL builder.
 * `legal` marks the Impressum and privacy pages, which `llms.txt` lists as
 * optional.
 *
 * `search.json.ts` is under `[...locale]` and calls this once per locale
 * with that locale's translator, so its titles/descriptions come out in the
 * page's own language; `llms.ts`'s endpoints are single global files, not
 * localised (see CLAUDE.md), so they always pass the English translator.
 * `sitePages()` takes `t` either way, rather than a hardcoded list, so these
 * strings stay in the one catalog instead of a second, independently
 * maintained copy.
 */
export interface SitePage {
  title: string;
  description: string;
  path: string;
  legal?: boolean;
}

export function sitePages(t: TFn): SitePage[] {
  return [
    { title: t('nav.team'), description: t('sitePages.team'), path: '/people/' },
    { title: t('nav.openPositions'), description: t('sitePages.openPositions'), path: '/people/#open-positions' },
    { title: t('nav.research'), description: t('sitePages.research'), path: '/research/' },
    { title: t('nav.projects'), description: t('sitePages.projects'), path: '/projects/' },
    { title: t('nav.publications'), description: t('sitePages.publications'), path: '/publications/' },
    { title: t('nav.network'), description: t('sitePages.network'), path: '/network/' },
    { title: t('nav.news'), description: t('sitePages.news'), path: '/news/' },
    { title: t('nav.meetings'), description: t('sitePages.meetings'), path: '/meetings/' },
    { title: t('nav.teaching'), description: t('sitePages.teaching'), path: '/teaching/' },
    { title: t('footer.impressum'), description: t('sitePages.impressum'), path: '/impressum/', legal: true },
    { title: t('footer.privacy'), description: t('sitePages.privacy'), path: '/privacy/', legal: true },
  ];
}
