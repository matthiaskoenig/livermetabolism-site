# Internationalization (EN/DE) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the site in US English (default, unprefixed) and German (`/de/`), with a switch in the navbar, where German content is generated into commit-tracked catalogs and never hand-edited.

**Architecture:** Astro's built-in i18n with one source file per page under `site/pages/[...locale]/`, so both languages render from the same template. UI strings move into a typed English catalog (`site/lib/i18n/ui.en.ts`) whose key union is derived by the type system, making a missing German key a compile error. Prose in `data/*.yml` is overlaid at the single choke point `all()` in `site/lib/data.ts` by translation catalogs under `i18n/de/` that store only translated fields plus a hash of their English source.

**Tech Stack:** Astro 7.3.2 (static output), Vue 3 (statically rendered plus a few islands), TypeScript, Tailwind v4, js-yaml, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-17-internationalization-design.md`

## Global Constraints

- **Never use the em dash.** Use a plain dash `-`. Applies to code, comments, commit messages, docs and all English copy. (German copy uses German typography; see the guide in Task 14.)
- **Never add an agent name as commit co-author.** Commit with `--author="matthiaskoenig <konigmatt@googlemail.com>"`; never edit git config.
- Locales are exactly `en` (default, **US** English) and `de`. English is unprefixed, German is `/de/`-prefixed.
- `trailingSlash: 'always'` stays. Every internal link keeps going through a base-aware helper; never hand-write a root-relative `href`/`src`.
- `data/*.yml`, `src/data.py`, `site/lib/schemas.ts` and the Typst CV tooling stay English-only, with the single exception of removing the retired `title_german` field in Task 16.
- Bibliographic fields must never appear in a translation catalog: `publications`, `posters`, `presentations`, `abstracts` and `panels` titles, abstracts, authors, journals and event names stay English.
- Assets are shared between languages and never get a locale prefix. `url()` and `asset()` in `site/lib/url.ts` stay base-aware and locale-unaware.
- No new third-party host. Any new one must be added to `astro.config.mjs`'s CSP `directives`. Never add `'unsafe-inline'` to `script-src` or `style-src`.
- Never write the literal text `<script>` or `<style>` inside an `.astro` file's frontmatter or template comments (Vite's dependency scanner regex trips on it and breaks the dev server).
- After any manual edit to `data/*.yml`, run `uv run python -m src.data`.
- Visibility is toggled with the `hidden` attribute, never an inline `display`.
- Run `npm run check && npm test` before every commit. Phases 1 and 2 must additionally leave `npm run e2e` green.

---

## File Structure

**New module `site/lib/i18n/` (pure TypeScript, no Astro or Vue imports, each with a co-located `*.test.ts`):**

| File | Responsibility |
|---|---|
| `locales.ts` | Leaf module: `Locale`, `LOCALES`, `DEFAULT_LOCALE`, `isLocale`. Importable from browser-side chrome without dragging in YAML. |
| `format.ts` | Leaf module: `fmt(template, vars)` placeholder interpolation. Browser-safe. |
| `routes.ts` | `localePaths`, `localeFromParams`, `localeUrl`, `stripLocale`, `switchPath`, `urlFor`. |
| `ui.en.ts` | The English UI catalog (nested `as const` object) and the derived `UiKey` type. |
| `catalog.ts` | Build-time loader: `flatten`, `EN_FLAT`, `loadUi`, `uiFor`. Validates German key parity, throws on mismatch. |
| `slices.ts` | `slices(t)`: per-component serialisable string bundles, and the `UiSlices` type. |
| `fields.ts` | `TRANSLATABLE`: the one registry of which `<table>.<field>` is translatable. |
| `sha.ts` | `sourceSha(value)`: first 16 hex chars of sha256 of the English source. |
| `content.ts` | `loadCatalog(locale, table)`, `localize(rows, catalog, fields)`. |
| `dates.ts` | Locale-aware `MONTHS` and date formatting, replacing the two duplicated month arrays. |

**New content tree (generated, never hand-edited except the two legal sources):**

```
i18n/
  TRANSLATION.md          the guide the skill reads
  de/ui.yml               ~500 UI strings, flat dotted keys
  de/<table>.yml          one per translatable table
  de/pages/<page>.yml     long-form page prose
  de/pages/impressum.yml  SOURCE (German-authored)
  de/pages/privacy.yml    SOURCE (German-authored)
  en/pages/<page>.yml     SOURCE for every page except the two legal ones
  en/pages/impressum.yml  generated from the German source
  en/pages/privacy.yml    generated from the German source
```

**Moved:** the 13 `.astro` pages and `detail/[type]/[id].astro` move under `site/pages/[...locale]/`. `404.astro` stays at the root.

**New:** `site/components/LanguageSwitch.astro`, `scripts/i18n-check.ts`, `scripts/lib/i18n-check.ts` (+ test), `.claude/skills/translate-de/SKILL.md`.

---

# Phase 1: Routing and switcher

Ships `/de/` as a fully navigable mirror rendering English text. No translation yet.

### Task 1: Locale primitives

**Files:**
- Create: `site/lib/i18n/locales.ts`, `site/lib/i18n/locales.test.ts`
- Create: `site/lib/i18n/routes.ts`, `site/lib/i18n/routes.test.ts`

**Interfaces:**
- Consumes: `url()` from `site/lib/url.ts`.
- Produces: `type Locale = 'en' | 'de'`; `LOCALES: readonly Locale[]`; `DEFAULT_LOCALE: Locale`; `isLocale(v: unknown): v is Locale`; `localePaths(): { params: { locale: string | undefined } }[]`; `localeFromParams(params: { locale?: string }): Locale`; `localeUrl(locale: Locale, path: string): string`; `stripLocale(pathname: string): { locale: Locale; path: string }`; `switchPath(locale: Locale, pathname: string): string`; `urlFor(locale: Locale): (path: string) => string`.

- [ ] **Step 1: Write the failing tests**

Create `site/lib/i18n/locales.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_LOCALE, isLocale, LOCALES } from './locales';

describe('locales', () => {
  it('lists English first and German second', () => {
    expect(LOCALES).toEqual(['en', 'de']);
  });
  it('defaults to English', () => {
    expect(DEFAULT_LOCALE).toBe('en');
  });
  it('accepts a known locale', () => {
    expect(isLocale('de')).toBe(true);
  });
  it('rejects an unknown locale', () => {
    expect(isLocale('fr')).toBe(false);
  });
  it('rejects a non-string', () => {
    expect(isLocale(undefined)).toBe(false);
  });
});
```

Create `site/lib/i18n/routes.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { localeFromParams, localePaths, localeUrl, stripLocale, switchPath, urlFor } from './routes';

describe('localePaths', () => {
  it('yields undefined for the default locale and the code for the others', () => {
    expect(localePaths()).toEqual([{ params: { locale: undefined } }, { params: { locale: 'de' } }]);
  });
});

describe('localeFromParams', () => {
  it('reads a prefixed locale', () => {
    expect(localeFromParams({ locale: 'de' })).toBe('de');
  });
  it('treats a missing param as the default locale', () => {
    expect(localeFromParams({})).toBe('en');
  });
  it('treats an unknown param as the default locale', () => {
    expect(localeFromParams({ locale: 'fr' })).toBe('en');
  });
});

describe('localeUrl', () => {
  it('leaves the default locale unprefixed', () => {
    expect(localeUrl('en', '/publications/')).toBe('/publications/');
  });
  it('prefixes a non-default locale', () => {
    expect(localeUrl('de', '/publications/')).toBe('/de/publications/');
  });
  it('builds the German homepage', () => {
    expect(localeUrl('de', '/')).toBe('/de/');
  });
  it('accepts a path without a leading slash', () => {
    expect(localeUrl('de', 'news/')).toBe('/de/news/');
  });
});

describe('stripLocale', () => {
  it('reads English from an unprefixed path', () => {
    expect(stripLocale('/publications/')).toEqual({ locale: 'en', path: '/publications/' });
  });
  it('reads German from a prefixed path', () => {
    expect(stripLocale('/de/publications/')).toEqual({ locale: 'de', path: '/publications/' });
  });
  it('reads the German homepage', () => {
    expect(stripLocale('/de/')).toEqual({ locale: 'de', path: '/' });
  });
  it('reads the German homepage without a trailing slash', () => {
    expect(stripLocale('/de')).toEqual({ locale: 'de', path: '/' });
  });
  it('does not mistake a page whose name starts with the locale code', () => {
    expect(stripLocale('/design/')).toEqual({ locale: 'en', path: '/design/' });
  });
});

describe('switchPath', () => {
  it('switches English to German', () => {
    expect(switchPath('de', '/publications/')).toBe('/de/publications/');
  });
  it('switches German back to English', () => {
    expect(switchPath('en', '/de/publications/')).toBe('/publications/');
  });
  it('is idempotent for the locale already in the path', () => {
    expect(switchPath('de', '/de/news/')).toBe('/de/news/');
  });
});

describe('urlFor', () => {
  it('binds a locale', () => {
    expect(urlFor('de')('/people/')).toBe('/de/people/');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run site/lib/i18n/`
Expected: FAIL, "Failed to resolve import './locales'".

- [ ] **Step 3: Write the implementation**

Create `site/lib/i18n/locales.ts`:

```ts
/**
 * The locale names, in one leaf module with no dependencies: the
 * browser-side chrome (the detail router, the search dialog) needs them,
 * and importing them from catalog.ts would drag js-yaml and the build-time
 * catalogs into the site chrome bundle. Same reasoning as detailTypes.ts.
 */
export type Locale = 'en' | 'de';

/** Display order of the language switch; the default locale comes first. */
export const LOCALES = ['en', 'de'] as const satisfies readonly Locale[];

/** US English. Rendered unprefixed, at the root of the site. */
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
```

Create `site/lib/i18n/routes.ts`:

```ts
import { url } from '../url';
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from './locales';

// Same derivation as url.ts: "/" locally, "/livermetabolism-site/" on the
// interim GitHub Pages URL. Stripped of its trailing slash so it can be
// sliced off a pathname.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * getStaticPaths for every page under site/pages/[...locale]/. The default
 * locale maps to an undefined rest param, which Astro renders at the root
 * ("/publications/"); every other locale renders under its own prefix
 * ("/de/publications/"). Verified against Astro 7.3.2.
 */
export function localePaths(): { params: { locale: string | undefined } }[] {
  return LOCALES.map((locale) => ({ params: { locale: locale === DEFAULT_LOCALE ? undefined : locale } }));
}

/** The locale of the page being rendered; anything unknown is the default. */
export function localeFromParams(params: { locale?: string }): Locale {
  return isLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
}

/** `localeUrl('de', '/people/')` -> `/de/people/` (+ base). */
export function localeUrl(locale: Locale, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? url(p) : url(`/${locale}${p}`);
}

/**
 * Split a pathname (which may carry the deploy's base) into its locale and
 * the locale-free path. A path is only treated as prefixed when the segment
 * matches exactly, so a page called "/design/" is not read as German.
 */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  let p = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  if (!p.startsWith('/')) p = `/${p}`;
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    if (p === `/${locale}` || p.startsWith(`/${locale}/`)) {
      return { locale, path: p.slice(locale.length + 1) || '/' };
    }
  }
  return { locale: DEFAULT_LOCALE, path: p };
}

/** The same page in another language, for the language switch. */
export function switchPath(locale: Locale, pathname: string): string {
  return localeUrl(locale, stripLocale(pathname).path);
}

/** A locale-bound `url()`, built once per page. */
export function urlFor(locale: Locale): (path: string) => string {
  return (path: string) => localeUrl(locale, path);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run site/lib/i18n/`
Expected: PASS, 21 tests.

- [ ] **Step 5: Commit**

```bash
git add site/lib/i18n/
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Add locale primitives and locale-aware route helpers"
```

---

### Task 2: Astro i18n config and the `[...locale]` restructure

**Files:**
- Modify: `astro.config.mjs` (add the `i18n` block, extend the sitemap filter)
- Move: the 13 `site/pages/*.astro` except `404.astro`, plus `site/pages/detail/[type]/[id].astro`, into `site/pages/[...locale]/`
- Modify: `site/layouts/Base.astro`, `site/components/Head.astro`

**Interfaces:**
- Consumes: `localePaths`, `localeFromParams`, `urlFor` from Task 1.
- Produces: every page renders at both `/<page>/` and `/de/<page>/`; `Base.astro` accepts a `locale` prop and renders `<html lang={locale}>`.

- [ ] **Step 1: Add the i18n config**

In `astro.config.mjs`, add to the `defineConfig` object, after `compressHTML: true`:

```js
  // English is unprefixed at the root, German lives under /de/. Astro does
  // not generate localized routes by itself in static output, so every page
  // sits under site/pages/[...locale]/ and yields both URLs from one source
  // file via localePaths() (site/lib/i18n/routes.ts).
  i18n: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
```

and replace the `sitemap(...)` call in `integrations` with:

```js
    sitemap({
      filter: (page) => !page.includes('/detail/'),
      i18n: { defaultLocale: 'en', locales: { en: 'en-US', de: 'de-DE' } },
    }),
```

The existing `filter` already excludes `/de/detail/` too, because it tests for the `/detail/` substring anywhere in the URL.

- [ ] **Step 2: Move the pages with git mv**

```bash
mkdir -p "site/pages/[...locale]"
for p in cv impressum index meetings network news people privacy projects publications research teaching; do
  git mv "site/pages/$p.astro" "site/pages/[...locale]/$p.astro"
done
git mv site/pages/detail "site/pages/[...locale]/detail"
```

`404.astro` and the five endpoints (`llms.txt.ts`, `llms-full.txt.ts`, `robots.txt.ts`, `search.json.ts`, `site.webmanifest.ts`) stay at the root for now; `search.json.ts` moves in Task 12 and the LLM files stay single-file by design.

- [ ] **Step 3: Fix the relative imports in every moved page**

Each moved page gained one directory level, so `../layouts/`, `../components/` and `../lib/` become `../../layouts/`, `../../components/` and `../../lib/`. The detail route gained one level on top of its existing two.

```bash
sed -i "s#from '\.\./\(layouts\|components\|lib\|styles\)/#from '../../\1/#g" "site/pages/[...locale]"/*.astro
sed -i "s#from '\.\./\.\./\.\./\(layouts\|components\|lib\|styles\)/#from '../../../../\1/#g" "site/pages/[...locale]/detail/[type]/[id].astro"
```

Verify no stale depth remains:

```bash
grep -rn "from '\.\./\(layouts\|components\|lib\)/" "site/pages/[...locale]/" || echo "clean"
```

- [ ] **Step 4: Add getStaticPaths and the locale to every moved page**

For each of the 13 pages, add to the top of the frontmatter, after the imports:

```ts
import { localeFromParams, localePaths, urlFor } from '../../lib/i18n/routes';

export const getStaticPaths = localePaths;
const locale = localeFromParams(Astro.params);
const u = urlFor(locale);
```

and pass the locale to the layout, e.g. in `teaching.astro`:

```astro
<Base title="Teaching" sectionid="teaching" locale={locale}>
```

Replace every `url('/...')` call **that targets a page** with `u('/...')` in these files. Leave `asset(...)` calls untouched: assets are shared between languages.

For `detail/[type]/[id].astro`, cross the locale with the existing entity paths. Its current `getStaticPaths` returns one entry per entity; wrap it:

```ts
export async function getStaticPaths() {
  const entities = await detailPaths();   // the existing body, extracted to a helper
  return LOCALES.flatMap((locale) =>
    entities.map((e) => ({
      params: { ...e.params, locale: locale === DEFAULT_LOCALE ? undefined : locale },
      props: { ...e.props, locale },
    })),
  );
}
```

- [ ] **Step 5: Plumb the locale through the layout**

In `site/layouts/Base.astro`, change the props interface and the `<html>` tag:

```ts
import { DEFAULT_LOCALE, type Locale } from '../lib/i18n/locales';
import { localeUrl } from '../lib/i18n/routes';

interface Props { title?: string; description?: string; sectionid?: string; locale?: Locale }
const { title, description, sectionid, locale = DEFAULT_LOCALE } = Astro.props;
const isHome = Astro.url.pathname === localeUrl(locale, '/');
```

```astro
<html lang={locale} class:list={[{ onepager: isHome }]}>
```

and make the three locale-sensitive child props locale-aware:

```astro
    <TopNav sectionid={sectionid} locale={locale} />
    <CookieConsent gaId="G-FDNGDW6G09" privacyUrl={localeUrl(locale, '/privacy/')} />
    <SiteSearch searchUrl={localeUrl(locale, '/search.json')} />
```

`TopNav.astro` takes `locale` as a prop now: add `locale?: Locale` to its `Props`, default it to `DEFAULT_LOCALE`, and route every nav `href` through `urlFor(locale)` instead of `url`. Do the same for `Footer.astro`'s internal links (`/impressum/`, `/privacy/`, `/cv/`), which needs a `locale` prop passed from `Base.astro` beside the existing `home`.

Note: `SiteSearch` will fetch `/de/search.json`, which does not exist until Task 12. Until then the German search dialog shows its error state, which is correct behaviour for a missing index and is covered by the Task 12 test.

- [ ] **Step 6: Build and verify both trees exist**

Run: `npm run check && npm run build`
Expected: PASS, and the build log lists both `/publications/index.html` and `/de/publications/index.html`.

```bash
test -f dist/index.html && test -f dist/de/index.html && test -f dist/de/publications/index.html \
  && test -f dist/de/detail/person/matthias_koenig/index.html \
  && grep -q 'lang="de"' dist/de/publications/index.html \
  && grep -q 'lang="en"' dist/publications/index.html \
  && echo OK
```

- [ ] **Step 7: Run the existing e2e suite**

```bash
npx astro preview --background
npm run e2e
npx astro preview stop
```

Expected: PASS. The English tree is unchanged, so every existing spec must still pass. If a spec fails, the restructure broke a link; fix it before committing.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Render every page under [...locale] so /de/ mirrors the site"
```

---

### Task 3: hreflang alternates

**Files:**
- Modify: `site/components/Head.astro`
- Create: `site/lib/i18n/alternates.ts`, `site/lib/i18n/alternates.test.ts`

**Interfaces:**
- Consumes: `LOCALES`, `DEFAULT_LOCALE`, `stripLocale`, `localeUrl` from Tasks 1.
- Produces: `alternates(pathname: string, site: URL | undefined): { hreflang: string; href: string }[]`.

- [ ] **Step 1: Write the failing test**

Create `site/lib/i18n/alternates.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { alternates } from './alternates';

const site = new URL('https://livermetabolism.com');

describe('alternates', () => {
  it('lists both languages plus x-default for an English page', () => {
    expect(alternates('/publications/', site)).toEqual([
      { hreflang: 'en-US', href: 'https://livermetabolism.com/publications/' },
      { hreflang: 'de-DE', href: 'https://livermetabolism.com/de/publications/' },
      { hreflang: 'x-default', href: 'https://livermetabolism.com/publications/' },
    ]);
  });
  it('produces the same set for the German page', () => {
    expect(alternates('/de/publications/', site)).toEqual(alternates('/publications/', site));
  });
  it('handles the homepage', () => {
    expect(alternates('/de/', site)).toEqual([
      { hreflang: 'en-US', href: 'https://livermetabolism.com/' },
      { hreflang: 'de-DE', href: 'https://livermetabolism.com/de/' },
      { hreflang: 'x-default', href: 'https://livermetabolism.com/' },
    ]);
  });
  it('returns nothing without a site URL, since hreflang must be absolute', () => {
    expect(alternates('/publications/', undefined)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run site/lib/i18n/alternates.test.ts`
Expected: FAIL, "Failed to resolve import './alternates'".

- [ ] **Step 3: Write the implementation**

Create `site/lib/i18n/alternates.ts`:

```ts
import { DEFAULT_LOCALE, LOCALES, type Locale } from './locales';
import { localeUrl, stripLocale } from './routes';

/** BCP 47 tags for the hreflang attribute; en is explicitly US English. */
const HREFLANG: Record<Locale, string> = { en: 'en-US', de: 'de-DE' };

/**
 * The rel="alternate" set for the page at `pathname`, plus x-default
 * pointing at the default locale. hreflang requires absolute URLs, so
 * without Astro.site (only the case in an unconfigured build) this yields
 * nothing rather than emitting relative hrefs search engines would ignore.
 */
export function alternates(pathname: string, site: URL | undefined): { hreflang: string; href: string }[] {
  if (!site) return [];
  const { path } = stripLocale(pathname);
  const abs = (locale: Locale) => new URL(localeUrl(locale, path), site).href;
  return [
    ...LOCALES.map((locale) => ({ hreflang: HREFLANG[locale], href: abs(locale) })),
    { hreflang: 'x-default', href: abs(DEFAULT_LOCALE) },
  ];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run site/lib/i18n/alternates.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Emit the tags**

In `site/components/Head.astro`, add to the frontmatter:

```ts
import { alternates } from '../lib/i18n/alternates';

const alternateLinks = alternates(Astro.url.pathname, Astro.site);
```

and after the existing `<link rel="canonical" …/>`:

```astro
{alternateLinks.map((a) => <link rel="alternate" hreflang={a.hreflang} href={a.href} />)}
```

- [ ] **Step 6: Build and verify**

Run: `SITE=https://livermetabolism.com BASE=/ npm run build`

```bash
grep -c 'rel="alternate" hreflang' dist/publications/index.html   # expect 3
grep -q 'hreflang="de-DE" href="https://livermetabolism.com/de/publications/"' dist/publications/index.html && echo OK
grep -q 'hreflang="de-DE"' dist/sitemap-0.xml && echo "sitemap OK"
```

- [ ] **Step 7: Commit**

```bash
git add site/lib/i18n/alternates.ts site/lib/i18n/alternates.test.ts site/components/Head.astro
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Emit hreflang alternates for both languages"
```

---

### Task 4: The language switch

**Files:**
- Create: `site/components/LanguageSwitch.astro`
- Modify: `site/components/TopNav.astro` (mount it in `.navbar-controls`), `site/styles/global.css`

**Interfaces:**
- Consumes: `LOCALES`, `switchPath` from Task 1.
- Produces: markup `.lang-switch` containing one `<a>` per locale, the current one carrying `aria-current="true"`.

- [ ] **Step 1: Write the component**

Create `site/components/LanguageSwitch.astro`:

```astro
---
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../lib/i18n/locales';
import { switchPath } from '../lib/i18n/routes';

interface Props { locale?: Locale }
const { locale = DEFAULT_LOCALE } = Astro.props;
const here = Astro.url.pathname;
const LABEL: Record<Locale, string> = { en: 'EN', de: 'DE' };
const TITLE: Record<Locale, string> = { en: 'English', de: 'Deutsch' };
---
<div class="lang-switch">
  {LOCALES.map((l) => (
    <a
      class:list={['lang-switch-link', { active: l === locale }]}
      href={switchPath(l, here)}
      hreflang={l}
      lang={l}
      title={TITLE[l]}
      aria-current={l === locale ? 'true' : undefined}
    >{LABEL[l]}</a>
  ))}
</div>
<script>
  // Both entries are real links, so the switch works without JavaScript and
  // middle-clicks like a link. This only carries the fragment across, so a
  // reader with a detail modal open lands on the same entry in the other
  // language (the hash is never sent to the server, so the href cannot
  // carry it).
  import { isModifiedClick } from '../lib/detailModal';
  document.querySelectorAll<HTMLAnchorElement>('.lang-switch-link').forEach((a) => {
    a.addEventListener('click', (event) => {
      if (isModifiedClick(event) || !location.hash) return;
      event.preventDefault();
      location.assign(a.href + location.hash);
    });
  });
</script>
```

`isModifiedClick` is already exported from `site/lib/detailModal.ts` (`modals.ts` imports it from there at line 14), so no new export is needed. Honouring it here is what keeps a ⌘/Ctrl/Shift-click on the switch opening the other language in a new tab.

- [ ] **Step 2: Mount it**

In `site/components/TopNav.astro`, inside `<div class="navbar-controls">`, before the search toggle:

```astro
      <LanguageSwitch locale={locale} />
```

with `import LanguageSwitch from './LanguageSwitch.astro';` added to the frontmatter.

- [ ] **Step 3: Style it**

In `site/styles/global.css`, in the `components` layer, beside the other navbar rules:

```css
  .lang-switch { display: inline-flex; align-items: center; gap: 0.125rem; margin-right: 0.5rem; }
  .lang-switch-link {
    padding: 0.125rem 0.375rem; border-radius: 0.375rem; font-size: 0.8125rem;
    font-weight: 600; letter-spacing: 0.02em; color: rgba(255, 255, 255, 0.55); text-decoration: none;
  }
  .lang-switch-link:hover, .lang-switch-link:focus { color: var(--color-success); }
  .lang-switch-link.active { color: #fff; background: rgba(255, 255, 255, 0.1); }
```

These values are the navbar's existing idiom, verified against `global.css`: `.nav-link` uses literal `#fff` with `var(--color-success)` on hover/focus, and `.navbar-toggler` uses `rgba(255, 255, 255, 0.55)` with `border-radius: 0.375rem` and a `rgba(255, 255, 255, 0.1)` border. **Do not** use `--color-navbar-fg`, `--color-navbar-fg-muted`, `--color-navbar-active-bg` or `--radius-sm`: none of them exist, and an undefined custom property would leave the switch unstyled and effectively invisible against the dark navbar.

- [ ] **Step 4: Write the e2e test**

Append to `e2e/interactions.spec.ts`:

```ts
test('the language switch keeps the path and the hash', async ({ page }) => {
  await page.goto('publications/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('.lang-switch-link[lang="de"]').click();
  await expect(page).toHaveURL(/\/de\/publications\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await page.locator('.lang-switch-link[lang="en"]').click();
  await expect(page).toHaveURL(/\/publications\/$/);
});

test('the language switch carries an open detail modal across', async ({ page }) => {
  await page.goto('people/');
  await page.locator('[data-detail^="person:"]').first().click();
  await expect(page.locator('#detail-modal')).toBeVisible();
  const hash = new URL(page.url()).hash;
  expect(hash).not.toBe('');
  await page.locator('.lang-switch-link[lang="de"]').click();
  await expect(page).toHaveURL(/\/de\/people\//);
  expect(new URL(page.url()).hash).toBe(hash);
  await expect(page.locator('#detail-modal')).toBeVisible();
});
```

- [ ] **Step 5: Run the e2e test**

```bash
npm run build && npx astro preview --background && npm run e2e -- -g "language switch"; npx astro preview stop
```

Expected: PASS, 2 tests.

- [ ] **Step 6: Commit**

```bash
git add site/components/LanguageSwitch.astro site/components/TopNav.astro site/styles/global.css e2e/interactions.spec.ts
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Add the EN/DE language switch to the navbar"
```

---

### Task 5: Browser-side locale awareness

**Files:**
- Modify: `site/lib/detailModal.ts`, `site/lib/detailModal.test.ts`
- Modify: `site/lib/details.ts` (the `base` in `DetailContext` becomes locale-aware), `site/lib/graphRows.ts` callers

**Interfaces:**
- Consumes: `stripLocale` from Task 1.
- Produces: `detailBase(): string`, reading the locale from `document.documentElement.lang`.

- [ ] **Step 1: Write the failing test**

Append to `site/lib/detailModal.test.ts`:

```ts
describe('detailBase', () => {
  it('fetches from the root on an English page', () => {
    document.documentElement.lang = 'en';
    expect(detailBase()).toBe('/');
  });
  it('fetches from the locale prefix on a German page', () => {
    document.documentElement.lang = 'de';
    expect(detailBase()).toBe('/de/');
  });
  it('falls back to the default locale for an unknown lang', () => {
    document.documentElement.lang = 'fr';
    expect(detailBase()).toBe('/');
  });
});
```

Add `detailBase` to the existing import from `./detailModal`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run site/lib/detailModal.test.ts`
Expected: FAIL, "detailBase is not a function".

- [ ] **Step 3: Implement it**

In `site/lib/detailModal.ts`, add and use:

```ts
import { isLocale, DEFAULT_LOCALE } from './i18n/locales';

/**
 * The prefix the prerendered detail fragments live under for the page the
 * reader is on. The locale comes from <html lang>, which Base.astro already
 * sets, so no extra data- attribute is needed.
 */
export function detailBase(): string {
  const base = import.meta.env.BASE_URL;
  const lang = document.documentElement.lang;
  return isLocale(lang) && lang !== DEFAULT_LOCALE ? `${base}${lang}/` : base;
}
```

Replace the existing fragment URL construction so it reads `${detailBase()}detail/${type}/${id}/`. The `type`/`id` validation against `DETAIL_TYPES` and `^[A-Za-z0-9_.-]+$` stays exactly as it is, before the fetch.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run site/lib/detailModal.test.ts`
Expected: PASS.

- [ ] **Step 5: Make the build-time detail hrefs locale-aware**

`details.ts` and `graphRows.ts` already build every href from a `base` string their context carries. No change inside them is needed: in `[...locale]/publications.astro`, `[...locale]/network.astro` and the other callers, pass `localeUrl(locale, '/')` as that base instead of `import.meta.env.BASE_URL`. Grep for the call sites:

```bash
grep -rn "BASE_URL" "site/pages/[...locale]/" site/lib/details.ts site/lib/graphRows.ts
```

- [ ] **Step 6: Verify end to end**

```bash
npm run build && npx astro preview --background
npm run e2e
npx astro preview stop
```

Add one spec to `e2e/interactions.spec.ts`:

```ts
test('a detail modal opens on the German tree', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('de/people/');
  await page.locator('[data-detail^="person:"]').first().click();
  await expect(page.locator('#detail-modal')).toBeVisible();
  await expect(page.locator('#detail-modal .modal-title')).not.toBeEmpty();
  expect(errors).toEqual([]);
});
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Fetch detail fragments from the current locale's tree"
```

---

# Phase 2: UI string extraction

No behaviour change. The built English HTML must be byte-identical apart from the switch added in Phase 1.

### Task 6: The UI catalog and `t()`

**Files:**
- Create: `site/lib/i18n/format.ts`, `site/lib/i18n/format.test.ts`
- Create: `site/lib/i18n/ui.en.ts`
- Create: `site/lib/i18n/catalog.ts`, `site/lib/i18n/catalog.test.ts`

**Interfaces:**
- Produces: `fmt(template: string, vars?: Record<string, string | number>): string`; `en` (the nested catalog); `type UiKey` (dotted leaf paths of `typeof en`); `flatten(tree: object): Record<string, string>`; `EN_FLAT: Record<UiKey, string>`; `loadUi(locale: Locale): Record<string, string>`; `type TFn = (key: UiKey, vars?: Record<string, string | number>) => string`; `uiFor(locale: Locale): { locale: Locale; t: TFn }`.

- [ ] **Step 1: Write the failing tests**

Create `site/lib/i18n/format.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { fmt } from './format';

describe('fmt', () => {
  it('returns a template without placeholders unchanged', () => {
    expect(fmt('Publications')).toBe('Publications');
  });
  it('substitutes a placeholder', () => {
    expect(fmt('No results for {query}.', { query: 'liver' })).toBe('No results for liver.');
  });
  it('substitutes the same placeholder twice', () => {
    expect(fmt('{a} and {a}', { a: 'x' })).toBe('x and x');
  });
  it('accepts a number', () => {
    expect(fmt('cited {n}', { n: 12 })).toBe('cited 12');
  });
  it('leaves an unknown placeholder in place rather than printing undefined', () => {
    expect(fmt('Release {tag}', {})).toBe('Release {tag}');
  });
});
```

Create `site/lib/i18n/catalog.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { EN_FLAT, flatten, loadUi, uiFor } from './catalog';
import { en } from './ui.en';

describe('flatten', () => {
  it('joins nested keys with dots', () => {
    expect(flatten({ nav: { news: 'News' }, search: { open: 'Search' } })).toEqual({
      'nav.news': 'News',
      'search.open': 'Search',
    });
  });
});

describe('EN_FLAT', () => {
  it('flattens the English catalog', () => {
    expect(EN_FLAT['nav.publications']).toBe('Publications');
  });
  it('has no empty value', () => {
    for (const [key, value] of Object.entries(EN_FLAT)) expect(value, key).not.toBe('');
  });
});

describe('loadUi', () => {
  it('returns the English catalog for the default locale', () => {
    expect(loadUi('en')).toBe(EN_FLAT);
  });
  it('has exactly the English key set for German', () => {
    expect(Object.keys(loadUi('de')).sort()).toEqual(Object.keys(EN_FLAT).sort());
  });
});

describe('uiFor', () => {
  it('resolves a key', () => {
    expect(uiFor('en').t('nav.publications')).toBe('Publications');
  });
  it('interpolates', () => {
    expect(uiFor('en').t('search.empty', { query: 'x' })).toContain('x');
  });
  // NOTE: do not write this as `expect(uiFor('de').t(key)).toBeTruthy()`. Every
  // seeded German entry has non-empty text, so such a test passes whether t()
  // uses `||`, `??`, or no fallback at all - it asserts nothing about the very
  // behaviour it is named after, and `||` vs `??` is the difference between an
  // English UI and a blank one. Drive it from a fixture instead: build a record
  // carrying every `EN_FLAT` key (so the parity check still passes) with an
  // empty `text` for the one key under test, then `vi.resetModules()` and
  // `vi.doMock('node:fs', ...)` before a fresh `await import('./catalog')`,
  // because `loadUi()` memoises per locale at module scope and would otherwise
  // serve the real catalog from cache. The test must fail under both mutations:
  // `||` changed to `??`, and the fallback removed entirely.
  it('falls back to English when the German entry text is empty, not merely missing', async () => {
    const fixture: Record<string, { sha: string; text: string }> = {};
    for (const key of Object.keys(EN_FLAT)) {
      fixture[key] = { sha: '0000000000000000', text: key === 'nav.publications' ? '' : `stub:${key}` };
    }
    vi.resetModules();
    vi.doMock('node:fs', () => ({ default: { readFileSync: () => dump(fixture) } }));
    try {
      const { uiFor: freshUiFor } = await import('./catalog');
      expect(freshUiFor('de').t('nav.publications')).toBe('Publications');
    } finally {
      vi.doUnmock('node:fs');
      vi.resetModules();
    }
  });
});

describe('the German catalog', () => {
  it('keeps every placeholder of its English source', () => {
    const de = loadUi('de');
    const placeholders = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort();
    for (const [key, english] of Object.entries(EN_FLAT)) {
      expect(placeholders(de[key] ?? english), key).toEqual(placeholders(english));
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run site/lib/i18n/format.test.ts site/lib/i18n/catalog.test.ts`
Expected: FAIL, "Failed to resolve import './format'".

- [ ] **Step 3: Write format.ts**

```ts
/**
 * Placeholder interpolation for the UI catalogs, in a leaf module with no
 * dependencies so the browser-side chrome (githubStats.ts, the search
 * dialog) can use the same function on the same templates the build used.
 * An unknown placeholder is left in place: a visible "{tag}" in the UI is a
 * bug report, a silent "undefined" is not.
 */
export function fmt(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}
```

- [ ] **Step 4: Write ui.en.ts with the first slice of keys**

Start with the navigation and the keys the tests above reference; Tasks 7 to 9 fill in the rest.

```ts
/**
 * The English UI catalog: the source of every user-facing string that is not
 * data. `UiKey` is derived from this object, so a typo in a t() call is a
 * type error and a key missing from i18n/de/ui.yml fails the build
 * (see catalog.ts).
 *
 * Placeholders are {name} and are interpolated by fmt() (format.ts).
 * Plurals get explicit .one/.other keys rather than a plural library:
 * German and English share the same two-form system.
 */
export const en = {
  nav: {
    publications: 'Publications',
    projects: 'Projects',
    research: 'Research',
    team: 'Team',
    meetings: 'Meetings',
    network: 'Network',
    news: 'News',
    teaching: 'Teaching',
    cv: 'CV',
  },
  search: {
    open: 'Search',
    openTitle: 'Search ({key})',
    close: 'Close',
    placeholder: 'Search publications, people, projects, software, news, ...',
    hint: 'Start typing to search publications, people, projects, software, news, and more.',
    unavailable: 'Search is temporarily unavailable.',
    empty: 'No results for “{query}”.',
  },
} as const;

type Leaves<T> = T extends string
  ? ''
  : { [K in keyof T & string]: Leaves<T[K]> extends '' ? K : `${K}.${Leaves<T[K]>}` }[keyof T & string];

/** Every dotted leaf path of `en`, e.g. 'nav.publications'. */
export type UiKey = Leaves<typeof en>;
```

- [ ] **Step 5: Write catalog.ts**

```ts
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { fmt } from './format';
import { DEFAULT_LOCALE, type Locale } from './locales';
import { en, type UiKey } from './ui.en';

export function flatten(tree: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree as Record<string, unknown>)) {
    const dotted = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[dotted] = value;
    else Object.assign(out, flatten(value, dotted));
  }
  return out;
}

export const EN_FLAT = flatten(en) as Record<UiKey, string>;

/** One catalog entry: the German text plus the sha of its English source. */
interface UiEntry { sha: string; text: string }

const cache = new Map<Locale, Record<string, string>>();

/**
 * The flat catalog for a locale. The German file must carry exactly the
 * English key set: a missing or unknown key throws here, which fails the
 * build with a precise message rather than leaking English into a German
 * page or rendering a raw key. A key present but empty is treated as
 * untranslated and falls back to English at lookup time.
 */
export function loadUi(locale: Locale): Record<string, string> {
  if (locale === DEFAULT_LOCALE) return EN_FLAT;
  const hit = cache.get(locale);
  if (hit) return hit;

  const file = path.join(process.cwd(), 'i18n', locale, 'ui.yml');
  const raw = (load(fs.readFileSync(file, 'utf8')) ?? {}) as Record<string, UiEntry>;

  const expected = Object.keys(EN_FLAT).sort();
  const actual = Object.keys(raw).sort();
  const missing = expected.filter((k) => !actual.includes(k));
  const unknown = actual.filter((k) => !expected.includes(k));
  if (missing.length || unknown.length) {
    throw new Error(
      `i18n/${locale}/ui.yml is out of sync with ui.en.ts.\n` +
        (missing.length ? `  missing: ${missing.join(', ')}\n` : '') +
        (unknown.length ? `  unknown: ${unknown.join(', ')}\n` : '') +
        `  Regenerate it with the translate-de skill.`,
    );
  }

  const flat: Record<string, string> = {};
  for (const [key, entry] of Object.entries(raw)) flat[key] = entry.text;
  cache.set(locale, flat);
  return flat;
}

export type TFn = (key: UiKey, vars?: Record<string, string | number>) => string;

/** The translator for one locale, built once per page. */
export function uiFor(locale: Locale): { locale: Locale; t: TFn } {
  const flat = loadUi(locale);
  // An entry that exists but is still empty falls back to English: a
  // lagging translation degrades to English, never to a blank.
  const t: TFn = (key, vars) => fmt(flat[key] || EN_FLAT[key], vars);
  return { locale, t };
}
```

- [ ] **Step 6: Seed the German catalog**

Create `i18n/de/ui.yml` with the same keys, German text, and a placeholder sha (Task 16 regenerates every sha properly):

```yaml
# AUTO-GENERATED by .claude/skills/translate-de. Do not edit by hand.
nav.publications:
  sha: '0000000000000000'
  text: Publikationen
nav.projects:
  sha: '0000000000000000'
  text: Projekte
nav.research:
  sha: '0000000000000000'
  text: Forschung
nav.team:
  sha: '0000000000000000'
  text: Team
nav.meetings:
  sha: '0000000000000000'
  text: Tagungen
nav.network:
  sha: '0000000000000000'
  text: Netzwerk
nav.news:
  sha: '0000000000000000'
  text: Aktuelles
nav.teaching:
  sha: '0000000000000000'
  text: Lehre
nav.cv:
  sha: '0000000000000000'
  text: Lebenslauf
search.open:
  sha: '0000000000000000'
  text: Suche
search.openTitle:
  sha: '0000000000000000'
  text: Suche ({key})
search.close:
  sha: '0000000000000000'
  text: Schließen
search.placeholder:
  sha: '0000000000000000'
  text: 'Publikationen, Personen, Projekte, Software, Aktuelles durchsuchen ...'
search.hint:
  sha: '0000000000000000'
  text: 'Tippen Sie, um Publikationen, Personen, Projekte, Software, Aktuelles und mehr zu durchsuchen.'
search.unavailable:
  sha: '0000000000000000'
  text: Die Suche ist derzeit nicht verfügbar.
search.empty:
  sha: '0000000000000000'
  text: 'Keine Treffer für „{query}“.'
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run site/lib/i18n/`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add site/lib/i18n/ i18n/de/ui.yml
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Add the typed UI catalog, the German loader, and fmt()"
```

---

### Task 7: Extract the site chrome strings

**Files:**
- Modify: `site/components/TopNav.astro`, `Footer.astro`, `Head.astro`, `CookieConsent.astro`, `SiteSearch.astro`, `DetailModal.astro`, `ScholarStats.astro`, `PublicationsOrder.astro`, `SoftwareLive.astro`
- Modify: `site/lib/i18n/ui.en.ts`, `i18n/de/ui.yml`
- Modify: `site/layouts/Base.astro` (pass `t` down)

**Interfaces:**
- Consumes: `uiFor`, `TFn` from Task 6.
- Produces: catalog keys under `nav.*`, `footer.*`, `meta.*`, `consent.*`, `search.*`, `detail.*`, `scholar.*`, `pubOrder.*`, `gh.*`.

- [ ] **Step 1: Capture the current English output as a baseline**

```bash
npm run build && cp -r dist .superpowers/sdd/2026-09-17-internationalization/dist-baseline
```

- [ ] **Step 2: Add the keys**

Extend `en` in `site/lib/i18n/ui.en.ts` with one group per component. The strings are the exact current literals, copied verbatim, for example:

```ts
  footer: {
    tagline: 'Systems Medicine, Digital Twins & AI',
    position: 'Professor of Metabolic Inflammation and Carcinogenesis of the Liver',
    cv: 'Curriculum vitae',
    releaseNotes: 'Release notes',
    deployedCommit: 'Deployed commit',
    toTop: 'Scroll to top',
    impressum: 'Impressum',
    privacy: 'Datenschutzerklärung',
  },
  consent: {
    message: "This site uses Google Analytics to understand how it's used. It only runs if you accept - see the privacy policy for details.",
    privacyLink: 'privacy policy',
    decline: 'Decline',
    accept: 'Accept',
  },
  detail: {
    back: '← Back',
    backLabel: 'Back to the previous entry',
    close: 'Close',
    loading: 'Loading…',
    title: 'Details',
    error: 'This entry could not be loaded. Please try again.',
    showInList: 'Show in list →',
    keywords: 'Keywords:',
  },
  scholar: {
    citations: 'Citations',
    hIndex: 'h-index',
    i10Index: 'i10-index',
    publications: 'Publications',
    peerReviewed: 'peer-reviewed',
    since: 'since {year}',
    note: 'Citation metrics from Google Scholar, last update {date}',
    none: 'none yet',
  },
```

Note: the current `CookieConsent.astro` literal contains an em dash before "see the privacy policy". The catalog value above already has it replaced with a plain dash, per the global constraints. This is the one intentional English text change in Phase 2, so expect it in the Step 4 diff.

- [ ] **Step 3: Replace the literals**

In each component, build the translator once in the frontmatter and use it:

```astro
---
import { uiFor } from '../lib/i18n/catalog';
import { DEFAULT_LOCALE, type Locale } from '../lib/i18n/locales';

interface Props { locale?: Locale; /* existing props */ }
const { locale = DEFAULT_LOCALE } = Astro.props;
const { t } = uiFor(locale);
---
<a class="nav-link" href={u('/publications/')}>{t('nav.publications')}</a>
```

For `SiteSearch.astro`, whose bundled script needs the same strings in the browser, pass them through `data-` attributes on the dialog root, matching the existing `data-search-url` pattern:

```astro
<dialog id="site-search-modal" class="modal"
  data-search-url={searchUrl}
  data-hint={t('search.hint')}
  data-unavailable={t('search.unavailable')}
  data-empty={t('search.empty')}>
```

and read them in the script instead of the current `HINT` const. This is the change that collapses the duplicated hint sentence: there is now one key, read once.

Do the same for `ScholarStats.astro`, `PublicationsOrder.astro` and `SoftwareLive.astro`, whose scripts patch text in place.

- [ ] **Step 4: Verify the English output is unchanged**

```bash
npm run build
diff -r .superpowers/sdd/2026-09-17-internationalization/dist-baseline dist --exclude='*.map' | head -40
```

Expected: the only differences are the consent em dash becoming a plain dash, and the `/de/` tree now carrying German nav labels. Any other English difference is a transcription error in a key. Fix it before continuing.

- [ ] **Step 5: Run the suites**

Run: `npm run check && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Move the site chrome strings into the UI catalog"
```

---

### Task 8: Extract the page and card strings

**Files:**
- Modify: the 13 pages under `site/pages/[...locale]/`
- Modify: the Vue card components listed below
- Create: `site/lib/i18n/slices.ts`, `site/lib/i18n/slices.test.ts`
- Modify: `site/lib/i18n/ui.en.ts`, `i18n/de/ui.yml`

**Interfaces:**
- Consumes: `TFn` from Task 6, `fmt` from Task 6.
- Produces: `slices(t: TFn)` returning one serialisable object per component, and `type UiSlices = ReturnType<typeof slices>`.

- [ ] **Step 1: Write the failing test**

Create `site/lib/i18n/slices.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { uiFor } from './catalog';
import { slices } from './slices';

describe('slices', () => {
  it('bundles the software card strings', () => {
    const s = slices(uiFor('en').t);
    expect(s.softwareCard.stars).toBe('Stars');
    expect(s.softwareCard.issues).toBe('Open issues');
  });
  it('yields only serialisable values, so an island can take one as a prop', () => {
    const s = slices(uiFor('en').t);
    for (const [name, slice] of Object.entries(s)) {
      expect(JSON.parse(JSON.stringify(slice)), name).toEqual(slice);
    }
  });
  it('keeps a parameterised string as a template for the component to format', () => {
    const s = slices(uiFor('en').t);
    expect(s.softwareCard.release).toContain('{tag}');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run site/lib/i18n/slices.test.ts`
Expected: FAIL, "Failed to resolve import './slices'".

- [ ] **Step 3: Write slices.ts**

```ts
import type { TFn } from './catalog';

/**
 * Per-component string bundles. Components take a plain serialisable object
 * rather than a `t` function, so the same rule covers the statically
 * rendered cards and the hydrated islands, whose props must serialise into
 * astro-island. Keeping the bundles narrow is what stops the whole ~500-key
 * catalog from being written into the island props of every page.
 *
 * A parameterised string stays a {placeholder} template here; the component
 * runs it through fmt() with its own values.
 */
export const slices = (t: TFn) => ({
  softwareCard: {
    stars: t('gh.stars'),
    issues: t('gh.issues'),
    issuesOpen: t('gh.issuesOpen'),
    lastPush: t('gh.lastPush'),
    language: t('gh.language'),
    license: t('gh.license'),
    release: t('gh.release'),
    releases: t('gh.releases'),
    homepage: t('links.projectHomepage'),
    repository: t('links.repositoryHomepage'),
  },
  publicationRow: {
    citations: t('pub.citationsTitle'),
    openAccess: t('pub.openAccess'),
    openAccessWith: t('pub.openAccessWith'),
    cited: t('pub.cited'),
    abstract: t('pub.abstract'),
    keywords: t('detail.keywords'),
    pdf: t('links.pdf'),
    homepage: t('links.projectHomepage'),
    repository: t('links.repositoryHomepage'),
  },
  personCard: {
    viewProfile: t('person.viewProfile'),
    fullProfile: t('person.fullProfile'),
    homepage: t('links.homepage'),
    orcid: t('links.orcid'),
    repository: t('links.repositoryHomepage'),
  },
  tagFilter: { all: t('filter.all') },
  network: {
    showArea: t('network.showArea'),
    all: t('filter.all'),
    zoomIn: t('network.zoomIn'),
    zoomOut: t('network.zoomOut'),
    reset: t('network.reset'),
    loading: t('network.loading'),
    graphLabel: t('network.graphLabel'),
    caption: t('network.caption'),
    categories: {
      people: t('network.categoryPeople'),
      projects: t('network.categoryProjects'),
      software: t('network.categorySoftware'),
      publications: t('network.categoryPublications'),
    },
  },
  // ... one entry per component that needs strings; add them as each
  // component is converted in Step 4.
});

export type UiSlices = ReturnType<typeof slices>;
```

- [ ] **Step 4: Convert the components**

For each Vue component, replace its literals with a `strings` prop:

```vue
<script setup lang="ts">
import { fmt } from '../lib/i18n/format';
import type { UiSlices } from '../lib/i18n/slices';

const props = defineProps<{ item: SoftwareData; strings: UiSlices['softwareCard'] }>();
const releaseTitle = () => fmt(props.strings.release, { tag: latest.tag, date: shortDate(latest.date) });
</script>
```

and in the page:

```astro
<SoftwareCard item={item} strings={ui.softwareCard} />
```

where the page frontmatter has `const ui = slices(t);`.

Components to convert, from the inventory: `SoftwareCard.vue`, `PublicationRow.vue`, `DetailView.vue`, `PersonCard.vue`, `PersonAvatar.vue`, `PresentationCard.vue`, `PublicationsChart.vue`, `AbstractCard.vue`, `PosterCard.vue`, `MeetingCard.vue`, `FundingCard.vue`, `ProjectCard.vue`, `EditorCard.vue`, `TeachingCard.vue`, `NewsCard.vue`, `StarsChart.vue`, `CitationHistoryChart.vue`, `CitationsPerYearChart.vue`, `CommitActivityChart.vue`, `ReleaseTimeline.vue`, `ReleaseFeed.vue`, `TagFilterBar.vue`, `NetworkGraph.vue`.

Pages to convert: all 12 (plus the detail route), including the `quickLinks` and per-tag link-card arrays in `index.astro` and the `positions` array in `people.astro`.

**No UI-catalog value is ever rendered as HTML.** `people.astro`'s positions text currently holds inline markup (an `<a>` to the Humboldt Internship Program) rendered with `set:html`. Do **not** move that markup into the catalog. `i18n/de/*` is regenerated by machine in Task 16, so a catalog value reaching `set:html` is an injection surface for machine-produced text - the same defect already fixed once in `CookieConsent.astro`. Split such a string into plain-text fragments around the link and put the anchor in the template:

```astro
<p>{t('positions.internship.before')} <a href="https://hic.hu-berlin.de/...">{t('positions.internship.linkText')}</a> {t('positions.internship.after')}</p>
```

The same rule applies to any other page string carrying inline markup. This is a UI-catalog rule only: the HTML-bearing **data** fields (`news.abstract`, `teaching.content`, `people.description`, …) keep their markup and their `v-html` render, per the spec and the translation guide.

- [ ] **Step 5: Verify the English output is unchanged**

```bash
npm run build
diff -r .superpowers/sdd/2026-09-17-internationalization/dist-baseline dist --exclude='*.map' | grep -v '^Only in dist: de' | head -40
```

Expected: no English differences.

- [ ] **Step 6: Run the suites**

Run: `npm run check && npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Move the page and card strings into the UI catalog"
```

---

### Task 9: Extract the library strings and collapse the duplicates

**Files:**
- Create: `site/lib/i18n/dates.ts`, `site/lib/i18n/dates.test.ts`
- Modify: `site/lib/llms.ts`, `details.ts`, `githubRows.ts`, `chartOptions.ts`, `networkOptions.ts`, `homeStats.ts`, `search.ts`, `detailModal.ts`, `scholarRows.ts`, `githubStats.ts`, `publicationRows.ts`, `sitePages.ts`
- Modify: `site/pages/site.webmanifest.ts`
- Modify: `site/lib/i18n/ui.en.ts` **and** `i18n/de/ui.yml` - every English key this task adds needs its German counterpart in the **same commit**, because `loadUi()` throws on a key-set mismatch and would otherwise fail the build.

**Interfaces:**
- Consumes: `TFn`, `fmt`.
- Produces: `monthsFor(locale: Locale): readonly string[]`; `shortDate(iso: string, locale: Locale): string`; `relativeDate(iso: string, now: Date, t: TFn): string`.

- [ ] **Step 1: Write the failing test**

Create `site/lib/i18n/dates.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { monthsFor, shortDate } from './dates';

describe('monthsFor', () => {
  it('gives the English abbreviations', () => {
    expect(monthsFor('en')[0]).toBe('Jan');
    expect(monthsFor('en')).toHaveLength(12);
  });
  it('gives the German abbreviations', () => {
    expect(monthsFor('de')[11]).toBe('Dez');
    expect(monthsFor('de')).toHaveLength(12);
  });
});

describe('shortDate', () => {
  it('formats an ISO date in English', () => {
    expect(shortDate('2026-03-09', 'en')).toBe('Mar 9, 2026');
  });
  it('formats an ISO date in German', () => {
    expect(shortDate('2026-03-09', 'de')).toBe('9. Mär 2026');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run site/lib/i18n/dates.test.ts`
Expected: FAIL, "Failed to resolve import './dates'".

- [ ] **Step 3: Write dates.ts**

```ts
import type { Locale } from './locales';

/**
 * The one month list. It previously existed twice, in githubRows.ts and
 * chartOptions.ts; two copies would have become two independently
 * translated key sets that could drift apart in German.
 */
const MONTHS: Record<Locale, readonly string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
};

export const monthsFor = (locale: Locale): readonly string[] => MONTHS[locale];

/** `2026-03-09` -> `Mar 9, 2026` (en) or `9. Mär 2026` (de). */
export function shortDate(iso: string, locale: Locale): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const month = monthsFor(locale)[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return locale === 'de' ? `${day}. ${month} ${year}` : `${month} ${day}, ${year}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run site/lib/i18n/dates.test.ts`
Expected: PASS.

- [ ] **Step 5: Thread the locale through the pure row builders**

`llms.ts`, `details.ts`, `githubRows.ts`, `chartOptions.ts`, `networkOptions.ts`, `homeStats.ts`, `scholarRows.ts` and `publicationRows.ts` are pure modules whose callers already pass a context. Add a `t: TFn` (and `locale` where a date is formatted) to that context rather than importing the catalog inside them, so they stay pure and unit-testable. Update each module's existing tests to pass `uiFor('en').t`.

Delete the duplicated `MONTHS` from `githubRows.ts` and `chartOptions.ts` and import `monthsFor`/`shortDate` instead. Replace the duplicated release label in `githubStats.ts` with `fmt(strings.release, …)` reading the template from a `data-` attribute set by `SoftwareLive.astro`, so the build and the live patch share one key. Replace the duplicated network description in `NetworkGraph.vue` with `strings.caption`, which `network.astro` also renders.

- [ ] **Step 6: Verify and commit**

```bash
npm run check && npm test && npm run build
diff -r .superpowers/sdd/2026-09-17-internationalization/dist-baseline dist --exclude='*.map' | grep -v '^Only in dist: de' | head -40
```

Expected: no English differences.

```bash
git add -A
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Move the library strings into the UI catalog and collapse the four duplicates"
```

---

# Phase 3: Data overlay

### Task 10: The field registry and the overlay

**Files:**
- Create: `site/lib/i18n/fields.ts`, `site/lib/i18n/fields.test.ts`
- Create: `site/lib/i18n/sha.ts`, `site/lib/i18n/sha.test.ts`
- Create: `site/lib/i18n/content.ts`, `site/lib/i18n/content.test.ts`

**Interfaces:**
- Produces: `TRANSLATABLE` (the registry); `type TranslatableTable = keyof typeof TRANSLATABLE`; `isTranslatable(table: string): table is TranslatableTable`; `sourceSha(value: string | string[]): string`; `interface CatalogEntry { sha: string; text: string | string[] }`; `type Catalog = Record<string, Record<string, CatalogEntry>>`; `loadCatalog(locale: Locale, table: TranslatableTable): Catalog`; `localize<T extends { id: string }>(rows: T[], catalog: Catalog, fields: readonly string[]): T[]`.

- [ ] **Step 1: Write the failing tests**

Create `site/lib/i18n/sha.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { sourceSha } from './sha';

describe('sourceSha', () => {
  it('is 16 hex characters', () => {
    expect(sourceSha('hello')).toMatch(/^[0-9a-f]{16}$/);
  });
  it('is stable for the same input', () => {
    expect(sourceSha('hello')).toBe(sourceSha('hello'));
  });
  it('changes when the source changes', () => {
    expect(sourceSha('hello')).not.toBe(sourceSha('hello.'));
  });
  it('hashes a list field by its JSON form', () => {
    expect(sourceSha(['a', 'b'])).toBe(sourceSha(['a', 'b']));
    expect(sourceSha(['a', 'b'])).not.toBe(sourceSha(['b', 'a']));
  });
});
```

Create `site/lib/i18n/content.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { localize, type Catalog } from './content';

const rows = [
  { id: 'koenig', name: 'Matthias König', description: 'Group leader.', role: ['Group Leader'] },
  { id: 'other', name: 'Other Person', description: 'Postdoc.', role: ['Postdoc'] },
];

const catalog: Catalog = {
  koenig: {
    description: { sha: 'aaaa000000000000', text: 'Gruppenleiter.' },
    role: { sha: 'bbbb000000000000', text: ['Gruppenleiter'] },
  },
};

describe('localize', () => {
  it('substitutes a translated field', () => {
    expect(localize(rows, catalog, ['description', 'role'])[0].description).toBe('Gruppenleiter.');
  });
  it('substitutes a list field', () => {
    expect(localize(rows, catalog, ['description', 'role'])[0].role).toEqual(['Gruppenleiter']);
  });
  it('falls back to English for a row with no catalog entry', () => {
    expect(localize(rows, catalog, ['description'])[1].description).toBe('Postdoc.');
  });
  it('leaves a field outside the registry untouched', () => {
    expect(localize(rows, catalog, ['description'])[0].name).toBe('Matthias König');
  });
  it('does not mutate the input rows', () => {
    localize(rows, catalog, ['description']);
    expect(rows[0].description).toBe('Group leader.');
  });
  it('preserves row order', () => {
    expect(localize(rows, catalog, ['description']).map((r) => r.id)).toEqual(['koenig', 'other']);
  });
});
```

Create `site/lib/i18n/fields.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { isTranslatable, TRANSLATABLE } from './fields';

const BIBLIOGRAPHIC = ['publications', 'posters', 'presentations', 'abstracts', 'panels'];

describe('TRANSLATABLE', () => {
  it('never lists a bibliographic table', () => {
    for (const table of BIBLIOGRAPHIC) expect(Object.keys(TRANSLATABLE)).not.toContain(table);
  });
  it('never lists a structural field', () => {
    const structural = ['id', 'order', 'doi', 'pmid', 'orcid', 'date', 'year', 'image', 'pdf', 'homepage', 'repository', 'people', 'tags'];
    for (const fields of Object.values(TRANSLATABLE)) {
      for (const f of fields) expect(structural).not.toContain(f);
    }
  });
  it('never lists tags.tag, which is a reference key and a slug', () => {
    expect(TRANSLATABLE.tags).not.toContain('tag');
  });
  it('recognises a translatable table', () => {
    expect(isTranslatable('people')).toBe(true);
  });
  it('rejects a bibliographic table', () => {
    expect(isTranslatable('publications')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run site/lib/i18n/sha.test.ts site/lib/i18n/content.test.ts site/lib/i18n/fields.test.ts`
Expected: FAIL, unresolved imports.

- [ ] **Step 3: Write the three modules**

`site/lib/i18n/sha.ts`:

```ts
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
```

`site/lib/i18n/fields.ts`:

```ts
/**
 * The one registry of which <table>.<field> carries translatable prose.
 * Read by the overlay (content.ts), by `npm run i18n:check`
 * (scripts/lib/i18n-check.ts) and by the translate-de skill, so the three
 * can never disagree about what is translatable.
 *
 * Deliberately absent:
 *  - every bibliographic table (publications, posters, presentations,
 *    abstracts, panels): a paper's title is its citation identity.
 *  - tags.tag: it is simultaneously a reference key, a slug, a chart series
 *    name and a filter value. Only its display label is German, via the
 *    tags.label.* keys of the UI catalog.
 *  - names, institutions, funders and place names, which stay as written.
 */
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

export type TranslatableTable = keyof typeof TRANSLATABLE;

export function isTranslatable(table: string): table is TranslatableTable {
  return Object.hasOwn(TRANSLATABLE, table);
}
```

`site/lib/i18n/content.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { DEFAULT_LOCALE, type Locale } from './locales';
import type { TranslatableTable } from './fields';

export interface CatalogEntry { sha: string; text: string | string[] }
/** row id -> field name -> entry */
export type Catalog = Record<string, Record<string, CatalogEntry>>;

const cache = new Map<string, Catalog>();

/**
 * The translation catalog for one table. A missing file is an empty
 * catalog, not an error: translation lags English by design, and every
 * lookup falls back to the English source.
 */
export function loadCatalog(locale: Locale, table: TranslatableTable): Catalog {
  if (locale === DEFAULT_LOCALE) return {};
  const key = `${locale}/${table}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const file = path.join(process.cwd(), 'i18n', locale, `${table}.yml`);
  const catalog = fs.existsSync(file) ? ((load(fs.readFileSync(file, 'utf8')) ?? {}) as Catalog) : {};
  cache.set(key, catalog);
  return catalog;
}

/**
 * Overlay the translated fields onto the English rows. Returns new objects
 * in the original order; a row or field with no entry keeps its English
 * value, so a lagging translation degrades to English rather than to a
 * blank.
 */
export function localize<T extends { id: string }>(rows: T[], catalog: Catalog, fields: readonly string[]): T[] {
  return rows.map((row) => {
    const entries = catalog[row.id];
    if (!entries) return row;
    let out: T | undefined;
    for (const field of fields) {
      const entry = entries[field];
      if (!entry || entry.text === '' || entry.text == null) continue;
      out ??= { ...row };
      (out as Record<string, unknown>)[field] = entry.text;
    }
    return out ?? row;
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run site/lib/i18n/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add site/lib/i18n/fields.ts site/lib/i18n/fields.test.ts site/lib/i18n/sha.ts site/lib/i18n/sha.test.ts site/lib/i18n/content.ts site/lib/i18n/content.test.ts
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Add the translatable-field registry, the source hash, and the overlay"
```

---

### Task 11: Wire the overlay into the data getters

**Files:**
- Modify: `site/lib/data.ts`
- Create: `site/lib/data.test.ts` (there is none today; `data.ts` was previously covered only through the page builds)
- Modify: every page under `site/pages/[...locale]/` and `site/lib/views.ts`'s `getTags` path

**Interfaces:**
- Consumes: `loadCatalog`, `localize`, `TRANSLATABLE`, `isTranslatable` from Task 10.
- Produces: every getter takes a `Locale`: `getPeople(locale)`, `getPublications(locale)`, `getProjects(locale)`, `getSoftware(locale)`, `getEditors(locale)`, `getFunding(locale)`, `getNews(locale)`, `getTeaching(locale)`, `getPresentations(locale)`, `getPosters(locale)`, `getAbstracts(locale)`, `getMeetings(locale)`, `getTags(locale)`, `getPeopleMap(locale)`.

- [ ] **Step 1: Write the failing test**

Create `site/lib/data.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { getNews, getPublications } from './data';

describe('the locale-aware getters', () => {
  it('returns English rows for the default locale', async () => {
    const news = await getNews('en');
    expect(news.length).toBeGreaterThan(0);
  });
  it('returns the same number of rows for German', async () => {
    const [en, de] = await Promise.all([getNews('en'), getNews('de')]);
    expect(de).toHaveLength(en.length);
  });
  it('keeps row order between locales', async () => {
    const [en, de] = await Promise.all([getNews('en'), getNews('de')]);
    expect(de.map((r) => r.id)).toEqual(en.map((r) => r.id));
  });
  it('leaves a bibliographic title in English on the German tree', async () => {
    const [en, de] = await Promise.all([getPublications('en'), getPublications('de')]);
    expect(de.map((p) => p.title)).toEqual(en.map((p) => p.title));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run site/lib/data.test.ts`
Expected: FAIL, "Expected 1 arguments, but got 0" or a type error from `astro check`.

- [ ] **Step 3: Modify data.ts**

```ts
import { loadCatalog, localize } from './i18n/content';
import { isTranslatable, TRANSLATABLE } from './i18n/fields';
import type { Locale } from './i18n/locales';

async function all<K extends keyof CollectionData & CollectionKey>(key: K, locale: Locale): Promise<Entry<CollectionData[K]>[]> {
  const entries = await getCollection(key);
  const rows = entries
    .slice()
    .sort((a, b) => (a.data as { order: number }).order - (b.data as { order: number }).order)
    .map((e) => plain(e));
  // The single choke point: every page, detail fragment, the search index
  // and the LLM files read through these getters, so the German overlay
  // reaches every surface without a second code path.
  if (!isTranslatable(key)) return rows;
  return localize(rows, loadCatalog(locale, key), TRANSLATABLE[key]);
}

export const getPeople = (locale: Locale) => all('people', locale);
export const getPublications = (locale: Locale) => all('publications', locale);
// ... the same for every getter
export async function getMeetings(locale: Locale) {
  return (await all('meetings', locale)).sort((a, b) => b.date.localeCompare(a.date));
}
```

`getTags` goes through `toTagInfo()` rather than `all()`, so overlay it explicitly before shaping:

```ts
export async function getTags(locale: Locale): Promise<TagInfo[]> {
  const raw = (await getCollection('tags')).map((t) => ({ ...(t.data as S.TagData), id: t.id }));
  const localized = localize(raw, loadCatalog(locale, 'tags'), TRANSLATABLE.tags);
  return toTagInfo(localized);
}
```

Note that `toTagInfo` must keep reading the untranslated `tag` field as the id and slug; only the three description fields change.

- [ ] **Step 4: Pass the locale from every page**

Each page already computes `const locale = localeFromParams(Astro.params)` from Task 2. Thread it into every getter call:

```ts
const [tagInfo, peopleMap, teaching] = await Promise.all([getTags(locale), getPeopleMap(locale), getTeaching(locale)]);
```

Verify none is missed:

```bash
npm run check
```

Expected: PASS, with no "Expected 1 arguments" errors.

- [ ] **Step 5: Run the suites**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Overlay the German catalogs in the data getters"
```

---

### Task 12: Per-locale search index

**Files:**
- Move: `site/pages/search.json.ts` to `site/pages/[...locale]/search.json.ts`
- Modify: it, to take the locale and use the catalog's type labels

**Interfaces:**
- Consumes: `localePaths`, `localeFromParams`, `uiFor`, the locale-aware getters.
- Produces: `/search.json` and `/de/search.json`.

- [ ] **Step 1: Move and convert**

```bash
git mv site/pages/search.json.ts "site/pages/[...locale]/search.json.ts"
```

Add to the top:

```ts
export const getStaticPaths = localePaths;

export const GET: APIRoute = async ({ params }) => {
  const locale = localeFromParams(params as { locale?: string });
  const { t } = uiFor(locale);
  // ... existing body, with every getter taking `locale` and the 14 record
  // type labels read from the catalog (t('searchType.publication'), etc.)
};
```

Fix the relative imports for the extra directory level, as in Task 2.

- [ ] **Step 2: Add the type-label keys and re-key the icon map**

Add a `searchType` group to `ui.en.ts` with the 14 existing labels verbatim: `publication`, `presentation`, `poster`, `abstract`, `project`, `software`, `funding`, `editorialRole`, `news`, `meeting`, `teaching`, `person`, `researchArea`, `page`.

`site/lib/search.ts` currently keys its icon map by the **English display label**:

```ts
export const SEARCH_TYPE_ICONS: Record<string, string> = {
  Publication: 'file-pdf-o', Presentation: 'desktop', /* ... */ 'Editorial role': 'pencil', /* ... */
};
```

German labels would therefore miss every icon. Give `SearchRecord` a stable slug beside its display label and key the map by the slug:

```ts
export interface SearchRecord { kind: string; type: string; title: string; text: string; url: string }

/** icon per record kind (Font Awesome 4 names, see site/icons). Keyed by the
 *  stable slug, never by the display label, which is translated. */
export const SEARCH_TYPE_ICONS: Record<string, string> = {
  publication: 'file-pdf-o', presentation: 'desktop', poster: 'image', abstract: 'file-text-o',
  project: 'cogs', software: 'code', funding: 'money', editorialRole: 'pencil', news: 'newspaper-o',
  meeting: 'users', teaching: 'graduation-cap', person: 'user', researchArea: 'flask', page: 'compass',
};
```

`search.json.ts` writes both fields: `kind` is the slug, `type` is `t(\`searchType.${kind}\`)`. Update the icon lookup in `SiteSearch.astro`'s script to read `record.kind`, and update the existing `search.test.ts` cases to carry a `kind`.

Add a test to `site/lib/search.test.ts`:

```ts
it('has an icon for every search kind', () => {
  const kinds = ['publication', 'presentation', 'poster', 'abstract', 'project', 'software',
    'funding', 'editorialRole', 'news', 'meeting', 'teaching', 'person', 'researchArea', 'page'];
  for (const kind of kinds) expect(SEARCH_TYPE_ICONS[kind], kind).toBeTruthy();
});
```

- [ ] **Step 3: Write the e2e test**

Append to `e2e/interactions.spec.ts`:

```ts
test('the German search index exists and drives the dialog', async ({ page }) => {
  await page.goto('de/');
  await page.keyboard.press('/');
  const dialog = page.locator('#site-search-modal');
  await expect(dialog).toBeVisible();
  await dialog.locator('input[type="search"]').fill('König');
  await expect(dialog.locator('.search-result').first()).toBeVisible();
});
```

- [ ] **Step 4: Verify**

```bash
npm run build
test -f dist/search.json && test -f dist/de/search.json && echo OK
npx astro preview --background && npm run e2e -- -g "German search"; npx astro preview stop
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Build a search index per locale"
```

---

# Phase 4: Guide, skill, check, and the first generation

### Task 13: `npm run i18n:check`

**Files:**
- Create: `scripts/lib/i18n-check.ts`, `scripts/lib/i18n-check.test.ts`
- Create: `scripts/i18n-check.ts`
- Modify: `package.json` (add the script), `.github/workflows/site.yml`

**Interfaces:**
- Consumes: `sourceSha`, `TRANSLATABLE`, `loadCatalog`.
- Produces: `interface Issue { kind: 'stale' | 'missing' | 'orphaned' | 'unknown-field'; table: string; id: string; field: string }`; `auditTable(rows: Record<string, unknown>[], catalog: Catalog, fields: readonly string[], table: string): Issue[]`; `formatIssues(issues: Issue[]): string`.

- [ ] **Step 1: Write the failing test**

Create `scripts/lib/i18n-check.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { sourceSha } from '../../site/lib/i18n/sha';
import { auditTable, formatIssues } from './i18n-check';

const rows = [
  { id: 'a', description: 'English A' },
  { id: 'b', description: 'English B' },
];
const fields = ['description'] as const;

describe('auditTable', () => {
  it('reports nothing when every entry is current', () => {
    const catalog = {
      a: { description: { sha: sourceSha('English A'), text: 'Deutsch A' } },
      b: { description: { sha: sourceSha('English B'), text: 'Deutsch B' } },
    };
    expect(auditTable(rows, catalog, fields, 'people')).toEqual([]);
  });

  it('reports a missing entry', () => {
    const catalog = { a: { description: { sha: sourceSha('English A'), text: 'Deutsch A' } } };
    expect(auditTable(rows, catalog, fields, 'people')).toEqual([
      { kind: 'missing', table: 'people', id: 'b', field: 'description' },
    ]);
  });

  it('reports a stale entry when the English source changed', () => {
    const catalog = {
      a: { description: { sha: sourceSha('something older'), text: 'Deutsch A' } },
      b: { description: { sha: sourceSha('English B'), text: 'Deutsch B' } },
    };
    expect(auditTable(rows, catalog, fields, 'people')).toEqual([
      { kind: 'stale', table: 'people', id: 'a', field: 'description' },
    ]);
  });

  it('reports an orphaned entry whose row is gone', () => {
    const catalog = {
      a: { description: { sha: sourceSha('English A'), text: 'Deutsch A' } },
      b: { description: { sha: sourceSha('English B'), text: 'Deutsch B' } },
      gone: { description: { sha: 'deadbeefdeadbeef', text: 'Deutsch' } },
    };
    expect(auditTable(rows, catalog, fields, 'people')).toContainEqual({
      kind: 'orphaned', table: 'people', id: 'gone', field: 'description',
    });
  });

  it('reports a catalog field outside the registry', () => {
    const catalog = {
      a: { description: { sha: sourceSha('English A'), text: 'Deutsch A' }, name: { sha: 'x', text: 'Nein' } },
      b: { description: { sha: sourceSha('English B'), text: 'Deutsch B' } },
    };
    expect(auditTable(rows, catalog, fields, 'people')).toContainEqual({
      kind: 'unknown-field', table: 'people', id: 'a', field: 'name',
    });
  });

  it('skips a row whose English source is empty', () => {
    expect(auditTable([{ id: 'a', description: '' }], {}, fields, 'people')).toEqual([]);
  });
});

describe('formatIssues', () => {
  it('says so when there is nothing to report', () => {
    expect(formatIssues([])).toContain('up to date');
  });
  it('names the table, id and field of an issue', () => {
    const out = formatIssues([{ kind: 'stale', table: 'people', id: 'koenig', field: 'description' }]);
    expect(out).toContain('people');
    expect(out).toContain('koenig');
    expect(out).toContain('description');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run scripts/lib/i18n-check.test.ts`
Expected: FAIL, "Failed to resolve import './i18n-check'".

- [ ] **Step 3: Write the audit core**

Create `scripts/lib/i18n-check.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run scripts/lib/i18n-check.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Write the runner**

Create `scripts/i18n-check.ts`, following the pattern of the other `scripts/*.ts` (run directly by Node 24, so imports carry `.ts`):

```ts
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { auditTable, formatIssues, type Issue } from './lib/i18n-check.ts';
import { TRANSLATABLE } from '../site/lib/i18n/fields.ts';
import { LOCALES, DEFAULT_LOCALE } from '../site/lib/i18n/locales.ts';
import type { Catalog } from '../site/lib/i18n/content.ts';

const root = process.cwd();
const readYaml = (file: string): unknown => (fs.existsSync(file) ? load(fs.readFileSync(file, 'utf8')) : null);

const issues: Issue[] = [];
for (const locale of LOCALES) {
  if (locale === DEFAULT_LOCALE) continue;
  for (const [table, fields] of Object.entries(TRANSLATABLE)) {
    const rows = (readYaml(path.join(root, 'data', `${table}.yml`)) ?? []) as Record<string, unknown>[];
    const catalog = (readYaml(path.join(root, 'i18n', locale, `${table}.yml`)) ?? {}) as Catalog;
    issues.push(...auditTable(rows, catalog, fields, `${locale}/${table}`));
  }
}

console.log(formatIssues(issues));
process.exit(issues.length === 0 ? 0 : 1);
```

`tags.yml` has no `id` column: its `tag` field is the id (see `content.config.ts`). Map it before auditing:

```ts
const rowsFor = (table: string, rows: Record<string, unknown>[]) =>
  table === 'tags' ? rows.map((r) => ({ ...r, id: r.tag })) : rows;
```

- [ ] **Step 6: Wire up the npm script only**

In `package.json` scripts: `"i18n:check": "node scripts/i18n-check.ts"`.

Do **not** touch `.github/workflows/site.yml` in this task. The check exits non-zero until the catalogs exist in Task 16, and wiring a deliberately-failing step into CI would leave the branch red across Tasks 14 and 15 for no signal. Task 16 adds the CI step once it passes.

- [ ] **Step 7: Run it**

Run: `npm run i18n:check`
Expected: exit 1, listing every missing entry (no data catalogs exist yet). That is the correct state before Task 16.

- [ ] **Step 8: Commit**

```bash
git add scripts/i18n-check.ts scripts/lib/i18n-check.ts scripts/lib/i18n-check.test.ts package.json
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Add npm run i18n:check to detect stale German catalogs"
```

---

### Task 14: The translation guide

**Files:**
- Create: `i18n/TRANSLATION.md`

- [ ] **Step 1: Write the guide**

Create `i18n/TRANSLATION.md`:

````markdown
# Translating this site into German

The English text is the source. German is generated into the catalogs under
`i18n/de/` and **never edited by hand**: the next run overwrites it.

Run `npm run i18n:check` to see what needs work. It compares a hash of each
English source against the `sha` recorded beside its German text, and reports
entries that are `missing`, `stale` (the English changed), `orphaned` (the row
is gone) or `unknown-field` (not in the registry).

## What is translated

`site/lib/i18n/fields.ts` is the registry. Nothing outside it is translated.

## What is never translated

- **Bibliographic records.** Publication, poster, presentation, abstract and
  panel titles, abstracts, authors, journals and event names stay in English.
  A paper's title is how it is cited and found; a German rendering matches
  nothing in the literature.
- **`tags.tag`.** It is a reference key, a slug, a chart series name and a
  filter value at once. Only its display label is German, in the UI catalog
  under `tags.label.*`.
- **Names of people, institutions and funders.** `Humboldt-Universität zu
  Berlin`, `BMFTR`, `de.NBI` stay exactly as written.
- **Identifiers and paths.** ids, DOIs, ORCIDs, PMIDs, URLs, image and PDF
  paths, dates.

## Corner cases

**HTML-bearing fields.** `news.abstract`, `news.short`, `people.description`,
`teaching.content`, `teaching.caption` and `teaching.funding` contain markup.
Translate the text nodes only. Keep every tag, attribute, `href` and `src`
byte-identical, and keep the same number of elements in the same order.

**Placeholders.** `{query}`, `{tag}`, `{date}`, `{n}` and friends must survive
verbatim, and must still make grammatical sense where German word order puts
them. Never translate the name inside the braces.

**Forms of address.** Use the formal `Sie`. The site addresses prospective
students and collaborators, not friends.

**Typography.** German quotation marks `„…"`, not `"…"`. Use `ß` where the
Duden does (`Schließen`, not `Schliessen`). No em dash anywhere - a plain `-`,
matching the English side.

**Academic roles.** Use the official German terms, not literal translations:

| English | German |
|---|---|
| Group Leader | Gruppenleiter |
| PhD student | Doktorand / Doktorandin |
| Postdoc | Postdoktorand / Postdoktorandin |
| Master Thesis | Masterarbeit |
| Bachelor Thesis | Bachelorarbeit |
| Internship | Praktikum |
| Student Assistant | Studentische Hilfskraft |
| Technical Assistant | Technische Assistentin (TA) |

Some `people.role` values are already German in `data/people.yml`. Keep them
as they are rather than "correcting" them.

**Domain glossary.**

| English | German |
|---|---|
| digital twin | digitaler Zwilling |
| systems medicine | Systemmedizin |
| systems biology | Systembiologie |
| liver | Leber |
| metabolism | Stoffwechsel |
| hepatic | hepatisch |
| whole-slide image | Ganzschnittbild |
| digital pathology | digitale Pathologie |
| pharmacokinetics | Pharmakokinetik |
| physiologically based | physiologiebasiert |
| open science | Open Science (unübersetzt) |
| FAIR data | FAIR-Daten |
| machine learning | maschinelles Lernen |
| research area | Forschungsbereich |
| peer-reviewed | begutachtet |
| open access | Open Access (unübersetzt) |
| preprint | Preprint (unübersetzt) |
| grant | Förderung |
| funding | Förderung |
| teaching | Lehre |
| course | Kurs |
| lecture | Vorlesung |
| seminar | Seminar |

Established English terms that the German-language field itself uses
(Open Science, Open Access, Preprint, Repository, Commit, Release) stay
English.

**Dates.** `date_display` in the data holds English formatting and is **not**
translated; `site/lib/i18n/dates.ts` reformats dates for display. Leave it
alone.

**Source variant.** The English side is US English: `-ize`, `color`, `center`.
Do not "fix" it to British spelling.

## The legal pages

`i18n/de/pages/impressum.yml` and `i18n/de/pages/privacy.yml` are the
**source**: they are authored in German because the German text is the legally
binding one. Their English counterparts under `i18n/en/pages/` are generated
from them, in the opposite direction from everything else. Translate the legal
text faithfully and add nothing; the generated English page already carries a
line saying only the German version is binding.
````

- [ ] **Step 2: Commit**

```bash
git add i18n/TRANSLATION.md
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Add the German translation guide"
```

---

### Task 15: The translate-de skill

**Files:**
- Create: `.claude/skills/translate-de/SKILL.md`

- [ ] **Step 1: Write the skill**

Create `.claude/skills/translate-de/SKILL.md`:

````markdown
---
name: translate-de
description: Use when German translations need regenerating - after editing English prose in data/*.yml or site/lib/i18n/ui.en.ts, when `npm run i18n:check` reports stale or missing entries, or when asked to update the German version of the site.
---

# Regenerating the German catalogs

The English text is the source. German lives in `i18n/de/` and is generated.
Never hand-edit a German catalog outside this workflow, and never edit
`data/*.yml` to make a translation fit.

## Steps

1. **Read the guide.** `i18n/TRANSLATION.md` holds the glossary and every
   corner-case rule. Follow it exactly; it is the reason this is a skill and
   not a one-line prompt.

2. **Find the work.**

   ```bash
   npm run i18n:check
   ```

   It lists `missing`, `stale`, `orphaned` and `unknown-field` entries per
   table. Translate **only** what it lists. Do not re-translate entries it
   does not mention: they are current, and rewriting them produces churn in
   the diff for no gain.

3. **Read the English source** for each listed entry from `data/<table>.yml`
   (or `site/lib/i18n/ui.en.ts` for UI keys).

4. **Write the German** into `i18n/de/<table>.yml`, computing the `sha` for
   each entry with:

   ```bash
   node -e "import('./site/lib/i18n/sha.ts').then(m => console.log(m.sourceSha(process.argv[1])))" "<the exact English source>"
   ```

   Keep the file's `AUTO-GENERATED` header. Entry shape:

   ```yaml
   <row id>:
     <field>:
       sha: <16 hex chars of the English source>
       text: <the German text>
   ```

   Delete `orphaned` entries. Delete `unknown-field` entries: a field outside
   `site/lib/i18n/fields.ts` must not be in a catalog.

5. **Mind the YAML indentation rule.** `js-yaml` follows YAML 1.2 and rejects
   a multi-line quoted string whose continuation lines are flush with their
   key. Indent them deeper, or run `uv run python scripts/reindent_yaml.py`.

6. **Verify.**

   ```bash
   npm run i18n:check   # must exit 0
   npm run check && npm test && npm run build
   ```

7. **Commit** the catalogs only. If `npm run i18n:check` still reports
   anything, go back to step 2 rather than committing.

## Never

- Never translate a bibliographic field. If a catalog gains one, the check
  reports `unknown-field`; delete it.
- Never change an `id`, a URL, a DOI, an image path or a date.
- Never alter the markup inside an HTML-bearing field.
- Never drop or rename a `{placeholder}`.
````

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/translate-de/SKILL.md
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Add the translate-de skill"
```

---

### Task 16: Generate the German catalogs

**Files:**
- Create: `i18n/de/<table>.yml` for all 10 translatable tables
- Modify: `i18n/de/ui.yml` (real shas, full key set)
- Modify: `data/teaching.yml`, `site/lib/schemas.ts`, `src/data.py`, `tests/` (retire `title_german`)

- [ ] **Step 1: Seed the teaching catalog from `title_german`**

`data/teaching.yml` already holds hand-written German titles for all 10 rows. Move them into `i18n/de/teaching.yml` as the `title` field, with the sha of the English `title`:

```bash
node -e "
const fs=require('fs'), yaml=require('js-yaml');
const rows=yaml.load(fs.readFileSync('data/teaching.yml','utf8'));
const {createHash}=require('crypto');
const sha=(v)=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v),'utf8').digest('hex').slice(0,16);
const out={};
for (const r of rows) if (r.title_german) out[r.id]={title:{sha:sha(r.title),text:r.title_german}};
fs.mkdirSync('i18n/de',{recursive:true});
fs.writeFileSync('i18n/de/teaching.yml','# AUTO-GENERATED by .claude/skills/translate-de. Do not edit by hand.\n'+yaml.dump(out,{lineWidth:100}));
"
```

- [ ] **Step 2: Retire `title_german`**

Remove the field from `data/teaching.yml` (all 10 rows), from `teachingSchema` in `site/lib/schemas.ts`, and from the `Teaching` model in `src/data.py`. Grep for any remaining reference:

```bash
grep -rn "title_german" --exclude-dir=node_modules --exclude-dir=.git . || echo "clean"
```

Then validate:

```bash
uv run python -m src.data && uv run pytest tests/
```

Expected: PASS.

- [ ] **Step 3: Run the skill for everything else**

Invoke the `translate-de` skill. It reads `i18n/TRANSLATION.md`, runs `npm run i18n:check`, and fills in the remaining catalogs: the 10 data tables and the full `i18n/de/ui.yml` key set with real shas.

- [ ] **Step 4: Verify**

```bash
npm run i18n:check          # exit 0
npm run check && npm test && npm run build
```

Spot-check the German tree renders German prose while keeping paper titles English:

```bash
grep -q 'Publikationen' dist/de/index.html && echo "nav OK"
node -e "
const fs=require('fs');
const en=fs.readFileSync('dist/publications/index.html','utf8');
const de=fs.readFileSync('dist/de/publications/index.html','utf8');
const title=en.match(/<a[^>]*data-detail=\"publication:[^\"]*\"[^>]*>([^<]{20,})</)?.[1];
console.log(title && de.includes(title) ? 'paper titles still English: OK' : 'FAIL');
"
```

- [ ] **Step 5: Wire the drift guard into CI**

Now that `npm run i18n:check` passes, add it to `.github/workflows/site.yml` in the `build` job, before the `astro build` step:

```yaml
      - name: Check translation catalogs
        run: npm run i18n:check
```

Confirm it passes locally one more time: `npm run i18n:check && echo "exit 0"`.

- [ ] **Step 6: Run the e2e suite**

```bash
npx astro preview --background && npm run e2e; npx astro preview stop
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Generate the German translation catalogs and retire title_german"
```

---

# Phase 5: Legal pages

### Task 17: Move the legal prose into catalogs

**Files:**
- Create: `site/lib/i18n/pages.ts`, `site/lib/i18n/pages.test.ts`
- Create: `i18n/de/pages/impressum.yml`, `i18n/de/pages/privacy.yml` (sources, extracted from the current German pages)
- Modify: `site/pages/[...locale]/impressum.astro`, `privacy.astro`

**Interfaces:**
- Produces: `loadPage(locale: Locale, page: string): Record<string, string>` with English fallback, mirroring `loadCatalog`.

- [ ] **Step 1: Write the failing test**

Create `site/lib/i18n/pages.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { loadPage } from './pages';

describe('loadPage', () => {
  it('loads the German legal source', () => {
    expect(loadPage('de', 'impressum').heading).toBeTruthy();
  });
  it('loads the generated English rendering', () => {
    expect(loadPage('en', 'impressum').heading).toBeTruthy();
  });
  it('carries the binding-version notice in English', () => {
    expect(loadPage('en', 'impressum').bindingNotice).toContain('German');
  });
  it('returns an empty record for an unknown page rather than throwing', () => {
    expect(loadPage('en', 'nope')).toEqual({});
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run site/lib/i18n/pages.test.ts`
Expected: FAIL, "Failed to resolve import './pages'".

- [ ] **Step 3: Write pages.ts**

```ts
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { DEFAULT_LOCALE, type Locale } from './locales';

interface PageEntry { sha?: string; text: string }

const cache = new Map<string, Record<string, string>>();

/**
 * Long-form page prose that lives in a page rather than in data/*.yml.
 * Most pages are English-sourced; impressum and privacy are the exception
 * and are authored in German, with the English side generated (see
 * i18n/TRANSLATION.md).
 */
export function loadPage(locale: Locale, page: string): Record<string, string> {
  const key = `${locale}/${page}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const file = path.join(process.cwd(), 'i18n', locale, 'pages', `${page}.yml`);
  const raw = fs.existsSync(file) ? ((load(fs.readFileSync(file, 'utf8')) ?? {}) as Record<string, PageEntry>) : {};
  const flat: Record<string, string> = {};
  for (const [k, entry] of Object.entries(raw)) flat[k] = entry.text;
  // Fall back to the default locale so a page whose translation lags still
  // renders its full text.
  if (locale !== DEFAULT_LOCALE) {
    const base = loadPage(DEFAULT_LOCALE, page);
    for (const [k, v] of Object.entries(base)) flat[k] ??= v;
  }
  cache.set(key, flat);
  return flat;
}
```

- [ ] **Step 4: Extract the German legal prose**

Move every prose block out of the two `.astro` files into `i18n/de/pages/impressum.yml` and `privacy.yml`, keyed by a stable name (`heading`, `addressBlock`, `contactBlock`, `liability1`, …). Mark each file:

```yaml
# SOURCE. Authored in German; the English rendering is generated from this
# file by the translate-de skill. Edit the German here.
```

Render them from the pages:

```astro
---
const page = loadPage(locale, 'impressum');
---
<h2>{page.heading}</h2>
<p set:html={page.liability1} />
```

The German output of `/impressum/` and `/privacy/` must be byte-identical to before, apart from the tags now coming from the catalog.

- [ ] **Step 5: Verify**

```bash
npm run build
diff <(cat .superpowers/sdd/2026-09-17-internationalization/dist-baseline/impressum/index.html) <(cat dist/de/impressum/index.html) | head
```

Expected: only the chrome differs (German nav), not the legal prose.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Move the legal pages' German prose into source catalogs"
```

---

### Task 18: Generate the English legal pages

**Files:**
- Create: `i18n/en/pages/impressum.yml`, `i18n/en/pages/privacy.yml`
- Modify: `site/lib/i18n/ui.en.ts`, `i18n/de/ui.yml` (the binding notice)

- [ ] **Step 1: Add the binding-notice key**

In `ui.en.ts`:

```ts
  legal: {
    bindingNotice: 'This is a translation for convenience. Only the German version is legally binding.',
  },
```

and its German counterpart in `i18n/de/ui.yml` (rendered only on the German page if at all; keep the key for parity):

```yaml
legal.bindingNotice:
  sha: '<sha of the English source>'
  text: Nur die deutsche Fassung ist rechtlich verbindlich.
```

- [ ] **Step 2: Generate the English renderings**

Invoke the `translate-de` skill in its reverse direction for these two files, per the guide's "The legal pages" section: German source in `i18n/de/pages/`, English output in `i18n/en/pages/`.

- [ ] **Step 3: Render the notice**

In both pages, above the content, on the English tree only:

```astro
{locale !== 'de' && <p class="legal-notice">{t('legal.bindingNotice')}</p>}
```

with a `.legal-notice` rule in the `components` layer of `global.css` using the existing muted-text token.

- [ ] **Step 4: Verify**

```bash
npm run build
grep -q 'legally binding' dist/impressum/index.html && echo "notice OK"
grep -q 'legally binding' dist/de/impressum/index.html && echo "FAIL: notice on the German page" || echo "German page clean"
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Generate English renderings of the legal pages"
```

---

# Phase 6: LLM files and release

### Task 19: Bilingual llms.txt and llms-full.txt

**Files:**
- Modify: `site/lib/llms.ts`, `site/lib/llms.test.ts`
- Modify: `site/pages/llms.txt.ts`, `llms-full.txt.ts`, `robots.txt.ts`

**Interfaces:**
- Consumes: the locale-aware getters, `uiFor`.
- Produces: `llmsTxt(ctx): string` and `llmsFullTxt(ctxByLocale): string`, each emitting both languages in one file.

- [ ] **Step 1: Write the failing test**

Append to `site/lib/llms.test.ts`:

```ts
describe('bilingual output', () => {
  it('llms-full.txt carries an English and a German half', async () => {
    const out = await buildLlmsFull();
    expect(out).toContain('## Deutsch');
    expect(out.indexOf('## Deutsch')).toBeGreaterThan(0);
  });

  it('the German half links to /de/ URLs', async () => {
    const out = await buildLlmsFull();
    const german = out.slice(out.indexOf('## Deutsch'));
    expect(german).toContain('/de/publications/');
  });

  it('the English half never links to /de/', async () => {
    const out = await buildLlmsFull();
    const english = out.slice(0, out.indexOf('## Deutsch'));
    expect(english).not.toContain('/de/');
  });

  it('llms.txt lists both language homepages', async () => {
    const out = await buildLlms();
    expect(out).toContain('/de/');
    expect(out).toMatch(/^# /m);
  });

  it('llms.txt keeps ## Optional last', async () => {
    const out = await buildLlms();
    const headings = [...out.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(headings.at(-1)).toBe('Optional');
  });

  it('renders a real paper title in English in BOTH halves, untranslated', async () => {
    // Read a real title from the data rather than hard-coding a fragment, so
    // the test keeps meaning something as publications.yml grows.
    const publications = load(fs.readFileSync('data/publications.yml', 'utf8')) as { title: string }[];
    const title = publications.find((p) => p.title.length > 40)!.title;

    const out = await buildLlmsFull();
    const split = out.indexOf('## Deutsch');
    const english = out.slice(0, split);
    const german = out.slice(split);

    // The same English string, byte for byte, on both sides: bibliographic
    // records are never translated.
    expect(english).toContain(title);
    expect(german).toContain(title);
  });
});
```

Add `buildLlms`/`buildLlmsFull` test helpers beside the existing ones, building the context from the real YAML the way the current tests do.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run site/lib/llms.test.ts`
Expected: FAIL, "expected … to contain '## Deutsch'".

- [ ] **Step 3: Implement**

Give `llmsFullTxt` a per-locale context and render the sections twice:

```ts
export function llmsFullTxt(contexts: Record<Locale, LlmsContext>): string {
  const english = renderSections(contexts.en, 'en');
  const german = renderSections(contexts.de, 'de');
  return [english, '', '## Deutsch', '', german].join('\n');
}
```

`renderSections` is the current body, parameterised by locale so its 15 section headings and 15 field labels come from the catalog and its links from `localeUrl(locale, …)`. `llmsTxt` gains a link to both language homepages in its index and keeps `## Optional` last.

In `robots.txt.ts`, keep the single `Disallow: /detail/` and add `Disallow: /de/detail/`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run site/lib/llms.test.ts`
Expected: PASS.

- [ ] **Step 5: Verify the built files**

```bash
npm run build
grep -c '## Deutsch' dist/llms-full.txt          # expect 1
grep -q 'Disallow: /de/detail/' dist/robots.txt && echo OK
wc -c dist/llms-full.txt
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Carry both languages in llms.txt and llms-full.txt"
```

---

### Task 20: Full-suite verification and release 0.11.0

**Files:**
- Modify: `package.json`, `pyproject.toml`, `package-lock.json`, `uv.lock`
- Create: `release-notes/0.11.0.md`

- [ ] **Step 1: Run everything**

```bash
uv run python -m src.data
uv run pytest tests/
npm run check
npm test
npm run i18n:check
npm run build
npx astro preview --background && npm run e2e; npx astro preview stop
```

Expected: all PASS. Do not proceed past a failure.

- [ ] **Step 2: Add the German e2e coverage**

Append to `e2e/pages.spec.ts`:

```ts
const PAGES = ['', 'publications/', 'projects/', 'research/', 'people/', 'news/', 'teaching/', 'meetings/', 'network/', 'cv/', 'impressum/', 'privacy/'];

for (const p of PAGES) {
  test(`the German page /de/${p} renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    const response = await page.goto(`de/${p}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.locator('.lang-switch-link[lang="en"]')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('hreflang alternates point at pages that exist', async ({ page, request }) => {
  await page.goto('publications/');
  const hrefs = await page.locator('link[rel="alternate"]').evaluateAll((ls) =>
    ls.map((l) => (l as HTMLLinkElement).href),
  );
  expect(hrefs).toHaveLength(3);
  for (const href of hrefs) {
    expect((await request.get(href)).status()).toBe(200);
  }
});
```

Run: `npm run build && npx astro preview --background && npm run e2e; npx astro preview stop`
Expected: PASS.

- [ ] **Step 3: Bump the version**

```bash
npm version 0.11.0 --no-git-tag-version
sed -i 's/^version = ".*"/version = "0.11.0"/' pyproject.toml
npm install --package-lock-only
uv lock
```

- [ ] **Step 4: Write the release notes**

Create `release-notes/0.11.0.md`:

```markdown
# 0.11.0

## Internationalization (EN/DE)

The site is now available in US English (the default, at the root) and German
(under `/de/`), with a language switch in the navbar that keeps the current
page and any open detail modal.

- Every page renders from one source file under `site/pages/[...locale]/`, so
  both language trees stay in step.
- The roughly 500 UI strings moved into a typed catalog
  (`site/lib/i18n/ui.en.ts`); a German key that goes missing is now a build
  error rather than an English string leaking into a German page.
- The group's own prose - research areas, people, projects, software,
  funding, news, teaching, meetings, editors - is translated. Bibliographic
  records keep their English text: a paper's title is how it is cited and
  found.
- German lives in generated catalogs under `i18n/de/` and is never edited by
  hand. `npm run i18n:check` compares each German entry against a hash of its
  English source and fails CI when the two drift apart.
- The legal pages keep German as their source, since that version is the
  legally binding one, and their English rendering says so.
- `llms.txt` and `llms-full.txt` now carry both languages, and the sitemap and
  every page carry `hreflang` alternates.
```

- [ ] **Step 5: Final verification**

```bash
npm run check && npm test && npm run i18n:check && npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit and open the pull request**

```bash
git add -A
git commit --author="matthiaskoenig <konigmatt@googlemail.com>" -m "Release 0.11.0: EN/DE internationalization"
git push -u origin i18n
gh pr create --base main --title "Internationalization (EN/DE)" --body "$(cat <<'EOF'
Closes #63.

Adds a German version of the site under `/de/`, with English (US) staying the
default at the root and a language switch in the navbar.

Design: `docs/superpowers/specs/2026-09-17-internationalization-design.md`
Plan: `docs/superpowers/plans/2026-09-17-internationalization.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review

**Spec coverage.** Every section of the spec maps to a task: routing and the `[...locale]` restructure (Task 2), locale plumbing (Tasks 1, 2, 5), UI strings and the derived key type (Tasks 6 to 8), the four collapsed duplicates (Tasks 7 and 9), the field registry and overlay (Tasks 10, 11), per-locale search (Task 12), the drift guard (Task 13), the guide (Task 14), the generation workflow (Tasks 15, 16), `title_german` retirement (Task 16), the legal-page inversion (Tasks 17, 18), bilingual LLM files (Task 19), hreflang and sitemap alternates (Task 3), the switcher (Task 4), and the release (Task 20).

**Type consistency.** `Locale`, `TFn`, `UiKey`, `UiSlices`, `Catalog`, `CatalogEntry`, `Issue` and `TRANSLATABLE` keep the same names and shapes from the task that defines them through every later use. `sourceSha` is defined once (Task 10) and consumed by Tasks 13, 15 and 16. `localeUrl`/`switchPath`/`stripLocale` are defined in Task 1 and reused in Tasks 3, 4 and 19.

**Known ordering constraint.** Task 2 leaves `/de/search.json` missing until Task 12; the German search dialog shows its error state in between. This is called out in Task 2 Step 5 and covered by the Task 12 test.
