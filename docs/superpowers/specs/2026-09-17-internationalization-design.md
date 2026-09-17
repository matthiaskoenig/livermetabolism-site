# Internationalization (EN/DE): design

Date: 2026-09-17
Status: approved
Issue: #63

## Goal

Serve the site in US English (default) and German, with a switch in the site chrome. English is the authored language for everything except the two legal pages, which stay German-authored because the German text is the legally binding one. German content is generated, committed, and never hand-edited. Both languages appear in `/llms.txt` and `/llms-full.txt` so agents find either.

## Decisions

| Topic | Decision |
|---|---|
| Locales | `en` (default, US English) and `de`. Astro's built-in i18n: `i18n: { locales: ['en', 'de'], defaultLocale: 'en', routing: { prefixDefaultLocale: false } }`. |
| URLs | English unprefixed (`/publications/`), German prefixed (`/de/publications/`). `trailingSlash: 'always'` as today. |
| Page sources | One source file per page, not one per language. The 13 pages and the detail route move under `site/pages/[...locale]/`; each exports `getStaticPaths = localePaths`, which yields `{ locale: undefined }` and `{ locale: 'de' }`. `404.astro` stays at the root (a static host serves exactly one). Verified against Astro 7.3.2 with a throwaway route before this spec was written: `[...locale]/index.astro` emits `/` and `/de/`, `[...locale]/probe.astro` emits `/probe/` and `/de/probe/`. |
| Translation scope | UI chrome plus the group's own descriptive prose (tags, people, projects, software, funding, news, teaching, meetings, editors, activities). Bibliographic records keep their English text: `publications`, `posters`, `presentations`, `abstracts` and `panels` titles, abstracts, authors, journals and event names. A paper's title is its citation identity; a German rendering of it matches nothing in the literature. |
| DE storage | Translation catalogs under `i18n/de/`, holding only translated fields keyed by row id, each with the sha of its English source. Structural data (ids, DOIs, dates, image paths, reference lists) exists once, in `data/*.yml`, and is never duplicated. |
| Generation | A Claude Code skill (`.claude/skills/translate-de/`), not an API script. Guided by `i18n/TRANSLATION.md`. |
| Drift guard | `npm run i18n:check`, no network: recomputes each English source sha and compares it to the catalog, reporting stale, missing and orphaned entries. Runs in CI, so a PR that edits English prose without regenerating German fails. |
| Missing DE | Falls back to the English string silently at build time (translation lags by design) and is reported by `i18n:check`. Never renders an empty string or a key. |
| Switcher | Swaps to the same path in the other language, preserving path and `#hash`. No stored preference, no `Accept-Language` detection, no redirect. `/` is always English. |
| Legal pages | `impressum` and `privacy` are German-authored; their English rendering is the generated side, and carries a line stating that only the German version is legally binding. |
| LLM files | One `/llms.txt` and one `/llms-full.txt`, each carrying both languages. `/robots.txt` and `/site.webmanifest` stay single, at the root. |
| Python tooling | Untouched. `src/data.py`, the pydantic model and the CV generators stay English-only; `data/*.yml` keeps its current shape. |
| Release | 0.11.0, with `release-notes/0.11.0.md`. |

## Locale plumbing

`site/lib/i18n/` is the new module. It is pure TypeScript with no Astro or Vue imports, in the style of `details.ts` and `graphRows.ts`, so it is unit-testable and safe to import from the browser-side chrome.

```ts
// site/lib/i18n/locales.ts  (leaf module, importable from site chrome)
export type Locale = 'en' | 'de';
export const LOCALES = ['en', 'de'] as const;
export const DEFAULT_LOCALE: Locale = 'en';
```

It is a separate leaf module for the same reason `detailTypes.ts` is: the browser-side detail router and the network island need the locale names, and importing them from the build-time catalog loader would drag YAML and the whole content layer into the chrome bundle.

```ts
// site/lib/i18n/routes.ts
localePaths(): { params: { locale: string | undefined } }[]   // getStaticPaths for every page
localeFromParams(params): Locale                              // '' | undefined -> 'en'
localeUrl(locale: Locale, path: string): string               // base + locale prefix + path
switchPath(locale: Locale, pathname: string): string          // the other language's path for this URL
```

`url()` and `asset()` in `site/lib/url.ts` stay exactly as they are: base-aware, locale-unaware. Assets are shared between languages and must not gain a locale prefix. Internal page links go through a locale-bound helper that each page builds once from its own locale. This keeps the change explicit at every call site rather than hiding a locale in a global.

Browser-side code reads the locale from `document.documentElement.lang` rather than a new `data-` attribute, since `Base.astro` sets it anyway. That covers `detailModal.ts` (which fetches `${base}detail/<type>/<id>/` and must fetch `${base}de/detail/...` on a German page) and the search dialog.

## UI strings

`site/lib/i18n/ui.en.ts` is the typed source catalog for the roughly 500 chrome strings the inventory found across `site/pages/`, `site/components/` and `site/lib/`:

```ts
export const en = {
  nav: { publications: 'Publications', projects: 'Projects', /* ... */ },
  search: { placeholder: 'Search publications, people, projects, software, news, ...',
            empty: 'No results for “{query}”.' },
  gh: { stars: 'Stars', issues: 'Open issues', release: 'Release {tag} · {date}' },
  // ...
} as const;

export type UiKey = /* dotted leaf paths of typeof en */;
```

`i18n/de/ui.yml` carries the German side, keyed identically. `site/lib/i18n/index.ts` loads it at build time and validates it against the English key set, so a missing or unknown key **fails the build** with a precise message; `UiKey` being derived from `en` also makes a typo in a `t()` call a type error under `astro check`. Interpolation is `{name}` placeholders. Plurals get explicit `.one` / `.other` keys rather than a plural library, since German and English share the same two-form system.

Components receive a plain **serialisable `strings` object**, never a `t` function. One uniform rule covers the statically rendered cards and the hydrated islands alike, and per-component typed slices (`site/lib/i18n/slices.ts`) keep the island props minimal, honouring the existing rule that no record is serialised twice into `astro-island` props.

```astro
---
const locale = localeFromParams(Astro.params);
const ui = uiFor(locale);
---
<SoftwareCard item={item} strings={ui.softwareCard} />
```

### Duplication collapsed while extracting

The inventory found four strings that exist twice in the source. Each would become two independently translated keys that can drift apart in German, so they are unified as part of the extraction:

| Duplicate | Resolution |
|---|---|
| `MONTHS` in `githubRows.ts` and `chartOptions.ts` | One locale-aware month list in `site/lib/i18n/dates.ts`. |
| Search hint in `SiteSearch.astro` markup and its `HINT` const | One key, read by both. |
| Network description in `network.astro` and `NetworkGraph.vue`'s figcaption | One key, passed to the island. |
| `Release {tag} · {date}` / `Releases` in `SoftwareCard.vue` and `githubStats.ts` | One key, shared by the build render and the live DOM patch. |

## Data overlay

`site/lib/i18n/fields.ts` is the single registry of which `<table>.<field>` is translatable:

```ts
export const TRANSLATABLE = {
  tags: ['short_description', 'description', 'vision'],
  people: ['description', 'role'],
  projects: ['title', 'abstract', 'image_title'],
  software: ['title', 'description'],
  editors: ['description'],
  funding: ['title', 'description'],
  news: ['title', 'short', 'abstract'],
  teaching: ['title', 'content', 'caption', 'funding'],
  meetings: ['title', 'description'],
  activities: ['title', 'description'],
} as const;
```

It is read by the overlay, by `i18n:check` and by the translation skill, so the three can never disagree about what is translatable.

`tags.tag` is deliberately absent: it is a reference key, a slug, a chart series name and a filter value all at once. Only its display label may be German, which is handled by a separate `tags.label` key in the UI catalog keyed by tag slug, leaving every id untouched.

The overlay applies inside `all()` in `site/lib/data.ts`, the one choke point every getter already goes through:

```ts
async function all<K>(key: K, locale: Locale): Promise<Entry<CollectionData[K]>[]>
export const getPeople = (locale: Locale) => all('people', locale);
```

Because list pages, detail fragments, the search index and the LLM files all read through these getters, German reaches every surface without a second code path.

A catalog file is one YAML document per table, keyed by row id:

```yaml
# i18n/de/people.yml
# AUTO-GENERATED by .claude/skills/translate-de. Do not edit by hand.
koenig:
  description:
    sha: a1b2c3d4e5f6a7b8
    text: 'Matthias König leitet die Arbeitsgruppe ...'
  role:
    sha: e5f6a7b8c9d0e1f2
    text: ['Gruppenleiter']
```

`sha` is the first 16 hex characters of the sha256 of the exact English source value (a list field is hashed as its JSON form), which is enough to detect an edit and short enough to keep the diffs readable.

Long-form page prose that lives in a page rather than in `data/` (the homepage vision statements, the open-positions blurbs, the teaching intro, the research funding acknowledgement) goes into `i18n/<locale>/pages/<page>.yml` under the same format, with `i18n/en/pages/` as the source for all pages except the two legal ones.

## Legal pages

`impressum` and `privacy` invert the direction: `i18n/de/pages/impressum.yml` and `privacy.yml` are the **source**, and `i18n/en/pages/` holds the generated English. The direction is declared per file in the catalog header so `i18n:check` hashes the right side:

```yaml
# i18n/de/pages/impressum.yml
# SOURCE. Authored in German; the English rendering is generated from this file.
```

The generated English rendering appends a fixed sentence: only the German version is legally binding. This is standard practice for a German Impressum and keeps the English page from reading as an independent legal claim.

## Translation guide and workflow

`i18n/TRANSLATION.md` is the information sheet the skill reads. It contains the EN to DE glossary for the domain vocabulary, and the corner-case rules:

- **Tag names are ids.** Never translate the key; only its display label.
- **HTML-bearing fields keep their markup byte-identical.** Translate text nodes only, never an attribute. Applies to `news.abstract` (12 rows), `news.short` (2), `people.description` (7) and all of `teaching.content`, `teaching.caption`, `teaching.funding`.
- **Bibliographic fields are out of scope** and must not appear in a catalog.
- **`{placeholders}` survive verbatim**, including their position relative to the surrounding words.
- German conventions: formal `Sie`, German quotation marks, official university role names (`Wissenschaftliche Mitarbeiterin`, `Bachelorarbeit`, `Masterarbeit`), institution and funder names verbatim (`Humboldt-Universität zu Berlin`, `BMFTR`). `people.role` already holds German values such as `Technische Assistentin (TA)` for some rows.
- Source variant is US English; `-ize`, `color`, `center`.
- Dates: `date_display` in the data holds English formatting (`October 20 - 23, 2025`). It stays English in the data and is reformatted for display by `site/lib/i18n/dates.ts`, not translated in a catalog.

`data/teaching.yml`'s `title_german` already holds hand-written German for all 10 rows and is currently rendered nowhere. It seeds `i18n/de/teaching.yml`, after which the field is removed from `data/teaching.yml`, `site/lib/schemas.ts` and `src/data.py`, so there is one place German lives.

The skill's loop: run `npm run i18n:check`, translate only the entries it lists, write the catalogs with fresh shas, re-run until clean, then `npm test` and `npm run build`.

## LLM files

`llmsTxt()` and `llmsFullTxt()` in `site/lib/llms.ts` gain a locale loop. `/llms-full.txt` emits the English document, then a `## Deutsch` half rendering the same sections from the German getters with `/de/` URLs. `/llms.txt` lists both halves and both language homepages, and keeps the `## Optional` section last per the llmstxt.org format. Every link stays absolute, and data HTML keeps going through `plainText()`.

`/search.json` becomes per-locale (`/search.json` and `/de/search.json`), since the search dialog is client-side and a German page must score German text. The 14 record type labels come from the UI catalog. `robots.txt` gains the `/de/detail/` disallow beside the existing `/detail/`.

## Head, sitemap, and the switcher

`Base.astro` takes a `locale` prop and renders `<html lang={locale}>`. `Head.astro` emits the alternates:

```html
<link rel="alternate" hreflang="en-US" href="…/publications/" />
<link rel="alternate" hreflang="de-DE" href="…/de/publications/" />
<link rel="alternate" hreflang="x-default" href="…/publications/" />
```

`@astrojs/sitemap` gets its `i18n` option (`defaultLocale: 'en'`, `locales: { en: 'en-US', de: 'de-DE' }`) so the sitemap carries the same alternates, with the existing `/detail/` filter extended to `/de/detail/`.

The switcher is a two-link control in `.navbar-controls` beside the search toggle, static markup with no island: each language is a real `<a href>` to `switchPath()` of the current path, with the current one marked `aria-current="true"`. A small bundled script re-appends `location.hash` on click so an open detail modal survives the switch. Because both are real links, the control works without JavaScript and middle-clicks like a link.

## Testing

**Vitest.** `localePaths`/`localeUrl`/`switchPath` including the base path and the hash; key parity between `ui.en.ts` and `i18n/de/ui.yml`; interpolation, including a missing placeholder; the overlay, including English fallback for a missing entry; the sha helper and the stale/missing/orphaned classification of `i18n:check`; `fields.ts` covering every prose field the pages actually render; bilingual `llmsTxt`/`llmsFullTxt` output; per-locale `search.json` shape; date formatting in both locales.

**Real-data tests**, in the style of the existing cross-reference validators: every catalog id resolves to a live row in its table, no catalog names a field outside `TRANSLATABLE`, no orphaned entries, and no bibliographic field appears in any catalog.

**Playwright.** The switch preserves path and `#hash`, with an open detail modal surviving it; `/de/` serves `lang="de"` and German chrome; a publication title is still English on `/de/publications/`; `hreflang` alternates are present and point at existing pages; `/de/` detail fragments load in the modal; zero console errors on every page in both languages.

**CI.** `npm run i18n:check` joins the `build` job in `.github/workflows/site.yml`, before `astro build`.

## Rollout

Six pull requests, each shippable on its own:

1. **Routing and switcher.** Astro i18n config, the `[...locale]` restructure, `Base`/`Head` locale plumbing, the switcher, hreflang and sitemap alternates. German falls back to English everywhere, so `/de/` exists and is fully navigable in English.
2. **UI string extraction.** The roughly 500 strings move into `ui.en.ts` with typed keys, and the four duplicates collapse. No behaviour change, verified by the e2e suite and by diffing the built HTML against the previous build.
3. **Data overlay.** `fields.ts`, the catalog loader, `all()` taking a locale, per-locale `search.json`.
4. **Guide, skill, and first generation.** `i18n/TRANSLATION.md`, `.claude/skills/translate-de/`, `npm run i18n:check` in CI, and the first full German catalog set. `teaching.title_german` is retired here.
5. **Legal pages.** The two German-authored pages move into catalogs and gain generated English renderings.
6. **LLM files.** Bilingual `llms.txt` and `llms-full.txt`, and the `robots.txt` update.

## Risks

- **Phase 2 is a large mechanical diff** across roughly 45 files. Mitigated by having no behaviour change in that PR: the e2e suite and a built-HTML diff must both come back clean.
- **The `[...locale]` restructure moves every page at once.** Git will render these as renames; reviewers should read the PR with rename detection on.
- **Translation is agent-driven, so German lags English by construction.** `i18n:check` in CI makes the lag visible and blocks a merge that widens it silently, and the English fallback means a lagging entry degrades to English rather than to nothing.
- **A generated German file edited by hand is silently overwritten** on the next run. Every catalog carries an `AUTO-GENERATED` header, and the repository's own convention already forbids editing generated files.
