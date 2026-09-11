# Jekyll to Astro Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Jekyll build of livermetabolism.com with an Astro site that reproduces every page, URL, interaction, and visual of the current site, without Bootstrap, deployed to GitHub Pages by GitHub Actions.

**Architecture:** Astro (static output) reads the 17 YAML tables in `data/` through content collections with Zod schemas mirroring `src/data.py`. Pages and layout are `.astro`; every reusable piece (entry cards, badges, avatars, modals, filters, search, cookie banner) is a Vue 3 single-file component, rendered statically from `.astro` pages and hydrated as an island only where it is interactive. Styling is one Tailwind v4 stylesheet carrying the ported custom CSS. The old `app/` tree, Bootstrap, Sass, Docker, nginx, and all hand-written JS are deleted.

**Tech Stack:** Astro 7, @astrojs/vue 7 + Vue 3.5, Tailwind CSS 4 (Vite plugin), @astrojs/sitemap, js-yaml, Vitest 5 + @vue/test-utils + happy-dom, Playwright, Node 24, GitHub Actions + GitHub Pages. Python side unchanged (uv, pydantic, pytest).

**Spec:** `docs/superpowers/specs/2026-09-11-astro-migration-design.md`

## Global Constraints

- Feature parity only: same URLs (with trailing slashes: `/people/`, `/projects/`, …), same anchor ids (`#pub-<id>`, `#presentation-<id>`, `#poster-<id>`, `#abstract-<id>`, `#project-<id>`, `#project-modal-<id>`, `#news-<id>`, `#news-modal-<id>`, `#software-<id>`, `#funding-<id>`, `#editor-<id>`, `#meeting-<id>`, `#teaching-<id>`, `#person-modal-<id>`, `#current-members`, `#open-positions`, `#alumni`, `#software`, `#funding`, `#editors`, `#publications`, `#presentations`, `#posters`, `#abstracts`, `#home`, `#footer`, and the five tag slugs), same visible text, same CSS class names.
- No Bootstrap, Bootswatch, Sass, Font Awesome kit, or hand-written page scripts survive. Behaviour lives in Vue components only.
- YAML in `data/` is the single database; `src/data.py` stays the schema of record. Zod mirrors it, does not replace it.
- Astro source lives in `site/` (`srcDir: "./site"`) because `src/` is the Python package. Never create `src/content.config.ts`.
- Every internal link and asset URL goes through `url()`/`asset()` from `site/lib/url.ts`, which prefix `import.meta.env.BASE_URL`, so the interim `matthiaskoenig.github.io/livermetabolism-site/` deployment works.
- All Vue components are written for server rendering first: no `window`/`document` access outside `onMounted`.
- Astro 7 uses the Rust compiler: every tag must be closed, and `compressHTML: true` (HTML whitespace rules, not the new `'jsx'` default) is set so inline spacing survives.
- Node `>=22` (Astro 6+ requirement); the machine has Node 24.19.
- Commit after every task on the `astro-migration` branch. `main` is protected; the work lands via one pull request at the end (Task 20).
- Panels, activities, and LinkedIn posts have no page today (only the Python CV uses them). They get collections and schemas but no components. This is parity, and the spec's `PanelRow`/`ActivityRow` components are therefore not built.

## Reference material the engineer must use

- `web/` holds the last Jekyll build (gitignored, on disk). `web/assets/css/main.css` is the compiled stylesheet: when a colour or size is in doubt, grep the selector there and copy the computed value.
- `app/` (until Task 19 deletes it) holds the Liquid templates. Each page task names the template it ports.
- Font Awesome Free 6 SVGs: `https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/<style>/<name>.svg`.

## File map

| Path | Responsibility |
|---|---|
| `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts` | Toolchain |
| `data/*.yml` | The 17 YAML tables (moved from `app/_data`) |
| `public/assets/…`, `public/favicon.ico` | Static files served at `/assets/…` (moved from `app/assets`) |
| `assets_src/image/…`, `assets_src/pdf/poster/…` | Raster masters, not served |
| `site/content.config.ts` | Collection definitions (loaders + reference() wiring) |
| `site/lib/schemas.ts` | Zod schemas (plain, testable, mirror `src/data.py`) |
| `site/lib/text.ts` | `slugify`, `stripHtml`, `truncateWords`, `capitalize`, `escapeHtml` |
| `site/lib/url.ts` | `url()`, `asset()` base-path helpers |
| `site/lib/people.ts` | `personChips()`, `avatarPeople()` |
| `site/lib/views.ts` | Pure grouping/sorting: `groupByYear`, `alumniByYear`, `crossRefs`, `tagCounts` |
| `site/lib/data.ts` | `getCollection()` glue producing plain view objects for pages |
| `site/lib/icons.ts` | `iconSvg(name)` from `site/icons/*.svg` |
| `site/lib/modals.ts` | `installModalRouter()`, `openModal()`, `closeModal()` |
| `site/lib/tagFilter.ts` | `useTagFilter()` composable |
| `site/lib/consent.ts` | consent storage + GA loader (pure functions) |
| `site/lib/search.ts` | `scoreRecord()`, `rankRecords()` |
| `site/icons/*.svg` | Downloaded FA6 glyphs named by FA4 name |
| `site/styles/global.css` | Tailwind import, `@theme`, base, components |
| `site/layouts/Base.astro` | Page shell |
| `site/components/*.astro` | `Head`, `TopNav`, `Footer`, `CoreMessages` |
| `site/components/*.vue` | Everything reusable (see Task list) |
| `site/pages/*.astro`, `site/pages/search.json.ts` | Routes |
| `e2e/*.spec.ts`, `e2e/screenshots.ts` | Playwright |
| `.github/workflows/site.yml` | validate → build → deploy |
| `scripts/fetch-icons.sh` | Icon download |

## Conventions for every task

- Run all commands from the repository root.
- `npm run build` must pass before every commit from Task 2 on; `uv run pytest tests/` and `uv run python -m src.data` before every commit that touches `data/`, `src/`, or `tests/`.
- Commit messages: imperative subject, then the two attribution lines:

```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EACGN79i4sGkmxT67hQuRJ
```

---

### Task 1: Branch model — `main`, no `develop`, ruleset

**Files:** none in the tree (repository settings + git refs).

**Interfaces:**
- Produces: default branch `main`; feature branch `astro-migration` checked out for all following tasks.

- [ ] **Step 1: Bring the spec commit onto master and rename**

```bash
git checkout master
git pull --ff-only origin master
git merge --ff-only spec/astro-migration
git branch -m master main
git push -u origin main
```

Expected: `origin/main` exists with the spec commit on top.

- [ ] **Step 2: Switch the default branch on GitHub (browser, no CLI available)**

Open `https://github.com/matthiaskoenig/livermetabolism-site/settings`, section "Default branch", switch to `main`, confirm.

- [ ] **Step 3: Delete the old branches**

```bash
git push origin --delete master
git push origin --delete develop
git branch -D develop
git branch -d spec/astro-migration
git remote set-head origin -a
git branch -a
```

Expected: only `main` and `remotes/origin/main` remain (`remotes/origin/HEAD -> origin/main`).

- [ ] **Step 4: Create the `main` ruleset (browser)**

`Settings → Rules → Rulesets → New ruleset → New branch ruleset`:

| Field | Value |
|---|---|
| Ruleset name | `main` |
| Enforcement status | Active |
| Bypass list | empty |
| Target branches | Add target → Include default branch |
| Restrict deletions | checked |
| Require linear history | checked |
| Require a pull request before merging | checked; Required approvals `0`; Dismiss stale pull request approvals when new commits are pushed: checked; Require conversation resolution before merging: checked; Allowed merge methods: Squash, Rebase (uncheck Merge) |
| Block force pushes | checked |
| Require status checks to pass | leave unchecked for now (Task 21 adds `validate` and `build` once the workflow exists on `main`) |

Save. Verify with:

```bash
curl -s https://api.github.com/repos/matthiaskoenig/livermetabolism-site/rulesets | python3 -c "import sys,json; print([r['name'] for r in json.load(sys.stdin)])"
```

Expected: `['main']`.

- [ ] **Step 5: Start the feature branch**

```bash
git checkout -b astro-migration
```

---

### Task 2: Astro scaffold that builds

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `site/styles/global.css` (minimal, expanded in Task 7), `site/pages/index.astro` (placeholder, replaced in Task 11)
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm run dev|build|preview|check|test`, `import.meta.env.BASE_URL` semantics (always ends with `/` because `trailingSlash: 'always'`).

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "livermetabolism-site",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "e2e": "playwright test",
    "fetch-icons": "bash scripts/fetch-icons.sh"
  },
  "dependencies": {
    "@astrojs/sitemap": "^3.7.4",
    "@astrojs/vue": "^7.0.2",
    "@tailwindcss/vite": "^4.3.3",
    "astro": "^7.3.2",
    "js-yaml": "^4.1.0",
    "tailwindcss": "^4.3.3",
    "vue": "^3.5.42"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.10",
    "@playwright/test": "^1.63.0",
    "@types/js-yaml": "^4.0.9",
    "@vue/test-utils": "^2.5.0",
    "happy-dom": "^20.14.3",
    "typescript": "^5.9.0",
    "vitest": "^5.0.0"
  }
}
```

- [ ] **Step 2: Write `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// SITE/BASE are set by .github/workflows/site.yml for GitHub Pages
// (https://matthiaskoenig.github.io + /livermetabolism-site/); the
// defaults serve local development. When the custom domain is attached,
// the workflow sets SITE=https://livermetabolism.com and BASE=/.
const site = process.env.SITE ?? 'http://localhost:4321';
const base = process.env.BASE ?? '/';

export default defineConfig({
  site,
  base,
  srcDir: './site',
  output: 'static',
  trailingSlash: 'always',
  // Astro 7 defaults to 'jsx' whitespace rules, which drop the spaces
  // between adjacent inline elements (icons next to text, author chips).
  compressHTML: true,
  integrations: [vue(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "site/**/*", "e2e/**/*", "vitest.config.ts", "playwright.config.ts"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 4: Write `vitest.config.ts`**

```ts
/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'happy-dom',
    include: ['site/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Write the minimal stylesheet and placeholder page**

`site/styles/global.css`:

```css
@import "tailwindcss";
```

`site/pages/index.astro`:

```astro
---
import '../styles/global.css';
---
<html lang="en">
  <head><meta charset="utf-8" /><title>scaffold</title></head>
  <body><h1>scaffold</h1></body>
</html>
```

- [ ] **Step 6: Update `.gitignore`**

Replace the whole file with:

```
*~
.Rhistory
.idea
.venv
__pycache__/
.pytest_cache/
node_modules/
dist/
.astro/
playwright-report/
test-results/
e2e/screenshots/
src/cv/results/
web/
```

(`Gemfile.lock`, `.sass-cache`, `app/vendor/`, `logs`, `livermetabolism` are dropped. `web/` stays ignored: it is the last Jekyll build and the visual reference for Task 19.)

- [ ] **Step 7: Install and build**

```bash
npm install
npm run build
ls dist
```

Expected: `dist/index.html` exists, build log ends with "Complete!". `package-lock.json` is created; commit it.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts site/ .gitignore
git commit -m "Scaffold Astro project with Vue, Tailwind, sitemap"
```

---

### Task 3: Move data and assets; point Python at the new paths

**Files:**
- Move: `app/_data/` → `data/`; `app/assets/` → `public/assets/`; `app/favicon.ico` → `public/favicon.ico`; raster masters → `assets_src/`
- Modify: `src/data.py:36-39`, `src/data.py:590-600`, `src/data.py:663-705`, `src/cv/list_of_*.py` (7 path expressions), `tests/test_load_yaml.py:181-235`

**Interfaces:**
- Produces: `data/<table>.yml` at repo root; `public/assets/image/...`, `public/assets/pdf/...`; `src.data.DATA_DIR == REPO_ROOT / "data"`, `src.data.PUBLIC_DIR == REPO_ROOT / "public"`, `load_database(data_dir=DATA_DIR, public_dir=PUBLIC_DIR)`.

- [ ] **Step 1: Move the tables and served assets**

```bash
git mv app/_data data
mkdir -p public
git mv app/assets public/assets
git mv app/favicon.ico public/favicon.ico
```

- [ ] **Step 2: Move the raster masters out of the served tree**

```bash
cd public/assets/image
find . -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.gif' \) -print0 |
  while IFS= read -r -d '' f; do
    mkdir -p "../../../assets_src/image/$(dirname "$f")"
    git mv "$f" "../../../assets_src/image/$f"
  done
cd ../pdf/poster
mkdir -p ../../../../assets_src/pdf/poster
find . -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0 |
  while IFS= read -r -d '' f; do git mv "$f" "../../../../assets_src/pdf/poster/$f"; done
cd ../../../..
find public/assets/image -type f | sed 's/.*\.//' | sort | uniq -c
find assets_src -type f | wc -l
```

Expected: the first count lists only `webp` (215) and `svg` (1); the second is 291 (275 image masters + 16 poster rasters). `public/assets/favicon/*.png` are untouched (they are not under `image/`).

- [ ] **Step 3: Update `src/data.py` paths**

Replace lines 36–39:

```python
REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"
# static files served at /assets/... on the site; image/pdf existence is
# checked relative to this directory
PUBLIC_DIR = REPO_ROOT / "public"
```

In `_check_references` (around line 595) replace `APP_DIR` with `PUBLIC_DIR`:

```python
        app_dir: Path = (info.context or {}).get("app_dir", PUBLIC_DIR)
```

Change the `load_database` signature and context (around lines 663 and 703):

```python
def load_database(data_dir: Path = DATA_DIR, public_dir: Path = PUBLIC_DIR) -> Database:
    """Load every ``data/*.yml`` file into a validated `Database`.
    ...
```

```python
            context={"app_dir": public_dir},
```

Then fix the docstrings:

```bash
sed -i 's#app/_data/#data/#g; s#``app/_data``#``data``#g; s#under ``app/assets/``#under ``public/assets/``#g' src/data.py
grep -n "app" src/data.py
```

Expected: the remaining hits are the `app_dir` context key and comments about "the app/ dir"; edit those comments to say `public/`.

- [ ] **Step 4: Update the CV generators and the test fixture**

```bash
sed -i 's#/ "app" / "_data" /#/ "data" /#' src/cv/list_of_*.py
grep -n '"app"' src/cv/*.py   # expected: no output
sed -i 's#load_database(data_dir)#load_database(data_dir, public_dir=data_dir.parent)#' tests/test_load_yaml.py
grep -n "load_database(" tests/test_load_yaml.py
```

Expected: every call in `tests/test_load_yaml.py` now passes `public_dir=data_dir.parent`. The fixture at lines 181–185 already creates `assets/` under `data_dir.parent`, so it keeps working.

- [ ] **Step 5: Validate**

```bash
uv run python -m src.data
uv run pytest tests/ -q
npm run build
```

Expected: `✓ loaded and validated … entries across 16 tables`; pytest all green; build fine (the placeholder page does not touch data yet).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Move YAML tables to data/ and served assets to public/, keep raster masters aside"
```

---

### Task 4: Zod schemas and content collections

**Files:**
- Create: `site/lib/schemas.ts`, `site/lib/schemas.test.ts`, `site/content.config.ts`

**Interfaces:**
- Produces: one `*Schema` per table in `schemas.ts` with output types `PersonData`, `PublicationData`, `ProjectData`, `SoftwareData`, `EditorData`, `FundingData`, `NewsData`, `TeachingData`, `PresentationData`, `PosterData`, `PanelData`, `AbstractData`, `MeetingData`, `ActivityData`, `LinkedInData`, `TagData`, `CountryFlagData`. All dates are ISO `YYYY-MM-DD` strings (or `null`), all list fields are `string[]`, every optional scalar is `string | null | undefined`.
- Produces: collections `tags`, `countryFlags`, `people`, `publications`, `projects`, `software`, `editors`, `funding`, `news`, `teaching`, `presentations`, `posters`, `panels`, `abstracts`, `meetings`, `activities`, `linkedin` in `content.config.ts`, where `tags`/`people`/`publications` list fields are `reference()` objects `{ collection, id }`.

- [ ] **Step 1: Write the failing schema test**

`site/lib/schemas.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import * as s from './schemas';

const TABLES = {
  people: s.personSchema,
  publications: s.publicationSchema,
  projects: s.projectSchema,
  software: s.softwareSchema,
  editors: s.editorSchema,
  funding: s.fundingSchema,
  news: s.newsSchema,
  teaching: s.teachingSchema,
  presentations: s.presentationSchema,
  posters: s.posterSchema,
  panels: s.panelSchema,
  abstracts: s.abstractSchema,
  meetings: s.meetingSchema,
  activities: s.activitySchema,
  linkedin: s.linkedInSchema,
  tags: s.tagSchema,
} as const;

function rows(name: string): Record<string, unknown>[] {
  return load(readFileSync(`data/${name}.yml`, 'utf8')) as Record<string, unknown>[];
}

describe('schemas mirror data/*.yml', () => {
  for (const [name, schema] of Object.entries(TABLES)) {
    it(`parses every row of ${name}.yml`, () => {
      const raw = rows(name);
      const parsed = schema.array().parse(raw);
      expect(parsed).toHaveLength(raw.length);
    });
  }

  it('parses country_flags.yml as a map', () => {
    const raw = load(readFileSync('data/country_flags.yml', 'utf8')) as Record<string, string>;
    expect(s.countryFlagsSchema.parse(raw)).toEqual(raw);
  });

  it('renders dates as YYYY-MM-DD strings', () => {
    const pub = s.publicationSchema.parse({
      id: 'x', year: 2026, date: new Date('2026-09-05T00:00:00Z'), authors: 'A', title: 'T',
      journal: 'J', status: 'publication', position: 'first',
    });
    expect(pub.date).toBe('2026-09-05');
    const pub2 = s.publicationSchema.parse({ ...pub, date: '2026-01-02' });
    expect(pub2.date).toBe('2026-01-02');
  });

  it('turns blank and null list fields into []', () => {
    const p = s.projectSchema.parse({ id: 'p', title: 't', status: 'current', abstract: 'a', tags: null, people: null, images: 'one.webp' });
    expect(p.tags).toEqual([]);
    expect(p.people).toEqual([]);
    expect(p.images).toEqual(['one.webp']);
  });

  it('rejects unknown keys like the pydantic StrictModel', () => {
    expect(() => s.personSchema.parse({ id: 'a', status: 'current', tenure: '2020-', name: 'A', flag: 'x' })).toThrow();
  });

  it('cross-references resolve (people, tags, publications)', () => {
    const personIds = new Set(rows('people').map((r) => r.id as string));
    const tagNames = new Set(rows('tags').map((r) => r.tag as string));
    const pubIds = new Set(rows('publications').map((r) => r.id as string));
    const peopleLinked = ['publications', 'projects', 'software', 'news', 'teaching', 'presentations', 'posters', 'panels', 'abstracts', 'meetings'];
    const tagged = ['publications', 'projects', 'software', 'editors', 'funding', 'news', 'teaching', 'meetings', 'presentations', 'posters'];
    const pubLinked = ['projects', 'software', 'presentations', 'panels'];
    for (const t of peopleLinked) for (const r of rows(t)) for (const id of (r.people as string[] | null) ?? []) expect(personIds, `${t}:${r.id} person ${id}`).toContain(id);
    for (const t of tagged) for (const r of rows(t)) for (const tag of (r.tags as string[] | null) ?? []) expect(tagNames, `${t}:${r.id} tag ${tag}`).toContain(tag);
    for (const t of pubLinked) for (const r of rows(t)) for (const id of (r.publications as string[] | null) ?? []) expect(pubIds, `${t}:${r.id} publication ${id}`).toContain(id);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL, "Cannot find module './schemas'".

- [ ] **Step 3: Write `site/lib/schemas.ts`**

```ts
/**
 * Zod mirror of src/data.py. pydantic stays the schema of record; this
 * makes the Astro build fail on the same malformed data, with the same
 * normalisation: "" and null both mean "unset", a blank list field means
 * [], a bare scalar in a list field means a one-element list, unknown
 * keys are errors. Dates come out as ISO YYYY-MM-DD strings so every
 * value is a plain, serialisable island prop.
 */
import { z } from 'astro/zod';

const blankToNull = (v: unknown) => (v === '' ? null : v);
const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

export const optStr = z.preprocess(blankToNull, z.string().nullable().optional());
export const reqStr = z.preprocess(blankToNull, z.string());
export const optInt = z.preprocess(blankToNull, z.number().int().nullable().optional());
export const optNum = z.preprocess(blankToNull, z.number().nullable().optional());
export const strList = z.preprocess(
  (v) => (v == null || v === '' ? [] : Array.isArray(v) ? v : [v]),
  z.array(z.string()),
);
export const optDate = z
  .preprocess(blankToNull, z.coerce.date().nullable().optional())
  .transform((d) => (d ? toIsoDate(d) : null));
export const reqDate = z.coerce.date().transform(toIsoDate);

export const PersonStatus = z.enum(['current', 'alumni']);
export const ContentStatus = z.enum(['current', 'old']);
export const PublicationStatus = z.enum(['thesis', 'report', 'preprint', 'publication', 'review', 'proceeding', 'chapter', 'abstract']);
export const AuthorPosition = z.enum(['first', 'first_equal', 'index', 'last_equal', 'last']);
export const FundingRole = z.enum(['Recipient', 'Co-Investigator']);
export const TalkType = z.enum(['invited_talk', 'selected_talk']);
export const PanelType = z.enum(['panelist']);
export const SoftwareType = z.enum(['software', 'database']);
export const TeachingType = z.enum(['lecture', 'course', 'seminar']);

// `id` is optional here because Astro's file() loader may lift it out of
// the row; code always reads `entry.id`, never `entry.data.id`.
const id = z.string().optional();

export const tagSchema = z.object({
  id, tag: reqStr, icon: reqStr, short_description: reqStr, description: reqStr, vision: reqStr,
}).strict();

export const countryFlagsSchema = z.record(z.string(), z.string());
export const countryFlagSchema = z.object({ id, flag: reqStr }).strict();

export const personSchema = z.object({
  id, status: PersonStatus, tenure: reqStr, name: reqStr, country: optStr, role: strList,
  image: optStr, orcid: optStr, repository: optStr, homepage: optStr, affiliation: optStr,
  description: optStr, end_year: optInt,
}).strict().refine((p) => p.status !== 'alumni' || p.end_year != null, { message: 'alumni need end_year' });

export const publicationSchema = z.object({
  id, tags: strList, people: strList, year: z.number().int(), date: optDate, pdf: optStr,
  authors: reqStr, affiliations: optStr, title: reqStr, journal: reqStr, journal_short: optStr,
  status: PublicationStatus, impact: optNum, position: AuthorPosition, doi: optStr, pmid: optInt,
  keywords: strList, homepage: optStr, repository: optStr, abstract: optStr,
}).strict();

export const projectSchema = z.object({
  id, tags: strList, people: strList, title: reqStr, status: ContentStatus, publications: strList,
  homepage: optStr, repository: optStr, cooperation_partners: optStr, images: strList,
  image_title: optStr, abstract: reqStr,
}).strict();

export const softwareSchema = z.object({
  id, tags: strList, people: strList, type: SoftwareType, name: reqStr, title: reqStr,
  description: reqStr, image: optStr, publications: strList, homepage: optStr, repository: optStr, doi: optStr,
}).strict();

export const editorSchema = z.object({
  id, tags: strList, status: PersonStatus, tenure: reqStr, name: reqStr, image: optStr,
  repository: optStr, homepage: optStr, description: reqStr,
}).strict();

export const fundingSchema = z.object({
  id, tags: strList, funder_short: reqStr, funder: reqStr, funder_link: optStr, funder_logo: optStr,
  grant: z.preprocess((v) => (v == null || v === '' ? null : String(v)), z.string().nullable().optional()),
  start: reqStr, end: reqStr, title: reqStr, role: FundingRole, amount: z.number().int(),
  personal_amount: z.number().int(), currency: reqStr, homepage: optStr, repository: optStr, description: reqStr,
}).strict();

export const newsSchema = z.object({
  id, tags: strList, people: strList, status: ContentStatus, title: reqStr, date: reqDate,
  image: optStr, image2: optStr, link: optStr, short: reqStr, abstract: optStr, video: optStr,
}).strict();

export const teachingSchema = z.object({
  id, tags: strList, people: strList, title: reqStr, title_german: optStr, date: reqStr,
  type: z.preprocess((v) => (v == null ? [] : v), z.array(TeachingType)), semester: reqStr,
  authors: reqStr, location: reqStr, image: optStr, caption: optStr, funding: optStr, content: reqStr,
}).strict();

export const presentationSchema = z.object({
  id, tags: strList, people: strList, type: TalkType, title: reqStr, authors: reqStr,
  affiliations: optStr, image: optStr, slides: optStr, video: optStr, event: reqStr,
  event_page: optStr, date: reqDate, date_display: optStr, location: optStr, repository: optStr,
  publications: strList, abstract: optStr, keywords: strList,
}).strict();

export const posterSchema = z.object({
  id, tags: strList, people: strList, year: z.number().int(), date: reqDate, pdf: reqStr,
  image: reqStr, authors: reqStr, affiliations: reqStr, title: reqStr, event: reqStr,
  event_page: optStr, doi: optStr, keywords: strList, homepage: optStr, repository: optStr, abstract: reqStr,
}).strict();

export const panelSchema = z.object({
  id, people: strList, type: PanelType, title: reqStr, authors: reqStr, slides: optStr,
  video: optStr, event: reqStr, event_page: optStr, date: reqDate, location: reqStr,
  repository: optStr, publications: strList, abstract: optStr, keywords: strList,
}).strict();

export const abstractSchema = z.object({
  id, people: strList, year: z.number().int(), date: optDate, title: reqStr, pdf: optStr,
  authors: reqStr, affiliations: optStr, abstract: optStr, keywords: strList, event: optStr,
  event_page: optStr, journal: optStr, doi: optStr, homepage: optStr, repository: optStr,
}).strict();

export const meetingSchema = z.object({
  id, tags: strList, people: strList, title: reqStr, description: reqStr, date: reqDate,
  date_display: optStr, location: reqStr, homepage: optStr, pdf: optStr, image: optStr, repository: optStr,
}).strict();

export const activitySchema = z.object({
  id, tenure: reqStr, title: reqStr, description: reqStr, link: reqStr,
}).strict();

export const linkedInSchema = z.object({ id, date: reqDate, content: reqStr }).strict();

export type TagData = z.output<typeof tagSchema>;
export type CountryFlagData = z.output<typeof countryFlagSchema>;
export type PersonData = z.output<typeof personSchema>;
export type PublicationData = z.output<typeof publicationSchema>;
export type ProjectData = z.output<typeof projectSchema>;
export type SoftwareData = z.output<typeof softwareSchema>;
export type EditorData = z.output<typeof editorSchema>;
export type FundingData = z.output<typeof fundingSchema>;
export type NewsData = z.output<typeof newsSchema>;
export type TeachingData = z.output<typeof teachingSchema>;
export type PresentationData = z.output<typeof presentationSchema>;
export type PosterData = z.output<typeof posterSchema>;
export type PanelData = z.output<typeof panelSchema>;
export type AbstractData = z.output<typeof abstractSchema>;
export type MeetingData = z.output<typeof meetingSchema>;
export type ActivityData = z.output<typeof activitySchema>;
export type LinkedInData = z.output<typeof linkedInSchema>;
```

- [ ] **Step 4: Run the test**

Run: `npm test`
Expected: PASS for all 16 table tests plus the 5 behaviour tests. If a table fails, the error names the row `id` and field; fix the schema (not the data) unless pydantic also rejects that row.

- [ ] **Step 5: Write `site/content.config.ts`**

```ts
import { defineCollection, reference } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { load } from 'js-yaml';
import * as s from './lib/schemas';

// tags.yml rows have no `id`; the tag name itself is the id so that the
// `tags: ['Digital Twins']` lists on other tables resolve with reference().
const tagsLoader = file('data/tags.yml', {
  parser: (text) => (load(text) as { tag: string }[]).map((t) => ({ id: t.tag, ...t })),
});
// country_flags.yml is a map country -> emoji, not a list.
const countryFlagsLoader = file('data/country_flags.yml', {
  parser: (text) => Object.entries(load(text) as Record<string, string>).map(([id, flag]) => ({ id, flag })),
});
const yml = (name: string) => file(`data/${name}.yml`);

const refList = (collection: 'people' | 'tags' | 'publications') =>
  z.preprocess((v) => (v == null || v === '' ? [] : v), z.array(reference(collection)));

const withPeopleTags = { tags: refList('tags'), people: refList('people') };

export const collections = {
  tags: defineCollection({ loader: tagsLoader, schema: s.tagSchema }),
  countryFlags: defineCollection({ loader: countryFlagsLoader, schema: s.countryFlagSchema }),
  people: defineCollection({ loader: yml('people'), schema: s.personSchema }),
  publications: defineCollection({ loader: yml('publications'), schema: s.publicationSchema.extend(withPeopleTags) }),
  projects: defineCollection({ loader: yml('projects'), schema: s.projectSchema.extend({ ...withPeopleTags, publications: refList('publications') }) }),
  software: defineCollection({ loader: yml('software'), schema: s.softwareSchema.extend({ ...withPeopleTags, publications: refList('publications') }) }),
  editors: defineCollection({ loader: yml('editors'), schema: s.editorSchema.extend({ tags: refList('tags') }) }),
  funding: defineCollection({ loader: yml('funding'), schema: s.fundingSchema.extend({ tags: refList('tags') }) }),
  news: defineCollection({ loader: yml('news'), schema: s.newsSchema.extend(withPeopleTags) }),
  teaching: defineCollection({ loader: yml('teaching'), schema: s.teachingSchema.extend(withPeopleTags) }),
  presentations: defineCollection({ loader: yml('presentations'), schema: s.presentationSchema.extend({ ...withPeopleTags, publications: refList('publications') }) }),
  posters: defineCollection({ loader: yml('posters'), schema: s.posterSchema.extend(withPeopleTags) }),
  panels: defineCollection({ loader: yml('panels'), schema: s.panelSchema.extend({ people: refList('people'), publications: refList('publications') }) }),
  abstracts: defineCollection({ loader: yml('abstracts'), schema: s.abstractSchema.extend({ people: refList('people') }) }),
  meetings: defineCollection({ loader: yml('meetings'), schema: s.meetingSchema.extend(withPeopleTags) }),
  activities: defineCollection({ loader: yml('activities'), schema: s.activitySchema }),
  linkedin: defineCollection({ loader: yml('linkedin'), schema: s.linkedInSchema }),
};
```

`personSchema` ends in `.refine()`, which returns a `ZodEffects`, so it is used as-is (no `.extend`); that is why `people` above passes it unchanged.

- [ ] **Step 6: Prove the collections load in a build**

Temporarily change `site/pages/index.astro` to:

```astro
---
import { getCollection } from 'astro:content';
import '../styles/global.css';
const counts = await Promise.all(
  (['tags', 'countryFlags', 'people', 'publications', 'projects', 'software', 'editors', 'funding', 'news', 'teaching', 'presentations', 'posters', 'panels', 'abstracts', 'meetings', 'activities', 'linkedin'] as const)
    .map(async (c) => [c, (await getCollection(c)).length] as const),
);
---
<html lang="en"><head><meta charset="utf-8" /><title>scaffold</title></head>
<body><pre>{JSON.stringify(Object.fromEntries(counts), null, 2)}</pre></body></html>
```

Run: `npm run build && cat dist/index.html`
Expected: 17 counts, matching `grep -c "^- id" data/*.yml` for the list tables (people 61, publications 110, projects 25, software 11, editors 4, funding 12, news 90, teaching 10, presentations 22, posters 16, panels 3, abstracts 4, meetings 2, activities 14, linkedin 2), tags 5, countryFlags = number of lines in `data/country_flags.yml` that contain `: '`. A build error naming a collection and id means a `reference()` did not resolve; fix the data or the wiring.

- [ ] **Step 7: Commit**

```bash
git add site/lib/schemas.ts site/lib/schemas.test.ts site/content.config.ts site/pages/index.astro
git commit -m "Add Zod schemas mirroring src/data.py and Astro content collections"
```

---

### Task 5: Pure helpers and the data views

**Files:**
- Create: `site/lib/text.ts`, `site/lib/text.test.ts`, `site/lib/url.ts`, `site/lib/people.ts`, `site/lib/people.test.ts`, `site/lib/views.ts`, `site/lib/views.test.ts`, `site/lib/data.ts`

**Interfaces:**
- Produces:
  - `text.ts`: `slugify(s): string`, `stripHtml(s): string`, `truncateWords(s, n): string`, `capitalize(s): string`, `escapeHtml(s): string`
  - `url.ts`: `url(path: string): string` (prefixes base, keeps trailing slash as given), `asset(relPath: string): string` = `url('/assets/' + relPath)`
  - `people.ts`: `type PersonLite = { id: string; name: string; image: string | null }`, `type PeopleMap = Record<string, PersonLite>`, `personChips(text, peopleIds, people: PeopleMap, avatarBase: string): string` (HTML), `avatarPeople(peopleIds, people: PeopleMap): PersonLite[]`
  - `views.ts`: `groupByYear<T extends { year: number }>(items: T[]): { year: number; items: T[] }[]` (consecutive runs, file order), `alumniByYear(people: PersonData[]): { year: number; people: PersonData[] }[]`, `crossRefs(personId, publications, projects, software): { publications: Entry<PublicationData>[]; projects: Entry<ProjectData>[]; software: Entry<SoftwareData>[] }`, `tagCounts(tag, publications, projects, software): { publications: number; projects: number; software: number }`, `type Entry<T> = Omit<T, 'id'> & { id: string }`, `type TagInfo = { tag: string; slug: string; icon: string; short_description: string; description: string; vision: string }`
  - `data.ts`: `getTags(): Promise<TagInfo[]>`, `getPeopleMap(): Promise<PeopleMap>`, `getPeople(): Promise<Entry<PersonData>[]>`, `getPublications()`, `getProjects()`, `getSoftware()`, `getEditors()`, `getFunding()`, `getNews()`, `getTeaching()`, `getPresentations()`, `getPosters()`, `getAbstracts()`, `getMeetings()` (sorted by date desc), each returning `Entry<XData>[]` with `tags`/`people`/`publications` as plain `string[]` ids.

- [ ] **Step 1: Write the failing tests**

`site/lib/text.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { capitalize, escapeHtml, slugify, stripHtml, truncateWords } from './text';

describe('text helpers (Liquid parity)', () => {
  it('slugify matches Jekyll default mode', () => {
    expect(slugify('Open & FAIR')).toBe('open-fair');
    expect(slugify('Digital Twins')).toBe('digital-twins');
    expect(slugify('first_equal')).toBe('first-equal');
    expect(slugify('  AI ')).toBe('ai');
  });
  it('stripHtml removes tags only', () => {
    expect(stripHtml('<b>Matthias König</b>, A. B')).toBe('Matthias König, A. B');
  });
  it('truncateWords appends an ellipsis only when cutting', () => {
    expect(truncateWords('one two three', 2)).toBe('one two...');
    expect(truncateWords('one two', 2)).toBe('one two');
    expect(truncateWords('  one   two three ', 2)).toBe('one two...');
  });
  it('capitalize uppercases the first letter', () => {
    expect(capitalize('publication')).toBe('Publication');
  });
  it('escapeHtml escapes the five characters', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });
});
```

`site/lib/people.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { avatarPeople, personChips, type PeopleMap } from './people';

const people: PeopleMap = {
  matthias_koenig: { id: 'matthias_koenig', name: 'Prof. Dr. Matthias König', image: 'matthias_koenig.webp' },
  jane_doe: { id: 'jane_doe', name: 'Jane Doe', image: 'jane_doe.webp' },
  no_photo: { id: 'no_photo', name: 'No Photo', image: null },
};

describe('personChips', () => {
  it('splices an avatar + bold name for "Initial. Surname" first', () => {
    const html = personChips('J. Doe, M. König and X. Y', ['jane_doe', 'matthias_koenig'], people, '/assets/image/people/128/');
    expect(html).toBe(
      '<span class="person-chip"><img src="/assets/image/people/128/jane_doe.webp" class="author-avatar" alt="" title="Jane Doe"/><strong>J. Doe</strong></span>, ' +
      '<span class="person-chip"><img src="/assets/image/people/128/matthias_koenig.webp" class="author-avatar" alt="" title="Prof. Dr. Matthias König"/><strong>M. König</strong></span> and X. Y',
    );
  });
  it('falls back to "Given Surname" and replaces every occurrence', () => {
    const html = personChips('Jane Doe; Jane Doe', ['jane_doe'], people, '/p/');
    expect(html.match(/person-chip/g)).toHaveLength(2);
    expect(html).toContain('<strong>Jane Doe</strong>');
  });
  it('skips people without an image or unknown ids', () => {
    expect(personChips('No Photo, Z. Z', ['no_photo', 'ghost'], people, '/p/')).toBe('No Photo, Z. Z');
  });
});

describe('avatarPeople', () => {
  it('keeps order, drops missing/imageless, moves matthias_koenig last', () => {
    expect(avatarPeople(['matthias_koenig', 'no_photo', 'jane_doe', 'ghost'], people).map((p) => p.id)).toEqual(['jane_doe', 'matthias_koenig']);
  });
});
```

`site/lib/views.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { alumniByYear, crossRefs, groupByYear, tagCounts } from './views';

describe('groupByYear', () => {
  it('groups consecutive runs in file order like the Liquid template', () => {
    const groups = groupByYear([{ year: 2026, id: 'a' }, { year: 2026, id: 'b' }, { year: 2025, id: 'c' }]);
    expect(groups.map((g) => [g.year, g.items.map((i) => i.id)])).toEqual([[2026, ['a', 'b']], [2025, ['c']]]);
  });
});

describe('alumniByYear', () => {
  it('takes alumni with an image, newest end_year first', () => {
    const p = (id: string, status: 'current' | 'alumni', end_year: number | null, image: string | null) =>
      ({ id, status, end_year, image, tenure: '', name: id, role: [], country: null, orcid: null, repository: null, homepage: null, affiliation: null, description: null });
    const groups = alumniByYear([p('a', 'alumni', 2020, 'a.webp'), p('b', 'alumni', 2024, 'b.webp'), p('c', 'alumni', 2024, null), p('d', 'current', null, 'd.webp')]);
    expect(groups.map((g) => [g.year, g.people.map((x) => x.id)])).toEqual([[2024, ['b']], [2020, ['a']]]);
  });
});

describe('crossRefs', () => {
  it('collects a person’s publications (newest year first), projects and software', () => {
    const refs = crossRefs(
      'x',
      [{ id: 'p1', year: 2020, people: ['x'] }, { id: 'p2', year: 2024, people: ['x', 'y'] }, { id: 'p3', year: 2022, people: ['y'] }] as never,
      [{ id: 'pr', people: ['x'] }] as never,
      [{ id: 'sw', people: ['y'] }] as never,
    );
    expect(refs.publications.map((p) => p.id)).toEqual(['p2', 'p1']);
    expect(refs.projects.map((p) => p.id)).toEqual(['pr']);
    expect(refs.software).toEqual([]);
  });
});

describe('tagCounts', () => {
  it('counts publications, current projects, software carrying the tag', () => {
    const c = tagCounts(
      'AI',
      [{ tags: ['AI'] }, { tags: [] }] as never,
      [{ tags: ['AI'], status: 'current' }, { tags: ['AI'], status: 'old' }] as never,
      [{ tags: ['AI'] }] as never,
    );
    expect(c).toEqual({ publications: 1, projects: 1, software: 1 });
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

Run: `npm test`
Expected: FAIL, three "Cannot find module" errors.

- [ ] **Step 3: Write `site/lib/text.ts`**

```ts
/** Jekyll `slugify` (default mode): lowercase, non-letter/digit runs -> "-", trimmed. */
export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
}

/** Liquid `strip_html`. */
export function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

/** Liquid `truncatewords: n` (appends "..." only when it cut). */
export function truncateWords(s: string, n: number): string {
  const words = s.trim().split(/\s+/).filter(Boolean);
  return words.length <= n ? words.join(' ') : words.slice(0, n).join(' ') + '...';
}

/** Liquid `capitalize`. */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
```

- [ ] **Step 4: Write `site/lib/url.ts`**

```ts
/**
 * Base-path aware links. import.meta.env.BASE_URL is "/" locally and
 * "/livermetabolism-site/" on the interim GitHub Pages URL (it always ends
 * with "/" because astro.config sets trailingSlash: 'always').
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** `url('/people/')` -> `/people/` or `/livermetabolism-site/people/`. */
export function url(path: string): string {
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** `asset('image/people/128/x.webp')` -> `/assets/image/people/128/x.webp` (+ base). */
export function asset(relPath: string): string {
  return url(`/assets/${relPath.replace(/^\/+/, '')}`);
}
```

- [ ] **Step 5: Write `site/lib/people.ts`**

```ts
import { escapeHtml } from './text';

export interface PersonLite { id: string; name: string; image: string | null }
export type PeopleMap = Record<string, PersonLite>;

/**
 * Port of _includes/person_chips.html: splice a small avatar + bold name
 * into a free-text author string. "Initial. Surname" is tried first, then
 * "Given Surname"; like Liquid's `replace`, every occurrence is replaced.
 * Returns HTML (the author string itself is trusted YAML content).
 */
export function personChips(text: string, peopleIds: string[], people: PeopleMap, avatarBase: string): string {
  let html = text;
  for (const pid of peopleIds) {
    const person = people[pid];
    if (!person || !person.image) continue;
    const parts = person.name.split(' ');
    const given = parts[parts.length - 2] ?? '';
    const surname = parts[parts.length - 1] ?? '';
    const avatar = `<img src="${avatarBase}${person.image}" class="author-avatar" alt="" title="${escapeHtml(person.name)}"/>`;
    const chip = (label: string) => `<span class="person-chip">${avatar}<strong>${label}</strong></span>`;
    const short = `${given.charAt(0)}. ${surname}`;
    if (html.includes(short)) {
      html = html.replaceAll(short, chip(short));
    } else {
      const full = `${given} ${surname}`;
      html = html.replaceAll(full, chip(full));
    }
  }
  return html;
}

/** Port of _includes/people_avatars.html: everyone with a photo, matthias_koenig last. */
export function avatarPeople(peopleIds: string[], people: PeopleMap): PersonLite[] {
  const out = peopleIds.filter((id) => id !== 'matthias_koenig').map((id) => people[id]).filter((p): p is PersonLite => !!p && !!p.image);
  const koenig = peopleIds.includes('matthias_koenig') ? people['matthias_koenig'] : undefined;
  if (koenig && koenig.image) out.push(koenig);
  return out;
}
```

- [ ] **Step 6: Write `site/lib/views.ts`**

```ts
import type { PersonData, ProjectData, PublicationData, SoftwareData } from './schemas';

/** A collection entry flattened to its data plus the guaranteed entry id. */
export type Entry<T> = Omit<T, 'id'> & { id: string };

export interface TagInfo {
  tag: string; slug: string; icon: string; short_description: string; description: string; vision: string;
}

/** Consecutive runs of the same year, in the given order (Liquid's prev_year loop). */
export function groupByYear<T extends { year: number }>(items: T[]): { year: number; items: T[] }[] {
  const groups: { year: number; items: T[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.year === item.year) last.items.push(item);
    else groups.push({ year: item.year, items: [item] });
  }
  return groups;
}

/** team.html alumni timeline: alumni with a photo, sorted by end_year desc, grouped. */
export function alumniByYear<T extends Pick<PersonData, 'status' | 'end_year' | 'image'>>(people: T[]): { year: number; people: T[] }[] {
  const alumni = people
    .filter((p) => p.status === 'alumni' && !!p.image && p.end_year != null)
    .sort((a, b) => (b.end_year as number) - (a.end_year as number));
  const groups: { year: number; people: T[] }[] = [];
  for (const p of alumni) {
    const last = groups[groups.length - 1];
    if (last && last.year === p.end_year) last.people.push(p);
    else groups.push({ year: p.end_year as number, people: [p] });
  }
  return groups;
}

/** person_modal.html: everything a person is credited on via `people:`. */
export function crossRefs(
  personId: string,
  publications: Entry<PublicationData>[],
  projects: Entry<ProjectData>[],
  software: Entry<SoftwareData>[],
) {
  return {
    publications: publications.filter((p) => p.people.includes(personId)).sort((a, b) => b.year - a.year),
    projects: projects.filter((p) => p.people.includes(personId)),
    software: software.filter((s) => s.people.includes(personId)),
  };
}

/** index.html tag sections: counts behind the Publications/Projects/Software links. */
export function tagCounts(
  tag: string,
  publications: Pick<PublicationData, 'tags'>[],
  projects: Pick<ProjectData, 'tags' | 'status'>[],
  software: Pick<SoftwareData, 'tags'>[],
) {
  return {
    publications: publications.filter((p) => p.tags.includes(tag)).length,
    projects: projects.filter((p) => p.tags.includes(tag) && p.status === 'current').length,
    software: software.filter((s) => s.tags.includes(tag)).length,
  };
}
```

- [ ] **Step 7: Run the tests**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 8: Write `site/lib/data.ts`** (build-time glue, uses the virtual `astro:content` module so it is exercised by `npm run build`, not Vitest)

```ts
import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import type { PeopleMap } from './people';
import type * as S from './schemas';
import { slugify } from './text';
import type { Entry, TagInfo } from './views';

type Ref = { collection: string; id: string };
const ids = (refs: Ref[] | undefined) => (refs ?? []).map((r) => r.id);

/** Flatten an entry: data + entry id, reference() objects back to id strings. */
function plain<K extends CollectionKey, T>(entry: CollectionEntry<K>): Entry<T> {
  const data = entry.data as Record<string, unknown>;
  const out: Record<string, unknown> = { ...data, id: entry.id };
  for (const key of ['tags', 'people', 'publications']) {
    if (Array.isArray(data[key])) out[key] = ids(data[key] as Ref[]);
  }
  return out as Entry<T>;
}

async function all<K extends CollectionKey, T>(key: K): Promise<Entry<T>[]> {
  return (await getCollection(key)).map((e) => plain<K, T>(e));
}

export async function getTags(): Promise<TagInfo[]> {
  return (await getCollection('tags')).map((t) => ({ ...t.data, tag: t.data.tag, slug: slugify(t.data.tag) }));
}
export const getPeople = () => all<'people', S.PersonData>('people');
export const getPublications = () => all<'publications', S.PublicationData>('publications');
export const getProjects = () => all<'projects', S.ProjectData>('projects');
export const getSoftware = () => all<'software', S.SoftwareData>('software');
export const getEditors = () => all<'editors', S.EditorData>('editors');
export const getFunding = () => all<'funding', S.FundingData>('funding');
export const getNews = () => all<'news', S.NewsData>('news');
export const getTeaching = () => all<'teaching', S.TeachingData>('teaching');
export const getPresentations = () => all<'presentations', S.PresentationData>('presentations');
export const getPosters = () => all<'posters', S.PosterData>('posters');
export const getAbstracts = () => all<'abstracts', S.AbstractData>('abstracts');
/** meetings.html sorts by date, newest first. */
export async function getMeetings() {
  return (await all<'meetings', S.MeetingData>('meetings')).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPeopleMap(): Promise<PeopleMap> {
  const map: PeopleMap = {};
  for (const p of await getPeople()) map[p.id] = { id: p.id, name: p.name, image: p.image ?? null };
  return map;
}
```

- [ ] **Step 9: Build and commit**

Run: `npm run build`
Expected: still builds (nothing imports data.ts yet; `astro check` in a later task type-checks it).

```bash
git add site/lib
git commit -m "Add Liquid-parity text helpers, base-path URLs, people chips, data views"
```

---

### Task 6: Icons without the Font Awesome kit

**Files:**
- Create: `scripts/fetch-icons.sh`, `site/icons/*.svg` (committed), `site/icons/LICENSE.txt`, `site/lib/icons.ts`, `site/lib/icons.test.ts`, `site/components/Icon.vue`

**Interfaces:**
- Produces: `iconSvg(name: string): string` returning an inline `<svg class="fa fa-<name> icon" …>` string; `<Icon name="globe" />` Vue component (props `name: string`, optional `extraClass`, optional `title`). Icon names are the Font Awesome 4 names used in the templates today, without the `fa-` prefix.

- [ ] **Step 1: Write the download script**

`scripts/fetch-icons.sh`:

```bash
#!/usr/bin/env bash
# Downloads the Font Awesome Free 6 SVGs the site uses into site/icons/,
# named by the Font Awesome 4 class name the templates/data use (tags.yml
# `icon:` values are FA4 names). Re-run when adding an icon.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p site/icons
BASE="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs"
# fa4-name  style/fa6-name
while read -r name src; do
  [ -z "$name" ] && continue
  curl -fsSL "$BASE/$src.svg" -o "site/icons/$name.svg"
  echo "fetched $name <- $src"
done <<'MAP'
cube solid/cube
heartbeat solid/heart-pulse
picture-o regular/image
line-chart solid/chart-line
unlock-alt solid/unlock-keyhole
cogs solid/gears
file-pdf-o regular/file-pdf
code solid/code
user-circle-o regular/circle-user
users solid/users
user solid/user
chevron-down solid/chevron-down
chevron-up solid/chevron-up
globe solid/globe
github brands/github
orcid brands/orcid
desktop solid/desktop
video-camera solid/video
caret-down solid/caret-down
home solid/house
envelope solid/envelope
phone solid/phone
google brands/google
linkedin brands/linkedin
youtube brands/youtube
registered solid/registered
search solid/magnifying-glass
person-chalkboard solid/person-chalkboard
laptop-code solid/laptop-code
book solid/book
file-text-o regular/file-lines
image regular/image
money solid/money-bill
pencil solid/pencil
newspaper-o regular/newspaper
graduation-cap solid/graduation-cap
flask solid/flask
compass regular/compass
file-o regular/file
MAP
cat > site/icons/LICENSE.txt <<'TXT'
The SVG files in this directory are from Font Awesome Free 6
(https://fontawesome.com), licensed CC BY 4.0
(https://creativecommons.org/licenses/by/4.0/). Files were renamed to the
Font Awesome 4 class names used by this site.
TXT
```

Run: `chmod +x scripts/fetch-icons.sh && npm run fetch-icons && ls site/icons | wc -l`
Expected: 39 files printed as fetched, `ls` shows 40 entries (39 svg + LICENSE.txt).

- [ ] **Step 2: Write the failing test**

`site/lib/icons.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { iconNames, iconSvg } from './icons';

describe('icons', () => {
  it('knows every icon the templates use', () => {
    for (const n of ['cube', 'heartbeat', 'picture-o', 'line-chart', 'unlock-alt', 'cogs', 'file-pdf-o', 'code', 'globe', 'github', 'orcid', 'search', 'chevron-down', 'chevron-up', 'caret-down', 'compass', 'file-o']) {
      expect(iconNames()).toContain(n);
    }
  });
  it('renders an inline svg carrying the legacy fa classes', () => {
    const svg = iconSvg('globe');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('class="fa fa-globe icon"');
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).toContain('fill="currentColor"');
    expect(svg).not.toContain('<!--');
  });
  it('throws on unknown names so a typo fails the build', () => {
    expect(() => iconSvg('nope')).toThrow(/nope/);
  });
});
```

Run: `npm test` → FAIL (module missing).

- [ ] **Step 3: Write `site/lib/icons.ts`**

```ts
// Vite bundles the SVG sources at build time; works in .astro and .vue alike.
const files = import.meta.glob('../icons/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const byName: Record<string, string> = {};
for (const [path, raw] of Object.entries(files)) {
  const name = path.slice(path.lastIndexOf('/') + 1, -'.svg'.length);
  byName[name] = raw;
}

export function iconNames(): string[] {
  return Object.keys(byName).sort();
}

/** Inline SVG with the old `fa fa-<name>` classes so the ported CSS keeps matching. */
export function iconSvg(name: string, extraClass = ''): string {
  const raw = byName[name];
  if (!raw) throw new Error(`Unknown icon "${name}" (add it to scripts/fetch-icons.sh)`);
  const cls = ['fa', `fa-${name}`, 'icon', extraClass].filter(Boolean).join(' ');
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg\b([^>]*)>/, (_m, attrs: string) => `<svg${attrs} class="${cls}" aria-hidden="true" focusable="false" fill="currentColor">`)
    .trim();
}
```

- [ ] **Step 4: Write `site/components/Icon.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { iconSvg } from '../lib/icons';

const props = defineProps<{ name: string; extraClass?: string; title?: string }>();
const html = computed(() => iconSvg(props.name, props.extraClass ?? ''));
</script>

<template>
  <span v-if="title" class="icon-wrap" :title="title" v-html="html"></span>
  <span v-else class="icon-wrap" v-html="html"></span>
</template>
```

- [ ] **Step 5: Run tests, build, commit**

Run: `npm test && npm run build`
Expected: PASS; build OK.

```bash
git add scripts/fetch-icons.sh site/icons site/lib/icons.ts site/lib/icons.test.ts site/components/Icon.vue
git commit -m "Inline Font Awesome Free SVG icons, drop the hosted kit"
```

---

### Task 7: The stylesheet — Tailwind theme, base, Bootstrap replacements, ported custom CSS

**Files:**
- Modify: `site/styles/global.css` (replace the one-line placeholder)
- Read: `app/assets/css/main.scss` (lines 40–1730, the custom rules), `web/assets/css/main.css` (compiled reference)

**Interfaces:**
- Produces: CSS custom properties `--color-primary`, `--color-success`, `--color-info`, `--color-warning`, `--color-danger`, `--color-gray-100…900`, `--color-body-bg`, `--color-body`, `--font-sans`, `--font-serif-display`, `--font-brand`, `--navbar-height`, `--color-tag-<slug>`, `--color-hero-<slug>`; the class names used by every component in Tasks 8–18 (unchanged from today's site) plus the Bootstrap-replacement classes `container`, `btn`, `btn-sm`, `btn-primary`, `btn-secondary`, `btn-outline-secondary`, `form-control`, `modal`, `modal-header`, `modal-title`, `modal-body`, `btn-close`, `navbar`, `navbar-brand`, `navbar-toggler`, `navbar-collapse`, `navbar-nav`, `nav-item`, `nav-link`, `dropdown`, `dropdown-menu`, `dropdown-item`, `lead`, `small`, `text-muted`, `text-justify`, `img-fluid`, `pub-abstract`.

- [ ] **Step 1: Write the head of `site/styles/global.css` (theme + base)**

```css
@import "tailwindcss";

/* Flatly (Bootswatch 5.3.8) palette + this site's own tokens, formerly
   Sass variables in app/assets/css/main.scss. `static` so every variable
   is emitted even where only the hand-written rules below use it. */
@theme static {
  --color-primary: #2c3e50;
  --color-secondary: #95a5a6;
  --color-success: #18bc9c;
  --color-info: #3498db;
  --color-warning: #f39c12;
  --color-danger: #e74c3c;
  --color-gray-100: #f8f9fa;
  --color-gray-200: #ecf0f1;
  --color-gray-300: #dee2e6;
  --color-gray-400: #ced4da;
  --color-gray-500: #b4bcc2;
  --color-gray-600: #95a5a6;
  --color-gray-700: #7b8a8b;
  --color-gray-800: #343a40;
  --color-gray-900: #212529;
  --color-body-bg: #ffffff;
  --color-body: #212529;
  --color-link: #18bc9c;
  --color-link-hover: #13967d;

  --font-sans: Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  --font-serif-display: "Source Serif 4", Georgia, "Times New Roman", serif;
  --font-brand: "Space Grotesk", "Helvetica Neue", Helvetica, Arial, sans-serif;

  --navbar-height: 64px;

  /* one colour per research tag (keyed by slugify(tag)) */
  --color-tag-digital-twins: #3498db;
  --color-tag-ai: #f39c12;
  --color-tag-digital-pathology: #e74c3c;
  --color-tag-pharmacometrics: #18bc9c;
  --color-tag-open-fair: #2c3e50;
  /* full-screen homepage sections */
  --color-hero-digital-twins: #2766a5;
  --color-hero-ai: #a7661b;
  --color-hero-digital-pathology: #ae294a;
  --color-hero-pharmacometrics: #157965;
  --color-hero-open-fair: #282f5d;
}

/* What Bootstrap Reboot used to provide on top of a reset. */
@layer base {
  html { position: relative; min-height: 100%; overflow-x: hidden; }
  html.onepager { scroll-snap-type: y mandatory; }
  body {
    margin: 0;
    padding-top: var(--navbar-height);
    overflow-x: hidden;
    font-family: var(--font-sans);
    font-size: 1rem;
    line-height: 1.5;
    color: var(--color-body);
    background-color: var(--color-body-bg);
    -webkit-text-size-adjust: 100%;
  }
  :target { scroll-margin-top: var(--navbar-height); }
  h1, h2, h3, h4, h5, h6 { margin-top: 0; margin-bottom: 0.5rem; font-weight: 500; line-height: 1.2; }
  h1 { font-size: calc(1.425rem + 2.1vw); }
  h2 { font-size: calc(1.375rem + 1.5vw); }
  h3 { font-size: calc(1.325rem + 0.9vw); }
  h4 { font-size: calc(1.275rem + 0.3vw); }
  h5 { font-size: 1.25rem; }
  h6 { font-size: 1rem; }
  @media (min-width: 1200px) {
    h1 { font-size: 3rem; } h2 { font-size: 2.5rem; } h3 { font-size: 2rem; } h4 { font-size: 1.5rem; }
  }
  p { margin: 0 0 1rem; }
  ul, ol { padding-left: 2rem; margin: 0 0 1rem; }
  ul { list-style: disc; }
  ol { list-style: decimal; }
  a { color: var(--color-link); text-decoration: underline; }
  a:hover { color: var(--color-link-hover); }
  strong, b { font-weight: bolder; }
  img, svg { display: inline-block; vertical-align: middle; }
  table { border-collapse: collapse; caption-side: bottom; }
  button { font: inherit; color: inherit; }
  iframe { border: 0; }
  /* Icon.vue wraps the inline svg; make the wrapper layout-transparent */
  .icon-wrap { display: contents; }
  svg.icon { width: 1em; height: 1em; vertical-align: -0.125em; }
}
```

- [ ] **Step 2: Append the Bootstrap replacements**

```css
/* ------------------------------------------------------------------
   Bootstrap 5 pieces the markup relied on, re-created explicitly.
   ------------------------------------------------------------------ */
@layer components {
  .container { width: 100%; padding-inline: 0.75rem; margin-inline: auto; }
  @media (min-width: 576px) { .container { max-width: 540px; } }
  @media (min-width: 768px) { .container { max-width: 720px; } }
  @media (min-width: 992px) { .container { max-width: 960px; } }
  @media (min-width: 1200px) { .container { max-width: 1140px; } }
  @media (min-width: 1400px) { .container { max-width: 1320px; } }

  .text-justify { text-align: justify; }
  .text-muted { color: rgba(33, 37, 41, 0.75); }
  .lead { font-size: 1.25rem; font-weight: 300; }
  .small, small { font-size: 0.875em; }
  .img-fluid { max-width: 100%; height: auto; }

  .btn {
    display: inline-block; padding: 0.375rem 0.75rem; font-size: 1rem; font-weight: 400; line-height: 1.5;
    text-align: center; text-decoration: none; vertical-align: middle; cursor: pointer; user-select: none;
    border: 1px solid transparent; border-radius: 0.375rem;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
  }
  .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.875rem; border-radius: 0.25rem; }
  .btn-primary { color: #fff; background-color: var(--color-primary); border-color: var(--color-primary); }
  .btn-primary:hover { color: #fff; background-color: #253544; border-color: #233240; }
  .btn-secondary { color: #fff; background-color: var(--color-secondary); border-color: var(--color-secondary); }
  .btn-secondary:hover { color: #fff; background-color: #7f8c8d; border-color: #778485; }
  .btn-outline-secondary { color: var(--color-secondary); border-color: var(--color-secondary); background: transparent; }
  .btn-outline-secondary:hover { color: #fff; background-color: var(--color-secondary); }

  .form-control {
    display: block; width: 100%; padding: 0.375rem 0.75rem; font-size: 1rem; line-height: 1.5;
    color: var(--color-body); background-color: var(--color-body-bg); appearance: none;
    border: 1px solid var(--color-gray-400); border-radius: 0.375rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }
  .form-control:focus { outline: 0; border-color: #969fa8; box-shadow: 0 0 0 0.25rem rgba(44, 62, 80, 0.25); }

  /* native <dialog> styled like Bootstrap's .modal-dialog.modal-lg */
  dialog.modal {
    width: min(800px, calc(100% - 1rem)); max-height: calc(100vh - 3.5rem); margin: 1.75rem auto; padding: 0;
    display: none; flex-direction: column; color: var(--color-body); background-color: var(--color-body-bg);
    border: 1px solid rgba(0, 0, 0, 0.175); border-radius: 0.5rem; box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  }
  dialog.modal[open] { display: flex; }
  dialog.modal.modal-centered { margin-block: auto; }
  dialog.modal::backdrop { background-color: rgba(0, 0, 0, 0.5); }
  body:has(dialog.modal[open]) { overflow: hidden; }
  .modal-header {
    display: flex; flex-shrink: 0; align-items: center; justify-content: space-between; padding: 1rem;
    border-bottom: 1px solid var(--color-gray-300);
  }
  .modal-title { margin: 0; font-size: 1.25rem; line-height: 1.5; }
  .modal-body { padding: 1rem; overflow-y: auto; }
  .btn-close {
    box-sizing: content-box; width: 1em; height: 1em; padding: 0.25em; margin: -0.5rem -0.5rem -0.5rem auto;
    color: #000; background: transparent url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23000'%3e%3cpath d='M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z'/%3e%3c/svg%3e") center/1em auto no-repeat;
    border: 0; border-radius: 0.375rem; opacity: 0.5; cursor: pointer;
  }
  .btn-close:hover { opacity: 0.75; }

  /* publications.html abstract toggle, formerly Bootstrap collapse */
  .pub-abstract > summary { cursor: pointer; list-style: none; color: var(--color-link); }
  .pub-abstract > summary::-webkit-details-marker { display: none; }
  .pub-abstract > summary:hover { color: var(--color-link-hover); }

  /* navbar: fixed, dark, expands at md (768px) */
  .navbar {
    position: fixed; top: 0; right: 0; left: 0; z-index: 1030; padding: 0.5rem 0;
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  }
  .navbar > .container { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; }
  .navbar-brand { padding: 0.3125rem 0; margin-right: 1rem; font-size: 1.25rem; color: #fff; text-decoration: none; }
  .navbar-brand:hover, .navbar-brand:focus { color: #fff; }
  .navbar-nav { display: flex; flex-direction: column; padding-left: 0; margin: 0; list-style: none; }
  .nav-link { display: block; padding: 0.5rem 0; color: #fff; text-decoration: none; }
  .nav-link:hover, .nav-link:focus { color: var(--color-success); }
  .navbar-toggler {
    padding: 0.25rem 0.75rem; font-size: 1.25rem; line-height: 1; color: rgba(255, 255, 255, 0.55);
    background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 0.375rem; cursor: pointer;
  }
  .navbar-toggler-icon {
    display: inline-block; width: 1.5em; height: 1.5em; vertical-align: middle; background-size: 100%;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='%23fff' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
  }
  .navbar-collapse { flex-basis: 100%; flex-grow: 1; align-items: center; display: none; }
  .navbar-collapse.show { display: block; }
  .dropdown-menu {
    position: absolute; top: 100%; left: 0; z-index: 1000; display: none; min-width: 10rem; padding: 0.5rem 0; margin: 0;
    font-size: 1rem; text-align: left; list-style: none; background-color: var(--color-body-bg);
    border: 1px solid var(--color-gray-400); border-radius: 0.375rem;
  }
  .dropdown-item {
    display: block; width: 100%; padding: 0.25rem 1rem; font-weight: 400; color: var(--color-gray-700);
    text-align: inherit; text-decoration: none; white-space: nowrap; background: transparent; border: 0;
  }
  @media (min-width: 768px) {
    .navbar-collapse { display: flex !important; flex-basis: auto; }
    .navbar-toggler { display: none; }
    .navbar-nav { flex-direction: row; }
    .nav-link { padding: 0.5rem; }
  }
}
```

- [ ] **Step 3: Port the custom rules from `main.scss`**

Append everything from `app/assets/css/main.scss` line 60 (`.text-justify` is already covered above) to the end, inside one `@layer components { … }` block, applying these rewrites exactly:

| Sass | CSS |
|---|---|
| `$primary`, `$success`, `$info`, `$warning`, `$danger` | `var(--color-primary)`, `var(--color-success)`, `var(--color-info)`, `var(--color-warning)`, `var(--color-danger)` |
| `$gray-100` … `$gray-900` | `var(--color-gray-100)` … `var(--color-gray-900)` |
| `$body-bg`, `$body-color` | `var(--color-body-bg)`, `var(--color-body)` |
| `$font-serif-display`, `$font-brand`, `$font-family-sans-serif` | `var(--font-serif-display)`, `var(--font-brand)`, `var(--font-sans)` |
| `$navbar-height + $navbar-margin-bottom`, `#{$navbar-height} - #{$navbar-margin-bottom}` | `var(--navbar-height)` (margin-bottom is 0) |
| `rgba($success, 0.12)` | `rgba(24, 188, 156, 0.12)` (success = 24,188,156; primary = 44,62,80; warning = 243,156,18; gray-100 = 248,249,250) |
| `color.adjust($success, $lightness: -12%)` | `#11866f` |
| `color.adjust($success, $lightness: -8%)` (pharmacometrics badge) | `#13987e` |
| `color.adjust($warning, $lightness: -8%)` | `#d2850b` |
| `color.adjust($gray-200, $lightness: -8%)` (footer border) | `#d4dde0` |
| `map-get($tag-colors, "<slug>")` | `var(--color-tag-<slug>)` |
| `&:hover img` etc. (nesting) | keep as native CSS nesting; `&` works the same |
| `html.onepager &`, `.tag-section &` (parent selector suffix) | write the rule un-nested: `html.onepager .page-content { … }`, `.tag-section .section-scroll-cue { … }` |
| `@media (max-width: 767px)` inside a rule | keep nested (native CSS supports nested `@media`) |
| `@each $slug, $color in $hero-section-colors { &.tag-#{$slug} { background-color: $color } }` in `.tag-section` | the five rules `.tag-section.tag-digital-twins { background-color: var(--color-hero-digital-twins); }` … `.tag-section.tag-open-fair { … }` |
| `@each` in `.tag-filter-btn` | for each slug: `.tag-filter-btn.tag-<slug>:hover { border-color: var(--color-tag-<slug>); } .tag-filter-btn.tag-<slug>.active { border-color: var(--color-tag-<slug>); background-color: var(--color-tag-<slug>); color: #fff; }` |
| `@each` in `.tag-badge` | `.tag-badge.tag-digital-twins { background-color: rgba(52,152,219,.14); color: #2383c4; }`, `.tag-badge.tag-ai { background-color: rgba(243,156,18,.14); color: #d2850b; }`, `.tag-badge.tag-digital-pathology { background-color: rgba(231,76,60,.14); color: #df2e1b; }`, `.tag-badge.tag-pharmacometrics { background-color: rgba(24,188,156,.14); color: #13987e; }`, `.tag-badge.tag-open-fair { background-color: rgba(44,62,80,.14); color: #1e2a36; }` |
| `.core-message .fa-cube {color}` etc. | keep verbatim (the inline svg carries `fa fa-cube`) |
| `.fa` selectors | keep verbatim (svg has class `fa`); add `svg.fa { width: 1em; height: 1em; }` nowhere else — already in base |
| `.publication-table` mobile block: `.table-responsive` comment | drop the comment, keep the rules; there is no `.table-responsive` wrapper anymore |
| `.site-navbar .navbar-collapse { max-height: calc(100vh - #{$navbar-height} - #{$navbar-margin-bottom}) }` | `calc(100vh - var(--navbar-height))` |

Do not skip any rule; the class names are what the components in Tasks 8–18 use. Every value that is not a plain token can be verified by grepping the selector in `web/assets/css/main.css`.

- [ ] **Step 4: Build and eyeball**

Run: `npm run build && npx serve dist -l 4321` (or `npm run preview`) and open `http://localhost:4321/` — the placeholder page must render with Lato/system fonts and no console errors. Then:

```bash
grep -c "tag-section.tag-open-fair" dist/_astro/*.css
```

Expected: `1` or more (the port compiled in).

- [ ] **Step 5: Commit**

```bash
git add site/styles/global.css
git commit -m "Port the site stylesheet to Tailwind v4 with explicit Bootstrap replacements"
```

---

### Task 8: Base layout, head, navbar, footer

**Files:**
- Create: `site/layouts/Base.astro`, `site/components/Head.astro`, `site/components/TopNav.astro`, `site/components/NavToggle.vue`, `site/components/Footer.astro`
- Modify: `site/pages/index.astro` (use the layout; the real homepage comes in Task 11)

**Interfaces:**
- Consumes: `url()`, `asset()` from `site/lib/url.ts`; `Icon.vue`.
- Produces: `<Base title="Projects" sectionid="projects" description?>` with a default slot; `Base` renders `<html class="onepager">` when `Astro.url.pathname === url('/')`. Slots named `modals` for page-level islands that must sit outside `.container` (none today; the page body is the default slot). The search button carries `data-modal-target="site-search-modal"`; the mobile hamburger is the `NavToggle.vue` island (`client:load`), which toggles `.show` on `#navbar` and its own `aria-expanded`.

- [ ] **Step 1: Write `site/components/Head.astro`**

```astro
---
import { asset, url } from '../lib/url';

interface Props { title?: string; description?: string }
const siteTitle = 'livermetabolism';
const { title, description = 'Research Group König' } = Astro.props;
const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
const canonical = new URL(Astro.url.pathname, Astro.site);
---
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{fullTitle}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
<meta property="og:type" content="website" />
<meta property="og:title" content={title ?? siteTitle} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:site_name" content={siteTitle} />
<meta name="twitter:card" content="summary" />
<meta name="twitter:site" content="@konigmatt" />
<meta name="generator" content={Astro.generator} />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
<link rel="shortcut icon" href={asset('favicon/favicon.ico?1')} />
<link rel="icon" type="image/png" sizes="32x32" href={asset('favicon/favicon-32x32.png')} />
<link rel="icon" type="image/png" sizes="16x16" href={asset('favicon/favicon-16x16.png')} />
<link rel="apple-touch-icon" sizes="180x180" href={asset('favicon/apple-touch-icon.png')} />
<link rel="manifest" href={asset('favicon/site.webmanifest')} />
<link rel="sitemap" href={url('/sitemap-index.xml')} />
```

(`public/assets/favicon/site.webmanifest` hard-codes `/assets/favicon/...` icon paths; leave it, it is only consulted by installed-app prompts and will be right once the custom domain is attached.)

- [ ] **Step 2: Write `site/components/TopNav.astro`** (port of `_includes/topnav.html`)

```astro
---
import Icon from './Icon.vue';
import NavToggle from './NavToggle.vue';
import { asset, url } from '../lib/url';

interface Props { sectionid?: string }
const { sectionid } = Astro.props;
const active = (...ids: string[]) => (sectionid && ids.includes(sectionid) ? 'active' : '');
---
<nav class="navbar site-navbar">
  <div class="container navbar-container">
    <a class="navbar-brand" href={url('/')}>
      <svg class="brand-mark" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <polygon points="50,4 91,27 91,73 50,96 9,73 9,27" fill="none" stroke="#18BC9C" stroke-width="5"></polygon>
        <g stroke="#EAF0F1" stroke-width="3" fill="none">
          <line x1="50" y1="30" x2="30" y2="55"></line>
          <line x1="50" y1="30" x2="70" y2="55"></line>
          <line x1="30" y1="55" x2="50" y2="75"></line>
          <line x1="70" y1="55" x2="50" y2="75"></line>
          <line x1="30" y1="55" x2="70" y2="55"></line>
        </g>
        <circle cx="50" cy="30" r="7" fill="#18BC9C"></circle>
        <circle cx="30" cy="55" r="7" fill="#EAF0F1"></circle>
        <circle cx="70" cy="55" r="7" fill="#EAF0F1"></circle>
        <circle cx="50" cy="75" r="7" fill="#18BC9C"></circle>
      </svg>
      <span class="brand-word">König Lab</span>
    </a>
    <div class="navbar-controls">
      <button type="button" class="search-toggle" data-modal-target="site-search-modal" aria-label="Search" title="Search (/)">
        <Icon name="search" />
      </button>
      <NavToggle client:load />
    </div>
    <div id="navbar" class="navbar-collapse">
      <ul class="navbar-nav">
        <li class:list={['nav-item', active('projects')]}><a class="nav-link" href={url('/projects/')}>Projects</a></li>
        <li class:list={['nav-item', 'dropdown', active('publications')]}>
          <a class="nav-link" href={url('/publications/')}>Publications</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href={url('/publications/#publications')}>Publications</a></li>
            <li><a class="dropdown-item" href={url('/publications/#presentations')}>Presentations</a></li>
            <li><a class="dropdown-item" href={url('/publications/#posters')}>Posters</a></li>
            <li><a class="dropdown-item" href={url('/publications/#abstracts')}>Abstracts</a></li>
          </ul>
        </li>
        <li class:list={['nav-item', 'dropdown', active('people')]}>
          <a class="nav-link" href={url('/people/')}>Team</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href={url('/people/#current-members')}>Team</a></li>
            <li><a class="dropdown-item" href={url('/people/#open-positions')}>Open Positions</a></li>
            <li><a class="dropdown-item" href={url('/people/#alumni')}>Alumni</a></li>
          </ul>
        </li>
        <li class:list={['nav-item', 'dropdown', active('research', 'meetings')]}>
          <a class="nav-link" href={url('/research/')}>Research</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href={url('/research/#software')}>Software</a></li>
            <li><a class="dropdown-item" href={url('/research/#funding')}>Funding</a></li>
            <li><a class="dropdown-item" href={url('/research/#editors')}>Editors</a></li>
            <li><a class="dropdown-item" href={url('/meetings/')}>Meetings</a></li>
          </ul>
        </li>
        <li class:list={['nav-item', active('news')]}><a class="nav-link" href={url('/news/')}>News</a></li>
        <li class:list={['nav-item', active('teaching')]}><a class="nav-link" href={url('/teaching/')}>Teaching</a></li>
        <li class="nav-item"><a class="nav-link" href={asset('cv/Koenig_CV.pdf')} target="_blank" rel="noopener">CV</a></li>
      </ul>
    </div>
  </div>
</nav>
```

`site/components/NavToggle.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue';

const open = ref(false);
function toggle() {
  open.value = !open.value;
  document.getElementById('navbar')?.classList.toggle('show', open.value);
}
</script>

<template>
  <button type="button" class="navbar-toggler" id="navbar-toggler" aria-controls="navbar" :aria-expanded="open ? 'true' : 'false'" aria-label="Toggle navigation" @click="toggle">
    <span class="navbar-toggler-icon"></span>
  </button>
</template>
```

- [ ] **Step 3: Write `site/components/Footer.astro`** (port of `_includes/footer.html`)

```astro
---
import Icon from './Icon.vue';
import { asset, url } from '../lib/url';

interface Props { home?: boolean }
const { home = false } = Astro.props;
const email = 'matthias.koenig@uni-luebeck.de';
---
<footer class="footer" id="footer">
  {home && (
    <a class="section-scroll-cue section-scroll-cue-up" href="#home" aria-label="Scroll to top"><Icon name="chevron-up" /></a>
  )}
  <div class="container">
    <div class="footer-top">
      <img src={asset('image/people/matthias_koenig.webp')} class="footer-photo" alt="Matthias König" />
      <div class="footer-title">
        <h4>Systems Medicine, Digital Twins &amp; AI</h4>
        <p class="footer-name"><strong>Prof. Dr. rer. nat. Matthias König</strong> &middot; Professor of Metabolic Inflammation and Carcinogenesis of the Liver</p>
      </div>
      <div class="footer-social">
        <a href={url('/cv/')} target="_blank" rel="noopener noreferrer" title="Curriculum vitae"><Icon name="user" /></a>
        <a href="https://github.com/matthiaskoenig" target="_blank" rel="noopener noreferrer" title="GitHub"><Icon name="github" /></a>
        <a href="http://scholar.google.com/citations?user=xD9IjnYAAAAJ&hl=en" target="_blank" rel="noopener noreferrer" title="Google Scholar"><Icon name="google" /></a>
        <a href="https://orcid.org/0000-0003-1725-179X" target="_blank" rel="noopener noreferrer" title="ORCID"><Icon name="orcid" /></a>
        <a href="https://www.linkedin.com/in/matthias-k%C3%B6nig-796bb758/" target="_blank" rel="noopener noreferrer" title="LinkedIn"><Icon name="linkedin" /></a>
        <a href="https://www.youtube.com/channel/UCin1GjSgRYEkN0Oqia_D44A" target="_blank" rel="noopener noreferrer" title="YouTube"><Icon name="youtube" /></a>
        <a href="https://www.researchgate.net/profile/Matthias_Koenig4/" target="_blank" rel="noopener noreferrer" title="ResearchGate"><Icon name="registered" /></a>
      </div>
    </div>
    <div class="footer-addresses grid md:grid-cols-2 gap-x-6">
      <div>
        <strong>Lübeck</strong> &middot;
        University Hospital Schleswig-Holstein, Campus Lübeck, First Department of Medicine, Ratzeburger Allee 160, 23562 Lübeck, Germany &middot;
        <Icon name="envelope" /> <a href={`mailto:${email}`}>{email}</a> &middot;
        <Icon name="phone" /> +49 451 3101-7845
      </div>
      <div>
        <strong>Berlin</strong> &middot;
        Institute for Biology, ITB, Humboldt-Universität zu Berlin, Philippstraße 13, 10115 Berlin, Germany &middot;
        <Icon name="envelope" /> <a href="mailto:koenigmx@hu-berlin.de">koenigmx@hu-berlin.de</a> &middot;
        <Icon name="phone" /> +49 30 2093-98435
      </div>
    </div>
    <div class="footer-legal">
      <a href={url('/impressum/')}>Impressum</a>
      <span aria-hidden="true">&middot;</span>
      <a href={url('/privacy/')}>Datenschutzerklärung</a>
    </div>
  </div>
</footer>
```

- [ ] **Step 4: Write `site/layouts/Base.astro`**

```astro
---
import '../styles/global.css';
import Head from '../components/Head.astro';
import TopNav from '../components/TopNav.astro';
import Footer from '../components/Footer.astro';
import { url } from '../lib/url';

interface Props { title?: string; description?: string; sectionid?: string }
const { title, description, sectionid } = Astro.props;
const isHome = Astro.url.pathname === url('/');
---
<html lang="en" class:list={[{ onepager: isHome }]}>
  <head>
    <Head title={title} description={description} />
  </head>
  <body>
    <TopNav sectionid={sectionid} />
    <div class="page-content">
      <div class="wrapper">
        <div class="container">
          <slot />
        </div>
      </div>
    </div>
    <Footer home={isHome} />
    <slot name="global" />
  </body>
</html>
```

The `global` slot is filled in Task 9/10 with the search modal and cookie banner islands; leave it as a slot for now so this task builds.

- [ ] **Step 5: Use the layout on the placeholder page**

`site/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base>
  <h2>scaffold</h2>
</Base>
```

Run: `npm run build && npm run preview` — open `/`: dark navbar with brand, footer with icons, no console errors. Resize below 768px: hamburger shows and toggles the menu.

- [ ] **Step 6: Commit**

```bash
git add site/layouts site/components/Head.astro site/components/TopNav.astro site/components/NavToggle.vue site/components/Footer.astro site/pages/index.astro
git commit -m "Add Base layout with head, navbar, and footer"
```

---

### Task 9: Modal infrastructure, site search island, search index endpoint

**Files:**
- Create: `site/lib/modals.ts`, `site/lib/modals.test.ts`, `site/lib/search.ts`, `site/lib/search.test.ts`, `site/components/Modal.vue`, `site/components/SiteSearch.vue`, `site/pages/search.json.ts`
- Modify: `site/layouts/Base.astro` (render `<SiteSearch client:idle searchUrl={url('/search.json')} />` where the `global` slot was)

**Interfaces:**
- Produces `modals.ts`: `installModalRouter(): void` (idempotent; document-level click handler for `[data-modal-target]` (ignores clicks on `a` inside the trigger), keydown Enter/Space on `[data-modal-target][role="button"]`, `hashchange` + initial hash handling: a `dialog.modal` id opens it, any other id gets `search-highlight` + smooth scroll unless it is a `.page-section`/`.footer`), `openModal(id: string): void`, `closeModal(id: string): void`, `onModalOpen(id, cb)`/`onModalClose(id, cb)` via the native `dialog` `close` event and a custom `modal:open` event dispatched on the dialog.
- Produces `Modal.vue`: props `id: string`, `title: string`, `centered?: boolean`; slot default (body). Renders `<dialog class="modal" :id>` with header + close button; calls `installModalRouter()` on mount; emits `open`/`close`.
- Produces `search.ts`: `type SearchRecord = { type: string; title: string; text: string; url: string }`, `scoreRecord(record, tokens: string[]): number` (-1 = no match), `rankRecords(records, query, limit = 30): SearchRecord[]`, `SEARCH_TYPE_ICONS: Record<string, string>`.
- Produces `SiteSearch.vue` island: prop `searchUrl: string`; lazy-fetches records on first open; `/` and Cmd/Ctrl+K open it; result click closes it.
- Produces `/search.json`: array of `SearchRecord` in the same order and with the same `type` labels as today's `app/search.json`.

- [ ] **Step 1: Write the failing tests**

`site/lib/search.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { rankRecords, scoreRecord } from './search';

const recs = [
  { type: 'Publication', title: 'Liver glucose model', text: 'hepatic metabolism', url: '/a' },
  { type: 'Person', title: 'Jane Doe', text: 'works on liver models', url: '/b' },
  { type: 'Project', title: 'Kidney twin', text: 'nothing here', url: '/c' },
];

describe('scoreRecord', () => {
  it('scores title-prefix 15, title 10, text 1, and -1 when a token is missing', () => {
    expect(scoreRecord(recs[0], ['liver'])).toBe(15);
    expect(scoreRecord(recs[0], ['glucose'])).toBe(10);
    expect(scoreRecord(recs[1], ['liver'])).toBe(1);
    expect(scoreRecord(recs[0], ['liver', 'kidney'])).toBe(-1);
  });
});

describe('rankRecords', () => {
  it('returns matching records best first, capped', () => {
    expect(rankRecords(recs, 'liver').map((r) => r.url)).toEqual(['/a', '/b']);
    expect(rankRecords(recs, '  ')).toEqual([]);
    expect(rankRecords(recs, 'liver', 1)).toHaveLength(1);
  });
});
```

`site/lib/modals.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { closeModal, installModalRouter, openModal } from './modals';

function setup(hash = '') {
  document.body.innerHTML = `
    <button id="btn" data-modal-target="m1">open</button>
    <div id="card" role="button" tabindex="0" data-modal-target="m1"><a id="inner" href="#x">link</a></div>
    <dialog class="modal" id="m1"><p>hi</p></dialog>
    <div id="row-1">row</div>
    <section class="page-section" id="home"></section>`;
  // happy-dom lacks showModal(); polyfill enough for the router
  for (const d of document.querySelectorAll('dialog')) {
    const dlg = d as HTMLDialogElement;
    dlg.showModal = () => { dlg.setAttribute('open', ''); };
    dlg.close = () => { dlg.removeAttribute('open'); dlg.dispatchEvent(new Event('close')); };
    dlg.scrollIntoView = () => {};
  }
  (document.getElementById('row-1') as HTMLElement).scrollIntoView = () => {};
  window.location.hash = hash;
  installModalRouter();
}

describe('modal router', () => {
  beforeEach(() => { document.body.innerHTML = ''; window.location.hash = ''; });

  it('opens on a data-modal-target click and closes via closeModal', () => {
    setup();
    document.getElementById('btn')!.click();
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(true);
    closeModal('m1');
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(false);
  });

  it('ignores clicks on links inside a clickable card', () => {
    setup();
    document.getElementById('inner')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(false);
  });

  it('opens a card on Enter', () => {
    setup();
    document.getElementById('card')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(true);
  });

  it('opens the modal named by the URL hash on install, highlights other anchors', () => {
    setup('#m1');
    expect(document.getElementById('m1')!.hasAttribute('open')).toBe(true);
    closeModal('m1');
    window.location.hash = '#row-1';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(document.getElementById('row-1')!.classList.contains('search-highlight')).toBe(true);
    window.location.hash = '#home';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(document.getElementById('home')!.classList.contains('search-highlight')).toBe(false);
  });

  it('openModal dispatches modal:open', () => {
    setup();
    let opened = 0;
    document.getElementById('m1')!.addEventListener('modal:open', () => opened++);
    openModal('m1');
    expect(opened).toBe(1);
  });
});
```

Run: `npm test` → FAIL (modules missing).

- [ ] **Step 2: Write `site/lib/search.ts`**

```ts
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
```

- [ ] **Step 3: Write `site/lib/modals.ts`**

```ts
/**
 * One document-level router for every native <dialog class="modal"> on a
 * page (person/project/news modals, site search): opens on
 * [data-modal-target] clicks/keys, on a matching URL hash (search results
 * deep-link to #person-modal-<id>), and pulses non-modal anchors.
 */
let installed = false;

function dialog(id: string): HTMLDialogElement | null {
  const el = document.getElementById(id);
  return el instanceof HTMLDialogElement ? el : null;
}

export function openModal(id: string): void {
  const dlg = dialog(id);
  if (!dlg || dlg.open) return;
  dlg.showModal();
  dlg.dispatchEvent(new CustomEvent('modal:open'));
}

export function closeModal(id: string): void {
  const dlg = dialog(id);
  if (dlg?.open) dlg.close();
}

function focusHashTarget(): void {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return;
  const el = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!el) return;
  if (el instanceof HTMLDialogElement) { openModal(el.id); return; }
  // homepage sections/footer are plain scroll-snap anchors, not search hits
  if (el.classList.contains('page-section') || el.classList.contains('footer')) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('search-highlight');
  window.setTimeout(() => el.classList.remove('search-highlight'), 2500);
}

export function installModalRouter(): void {
  if (installed) return;
  installed = true;

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    // backdrop click closes (the dialog itself is the event target then)
    if (target instanceof HTMLDialogElement && target.classList.contains('modal')) { target.close(); return; }
    if (target.closest('[data-modal-close]')) { target.closest('dialog')?.close(); return; }
    const trigger = target.closest<HTMLElement>('[data-modal-target]');
    if (!trigger) return;
    // links inside a clickable card navigate on their own
    const link = target.closest('a');
    if (link && trigger.contains(link) && link !== trigger) return;
    e.preventDefault();
    openModal(trigger.dataset.modalTarget!);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target as HTMLElement | null;
    const card = target?.closest<HTMLElement>('[data-modal-target][role="button"]');
    if (!card) return;
    e.preventDefault();
    openModal(card.dataset.modalTarget!);
  });

  window.addEventListener('hashchange', focusHashTarget);
  focusHashTarget();
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test` → PASS.

- [ ] **Step 5: Write `site/components/Modal.vue`**

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { installModalRouter } from '../lib/modals';

const props = defineProps<{ id: string; title: string; centered?: boolean }>();
const emit = defineEmits<{ open: []; close: [] }>();
const el = ref<HTMLDialogElement | null>(null);

onMounted(() => {
  installModalRouter();
  el.value?.addEventListener('modal:open', () => emit('open'));
  el.value?.addEventListener('close', () => emit('close'));
});
</script>

<template>
  <dialog ref="el" :id="id" class="modal" :class="{ 'modal-centered': centered }" :aria-labelledby="`${id}-label`">
    <div class="modal-header">
      <h5 class="modal-title" :id="`${id}-label`">{{ title }}</h5>
      <button type="button" class="btn-close" data-modal-close aria-label="Close"></button>
    </div>
    <div class="modal-body">
      <slot />
    </div>
  </dialog>
</template>
```

- [ ] **Step 6: Write `site/components/SiteSearch.vue`** (port of `_includes/site_search.html` + `search.js`)

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Icon from './Icon.vue';
import Modal from './Modal.vue';
import { closeModal, openModal } from '../lib/modals';
import { rankRecords, SEARCH_TYPE_ICONS, type SearchRecord } from '../lib/search';

const props = defineProps<{ searchUrl: string }>();
const MODAL_ID = 'site-search-modal';

const input = ref<HTMLInputElement | null>(null);
const query = ref('');
const records = ref<SearchRecord[] | null>(null);
const failed = ref(false);
const results = ref<SearchRecord[]>([]);
let loading: Promise<void> | null = null;

function load(): Promise<void> {
  if (!loading) {
    loading = fetch(props.searchUrl)
      .then((r) => r.json())
      .then((data: SearchRecord[]) => { records.value = data; })
      .catch(() => { failed.value = true; });
  }
  return loading;
}

function render() {
  results.value = records.value ? rankRecords(records.value, query.value) : [];
}

function onOpen() {
  input.value?.focus();
  load().then(render);
}

function onClose() {
  query.value = '';
  results.value = [];
}

onMounted(() => {
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    const inField = tag === 'INPUT' || tag === 'TEXTAREA';
    const isSlash = e.key === '/' && !inField;
    const isCtrlK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
    if (isSlash || isCtrlK) { e.preventDefault(); openModal(MODAL_ID); }
  });
});
</script>

<template>
  <Modal :id="MODAL_ID" title="Search" centered @open="onOpen" @close="onClose">
    <input ref="input" v-model="query" type="search" id="site-search-input" class="form-control site-search-input"
      placeholder="Search publications, people, projects, software, news, ..." autocomplete="off" aria-label="Search" @input="render" />
    <div id="site-search-results" class="site-search-results">
      <p v-if="failed" class="site-search-empty">Search is temporarily unavailable.</p>
      <p v-else-if="!query.trim()" class="site-search-hint">Start typing to search publications, people, projects, software, news, and more.</p>
      <p v-else-if="results.length === 0" class="site-search-empty">No results for &ldquo;{{ query.trim() }}&rdquo;.</p>
      <a v-else v-for="r in results" :key="r.url" class="site-search-result" :href="r.url" @click="closeModal(MODAL_ID)">
        <Icon :name="SEARCH_TYPE_ICONS[r.type] ?? 'file-o'" />
        <span class="site-search-result-body">
          <span class="site-search-result-title">{{ r.title }}</span>
          <span class="site-search-result-type">{{ r.type }}</span>
        </span>
      </a>
    </div>
  </Modal>
</template>
```

- [ ] **Step 7: Write `site/pages/search.json.ts`** (port of `app/search.json`; same order, labels, and url anchors)

```ts
import type { APIRoute } from 'astro';
import * as d from '../lib/data';
import type { SearchRecord } from '../lib/search';
import { stripHtml } from '../lib/text';
import { url } from '../lib/url';

const clean = (s: string | null | undefined) => (s ?? '').replace(/\s*\n\s*/g, ' ').trim();
const join = (parts: (string | number | null | undefined)[]) => clean(parts.map((p) => (p == null ? '' : String(p))).join(' '));

export const GET: APIRoute = async () => {
  const [tags, people, publications, presentations, posters, abstracts, projects, software, funding, editors, news, meetings, teaching] =
    await Promise.all([d.getTags(), d.getPeople(), d.getPublications(), d.getPresentations(), d.getPosters(), d.getAbstracts(), d.getProjects(), d.getSoftware(), d.getFunding(), d.getEditors(), d.getNews(), d.getMeetings(), d.getTeaching()]);

  const out: SearchRecord[] = [];
  for (const p of publications) out.push({ type: 'Publication', title: stripHtml(p.title), text: join([stripHtml(p.authors), p.journal, p.year, p.status, p.tags.join(', '), stripHtml(p.abstract ?? ''), p.keywords.join(', ')]), url: url(`/publications/#pub-${p.id}`) });
  for (const p of presentations) out.push({ type: 'Presentation', title: stripHtml(p.title), text: join([stripHtml(p.authors), p.event, p.location, p.tags.join(', '), stripHtml(p.abstract ?? ''), p.keywords.join(', ')]), url: url(`/publications/#presentation-${p.id}`) });
  for (const p of posters) out.push({ type: 'Poster', title: stripHtml(p.title), text: join([stripHtml(p.authors), p.event, p.tags.join(', '), stripHtml(p.abstract), p.keywords.join(', ')]), url: url(`/publications/#poster-${p.id}`) });
  for (const a of abstracts) out.push({ type: 'Abstract', title: stripHtml(a.title), text: join([stripHtml(a.authors), a.event, stripHtml(a.abstract ?? ''), a.keywords.join(', ')]), url: url(`/publications/#abstract-${a.id}`) });
  for (const p of projects) if (p.status === 'current') out.push({ type: 'Project', title: stripHtml(p.title), text: join([p.tags.join(', '), stripHtml(p.abstract)]), url: url(`/projects/#project-modal-${p.id}`) });
  for (const s of software) out.push({ type: 'Software', title: stripHtml(s.name), text: join([s.title, stripHtml(s.description), s.tags.join(', ')]), url: url(`/research/#software-${s.id}`) });
  for (const f of funding) out.push({ type: 'Funding', title: stripHtml(f.title), text: join([f.funder, f.funder_short, stripHtml(f.description), f.tags.join(', ')]), url: url(`/research/#funding-${f.id}`) });
  for (const e of editors) out.push({ type: 'Editorial role', title: stripHtml(e.name), text: join([e.tenure, stripHtml(e.description), e.tags.join(', ')]), url: url(`/research/#editor-${e.id}`) });
  for (const n of news) out.push({ type: 'News', title: stripHtml(n.title), text: join([stripHtml(n.short), n.tags.join(', ')]), url: url(`/news/#news-modal-${n.id}`) });
  for (const m of meetings) out.push({ type: 'Meeting', title: stripHtml(m.title), text: join([m.location, stripHtml(m.description), m.tags.join(', ')]), url: url(`/meetings/#meeting-${m.id}`) });
  for (const t of teaching) out.push({ type: 'Teaching', title: stripHtml(t.title), text: join([t.type.join(', '), t.location, stripHtml(t.content), t.tags.join(', ')]), url: url(`/teaching/#teaching-${t.id}`) });
  for (const p of people) if (p.status === 'current' || p.image) out.push({ type: 'Person', title: stripHtml(p.name), text: join([p.role.join(', '), p.affiliation, p.tenure, stripHtml(p.description ?? '')]), url: url(`/people/#person-modal-${p.id}`) });
  for (const t of tags) out.push({ type: 'Research area', title: t.tag, text: join([t.short_description, t.vision]), url: url(`/#${t.slug}`) });

  const pages: [string, string, string][] = [
    ['Team', 'Current members and alumni of the group.', '/people/'],
    ['Open Positions', 'Internships, Bachelor and Master theses, PhD and PostDoc positions - in Lübeck or Berlin.', '/people/#open-positions'],
    ['Research', 'Software, funding, and editorial roles.', '/research/'],
    ['Projects', 'Ongoing research projects.', '/projects/'],
    ['Publications', 'Publications, presentations, posters, and abstracts.', '/publications/'],
    ['News', 'Recent news and updates from the group.', '/news/'],
    ['Meetings', 'Meetings, workshops, and events organized or hosted by the group.', '/meetings/'],
    ['Teaching', 'Project-based teaching in digital health and shared decision-making, Open Science, and interdisciplinary collaboration.', '/teaching/'],
    ['Impressum', 'Legal notice: contact details, address, and person responsible for content per section 5 TMG.', '/impressum/'],
    ['Datenschutzerklärung', 'Privacy policy: server logs, Google Analytics, cookie consent, and data subject rights.', '/privacy/'],
  ];
  for (const [title, text, path] of pages) out.push({ type: 'Page', title, text, url: url(path) });

  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
```

- [ ] **Step 8: Mount the search island in `Base.astro`**

Replace `<slot name="global" />` with:

```astro
    <SiteSearch client:idle searchUrl={url('/search.json')} />
    <slot name="global" />
```

and add `import SiteSearch from '../components/SiteSearch.vue';` to the frontmatter.

- [ ] **Step 9: Build and verify**

```bash
npm run build
python3 -c "import json; d=json.load(open('dist/search.json')); print(len(d)); import collections; print(collections.Counter(r['type'] for r in d))"
python3 -c "import json; d=json.load(open('web/search.json')); import collections; print(len(d)); print(collections.Counter(r['type'] for r in d))"
```

Expected: identical totals and per-type counts between `dist/search.json` and the Jekyll `web/search.json`. Then `npm run preview`, press `/`, type "liver", results appear, Escape closes, clicking the navbar magnifier opens it.

- [ ] **Step 10: Commit**

```bash
git add site/lib/modals.ts site/lib/modals.test.ts site/lib/search.ts site/lib/search.test.ts site/components/Modal.vue site/components/SiteSearch.vue site/pages/search.json.ts site/layouts/Base.astro
git commit -m "Add native dialog modal router, site search island, and search index endpoint"
```

---

### Task 10: Cookie consent island

**Files:**
- Create: `site/lib/consent.ts`, `site/lib/consent.test.ts`, `site/components/CookieConsent.vue`
- Modify: `site/layouts/Base.astro`, `astro.config.mjs` (no change needed; the GA id is a prop)

**Interfaces:**
- Produces `consent.ts`: `getConsent(): 'accepted' | 'declined' | null`, `setConsent(v)`, `clearConsent()`, `deleteGoogleAnalyticsCookies()`, `loadGoogleAnalytics(gaId: string): void` (idempotent via `window.gaLoaded`).
- Produces `CookieConsent.vue` island: prop `gaId: string`; shows the banner unless a choice is stored; loads GA on accept or on a stored "accepted"; attaches to `#cookie-consent-reset` (privacy page) to reopen the banner and delete GA cookies.
- The GA id `G-FDNGDW6G09` is passed from `Base.astro`.

- [ ] **Step 1: Write the failing test**

`site/lib/consent.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { clearConsent, deleteGoogleAnalyticsCookies, getConsent, loadGoogleAnalytics, setConsent } from './consent';

describe('consent storage', () => {
  beforeEach(() => { localStorage.clear(); (window as any).gaLoaded = false; document.head.innerHTML = ''; });

  it('round-trips the choice', () => {
    expect(getConsent()).toBeNull();
    setConsent('accepted');
    expect(getConsent()).toBe('accepted');
    clearConsent();
    expect(getConsent()).toBeNull();
  });

  it('loads gtag once and only when asked', () => {
    loadGoogleAnalytics('G-TEST');
    loadGoogleAnalytics('G-TEST');
    const scripts = document.head.querySelectorAll('script[src*="googletagmanager.com/gtag/js?id=G-TEST"]');
    expect(scripts).toHaveLength(1);
    expect((window as any).dataLayer.length).toBeGreaterThan(0);
  });

  it('deletes _ga cookies', () => {
    document.cookie = '_ga=1; path=/';
    document.cookie = '_ga_X=2; path=/';
    deleteGoogleAnalyticsCookies();
    expect(document.cookie).not.toMatch(/_ga/);
  });
});
```

Run: `npm test` → FAIL.

- [ ] **Step 2: Write `site/lib/consent.ts`**

```ts
const STORAGE_KEY = 'cookie_consent';
export type Consent = 'accepted' | 'declined';

export function getConsent(): Consent | null {
  try { return localStorage.getItem(STORAGE_KEY) as Consent | null; } catch { return null; }
}
export function setConsent(value: Consent): void {
  try { localStorage.setItem(STORAGE_KEY, value); } catch { /* storage blocked: banner shows again next visit */ }
}
export function clearConsent(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function deleteGoogleAnalyticsCookies(): void {
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim() ?? '';
    if (/^_ga/.test(name)) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}

declare global { interface Window { gaLoaded?: boolean; dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void } }

/** Requests gtag.js from Google — only ever called after opt-in. */
export function loadGoogleAnalytics(gaId: string): void {
  if (!gaId || window.gaLoaded) return;
  window.gaLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) { window.dataLayer!.push(args); };
  window.gtag('js', new Date());
  window.gtag('config', gaId);
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  document.head.appendChild(script);
}
```

Run: `npm test` → PASS.

- [ ] **Step 3: Write `site/components/CookieConsent.vue`** (port of `_includes/cookie_consent.html` + `cookie-consent.js`)

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { clearConsent, deleteGoogleAnalyticsCookies, getConsent, loadGoogleAnalytics, setConsent } from '../lib/consent';

const props = defineProps<{ gaId: string; privacyUrl: string }>();
const visible = ref(false);

function accept() { setConsent('accepted'); loadGoogleAnalytics(props.gaId); visible.value = false; }
function decline() { setConsent('declined'); deleteGoogleAnalyticsCookies(); visible.value = false; }
function reset() { clearConsent(); deleteGoogleAnalyticsCookies(); window.gaLoaded = false; visible.value = true; }

onMounted(() => {
  const consent = getConsent();
  if (consent === 'accepted') loadGoogleAnalytics(props.gaId);
  else if (consent !== 'declined') visible.value = true;
  // "Cookie-Einstellungen ändern" button on /privacy/ — withdrawing must be as easy as giving
  document.getElementById('cookie-consent-reset')?.addEventListener('click', reset);
});
</script>

<template>
  <div id="cookie-consent-banner" class="cookie-consent" :hidden="!visible">
    <p class="cookie-consent-text">
      This site uses Google Analytics to understand how it's used. It only runs if you accept — see the <a :href="privacyUrl">privacy policy</a> for details.
    </p>
    <div class="cookie-consent-actions">
      <button type="button" id="cookie-consent-decline" class="btn btn-outline-secondary btn-sm" @click="decline">Decline</button>
      <button type="button" id="cookie-consent-accept" class="btn btn-primary btn-sm" @click="accept">Accept</button>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Mount it in `Base.astro`**

Add `import CookieConsent from '../components/CookieConsent.vue';` and, right after `<Footer … />`:

```astro
    <CookieConsent client:load gaId="G-FDNGDW6G09" privacyUrl={url('/privacy/')} />
```

- [ ] **Step 5: Verify and commit**

`npm run build && npm run preview`: banner shows at the bottom; Decline hides it and reloading keeps it hidden; clear localStorage, Accept, and the Network tab shows exactly one `gtag/js?id=G-FDNGDW6G09` request; before accepting there is none.

```bash
git add site/lib/consent.ts site/lib/consent.test.ts site/components/CookieConsent.vue site/layouts/Base.astro
git commit -m "Add cookie consent island gating Google Analytics"
```

---

### Task 11: Shared leaf components — tag badges, tag filter, people avatars, person chips, hover card, core-message tiles

**Files:**
- Create: `site/lib/tagFilter.ts`, `site/lib/tagFilter.test.ts`, `site/components/TagList.vue`, `site/components/TagFilterBar.vue`, `site/components/PeopleAvatars.vue`, `site/components/PersonChips.vue`, `site/components/PersonAvatar.vue`, `site/components/PersonAvatar.test.ts`, `site/components/CoreMessages.astro`

**Interfaces:**
- `tagFilter.ts`: `useTagFilter()` → `{ activeTag: Ref<string>, setTag(tag: string): void, matches(tags: string[]): boolean }`; `activeTag` starts as `'all'`, is read from `?tag=` in `onMounted`, and `setTag` does not touch the URL (parity: today the button click only filters).
- `TagList.vue`: props `tags: string[]`, `tagInfo: TagInfo[]` (from `getTags()`); renders `.tag-list > .tag-badge.tag-<slug>` with icon + name; renders nothing for an empty list.
- `TagFilterBar.vue`: props `tags: TagInfo[]`, `modelValue: string`, `id: string`; emits `update:modelValue`; renders `.tag-filter#<id>-tag-filter` with the "All" button and one `.tag-filter-btn.tag-<slug>` per tag.
- `PeopleAvatars.vue`: props `people: string[]`, `peopleMap: PeopleMap`, `avatarBase: string`; renders the `.project-avatar` images via `avatarPeople()`.
- `PersonChips.vue`: props `text: string`, `people: string[]`, `peopleMap: PeopleMap`, `avatarBase: string`; renders `personChips()` HTML inline (`v-html` on a `<span>`).
- `PersonAvatar.vue` (island): props `name`, `src` (full URL), `position`, `description?` (already truncated), `modalId?`, `imgClass?` (`'alumni-photo'` on the Team page); owns hover/focus/click open, outside-click close, viewport clamping (`--arrow-shift`).
- `CoreMessages.astro`: prop `tags: TagInfo[]`, `hrefPrefix` (`''` on the homepage → `#slug`, `url('/')` on the Team page → `/#slug`); renders `.core-messages` tiles.

- [ ] **Step 1: Write the failing tests**

`site/lib/tagFilter.test.ts`:

```ts
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import { useTagFilter } from './tagFilter';

function mountWith(search: string) {
  window.history.replaceState({}, '', `/x/${search}`);
  const Comp = defineComponent({ setup() { return useTagFilter(); }, render() { return h('div'); } });
  // the vm proxy unwraps the returned refs: vm.activeTag is a string
  return mount(Comp).vm as unknown as { activeTag: string; setTag(t: string): void; matches(tags: string[]): boolean };
}

describe('useTagFilter', () => {
  it('defaults to all and matches everything', () => {
    const f = mountWith('');
    expect(f.activeTag).toBe('all');
    expect(f.matches([])).toBe(true);
    expect(f.matches(['AI'])).toBe(true);
  });
  it('reads ?tag= on mount and filters by it', () => {
    const f = mountWith('?tag=Open%20%26%20FAIR');
    expect(f.activeTag).toBe('Open & FAIR');
    expect(f.matches(['Open & FAIR', 'AI'])).toBe(true);
    expect(f.matches(['AI'])).toBe(false);
  });
  it('setTag switches the filter', () => {
    const f = mountWith('');
    f.setTag('AI');
    expect(f.matches(['AI'])).toBe(true);
    expect(f.matches(['Digital Twins'])).toBe(false);
    f.setTag('all');
    expect(f.matches([])).toBe(true);
  });
});
```

`site/components/PersonAvatar.test.ts`:

```ts
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PersonAvatar from './PersonAvatar.vue';

const props = { name: 'Jane Doe', src: '/p/jane.webp', position: 'PhD student', description: 'Works on livers.', modalId: 'person-modal-jane' };

describe('PersonAvatar', () => {
  it('renders the photo and a hidden card', () => {
    const w = mount(PersonAvatar, { props, attachTo: document.body });
    expect(w.find('img').attributes('alt')).toBe('Jane Doe');
    expect(w.find('.person-card').classes()).not.toContain('is-visible');
    expect(w.find('.member-more').attributes('data-modal-target')).toBe('person-modal-jane');
    w.unmount();
  });
  it('opens on mouseenter/focus, closes on mouseleave/blur, toggles on click', async () => {
    const w = mount(PersonAvatar, { props, attachTo: document.body });
    await w.trigger('mouseenter');
    expect(w.find('.person-card').classes()).toContain('is-visible');
    await w.trigger('mouseleave');
    expect(w.find('.person-card').classes()).not.toContain('is-visible');
    await w.trigger('click');
    expect(w.find('.person-card').classes()).toContain('is-visible');
    await w.trigger('click');
    expect(w.find('.person-card').classes()).not.toContain('is-visible');
    w.unmount();
  });
  it('only one card is open at a time', async () => {
    const a = mount(PersonAvatar, { props, attachTo: document.body });
    const b = mount(PersonAvatar, { props: { ...props, name: 'B' }, attachTo: document.body });
    await a.trigger('click');
    await b.trigger('click');
    expect(a.find('.person-card').classes()).not.toContain('is-visible');
    expect(b.find('.person-card').classes()).toContain('is-visible');
    a.unmount(); b.unmount();
  });
});
```

Run: `npm test` → FAIL.

- [ ] **Step 2: Write `site/lib/tagFilter.ts`**

```ts
import { onMounted, ref } from 'vue';

/** Port of the .tag-filter handler in main.js: 'all' or one tag name; ?tag= pre-applies on load. */
export function useTagFilter() {
  const activeTag = ref('all');
  onMounted(() => {
    const urlTag = new URLSearchParams(window.location.search).get('tag');
    if (urlTag) activeTag.value = urlTag;
  });
  function setTag(tag: string) { activeTag.value = tag; }
  function matches(tags: string[]) { return activeTag.value === 'all' || tags.includes(activeTag.value); }
  return { activeTag, setTag, matches };
}
```

- [ ] **Step 3: Write `TagList.vue`, `TagFilterBar.vue`, `PeopleAvatars.vue`, `PersonChips.vue`**

`site/components/TagList.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';
import { slugify } from '../lib/text';
import type { TagInfo } from '../lib/views';

const props = defineProps<{ tags: string[]; tagInfo: TagInfo[] }>();
const items = computed(() => props.tags.map((tag) => ({ tag, slug: slugify(tag), icon: props.tagInfo.find((t) => t.tag === tag)?.icon ?? null })));
</script>

<template>
  <div v-if="items.length" class="tag-list">
    <span v-for="t in items" :key="t.tag" class="tag-badge" :class="`tag-${t.slug}`"><Icon v-if="t.icon" :name="t.icon.replace(/^fa-/, '')" /> {{ t.tag }}</span>
  </div>
</template>
```

`site/components/TagFilterBar.vue` (port of `_includes/tag_filter.html`):

```vue
<script setup lang="ts">
import Icon from './Icon.vue';
import type { TagInfo } from '../lib/views';

defineProps<{ id: string; tags: TagInfo[]; modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [tag: string] }>();
</script>

<template>
  <div class="tag-filter" :id="`${id}-tag-filter`">
    <button type="button" class="tag-filter-btn" :class="{ active: modelValue === 'all' }" data-tag="all" @click="emit('update:modelValue', 'all')">All</button>
    <button v-for="t in tags" :key="t.tag" type="button" class="tag-filter-btn" :class="[`tag-${t.slug}`, { active: modelValue === t.tag }]"
      :data-tag="t.tag" :title="t.short_description" @click="emit('update:modelValue', t.tag)">
      <Icon :name="t.icon.replace(/^fa-/, '')" /> {{ t.tag }}
    </button>
  </div>
</template>
```

`site/components/PeopleAvatars.vue` (port of `_includes/people_avatars.html`):

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { avatarPeople, type PeopleMap } from '../lib/people';

const props = defineProps<{ people: string[]; peopleMap: PeopleMap; avatarBase: string }>();
const list = computed(() => avatarPeople(props.people, props.peopleMap));
</script>

<template>
  <img v-for="p in list" :key="p.id" :src="avatarBase + p.image" :alt="p.name" class="project-avatar" :title="p.name" />
</template>
```

`site/components/PersonChips.vue` (port of `_includes/person_chips.html`):

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { personChips, type PeopleMap } from '../lib/people';

const props = defineProps<{ text: string; people: string[]; peopleMap: PeopleMap; avatarBase: string }>();
const html = computed(() => personChips(props.text, props.people, props.peopleMap, props.avatarBase));
</script>

<template>
  <span v-html="html"></span>
</template>
```

- [ ] **Step 4: Write `site/components/PersonAvatar.vue`** (port of the `.person-avatar` block in `main.js`)

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps<{ name: string; src: string; position: string; description?: string | null; modalId?: string; imgClass?: string }>();
const root = ref<HTMLElement | null>(null);
const card = ref<HTMLElement | null>(null);
const open = ref(false);

// module-level registry so only one card is visible across all islands
const registry: Set<() => void> = ((globalThis as any).__personAvatarCloseAll ??= new Set());

function close() { open.value = false; if (card.value) { card.value.style.transform = ''; card.value.style.removeProperty('--arrow-shift'); } }
function closeOthers() { for (const fn of registry) if (fn !== close) fn(); }

/** keep the card inside the viewport by shifting it off its centered position */
function position() {
  const el = card.value; if (!el) return;
  const margin = 8;
  el.style.transform = 'translateX(-50%)';
  const rect = el.getBoundingClientRect();
  let shift = 0;
  if (rect.left < margin) shift = margin - rect.left;
  else if (rect.right > window.innerWidth - margin) shift = window.innerWidth - margin - rect.right;
  if (shift !== 0) { el.style.transform = `translateX(calc(-50% + ${shift}px))`; el.style.setProperty('--arrow-shift', `${-shift}px`); }
}
function show() { closeOthers(); open.value = true; requestAnimationFrame(position); }
function toggle() { const was = open.value; closeOthers(); if (was) close(); else show(); }
function onDocClick(e: MouseEvent) { if (!(e.target as HTMLElement).closest('.person-avatar')) close(); }

onMounted(() => { registry.add(close); document.addEventListener('click', onDocClick); });
onBeforeUnmount(() => { registry.delete(close); document.removeEventListener('click', onDocClick); });
</script>

<template>
  <div ref="root" class="person-avatar" tabindex="0" @mouseenter="show" @mouseleave="close" @focus="show" @blur="close" @click="toggle">
    <img :src="src" :alt="name" loading="lazy" :class="imgClass" />
    <div ref="card" class="person-card" :class="{ 'is-visible': open }">
      <strong>{{ name }}</strong>
      <span class="person-position">{{ position }}</span>
      <p v-if="description">{{ description }}</p>
      <a v-if="modalId" :href="`#${modalId}`" :data-modal-target="modalId" class="member-more">Full profile &rarr;</a>
    </div>
  </div>
</template>
```

- [ ] **Step 5: Write `site/components/CoreMessages.astro`** (the tag tiles used on `/` and `/people/`)

```astro
---
import Icon from './Icon.vue';
import type { TagInfo } from '../lib/views';

interface Props { tags: TagInfo[]; hrefPrefix?: string }
const { tags, hrefPrefix = '' } = Astro.props;
---
<div class="core-messages">
  {tags.map((t) => (
    <div class="core-message">
      <a href={`${hrefPrefix}#${t.slug}`}>
        <Icon name={t.icon.replace(/^fa-/, '')} />
        <h3>{t.tag}</h3>
        <p>{t.short_description}</p>
      </a>
    </div>
  ))}
</div>
```

- [ ] **Step 6: Run tests, build, commit**

Run: `npm test && npm run build` → PASS, build OK.

```bash
git add site/lib/tagFilter.ts site/lib/tagFilter.test.ts site/components
git commit -m "Add shared Vue leaf components: tag badges/filter, avatars, chips, hover card"
```

---

### Task 12: Homepage

**Files:**
- Modify: `site/pages/index.astro` (replace placeholder; port of `app/index.html`)

**Interfaces:**
- Consumes: `getTags`, `getPeople`, `getPublications`, `getProjects`, `getSoftware` from `data.ts`; `tagCounts`; `CoreMessages.astro`; `PersonAvatar.vue` (island); `Icon.vue`; `asset`, `url`; `stripHtml`, `truncateWords`.

- [ ] **Step 1: Write `site/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import CoreMessages from '../components/CoreMessages.astro';
import Icon from '../components/Icon.vue';
import PersonAvatar from '../components/PersonAvatar.vue';
import { getPeople, getProjects, getPublications, getSoftware, getTags } from '../lib/data';
import { stripHtml, truncateWords } from '../lib/text';
import { asset, url } from '../lib/url';
import { tagCounts } from '../lib/views';

const [tags, people, publications, projects, software] = await Promise.all([getTags(), getPeople(), getPublications(), getProjects(), getSoftware()]);
const strip = people.filter((p) => p.status === 'current' && p.image);

// decorative background per section (app/assets/image/tags/)
const graphics: Record<string, string> = {
  'digital-twins': 'digital_twins_upscayl_3x_digital-art-4x.webp',
  'ai': 'ai_upscayl_3x_digital-art-4x.webp',
  'digital-pathology': 'digital_pathology_upscayl_3x_digital-art-4x.webp',
  'pharmacometrics': 'pharmacometrics_upscayl_3x_digital-art-4x.webp',
  'open-fair': 'fair_open_upscayl_3x_digital-art-4x.webp',
};

const sections = tags.map((t, i) => {
  const prev = i === 0 ? { slug: 'home', label: 'Home' } : { slug: tags[i - 1].slug, label: tags[i - 1].tag };
  const next = i === tags.length - 1 ? { slug: 'footer', label: 'Footer' } : { slug: tags[i + 1].slug, label: tags[i + 1].tag };
  return { ...t, prev, next, counts: tagCounts(t.tag, publications, projects, software), graphic: graphics[t.slug] };
});
const quickLinks = [
  { href: url('/projects/'), icon: 'cogs', title: 'Projects', text: 'Explore our ongoing research projects and digital twin models.' },
  { href: url('/publications/'), icon: 'file-pdf-o', title: 'Publications', text: 'Peer-reviewed papers, preprints, and open datasets from the lab.' },
  { href: url('/research/#software'), icon: 'code', title: 'Software', text: 'Open-source tools and models we build to make research reproducible, reusable, and trustworthy.' },
  { href: url('/people/'), icon: 'user-circle-o', title: 'Team', text: 'Get to know the researchers, engineers, and students turning ideas into digital twins.' },
  { href: url('/people/#open-positions'), icon: 'users', title: 'Open Positions', text: 'Internships, theses, and PhD opportunities — come join us.' },
];
---
<Base>
  <section class="page-section" id="home">
    <div class="text-justify">
      <h2 class="header-light">Systems Medicine, Digital Twins &amp; AI</h2>
      <p class="hero-subtitle">Metabolic Inflammation and Carcinogenesis of the Liver</p>
    </div>

    <CoreMessages tags={tags} />

    <div class="text-center vision-statement">
      <p class="lead">
        We build open, FAIR <strong>digital twins</strong> of human physiology — AI-powered models that
        predict disease and therapy, patient by patient.
      </p>
    </div>

    <div class="text-center">
      <div class="people-strip">
        {strip.map((p) => (
          <PersonAvatar client:idle name={p.name} src={asset(`image/people/128/${p.image}`)} position={p.role[p.role.length - 1] ?? ''}
            description={p.description ? truncateWords(stripHtml(p.description), 24) : null} />
        ))}
      </div>
    </div>

    <div class="text-center vision-statement">
      <p class="lead">What if every medical model served you, not the average — and belonged to everyone?</p>
    </div>

    <div class="core-messages">
      {quickLinks.map((q) => (
        <div class="core-message">
          <a href={q.href}><Icon name={q.icon} /><h3>{q.title}</h3><p>{q.text}</p></a>
        </div>
      ))}
    </div>

    <a class="section-scroll-cue section-scroll-cue-down" href={`#${tags[0].slug}`} aria-label={`Scroll to ${tags[0].tag}`}><Icon name="chevron-down" /></a>
  </section>

  {sections.map((s) => (
    <section class:list={['page-section', 'tag-section', `tag-${s.slug}`]} id={s.slug}>
      {s.graphic && <img class="tag-section-graphic" src={asset(`image/tags/${s.graphic}`)} alt="" aria-hidden="true" loading="lazy" />}
      <a class="section-scroll-cue section-scroll-cue-up" href={`#${s.prev.slug}`} aria-label={`Scroll to ${s.prev.label}`}><Icon name="chevron-up" /></a>
      <div class="tag-section-columns">
        <div class="tag-section-content">
          <Icon name={s.icon.replace(/^fa-/, '')} />
          <h2>{s.tag}</h2>
          <p class="lead">{s.vision}</p>
        </div>
        {(s.counts.publications > 0 || s.counts.projects > 0 || s.counts.software > 0) && (
          <div class="tag-section-links">
            {s.counts.publications > 0 && (
              <a class="tag-section-link" href={`${url('/publications/')}?tag=${encodeURIComponent(s.tag)}`}>
                <Icon name="file-pdf-o" /><span><strong>Publications</strong><span>Papers, reviews, and preprints on {s.tag}.</span></span>
              </a>
            )}
            {s.counts.projects > 0 && (
              <a class="tag-section-link" href={`${url('/projects/')}?tag=${encodeURIComponent(s.tag)}`}>
                <Icon name="cogs" /><span><strong>Projects</strong><span>Ongoing {s.tag} research projects.</span></span>
              </a>
            )}
            {s.counts.software > 0 && (
              <a class="tag-section-link" href={`${url('/research/')}?tag=${encodeURIComponent(s.tag)}#software`}>
                <Icon name="code" /><span><strong>Software</strong><span>Open-source tools for {s.tag}.</span></span>
              </a>
            )}
          </div>
        )}
      </div>
      <a class="section-scroll-cue section-scroll-cue-down" href={`#${s.next.slug}`} aria-label={`Scroll to ${s.next.label}`}><Icon name="chevron-down" /></a>
    </section>
  ))}
</Base>
```

- [ ] **Step 2: Compare with the Jekyll build**

Run: `npm run build && npm run preview`. Open `/` and `web/index.html` (via `npx serve web -l 4400`) side by side: hero, five tiles, people strip with hover cards, five coloured sections with chevrons; scrolling snaps. Check the DOM: `grep -o 'id="[a-z-]*"' dist/index.html | sort -u` equals the same command on `web/index.html`.

- [ ] **Step 3: Commit**

```bash
git add site/pages/index.astro
git commit -m "Port the homepage"
```

---

### Task 13: Publications page (publications, presentations, posters, abstracts)

**Files:**
- Create: `site/components/PublicationRow.vue`, `site/components/PublicationsSection.vue`, `site/components/PresentationCard.vue`, `site/components/PosterCard.vue`, `site/components/AbstractCard.vue`, `site/pages/publications.astro`

**Interfaces:**
- `PublicationRow.vue`: props `pub: Entry<PublicationData>`, `tagInfo: TagInfo[]`, `peopleMap: PeopleMap`, `pdfBase: string` (`asset('pdf/')`), `avatarBase: string` (`asset('image/people/128/')`). Renders one `<tr id="pub-<id>" data-tags="a|b">`.
- `PublicationsSection.vue` (island, `client:idle`): props `publications: Entry<PublicationData>[]`, `tagInfo`, `peopleMap`, `pdfBase`, `avatarBase`. Filter bar + year groups (empty groups hidden).
- `PresentationCard.vue` / `PosterCard.vue` / `AbstractCard.vue`: props `item`, `tagInfo`, `peopleMap`, `pdfBase`, `avatarBase` (AbstractCard: `item`, `pdfBase` only). Static (no client directive).

- [ ] **Step 1: Write `site/components/PublicationRow.vue`** (port of the `<tr>` in `app/publications.html`)

```vue
<script setup lang="ts">
import Icon from './Icon.vue';
import PersonChips from './PersonChips.vue';
import TagList from './TagList.vue';
import type { PeopleMap } from '../lib/people';
import type { PublicationData } from '../lib/schemas';
import { capitalize, slugify } from '../lib/text';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ pub: Entry<PublicationData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; pdfBase: string; avatarBase: string }>();
</script>

<template>
  <tr :id="`pub-${pub.id}`" :data-tags="pub.tags.join('|')">
    <td class="publication-status">
      <span class="status-badge" :class="`status-${slugify(pub.status)}`">{{ capitalize(pub.status) }}</span>
      <div class="pub-links">
        <a v-if="pub.pdf" :href="pdfBase + pub.pdf" title="PDF"><Icon name="file-pdf-o" /></a>
        <a v-if="pub.homepage" :href="pub.homepage" title="Project homepage"><Icon name="globe" /></a>
        <a v-if="pub.repository" :href="pub.repository" title="Repository homepage"><Icon name="github" /></a>
      </div>
    </td>
    <td>
      <TagList :tags="pub.tags" :tag-info="tagInfo" />
      <p class="pub-title"><i>{{ pub.title }}</i></p>
      <p class="pub-meta">
        <PersonChips :text="pub.authors" :people="pub.people" :people-map="peopleMap" :avatar-base="avatarBase" />; {{ pub.journal }}<template v-if="pub.doi">. doi:<a :href="`https://doi.org/${pub.doi}`">{{ pub.doi }}</a></template><template v-if="pub.pmid">. pmid:<a :href="`https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}`">{{ pub.pmid }}</a></template>
      </p>
      <details v-if="pub.abstract || pub.keywords.length" class="pub-abstract" :id="`abstract-${pub.id}`">
        <summary class="small"><Icon name="caret-down" /> Abstract</summary>
        <p v-if="pub.abstract" class="abstract text-justify small" v-html="pub.abstract"></p>
        <p v-if="pub.keywords.length" class="small"><strong class="small">Keywords:</strong> {{ pub.keywords.join(', ') }}</p>
      </details>
    </td>
  </tr>
</template>
```

- [ ] **Step 2: Write `site/components/PublicationsSection.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import PublicationRow from './PublicationRow.vue';
import TagFilterBar from './TagFilterBar.vue';
import type { PeopleMap } from '../lib/people';
import type { PublicationData } from '../lib/schemas';
import { useTagFilter } from '../lib/tagFilter';
import { groupByYear, type Entry, type TagInfo } from '../lib/views';

const props = defineProps<{ publications: Entry<PublicationData>[]; tagInfo: TagInfo[]; peopleMap: PeopleMap; pdfBase: string; avatarBase: string }>();
const { activeTag, setTag, matches } = useTagFilter();
const groups = computed(() => groupByYear(props.publications).map((g) => ({ ...g, visible: g.items.filter((p) => matches(p.tags)) })));
</script>

<template>
  <TagFilterBar id="publication" :tags="tagInfo" :model-value="activeTag" @update:model-value="setTag" />
  <div id="publication-list">
    <div v-for="g in groups" :key="g.year" class="pub-year-group" v-show="g.visible.length > 0">
      <h3 class="year-heading">{{ g.year }}</h3>
      <table class="table publication-table">
        <colgroup><col class="publication-status-col" /><col /></colgroup>
        <tbody>
          <PublicationRow v-for="p in g.items" :key="p.id" v-show="matches(p.tags)" :pub="p" :tag-info="tagInfo" :people-map="peopleMap" :pdf-base="pdfBase" :avatar-base="avatarBase" />
        </tbody>
      </table>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Write the three static cards**

`site/components/PresentationCard.vue`:

```vue
<script setup lang="ts">
import Icon from './Icon.vue';
import PeopleAvatars from './PeopleAvatars.vue';
import TagList from './TagList.vue';
import type { PeopleMap } from '../lib/people';
import type { PresentationData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ item: Entry<PresentationData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; pdfBase: string; avatarBase: string }>();
</script>

<template>
  <div class="project-card" :id="`presentation-${item.id}`" :data-tags="item.tags.join('|')">
    <template v-if="item.image">
      <a v-if="item.slides" :href="item.slides" target="_blank" rel="noopener noreferrer"><img :src="pdfBase + item.image" :alt="item.title" loading="lazy" class="project-image" /></a>
      <img v-else :src="pdfBase + item.image" :alt="item.title" loading="lazy" class="project-image" />
    </template>
    <div class="project-body">
      <p class="news-date">{{ item.date }}</p>
      <h3>{{ item.title }}</h3>
      <p>{{ item.event }}<template v-if="item.location"><br />{{ item.location }}</template></p>
      <TagList :tags="item.tags" :tag-info="tagInfo" />
      <div class="project-links">
        <PeopleAvatars :people="item.people" :people-map="peopleMap" :avatar-base="avatarBase" />
        <span class="project-links-spacer"></span>
        <a v-if="item.slides" :href="item.slides" target="_blank" rel="noopener noreferrer" title="Slides"><Icon name="desktop" /></a>
        <a v-if="item.video" :href="item.video" target="_blank" rel="noopener noreferrer" title="Video"><Icon name="video-camera" /></a>
        <a v-if="item.repository" :href="item.repository" target="_blank" rel="noopener noreferrer" title="Repository"><Icon name="github" /></a>
        <a v-if="item.event_page" :href="item.event_page" target="_blank" rel="noopener noreferrer" title="Event page"><Icon name="globe" /></a>
      </div>
    </div>
  </div>
</template>
```

`site/components/PosterCard.vue`:

```vue
<script setup lang="ts">
import Icon from './Icon.vue';
import PeopleAvatars from './PeopleAvatars.vue';
import TagList from './TagList.vue';
import type { PeopleMap } from '../lib/people';
import type { PosterData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ item: Entry<PosterData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; pdfBase: string; avatarBase: string }>();
</script>

<template>
  <div class="project-card" :id="`poster-${item.id}`" :data-tags="item.tags.join('|')">
    <a v-if="item.image" :href="pdfBase + item.pdf" target="_blank" rel="noopener noreferrer"><img :src="pdfBase + item.image" :alt="item.title" loading="lazy" class="project-image" /></a>
    <div class="project-body">
      <p class="news-date">{{ item.date }}</p>
      <h3>{{ item.title }}</h3>
      <p>{{ item.event }}</p>
      <TagList :tags="item.tags" :tag-info="tagInfo" />
      <div class="project-links">
        <PeopleAvatars :people="item.people" :people-map="peopleMap" :avatar-base="avatarBase" />
        <span class="project-links-spacer"></span>
        <a v-if="item.pdf" :href="pdfBase + item.pdf" target="_blank" rel="noopener noreferrer" title="PDF"><Icon name="file-pdf-o" /></a>
        <a v-if="item.homepage" :href="item.homepage" target="_blank" rel="noopener noreferrer" title="Homepage"><Icon name="globe" /></a>
        <a v-if="item.repository" :href="item.repository" target="_blank" rel="noopener noreferrer" title="Repository"><Icon name="github" /></a>
      </div>
    </div>
  </div>
</template>
```

`site/components/AbstractCard.vue`:

```vue
<script setup lang="ts">
import Icon from './Icon.vue';
import type { AbstractData } from '../lib/schemas';
import { stripHtml } from '../lib/text';
import type { Entry } from '../lib/views';

defineProps<{ item: Entry<AbstractData>; pdfBase: string }>();
</script>

<template>
  <div class="project-card" :id="`abstract-${item.id}`">
    <div class="project-body">
      <p class="news-date">{{ item.date ?? item.year }}</p>
      <h3>{{ item.title }}</h3>
      <p>{{ item.event }}<template v-if="item.authors"><br />{{ stripHtml(item.authors) }}</template></p>
      <div class="project-links">
        <span class="project-links-spacer"></span>
        <a v-if="item.pdf" :href="pdfBase + item.pdf" target="_blank" rel="noopener noreferrer" title="PDF"><Icon name="file-pdf-o" /></a>
        <a v-if="item.homepage" :href="item.homepage" target="_blank" rel="noopener noreferrer" title="Homepage"><Icon name="globe" /></a>
        <a v-if="item.repository" :href="item.repository" target="_blank" rel="noopener noreferrer" title="Repository"><Icon name="github" /></a>
        <a v-if="item.event_page" :href="item.event_page" target="_blank" rel="noopener noreferrer" title="Event page"><Icon name="globe" /></a>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Write `site/pages/publications.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import AbstractCard from '../components/AbstractCard.vue';
import PosterCard from '../components/PosterCard.vue';
import PresentationCard from '../components/PresentationCard.vue';
import PublicationsSection from '../components/PublicationsSection.vue';
import { getAbstracts, getPeopleMap, getPosters, getPresentations, getPublications, getTags } from '../lib/data';
import { asset } from '../lib/url';

const [tagInfo, peopleMap, publications, presentations, posters, abstracts] = await Promise.all([getTags(), getPeopleMap(), getPublications(), getPresentations(), getPosters(), getAbstracts()]);
const pdfBase = asset('pdf/');
const avatarBase = asset('image/people/128/');
---
<Base title="Publications" sectionid="publications">
  <h2 id="publications">Publications</h2>
  <PublicationsSection client:idle publications={publications} tagInfo={tagInfo} peopleMap={peopleMap} pdfBase={pdfBase} avatarBase={avatarBase} />

  <h2 id="presentations">Presentations</h2>
  <div class="project-grid" id="presentations-grid">
    {presentations.map((p) => <PresentationCard item={p} tagInfo={tagInfo} peopleMap={peopleMap} pdfBase={pdfBase} avatarBase={avatarBase} />)}
  </div>

  <h2 id="posters">Posters</h2>
  <div class="project-grid" id="posters-grid">
    {posters.map((p) => <PosterCard item={p} tagInfo={tagInfo} peopleMap={peopleMap} pdfBase={pdfBase} avatarBase={avatarBase} />)}
  </div>

  <h2 id="abstracts">Abstracts</h2>
  <div class="project-grid" id="abstracts-grid">
    {abstracts.map((a) => <AbstractCard item={a} pdfBase={pdfBase} />)}
  </div>
</Base>
```

- [ ] **Step 5: Verify**

```bash
npm run build
grep -o 'id="pub-[^"]*"' dist/publications/index.html | wc -l      # expected 110
grep -o 'id="pub-[^"]*"' web/publications/index.html | wc -l       # expected 110
grep -c 'person-chip' dist/publications/index.html; grep -c 'person-chip' web/publications/index.html
```

Preview: filter buttons hide rows and whole year groups; `/publications/?tag=AI` pre-filters; an "Abstract" summary expands; `/publications/#pub-<some id>` scrolls and pulses that row.

- [ ] **Step 6: Commit**

```bash
git add site/components/PublicationRow.vue site/components/PublicationsSection.vue site/components/PresentationCard.vue site/components/PosterCard.vue site/components/AbstractCard.vue site/pages/publications.astro
git commit -m "Port the publications page with a Vue tag-filter island"
```

---

### Task 14: Projects page with detail modals

**Files:**
- Create: `site/components/ProjectCard.vue`, `site/components/ProjectModal.vue`, `site/components/ProjectsSection.vue`, `site/pages/projects.astro`

**Interfaces:**
- `PubLite = Pick<Entry<PublicationData>, 'id' | 'title' | 'year' | 'pdf'>` (exported from `ProjectCard.vue`): the page passes only these fields so the serialised island props stay small.
- `ProjectCard.vue`: props `project: Entry<ProjectData>`, `tagInfo`, `peopleMap`, `publications: PubLite[]` (to resolve pdf links), `imageBase` (`asset('image/projects/')`), `pdfBase`, `avatarBase`. Clickable card with `data-modal-target="project-modal-<id>"`.
- `ProjectModal.vue`: props `project`, `tagInfo`, `peopleMap`, `people: Entry<PersonData>[]`, `publications`, `imageBase`, `peopleUrl` (`url('/people/')`), `publicationsUrl` (`url('/publications/')`).
- `ProjectsSection.vue` (island): all of the above for the `current` projects; renders filter bar, grid, and the modals after the grid.

- [ ] **Step 1: Write `site/components/ProjectCard.vue`** (port of the card in `app/projects.html`)

```vue
<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';
import PeopleAvatars from './PeopleAvatars.vue';
import TagList from './TagList.vue';
import type { PeopleMap } from '../lib/people';
import type { ProjectData, PublicationData } from '../lib/schemas';
import { stripHtml } from '../lib/text';
import type { Entry, TagInfo } from '../lib/views';

export type PubLite = Pick<Entry<PublicationData>, 'id' | 'title' | 'year' | 'pdf'>;

const props = defineProps<{ project: Entry<ProjectData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; publications: PubLite[]; imageBase: string; pdfBase: string; avatarBase: string }>();
const pdfs = computed(() => props.project.publications.map((id) => props.publications.find((p) => p.id === id)).filter((p): p is PubLite => !!p && !!p.pdf));
</script>

<template>
  <div class="project-card is-clickable" :id="`project-${project.id}`" :data-tags="project.tags.join('|')" :data-modal-target="`project-modal-${project.id}`" role="button" tabindex="0" aria-haspopup="dialog">
    <img v-if="project.images[0]" :src="imageBase + project.images[0]" :alt="project.title" loading="lazy" class="project-image" />
    <div class="project-body">
      <h3>{{ project.title }}</h3>
      <TagList :tags="project.tags" :tag-info="tagInfo" />
      <p>{{ stripHtml(project.abstract) }}</p>
      <div class="project-links">
        <PeopleAvatars :people="project.people" :people-map="peopleMap" :avatar-base="avatarBase" />
        <span class="project-links-spacer"></span>
        <a v-for="p in pdfs" :key="p.id" :href="pdfBase + p.pdf" :title="p.title"><Icon name="file-pdf-o" /></a>
        <a v-if="project.homepage" :href="project.homepage" target="_blank" rel="noopener noreferrer" title="Project homepage"><Icon name="globe" /></a>
        <a v-if="project.repository" :href="project.repository" target="_blank" rel="noopener noreferrer" title="Repository homepage"><Icon name="github" /></a>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Write `site/components/ProjectModal.vue`** (port of `_includes/project_modal.html`)

```vue
<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';
import Modal from './Modal.vue';
import TagList from './TagList.vue';
import type { PubLite } from './ProjectCard.vue';
import type { PeopleMap } from '../lib/people';
import type { PersonData, ProjectData } from '../lib/schemas';
import { stripHtml } from '../lib/text';
import type { Entry, TagInfo } from '../lib/views';

const props = defineProps<{ project: Entry<ProjectData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; people: Entry<PersonData>[]; publications: PubLite[]; imageBase: string; peopleUrl: string; publicationsUrl: string }>();
const persons = computed(() => props.project.people.map((id) => props.people.find((p) => p.id === id)).filter((p): p is Entry<PersonData> => !!p));
const pubs = computed(() => props.project.publications.map((id) => props.publications.find((p) => p.id === id)).filter((p): p is PubLite => !!p));
</script>

<template>
  <Modal :id="`project-modal-${project.id}`" :title="project.title">
    <template v-if="project.images.length">
      <div class="modal-image-gallery">
        <img v-for="img in project.images" :key="img" :src="imageBase + img" :alt="project.image_title ?? project.title" loading="lazy" />
      </div>
      <p v-if="project.image_title" class="modal-image-caption">{{ project.image_title }}</p>
    </template>
    <TagList :tags="project.tags" :tag-info="tagInfo" />
    <p class="person-modal-description">{{ stripHtml(project.abstract) }}</p>
    <template v-if="persons.length">
      <h6>People</h6>
      <ul class="person-modal-list">
        <li v-for="p in persons" :key="p.id"><a :href="`${peopleUrl}#person-modal-${p.id}`">{{ p.name }}</a><span v-if="p.role.length" class="text-muted"> &middot; {{ p.role[p.role.length - 1] }}</span></li>
      </ul>
    </template>
    <template v-if="project.cooperation_partners">
      <h6>Cooperation partners</h6>
      <p>{{ project.cooperation_partners }}</p>
    </template>
    <template v-if="pubs.length">
      <h6>Publications</h6>
      <ul class="person-modal-list">
        <li v-for="p in pubs" :key="p.id"><a :href="`${publicationsUrl}#pub-${p.id}`">{{ p.title }}</a> <span class="text-muted">({{ p.year }})</span></li>
      </ul>
    </template>
    <div v-if="project.homepage || project.repository" class="member-links">
      <a v-if="project.homepage" :href="project.homepage" target="_blank" rel="noopener noreferrer" title="Project homepage"><Icon name="globe" /></a>
      <a v-if="project.repository" :href="project.repository" target="_blank" rel="noopener noreferrer" title="Repository"><Icon name="github" /></a>
    </div>
  </Modal>
</template>
```

- [ ] **Step 3: Write `site/components/ProjectsSection.vue`**

```vue
<script setup lang="ts">
import ProjectCard, { type PubLite } from './ProjectCard.vue';
import ProjectModal from './ProjectModal.vue';
import TagFilterBar from './TagFilterBar.vue';
import type { PeopleMap } from '../lib/people';
import type { PersonData, ProjectData } from '../lib/schemas';
import { useTagFilter } from '../lib/tagFilter';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ projects: Entry<ProjectData>[]; tagInfo: TagInfo[]; peopleMap: PeopleMap; people: Entry<PersonData>[]; publications: PubLite[]; imageBase: string; pdfBase: string; avatarBase: string; peopleUrl: string; publicationsUrl: string }>();
const { activeTag, setTag, matches } = useTagFilter();
</script>

<template>
  <TagFilterBar id="project" :tags="tagInfo" :model-value="activeTag" @update:model-value="setTag" />
  <div class="project-grid" id="project-grid">
    <ProjectCard v-for="p in projects" :key="p.id" v-show="matches(p.tags)" :project="p" :tag-info="tagInfo" :people-map="peopleMap" :publications="publications" :image-base="imageBase" :pdf-base="pdfBase" :avatar-base="avatarBase" />
  </div>
  <ProjectModal v-for="p in projects" :key="`m-${p.id}`" :project="p" :tag-info="tagInfo" :people-map="peopleMap" :people="people" :publications="publications" :image-base="imageBase" :people-url="peopleUrl" :publications-url="publicationsUrl" />
</template>
```

- [ ] **Step 4: Write `site/pages/projects.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import ProjectsSection from '../components/ProjectsSection.vue';
import { getPeople, getPeopleMap, getProjects, getPublications, getTags } from '../lib/data';
import { asset, url } from '../lib/url';

const [tagInfo, people, peopleMap, projects, publications] = await Promise.all([getTags(), getPeople(), getPeopleMap(), getProjects(), getPublications()]);
const current = projects.filter((p) => p.status === 'current');
// only the fields the modals/cards need, to keep the serialised island props small
const pubsLite = publications.map(({ id, title, year, pdf }) => ({ id, title, year, pdf }));
---
<Base title="Projects" sectionid="projects">
  <ProjectsSection client:idle projects={current} tagInfo={tagInfo} peopleMap={peopleMap} people={people} publications={pubsLite}
    imageBase={asset('image/projects/')} pdfBase={asset('pdf/')} avatarBase={asset('image/people/128/')} peopleUrl={url('/people/')} publicationsUrl={url('/publications/')} />
</Base>
```

- [ ] **Step 5: Verify and commit**

```bash
npm run build
grep -o 'id="project-modal-[^"]*"' dist/projects/index.html | wc -l; grep -o 'id="project-modal-[^"]*"' web/projects/index.html | wc -l
```

Preview `/projects/`: clicking a card opens its dialog with the gallery; Escape and the backdrop close it; the PDF/globe icons on a card open their link without opening the modal; `/projects/#project-modal-<id>` opens directly; the tag filter hides cards.

```bash
git add site/components/ProjectCard.vue site/components/ProjectModal.vue site/components/ProjectsSection.vue site/pages/projects.astro
git commit -m "Port the projects page with card grid and detail modals"
```

---

### Task 15: Team page (members, open positions, alumni timeline, person modals)

**Files:**
- Create: `site/components/PersonCard.vue`, `site/components/PersonModal.vue`, `site/components/PersonModals.vue`, `site/pages/people.astro`

**Interfaces:**
- `PersonCard.vue`: props `person: Entry<PersonData>`, `avatarBase`; the `.member-card` with `data-modal-target="person-modal-<id>"` links.
- `PersonModal.vue`: props `person`, `refs: { publications: {id,title,year}[]; projects: {id,title,homepage}[]; software: {id,name,title,homepage}[] }`, `avatarBase`, `publicationsUrl`.
- `PersonModals.vue` (island): props `items: { person, refs }[]`, `avatarBase`, `publicationsUrl`; renders one `PersonModal` per item.
- Page `/people/` with sections `#current-members`, `#open-positions`, `#alumni`.

- [ ] **Step 1: Write `site/components/PersonCard.vue`**

```vue
<script setup lang="ts">
import Icon from './Icon.vue';
import type { PersonData } from '../lib/schemas';
import { stripHtml, truncateWords } from '../lib/text';
import type { Entry } from '../lib/views';

defineProps<{ person: Entry<PersonData>; avatarBase: string }>();
</script>

<template>
  <div class="member-card">
    <a v-if="person.image" :href="`#person-modal-${person.id}`" :data-modal-target="`person-modal-${person.id}`" class="member-photo-link" :aria-label="`View full profile of ${person.name}`">
      <img :src="avatarBase + person.image" :alt="person.name" loading="lazy" class="member-photo" />
    </a>
    <div class="member-info">
      <a :href="`#person-modal-${person.id}`" :data-modal-target="`person-modal-${person.id}`" class="member-name-link"><strong>{{ person.name }}</strong></a>
      <span class="person-position">{{ person.role[person.role.length - 1] }}</span>
      <p v-if="person.description">{{ truncateWords(stripHtml(person.description), 20) }}</p>
      <a :href="`#person-modal-${person.id}`" :data-modal-target="`person-modal-${person.id}`" class="member-more">Full profile &rarr;</a>
      <div class="member-links">
        <a v-if="person.homepage" :href="person.homepage" target="_blank" rel="noopener noreferrer" title="Homepage"><Icon name="home" /></a>
        <a v-if="person.orcid" :href="`https://orcid.org/${person.orcid}`" target="_blank" rel="noopener noreferrer" title="ORCID"><Icon name="orcid" /></a>
        <a v-if="person.repository" :href="person.repository" target="_blank" rel="noopener noreferrer" title="Repository homepage"><Icon name="github" /></a>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Write `site/components/PersonModal.vue`** (port of `_includes/person_modal.html`)

```vue
<script setup lang="ts">
import Icon from './Icon.vue';
import Modal from './Modal.vue';
import type { PersonData } from '../lib/schemas';
import type { Entry } from '../lib/views';

export interface PersonRefs {
  publications: { id: string; title: string; year: number }[];
  projects: { id: string; title: string; homepage: string | null | undefined }[];
  software: { id: string; name: string; title: string; homepage: string | null | undefined }[];
}
defineProps<{ person: Entry<PersonData>; refs: PersonRefs; avatarBase: string; publicationsUrl: string }>();
</script>

<template>
  <Modal :id="`person-modal-${person.id}`" :title="person.name">
    <div class="person-modal-header">
      <img v-if="person.image" :src="avatarBase + person.image" :alt="person.name" loading="lazy" class="person-modal-photo" />
      <div>
        <span v-if="person.role.length" class="person-position">{{ person.role.join(' · ') }}</span>
        <span class="person-tenure">{{ person.tenure }}<template v-if="person.affiliation"> &middot; {{ person.affiliation }}</template></span>
        <div class="member-links">
          <a v-if="person.homepage" :href="person.homepage" target="_blank" rel="noopener noreferrer" title="Homepage"><Icon name="home" /></a>
          <a v-if="person.orcid" :href="`https://orcid.org/${person.orcid}`" target="_blank" rel="noopener noreferrer" title="ORCID"><Icon name="orcid" /></a>
          <a v-if="person.repository" :href="person.repository" target="_blank" rel="noopener noreferrer" title="Repository"><Icon name="github" /></a>
        </div>
      </div>
    </div>
    <p v-if="person.description" class="person-modal-description" v-html="person.description"></p>
    <template v-if="refs.publications.length">
      <h6>Publications ({{ refs.publications.length }})</h6>
      <ul class="person-modal-list">
        <li v-for="p in refs.publications" :key="p.id"><a :href="`${publicationsUrl}#pub-${p.id}`">{{ p.title }}</a> <span class="text-muted">({{ p.year }})</span></li>
      </ul>
    </template>
    <template v-if="refs.projects.length">
      <h6>Projects ({{ refs.projects.length }})</h6>
      <ul class="person-modal-list">
        <li v-for="p in refs.projects" :key="p.id"><a v-if="p.homepage" :href="p.homepage" target="_blank" rel="noopener noreferrer">{{ p.title }}</a><template v-else>{{ p.title }}</template></li>
      </ul>
    </template>
    <template v-if="refs.software.length">
      <h6>Software ({{ refs.software.length }})</h6>
      <ul class="person-modal-list">
        <li v-for="s in refs.software" :key="s.id"><a v-if="s.homepage" :href="s.homepage" target="_blank" rel="noopener noreferrer">{{ s.name }}</a><template v-else>{{ s.name }}</template> &mdash; {{ s.title }}</li>
      </ul>
    </template>
  </Modal>
</template>
```

- [ ] **Step 3: Write `site/components/PersonModals.vue`**

```vue
<script setup lang="ts">
import PersonModal, { type PersonRefs } from './PersonModal.vue';
import type { PersonData } from '../lib/schemas';
import type { Entry } from '../lib/views';

defineProps<{ items: { person: Entry<PersonData>; refs: PersonRefs }[]; avatarBase: string; publicationsUrl: string }>();
</script>

<template>
  <PersonModal v-for="it in items" :key="it.person.id" :person="it.person" :refs="it.refs" :avatar-base="avatarBase" :publications-url="publicationsUrl" />
</template>
```

- [ ] **Step 4: Write `site/pages/people.astro`** (port of `app/team.html`)

```astro
---
import Base from '../layouts/Base.astro';
import CoreMessages from '../components/CoreMessages.astro';
import Icon from '../components/Icon.vue';
import PersonAvatar from '../components/PersonAvatar.vue';
import PersonCard from '../components/PersonCard.vue';
import PersonModals from '../components/PersonModals.vue';
import { getPeople, getProjects, getPublications, getSoftware, getTags } from '../lib/data';
import { stripHtml, truncateWords } from '../lib/text';
import { asset, url } from '../lib/url';
import { alumniByYear, crossRefs } from '../lib/views';

const [tags, people, publications, projects, software] = await Promise.all([getTags(), getPeople(), getPublications(), getProjects(), getSoftware()]);
const avatarBase = asset('image/people/128/');
const current = people.filter((p) => p.status === 'current');
const alumniGroups = alumniByYear(people);
const withModal = [...current, ...alumniGroups.flatMap((g) => g.people)];
const modalItems = withModal.map((person) => {
  const r = crossRefs(person.id, publications, projects, software);
  return {
    person,
    refs: {
      publications: r.publications.map(({ id, title, year }) => ({ id, title, year })),
      projects: r.projects.map(({ id, title, homepage }) => ({ id, title, homepage })),
      software: r.software.map(({ id, name, title, homepage }) => ({ id, name, title, homepage })),
    },
  };
});
const positions = [
  { title: 'Internship', paragraphs: ['We offer internships online or in-person for instance via the <a href="https://hic.hu-berlin.de/en/internship-program/projects/201" target="_blank" rel="noopener noreferrer">Humboldt Internship Program</a>.', 'We support ERASMUS student internships.'] },
  { title: 'Bachelor Thesis', paragraphs: ['Undergraduate (Bachelor) students are always welcome. Projects can take place in Lübeck or Berlin.'] },
  { title: 'Master Thesis', paragraphs: ['Graduate (Master) students are always welcome. Projects can take place in Lübeck or Berlin.'] },
  { title: 'PhD', paragraphs: ['We have a fully funded open position available as PhD in Lübeck as a Research Software Engineer (RSE) or Informatician.', 'We also supervise doctoral projects if you have a fellowship or similar funding source.'] },
  { title: 'PostDoc', paragraphs: ['We have a fully funded open position available as PostDoc in Lübeck as a Research Software Engineer (RSE) or Informatician.', 'We also supervise postdoctoral projects if you have a fellowship or similar funding source.'] },
];
---
<Base title="Team" sectionid="people">
  <h2 id="current-members">Team</h2>
  <div class="member-grid">
    {current.map((p) => <PersonCard person={p} avatarBase={avatarBase} />)}
  </div>

  <h2 id="open-positions">Open Positions</h2>
  <img src={asset('image/teaching/teaching_banner.webp')} alt="" class="img-fluid" />
  <div class="text-justify">
    <div class="position-cards">
      {positions.map((pos) => (
        <div class="position-card">
          <h3>{pos.title}</h3>
          {pos.paragraphs.map((html) => <p set:html={html} />)}
        </div>
      ))}
    </div>
    <p>We offer projects on the following topics</p>
    <CoreMessages tags={tags} hrefPrefix={url('/')} />
    <p>Interested in joining the group? Contact <Icon name="envelope" /> <a href="mailto:matthias.koenig@uni-luebeck.de">Prof. Matthias König</a>.</p>
  </div>

  <h2 id="alumni">Alumni</h2>
  <div class="alumni-timeline">
    {alumniGroups.map((g) => (
      <div class="timeline-year-group">
        <div class="timeline-year-marker"><span class="timeline-dot"></span><span class="timeline-year">{g.year}</span></div>
        <div class="timeline-year-people">
          {g.people.map((p) => (
            <div class="alumni-card">
              <PersonAvatar client:idle name={p.name} src={avatarBase + p.image} position={p.role[p.role.length - 1] ?? ''}
                description={p.description ? truncateWords(stripHtml(p.description), 24) : null} modalId={`person-modal-${p.id}`} imgClass="alumni-photo" />
              <div class="alumni-info">
                <a href={`#person-modal-${p.id}`} data-modal-target={`person-modal-${p.id}`} class="member-name-link"><strong>{p.name}</strong></a>{p.orcid && (<> <a href={`https://orcid.org/${p.orcid}`} target="_blank" rel="noopener noreferrer" title="ORCID"><Icon name="orcid" /></a></>)}
                <span class="person-position">{p.role[p.role.length - 1]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>

  <PersonModals client:idle items={modalItems} avatarBase={avatarBase} publicationsUrl={url('/publications/')} />
</Base>
```

- [ ] **Step 5: Verify and commit**

```bash
npm run build
grep -o 'id="person-modal-[^"]*"' dist/people/index.html | sort -u | wc -l; grep -o 'id="person-modal-[^"]*"' web/people/index.html | sort -u | wc -l
```

Preview `/people/`: member photo/name/"Full profile" open the modal with publication counts; alumni hover cards work and stay inside the viewport at the left/right edges; `/people/#person-modal-matthias_koenig` opens on load.

```bash
git add site/components/PersonCard.vue site/components/PersonModal.vue site/components/PersonModals.vue site/pages/people.astro
git commit -m "Port the team page with member cards, alumni timeline, and profile modals"
```

---

### Task 16: Research page (software, funding, editors) and Meetings page

**Files:**
- Create: `site/components/SoftwareCard.vue`, `site/components/FundingCard.vue`, `site/components/EditorCard.vue`, `site/components/MeetingCard.vue`, `site/components/FilteredGrid.vue`, `site/pages/research.astro`, `site/pages/meetings.astro`

**Interfaces:**
- `FilteredGrid.vue` (island): generic filter-bar + grid wrapper. Props `filterId: string`, `gridId: string`, `tags: TagInfo[]`, `items: { id: string; tags: string[] }[]`; scoped slot `item` with `{ item }`; renders `<TagFilterBar>` then `<div class="project-grid" :id="gridId">` with each slot item wrapped in `v-show`. Because slots cannot cross the Astro→Vue boundary, this component is used only *inside* the four small page-section islands below, which exist so Astro has a single Vue root to hydrate.
- `SoftwareSection.vue`, `FundingSection.vue`, `EditorsSection.vue`, `MeetingsSection.vue` (islands): compose `FilteredGrid` with the respective card.
- Cards: `SoftwareCard.vue` (`item`, `tagInfo`, `peopleMap`, `imageBase`, `avatarBase`), `FundingCard.vue` (`item`, `tagInfo`, `imageBase`), `EditorCard.vue` (`item`, `tagInfo`, `imageBase`), `MeetingCard.vue` (`item`, `tagInfo`, `peopleMap`, `imageBase`, `pdfBase`, `avatarBase`).

- [ ] **Step 1: Write `site/components/FilteredGrid.vue`**

```vue
<script setup lang="ts" generic="T extends { id: string; tags: string[] }">
import TagFilterBar from './TagFilterBar.vue';
import { useTagFilter } from '../lib/tagFilter';
import type { TagInfo } from '../lib/views';

defineProps<{ filterId: string; gridId: string; tags: TagInfo[]; items: T[] }>();
defineSlots<{ item(props: { item: T }): unknown }>();
const { activeTag, setTag, matches } = useTagFilter();
</script>

<template>
  <TagFilterBar :id="filterId" :tags="tags" :model-value="activeTag" @update:model-value="setTag" />
  <div class="project-grid" :id="gridId">
    <template v-for="it in items" :key="it.id">
      <div v-show="matches(it.tags)" class="contents"><slot name="item" :item="it" /></div>
    </template>
  </div>
</template>
```

(`.contents` is Tailwind's `display: contents`, so the wrapper does not disturb the grid.)

- [ ] **Step 2: Write the four cards**

`site/components/SoftwareCard.vue`:

```vue
<script setup lang="ts">
import Icon from './Icon.vue';
import PeopleAvatars from './PeopleAvatars.vue';
import TagList from './TagList.vue';
import type { PeopleMap } from '../lib/people';
import type { SoftwareData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ item: Entry<SoftwareData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; imageBase: string; avatarBase: string }>();
</script>

<template>
  <div class="project-card" :id="`software-${item.id}`" :data-tags="item.tags.join('|')">
    <img v-if="item.image" :src="imageBase + item.image" :alt="item.name" loading="lazy" class="project-image project-image-contain" />
    <div class="project-body">
      <h3>{{ item.name }}</h3>
      <TagList :tags="item.tags" :tag-info="tagInfo" />
      <p><strong>{{ item.title }}</strong><br />{{ item.description }}</p>
      <div class="project-links">
        <PeopleAvatars :people="item.people" :people-map="peopleMap" :avatar-base="avatarBase" />
        <span class="project-links-spacer"></span>
        <a v-if="item.homepage" :href="item.homepage" target="_blank" rel="noopener noreferrer" title="Project homepage"><Icon name="globe" /></a>
        <a v-if="item.repository" :href="item.repository" target="_blank" rel="noopener noreferrer" title="Repository homepage"><Icon name="github" /></a>
      </div>
    </div>
  </div>
</template>
```

`site/components/FundingCard.vue`:

```vue
<script setup lang="ts">
import Icon from './Icon.vue';
import TagList from './TagList.vue';
import type { FundingData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ item: Entry<FundingData>; tagInfo: TagInfo[]; imageBase: string }>();
</script>

<template>
  <div class="project-card" :id="`funding-${item.id}`" :data-tags="item.tags.join('|')">
    <img v-if="item.funder_logo" :src="imageBase + item.funder_logo" :alt="item.funder" loading="lazy" class="project-image project-image-contain" />
    <div class="project-body">
      <h3>{{ item.title }}</h3>
      <TagList :tags="item.tags" :tag-info="tagInfo" />
      <p><strong>{{ item.funder_short }}</strong>, {{ item.role }}, {{ item.start }}&ndash;{{ item.end }}<br />{{ item.description }}</p>
      <div class="project-links">
        <span class="project-links-spacer"></span>
        <a v-if="item.homepage" :href="item.homepage" target="_blank" rel="noopener noreferrer" title="Project homepage"><Icon name="globe" /></a>
        <a v-if="item.repository" :href="item.repository" target="_blank" rel="noopener noreferrer" title="Repository homepage"><Icon name="github" /></a>
        <a v-if="item.funder_link" :href="item.funder_link" target="_blank" rel="noopener noreferrer" :title="item.funder"><Icon name="globe" /></a>
      </div>
    </div>
  </div>
</template>
```

`site/components/EditorCard.vue`:

```vue
<script setup lang="ts">
import Icon from './Icon.vue';
import TagList from './TagList.vue';
import type { EditorData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ item: Entry<EditorData>; tagInfo: TagInfo[]; imageBase: string }>();
</script>

<template>
  <div class="project-card" :id="`editor-${item.id}`" :data-tags="item.tags.join('|')">
    <img v-if="item.image" :src="imageBase + item.image" :alt="item.name" loading="lazy" class="project-image project-image-contain" />
    <div class="project-body">
      <h3>{{ item.name }}</h3>
      <TagList :tags="item.tags" :tag-info="tagInfo" />
      <p><strong>{{ item.tenure }}</strong><br />{{ item.description }}</p>
      <div class="project-links">
        <span class="project-links-spacer"></span>
        <a v-if="item.homepage" :href="item.homepage" target="_blank" rel="noopener noreferrer" title="Project homepage"><Icon name="globe" /></a>
        <a v-if="item.repository" :href="item.repository" target="_blank" rel="noopener noreferrer" title="Repository homepage"><Icon name="github" /></a>
      </div>
    </div>
  </div>
</template>
```

`site/components/MeetingCard.vue`:

```vue
<script setup lang="ts">
import Icon from './Icon.vue';
import PeopleAvatars from './PeopleAvatars.vue';
import TagList from './TagList.vue';
import type { PeopleMap } from '../lib/people';
import type { MeetingData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ item: Entry<MeetingData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; imageBase: string; pdfBase: string; avatarBase: string }>();
</script>

<template>
  <div class="project-card" :id="`meeting-${item.id}`" :data-tags="item.tags.join('|')">
    <img v-if="item.image" :src="imageBase + item.image" :alt="item.title" loading="lazy" class="project-image" />
    <div class="project-body">
      <p class="news-date">{{ item.date_display ?? item.date }}<template v-if="item.location"> &middot; {{ item.location }}</template></p>
      <h3>{{ item.title }}</h3>
      <TagList :tags="item.tags" :tag-info="tagInfo" />
      <p>{{ item.description }}</p>
      <div class="project-links">
        <PeopleAvatars :people="item.people" :people-map="peopleMap" :avatar-base="avatarBase" />
        <span class="project-links-spacer"></span>
        <a v-if="item.pdf" :href="pdfBase + item.pdf" target="_blank" rel="noopener noreferrer" title="PDF"><Icon name="file-pdf-o" /></a>
        <a v-if="item.homepage" :href="item.homepage" target="_blank" rel="noopener noreferrer" title="Meeting homepage"><Icon name="globe" /></a>
        <a v-if="item.repository" :href="item.repository" target="_blank" rel="noopener noreferrer" title="Repository"><Icon name="github" /></a>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Write the four section islands**

`site/components/SoftwareSection.vue`:

```vue
<script setup lang="ts">
import FilteredGrid from './FilteredGrid.vue';
import SoftwareCard from './SoftwareCard.vue';
import type { PeopleMap } from '../lib/people';
import type { SoftwareData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ items: Entry<SoftwareData>[]; tagInfo: TagInfo[]; peopleMap: PeopleMap; imageBase: string; avatarBase: string }>();
</script>

<template>
  <FilteredGrid filter-id="software" grid-id="software-grid" :tags="tagInfo" :items="items">
    <template #item="{ item }"><SoftwareCard :item="item" :tag-info="tagInfo" :people-map="peopleMap" :image-base="imageBase" :avatar-base="avatarBase" /></template>
  </FilteredGrid>
</template>
```

`site/components/FundingSection.vue`:

```vue
<script setup lang="ts">
import FilteredGrid from './FilteredGrid.vue';
import FundingCard from './FundingCard.vue';
import type { FundingData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ items: Entry<FundingData>[]; tagInfo: TagInfo[]; imageBase: string }>();
</script>

<template>
  <FilteredGrid filter-id="funding" grid-id="funding-grid" :tags="tagInfo" :items="items">
    <template #item="{ item }"><FundingCard :item="item" :tag-info="tagInfo" :image-base="imageBase" /></template>
  </FilteredGrid>
</template>
```

`site/components/EditorsSection.vue`:

```vue
<script setup lang="ts">
import EditorCard from './EditorCard.vue';
import FilteredGrid from './FilteredGrid.vue';
import type { EditorData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ items: Entry<EditorData>[]; tagInfo: TagInfo[]; imageBase: string }>();
</script>

<template>
  <FilteredGrid filter-id="editors" grid-id="editors-grid" :tags="tagInfo" :items="items">
    <template #item="{ item }"><EditorCard :item="item" :tag-info="tagInfo" :image-base="imageBase" /></template>
  </FilteredGrid>
</template>
```

`site/components/MeetingsSection.vue`:

```vue
<script setup lang="ts">
import FilteredGrid from './FilteredGrid.vue';
import MeetingCard from './MeetingCard.vue';
import type { PeopleMap } from '../lib/people';
import type { MeetingData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ items: Entry<MeetingData>[]; tagInfo: TagInfo[]; peopleMap: PeopleMap; imageBase: string; pdfBase: string; avatarBase: string }>();
</script>

<template>
  <FilteredGrid filter-id="meeting" grid-id="meetings-grid" :tags="tagInfo" :items="items">
    <template #item="{ item }"><MeetingCard :item="item" :tag-info="tagInfo" :people-map="peopleMap" :image-base="imageBase" :pdf-base="pdfBase" :avatar-base="avatarBase" /></template>
  </FilteredGrid>
</template>
```

- [ ] **Step 4: Write the pages**

`site/pages/research.astro` (port of `app/research.html`):

```astro
---
import Base from '../layouts/Base.astro';
import EditorsSection from '../components/EditorsSection.vue';
import FundingSection from '../components/FundingSection.vue';
import SoftwareSection from '../components/SoftwareSection.vue';
import { getEditors, getFunding, getPeopleMap, getSoftware, getTags } from '../lib/data';
import { asset } from '../lib/url';

const [tagInfo, peopleMap, software, funding, editors] = await Promise.all([getTags(), getPeopleMap(), getSoftware(), getFunding(), getEditors()]);
const avatarBase = asset('image/people/128/');
---
<Base title="Research" sectionid="research">
  <h2 id="software">Software</h2>
  <SoftwareSection client:idle items={software} tagInfo={tagInfo} peopleMap={peopleMap} imageBase={asset('image/software/')} avatarBase={avatarBase} />

  <h2 id="funding">Funding</h2>
  <FundingSection client:idle items={funding} tagInfo={tagInfo} imageBase={asset('image/funding/')} />
  <p>
    This work was supported by the BMFTR-funded <a href="https://www.denbi.de/">de.NBI</a> Cloud within the German Network for Bioinformatics Infrastructure (de.NBI) (031A537B, 031A533A, 031A538A, 031A533B, 031A535A, 031A537C, 031A534A, 031A532B).
  </p>

  <h2 id="editors">Editors</h2>
  <p>We are actively involved in the standardization and reproducibility efforts in Systems Biology and Systems Medicine.</p>
  <EditorsSection client:idle items={editors} tagInfo={tagInfo} imageBase={asset('image/editors/')} />
</Base>
```

`site/pages/meetings.astro` (port of `app/meetings.html`):

```astro
---
import Base from '../layouts/Base.astro';
import MeetingsSection from '../components/MeetingsSection.vue';
import { getMeetings, getPeopleMap, getTags } from '../lib/data';
import { asset } from '../lib/url';

const [tagInfo, peopleMap, meetings] = await Promise.all([getTags(), getPeopleMap(), getMeetings()]);
---
<Base title="Meetings" sectionid="meetings">
  <h2 id="meetings">Meetings</h2>
  <p>Meetings, workshops, and events we organized or hosted.</p>
  <MeetingsSection client:idle items={meetings} tagInfo={tagInfo} peopleMap={peopleMap} imageBase={asset('image/meetings/')} pdfBase={asset('pdf/')} avatarBase={asset('image/people/128/')} />
</Base>
```

- [ ] **Step 5: Verify and commit**

```bash
npm run build
for id in software funding editor; do echo -n "$id: "; grep -o "id=\"$id-[^\"]*\"" dist/research/index.html | wc -l; grep -o "id=\"$id-[^\"]*\"" web/research/index.html | wc -l; done
grep -o 'id="meeting-[^"]*"' dist/meetings/index.html | wc -l
```

Expected: equal counts per type; meetings 2. Preview `/research/?tag=Open%20%26%20FAIR#software`: all three filter bars start on Open & FAIR (parity: the `?tag=` applies to every bar on the page).

```bash
git add site/components site/pages/research.astro site/pages/meetings.astro
git commit -m "Port the research and meetings pages"
```

---

### Task 17: News page with detail modals

**Files:**
- Create: `site/components/NewsCard.vue`, `site/components/NewsModal.vue`, `site/components/NewsSection.vue`, `site/pages/news.astro`

**Interfaces:**
- `NewsCard.vue`: props `item: Entry<NewsData>`, `tagInfo`, `peopleMap`, `imageBase` (`asset('image/news/')`), `avatarBase`. Clickable with `data-modal-target="news-modal-<id>"`. YouTube thumbnail fallback when `video` is set and `image` is not.
- `NewsModal.vue`: props `item`, `tagInfo`, `people: { id, name }[]`, `imageBase`, `peopleUrl`.
- `NewsSection.vue` (island): filter bar + grid + modals.

- [ ] **Step 1: Write `site/components/NewsCard.vue`** (port of the card in `app/news.html`)

```vue
<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';
import PeopleAvatars from './PeopleAvatars.vue';
import TagList from './TagList.vue';
import type { PeopleMap } from '../lib/people';
import type { NewsData } from '../lib/schemas';
import { stripHtml, truncateWords } from '../lib/text';
import type { Entry, TagInfo } from '../lib/views';

const props = defineProps<{ item: Entry<NewsData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; imageBase: string; avatarBase: string }>();
const thumb = computed(() => {
  if (props.item.image) return props.imageBase + props.item.image;
  if (props.item.video) return `https://img.youtube.com/vi/${props.item.video.split('/embed/').pop()}/hqdefault.jpg`;
  return null;
});
</script>

<template>
  <div class="project-card is-clickable" :id="`news-${item.id}`" :data-tags="item.tags.join('|')" :data-modal-target="`news-modal-${item.id}`" role="button" tabindex="0" aria-haspopup="dialog">
    <img v-if="thumb" :src="thumb" :alt="item.title" loading="lazy" class="project-image" />
    <div class="project-body">
      <p class="news-date">{{ item.date }}</p>
      <h3>{{ item.title }}</h3>
      <TagList :tags="item.tags" :tag-info="tagInfo" />
      <p>{{ truncateWords(stripHtml(item.short), 30) }}</p>
      <div v-if="item.people.length || item.link" class="project-links">
        <PeopleAvatars :people="item.people" :people-map="peopleMap" :avatar-base="avatarBase" />
        <span class="project-links-spacer"></span>
        <a v-if="item.link" :href="item.link" target="_blank" rel="noopener noreferrer" title="Read more"><Icon name="globe" /></a>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Write `site/components/NewsModal.vue`** (port of `_includes/news_modal.html`)

```vue
<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';
import Modal from './Modal.vue';
import TagList from './TagList.vue';
import type { NewsData } from '../lib/schemas';
import { stripHtml } from '../lib/text';
import type { Entry, TagInfo } from '../lib/views';

const props = defineProps<{ item: Entry<NewsData>; tagInfo: TagInfo[]; people: { id: string; name: string }[]; imageBase: string; peopleUrl: string }>();
const persons = computed(() => props.item.people.map((id) => props.people.find((p) => p.id === id)).filter(Boolean) as { id: string; name: string }[]);
</script>

<template>
  <Modal :id="`news-modal-${item.id}`" :title="item.title">
    <p class="news-date">{{ item.date }}</p>
    <div v-if="item.video" class="modal-video-embed"><iframe :src="item.video" :title="item.title" loading="lazy" allowfullscreen></iframe></div>
    <img v-else-if="item.image" :src="imageBase + item.image" :alt="item.title" loading="lazy" class="modal-image-single" />
    <TagList :tags="item.tags" :tag-info="tagInfo" />
    <p class="person-modal-description">{{ stripHtml(item.abstract ?? item.short) }}</p>
    <template v-if="persons.length">
      <h6>People</h6>
      <ul class="person-modal-list"><li v-for="p in persons" :key="p.id"><a :href="`${peopleUrl}#person-modal-${p.id}`">{{ p.name }}</a></li></ul>
    </template>
    <div v-if="item.link" class="member-links"><a :href="item.link" target="_blank" rel="noopener noreferrer" title="Read more"><Icon name="globe" /></a></div>
  </Modal>
</template>
```

- [ ] **Step 3: Write `site/components/NewsSection.vue`**

```vue
<script setup lang="ts">
import NewsCard from './NewsCard.vue';
import NewsModal from './NewsModal.vue';
import TagFilterBar from './TagFilterBar.vue';
import type { PeopleMap } from '../lib/people';
import type { NewsData } from '../lib/schemas';
import { useTagFilter } from '../lib/tagFilter';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ items: Entry<NewsData>[]; tagInfo: TagInfo[]; peopleMap: PeopleMap; people: { id: string; name: string }[]; imageBase: string; avatarBase: string; peopleUrl: string }>();
const { activeTag, setTag, matches } = useTagFilter();
</script>

<template>
  <TagFilterBar id="news" :tags="tagInfo" :model-value="activeTag" @update:model-value="setTag" />
  <div class="project-grid" id="news-grid">
    <NewsCard v-for="n in items" :key="n.id" v-show="matches(n.tags)" :item="n" :tag-info="tagInfo" :people-map="peopleMap" :image-base="imageBase" :avatar-base="avatarBase" />
  </div>
  <NewsModal v-for="n in items" :key="`m-${n.id}`" :item="n" :tag-info="tagInfo" :people="people" :image-base="imageBase" :people-url="peopleUrl" />
</template>
```

- [ ] **Step 4: Write `site/pages/news.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import NewsSection from '../components/NewsSection.vue';
import { getNews, getPeople, getPeopleMap, getTags } from '../lib/data';
import { asset, url } from '../lib/url';

const [tagInfo, people, peopleMap, news] = await Promise.all([getTags(), getPeople(), getPeopleMap(), getNews()]);
const peopleLite = people.map(({ id, name }) => ({ id, name }));
---
<Base title="News" sectionid="news">
  <NewsSection client:idle items={news} tagInfo={tagInfo} peopleMap={peopleMap} people={peopleLite} imageBase={asset('image/news/')} avatarBase={asset('image/people/128/')} peopleUrl={url('/people/')} />
</Base>
```

- [ ] **Step 5: Verify and commit**

```bash
npm run build
grep -o 'id="news-modal-[^"]*"' dist/news/index.html | wc -l; grep -o 'id="news-modal-[^"]*"' web/news/index.html | wc -l
```

Preview `/news/`: a video news item shows the YouTube thumbnail on the card and the iframe in the modal.

```bash
git add site/components/NewsCard.vue site/components/NewsModal.vue site/components/NewsSection.vue site/pages/news.astro
git commit -m "Port the news page with cards and detail modals"
```

---

### Task 18: Teaching, CV, Impressum, Privacy, 404

**Files:**
- Create: `site/components/TeachingCard.vue`, `site/pages/teaching.astro`, `site/pages/cv.astro`, `site/pages/impressum.astro`, `site/pages/privacy.astro`, `site/pages/404.astro`

**Interfaces:**
- `TeachingCard.vue`: props `item: Entry<TeachingData>`, `tagInfo`, `peopleMap`, `imageBase` (`asset('image/teaching/')`), `avatarBase`. Static.

- [ ] **Step 1: Write `site/components/TeachingCard.vue`** (port of the loop body in `app/teaching.html`)

```vue
<script setup lang="ts">
import Icon from './Icon.vue';
import PersonChips from './PersonChips.vue';
import TagList from './TagList.vue';
import type { PeopleMap } from '../lib/people';
import type { TeachingData } from '../lib/schemas';
import type { Entry, TagInfo } from '../lib/views';

defineProps<{ item: Entry<TeachingData>; tagInfo: TagInfo[]; peopleMap: PeopleMap; imageBase: string; avatarBase: string }>();
const TYPE_ICONS: Record<string, string> = { lecture: 'person-chalkboard', course: 'laptop-code', seminar: 'book' };
</script>

<template>
  <div :id="`teaching-${item.id}`">
    <h3>{{ item.title }}</h3>
    <h4>
      <template v-for="(t, i) in item.type" :key="t"><Icon :name="TYPE_ICONS[t]" />&nbsp;{{ t }}<template v-if="i < item.type.length - 1">, </template></template>
    </h4>
    <TagList :tags="item.tags" :tag-info="tagInfo" />
    <h4><PersonChips :text="item.authors" :people="item.people" :people-map="peopleMap" :avatar-base="avatarBase" /></h4>
    <h5>{{ item.date }} - {{ item.location }}</h5>
    <div class="grid md:grid-cols-4 gap-x-6">
      <div>
        <img v-if="item.image" :src="imageBase + item.image" :alt="item.title" class="img-fluid" />
        <span v-if="item.caption" v-html="item.caption"></span>
      </div>
      <div class="md:col-span-3">
        <div v-html="item.content"></div>
        <p v-if="item.funding" v-html="item.funding"></p>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Write `site/pages/teaching.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import TeachingCard from '../components/TeachingCard.vue';
import { getPeopleMap, getTags, getTeaching } from '../lib/data';
import { asset } from '../lib/url';

const [tagInfo, peopleMap, teaching] = await Promise.all([getTags(), getPeopleMap(), getTeaching()]);
---
<Base title="Teaching" sectionid="teaching">
  <p>Welcome to our teaching page! Our focus is on project-based learning that empowers students to actively engage with real-world challenges in digital health and shared decision-making. Through interdisciplinary collaboration, innovative digital formats, and a strong commitment to Open Science and ethical research, we create hands-on, inclusive learning environments. By supporting early-career researchers—especially women—and integrating digital competencies, we prepare the next generation of professionals to shape the future of healthcare.</p>
  <img src={asset('image/teaching/teaching_banner.webp')} alt="" class="img-fluid" />
  {teaching.map((t) => <TeachingCard item={t} tagInfo={tagInfo} peopleMap={peopleMap} imageBase={asset('image/teaching/')} avatarBase={asset('image/people/128/')} />)}
</Base>
```

- [ ] **Step 3: Write `site/pages/cv.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import { asset } from '../lib/url';
const pdf = asset('cv/Koenig_CV.pdf');
---
<Base title="Curriculum Vitae">
  <object data={pdf} type="application/pdf" style="display:block; width:100%; height:80vh;">
    <a href={pdf}>Koenig_CV.pdf</a>
  </object>
</Base>
```

- [ ] **Step 4: Write `site/pages/impressum.astro` and `site/pages/privacy.astro`**

Copy the body of `app/impressum.html` (from `<h2 id="impressum">` to the end) into `impressum.astro` inside `<Base title="Impressum" sectionid="impressum">…</Base>`, replacing `{{ site.email }}` with `matthias.koenig@uni-luebeck.de` (two places) and `{{ site.baseurl }}/privacy/` with `{url('/privacy/')}` (import `url` from `../lib/url`). Text stays byte-for-byte otherwise.

Same for `privacy.astro` with `<Base title="Datenschutzerklärung" sectionid="privacy">`: replace `{{ site.email }}` and `{{ site.baseurl }}/impressum/` with `{url('/impressum/')}`. Keep the `<button type="button" id="cookie-consent-reset" class="btn btn-outline-secondary btn-sm">Cookie-Einstellungen ändern</button>` exactly, because `CookieConsent.vue` binds to that id.

- [ ] **Step 5: Write `site/pages/404.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import { url } from '../lib/url';
---
<Base title="Not found">
  <div class="text-center">
    <p>The page you are looking for cannot be found.</p>
    <h2>404</h2>
    <p><a href={url('/')} class="btn btn-secondary" role="button">Go to homepage</a></p>
  </div>
</Base>
```

- [ ] **Step 6: Verify all routes exist and commit**

```bash
npm run build
for p in index.html projects/index.html publications/index.html people/index.html research/index.html meetings/index.html news/index.html teaching/index.html cv/index.html impressum/index.html privacy/index.html 404.html search.json sitemap-index.xml; do test -f "dist/$p" && echo "ok $p" || echo "MISSING $p"; done
npm run check
```

Expected: every route `ok`; `astro check` reports 0 errors (fix any type errors it finds in `.astro`/`.ts` files before committing). Preview `/privacy/`: the "Cookie-Einstellungen ändern" button re-shows the banner.

```bash
git add site/components/TeachingCard.vue site/pages
git commit -m "Port teaching, CV, impressum, privacy, and 404 pages"
```

---

### Task 19: Parity checks, Playwright end-to-end tests, screenshot tool, and removal of the Jekyll tree

**Files:**
- Create: `playwright.config.ts`, `e2e/pages.spec.ts`, `e2e/interactions.spec.ts`, `e2e/screenshots.ts`, `site/lib/parity.test.ts`
- Delete: `app/`, `_config.yml`, `Gemfile`, `Gemfile.lock` (if present), `docker-compose.yml`, `docker-compose-build.yml`, `docker-compose-serve.yml`, `deploy.sh`, `nginx/`

**Interfaces:**
- `npm run e2e` runs Playwright against `npm run preview` on port 4321.
- `npx tsx e2e/screenshots.ts` (add `tsx` as a devDependency) writes `e2e/screenshots/<page>-<width>-{jekyll,astro}.png` for manual review; needs the Jekyll build served on port 4400 (`npx serve web -l 4400`) and the Astro preview on 4321.
- `site/lib/parity.test.ts` runs in Vitest after a build and compares `dist/` with `web/`; it is skipped when `web/` is absent (CI), so CI stays green after the Jekyll build disappears from disk.

- [ ] **Step 1: Install Playwright and write its config**

```bash
npm install -D @playwright/test tsx serve
npx playwright install --with-deps chromium
```

`playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';

// BASE is unset locally ("/") and "/livermetabolism-site/" in CI (see
// .github/workflows/site.yml); astro preview serves under that prefix.
// Tests use base-relative paths ('projects/', not '/projects/') so the
// same specs run in both.
const origin = `http://localhost:4321${process.env.BASE ?? '/'}`;

export default defineConfig({
  testDir: 'e2e',
  testMatch: /.*\.spec\.ts/,
  timeout: 30_000,
  use: { baseURL: origin, viewport: { width: 1280, height: 800 } },
  webServer: { command: 'npm run preview', url: origin, timeout: 120_000, reuseExistingServer: !process.env.CI },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
```

- [ ] **Step 2: Write `e2e/pages.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

// base-relative (no leading slash): see playwright.config.ts
const pages = ['', 'projects/', 'publications/', 'people/', 'research/', 'meetings/', 'news/', 'teaching/', 'cv/', 'impressum/', 'privacy/'];

for (const path of pages) {
  test(`renders ${path} without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('nav.site-navbar')).toBeVisible();
    await expect(page.locator('footer.footer')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('404 page', async ({ page }) => {
  const res = await page.goto('does-not-exist/');
  expect(res?.status()).toBe(404);
  await expect(page.getByText('The page you are looking for cannot be found.')).toBeVisible();
});

test('every /assets/ reference on every page resolves', async ({ page, request }) => {
  const seen = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    const urls = await page.$$eval('[src],[href],object[data]', (els) => els.map((e) => (e as HTMLElement).getAttribute('src') ?? (e as HTMLElement).getAttribute('href') ?? (e as HTMLElement).getAttribute('data') ?? ''));
    for (const u of urls) if (u.includes('/assets/') && !seen.has(u)) seen.add(u);
  }
  for (const u of seen) {
    const res = await request.head(u);
    expect(res.status(), u).toBe(200);
  }
});
```

- [ ] **Step 3: Write `e2e/interactions.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('project card opens its modal, links inside do not', async ({ page }) => {
  await page.goto('projects/');
  const card = page.locator('.project-card.is-clickable').first();
  const id = (await card.getAttribute('data-modal-target'))!;
  await card.click();
  await expect(page.locator(`dialog#${id}`)).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(page.locator(`dialog#${id}`)).not.toHaveAttribute('open', '');
});

test('deep link opens a person modal', async ({ page }) => {
  await page.goto('people/#person-modal-matthias_koenig');
  await expect(page.locator('dialog#person-modal-matthias_koenig')).toHaveAttribute('open', '');
  await expect(page.locator('dialog#person-modal-matthias_koenig .modal-title')).toContainText('König');
});

test('alumni hover card shows on hover', async ({ page }) => {
  await page.goto('people/');
  const avatar = page.locator('.alumni-card .person-avatar').first();
  await avatar.hover();
  await expect(avatar.locator('.person-card')).toHaveClass(/is-visible/);
});

test('tag filter hides non-matching publications and honours ?tag=', async ({ page }) => {
  await page.goto('publications/?tag=AI');
  await expect(page.locator('#publication-tag-filter .tag-filter-btn.active')).toHaveText(/AI/);
  const hidden = await page.locator('#publication-list tr[data-tags]:not([data-tags*="AI"])').evaluateAll((rows) => rows.filter((r) => (r as HTMLElement).style.display === 'none').length);
  const nonMatching = await page.locator('#publication-list tr[data-tags]:not([data-tags*="AI"])').count();
  expect(hidden).toBe(nonMatching);
  await page.locator('#publication-tag-filter [data-tag="all"]').click();
  await expect(page.locator('#publication-list tr[data-tags]').first()).toBeVisible();
});

test('search opens with "/", finds a publication, result navigates', async ({ page }) => {
  await page.goto('');
  await page.keyboard.press('/');
  await expect(page.locator('dialog#site-search-modal')).toHaveAttribute('open', '');
  await page.locator('#site-search-input').fill('liver');
  const first = page.locator('.site-search-result').first();
  await expect(first).toBeVisible();
  await first.click();
  await expect(page).toHaveURL(/#/);
});

test('analytics loads only after consent', async ({ page }) => {
  const ga: string[] = [];
  page.on('request', (r) => { if (r.url().includes('googletagmanager.com')) ga.push(r.url()); });
  await page.goto('');
  await expect(page.locator('#cookie-consent-banner')).toBeVisible();
  expect(ga).toEqual([]);
  await page.locator('#cookie-consent-accept').click();
  await page.waitForTimeout(500);
  expect(ga.length).toBeGreaterThan(0);
  await expect(page.locator('#cookie-consent-banner')).toBeHidden();
});

test('mobile navbar toggles', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto('');
  await expect(page.locator('#navbar')).toBeHidden();
  await page.locator('#navbar-toggler').click();
  await expect(page.locator('#navbar')).toBeVisible();
});
```

- [ ] **Step 4: Write `e2e/screenshots.ts`** (local tool, not a test)

```ts
// Side-by-side screenshots of the Jekyll build (served on :4400) and the
// Astro build (:4321) for manual parity review. Run:
//   npx serve web -l 4400 &  npm run preview &  npx tsx e2e/screenshots.ts
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const pages = ['/', '/projects/', '/publications/', '/people/', '/research/', '/meetings/', '/news/', '/teaching/', '/impressum/', '/privacy/'];
const widths = [1280, 400];
const targets = { jekyll: 'http://localhost:4400', astro: 'http://localhost:4321' };

mkdirSync('e2e/screenshots', { recursive: true });
const browser = await chromium.launch();
for (const [name, origin] of Object.entries(targets)) {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    for (const path of pages) {
      await page.goto(origin + path, { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.setItem('cookie_consent', 'declined'));
      await page.reload({ waitUntil: 'networkidle' });
      const slug = path === '/' ? 'home' : path.replaceAll('/', '');
      await page.screenshot({ path: `e2e/screenshots/${slug}-${width}-${name}.png`, fullPage: true });
    }
    await page.close();
  }
}
await browser.close();
console.log('wrote e2e/screenshots/*.png');
```

- [ ] **Step 5: Write `site/lib/parity.test.ts`**

```ts
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const hasBoth = existsSync('web/index.html') && existsSync('dist/index.html');

describe.skipIf(!hasBoth)('parity with the Jekyll build in web/', () => {
  const pages = ['index.html', 'projects/index.html', 'publications/index.html', 'people/index.html', 'research/index.html', 'meetings/index.html', 'news/index.html', 'teaching/index.html'];

  it('keeps every element id that search results and links target', () => {
    for (const p of pages) {
      const ids = (f: string) => new Set([...readFileSync(f, 'utf8').matchAll(/ id="([^"]+)"/g)].map((m) => m[1]).filter((id) => !id.endsWith('-label')));
      const old = ids(`web/${p}`);
      const now = ids(`dist/${p}`);
      for (const id of old) expect(now, `${p} lost #${id}`).toContain(id);
    }
  });

  it('search index has the same number of records per type', () => {
    const count = (f: string) => {
      const c: Record<string, number> = {};
      for (const r of JSON.parse(readFileSync(f, 'utf8')) as { type: string }[]) c[r.type] = (c[r.type] ?? 0) + 1;
      return c;
    };
    expect(count('dist/search.json')).toEqual(count('web/search.json'));
  });

  it('sitemap covers every Jekyll URL', () => {
    const urls = (f: string) => new Set([...readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).filter((p) => !p.endsWith('.xml')));
    const old = urls('web/sitemap.xml');
    const now = urls('dist/sitemap-0.xml');
    for (const u of old) if (u !== '/feed.xml') expect(now, `sitemap lost ${u}`).toContain(u);
  });
});
```

`web/sitemap.xml` from Jekyll lists `/`, the ten pages, and possibly `/404.html`; if `/404.html` is in it, add it to the exclusion in the loop as well (Astro's sitemap does not list 404).

- [ ] **Step 6: Run everything**

```bash
npm run build && npm test && npm run e2e
```

Expected: Vitest green including the parity suite; Playwright green. Then the visual pass:

```bash
npx serve web -l 4400 & npm run preview & sleep 3; npx tsx e2e/screenshots.ts; kill %1 %2
```

Open the pairs in `e2e/screenshots/` and fix any CSS difference in `site/styles/global.css` (typical culprits: heading sizes, list styles, card image heights, navbar padding). Re-run until the pairs match apart from font rendering.

- [ ] **Step 7: Delete the Jekyll tree**

```bash
git rm -r app _config.yml Gemfile docker-compose.yml docker-compose-build.yml docker-compose-serve.yml deploy.sh nginx
git rm --cached -r --ignore-unmatch Gemfile.lock
npm run build && npm test && npm run e2e
```

Expected: `app/` is gone, everything still passes (the parity suite still runs because `web/` is untracked and stays on disk).

- [ ] **Step 8: Commit**

```bash
git add playwright.config.ts e2e site/lib/parity.test.ts package.json package-lock.json
git commit -m "Add Playwright end-to-end tests, parity checks, and remove the Jekyll build"
```

---

### Task 20: GitHub Actions workflow, documentation, pull request

**Files:**
- Create: `.github/workflows/site.yml`
- Modify: `README.md`, `CLAUDE.md`, `science_communication/project_output.md`
- Keep: `.github/workflows/validate-data.yml`

- [ ] **Step 1: Write `.github/workflows/site.yml`**

```yaml
name: Site

on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: site-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  validate:
    name: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
        with:
          enable-cache: true
      - run: uv python install
      - run: uv sync
      - run: uv run pytest tests/ -q
      - run: uv run python -m src.data

  build:
    name: build
    needs: validate
    runs-on: ubuntu-latest
    env:
      # interim project-pages URL; switch to SITE=https://livermetabolism.com
      # and BASE=/ (plus public/CNAME) when the domain is attached
      SITE: https://matthiaskoenig.github.io
      BASE: /livermetabolism-site/
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run check
      - run: npm test
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
        env:
          CI: "true"
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    name: deploy
    if: github.event_name != 'pull_request'
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

`playwright.config.ts` (Task 19) already derives its `baseURL` from `BASE`, so the base-prefixed build is exercised by the same specs in CI.

- [ ] **Step 2: Rewrite `README.md`**

Replace the "Repository layout", "Local development", "Editing content", and "Deployment" sections with:

```markdown
## Repository layout

| Path | Contents |
|---|---|
| `data/` | The YAML tables (publications, people, projects, …) — the single database for the site and the Python tooling |
| `public/` | Static files served as-is (`/assets/...`, favicon) |
| `assets_src/` | Raster masters of the images; not served (only the `.webp` renditions in `public/` are) |
| `site/` | Astro source: `pages/`, `layouts/`, `components/` (Vue), `lib/`, `styles/`, `content.config.ts` |
| `src/` | `uv`-managed Python package; `src/data.py` is the pydantic schema of the YAML, `src/cv/list_of_*.py` render tables to Typst |
| `tests/` | Pytest suite for `src/data.py` |
| `e2e/` | Playwright end-to-end tests and the screenshot comparison script |
| `science_communication/` | Planning notes (not part of the build) |

## Local development

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview    # serve dist/
npm run check      # astro check (types)
npm test           # vitest
npm run e2e        # playwright (needs a build)
```

## Editing content

Edit `data/*.yml`, then validate:

```bash
uv sync
uv run python -m src.data
uv run pytest tests/
```

The Astro build validates the same data again through Zod schemas (`site/lib/schemas.ts`) and fails on dangling `people`/`tags`/`publications` references.

## Branches and deployment

`main` is protected (ruleset "main": pull requests only, linear history, squash or rebase merges, required checks `validate` and `build`). Work on a branch and open a pull request. Merging to `main` builds and deploys the site to GitHub Pages through `.github/workflows/site.yml`.

Domain switch: set `SITE`/`BASE` in the workflow, add `public/CNAME`, configure the domain in the repository's Pages settings.
```

Keep the title paragraph (update "built with Jekyll" to "built with [Astro](https://astro.build/) and Vue"), the bug tracker line, the Python package section (change `app/_data` to `data`), and the license block.

- [ ] **Step 3: Rewrite `CLAUDE.md`**

Rewrite the "What this is", "Repository layout", "Data model & validation", "UI conventions", "Commands", and "Notable conventions" sections for the new stack. Required content:

- Astro source in `site/` because `src/` is Python; `data/` is the single database validated by pydantic and mirrored by Zod in `site/lib/schemas.ts` (keep both in sync when adding a field); `public/assets/` served at `/assets/`; raster masters in `assets_src/`.
- Components are Vue SFCs used statically from `.astro` pages and hydrated with `client:idle` only for the section islands (`*Section.vue`, `PersonModals.vue`, `PersonAvatar.vue`, `SiteSearch.vue`, `CookieConsent.vue`). One component per entry type (`PublicationRow`, `ProjectCard`, …).
- Modals are native `<dialog class="modal">` managed by `site/lib/modals.ts`; open with `data-modal-target="<dialog id>"`; deep links `#<dialog id>` open on load.
- Links go through `url()`/`asset()` (`site/lib/url.ts`) for the base path.
- Icons: `site/icons/*.svg` via `scripts/fetch-icons.sh`, `<Icon name="globe" />`.
- Styling: `site/styles/global.css` (Tailwind v4 theme + ported rules); no CSS framework classes beyond the explicitly re-created `btn*`, `container`, `modal*`, `navbar*`.
- Search index: `site/pages/search.json.ts`; add a table there to make it searchable.
- Commands block as in the README; Python commands unchanged apart from `data/`.
- GA gated by `CookieConsent.vue`; never add a third-party script unconditionally.
- Branch rules and the GitHub Pages size caveat (881 MB of PDFs against the 1 GB limit).

- [ ] **Step 4: Update `science_communication/project_output.md`**

Under "Future work", replace the Astro paragraph with a checked item under "Delivered updates": `- [x] Migrated the site from Jekyll to Astro (Vue islands, Tailwind, GitHub Pages deployment via GitHub Actions) — same pages, URLs, and features` and keep the "People page profiles" sentence. Update the Summary's last paragraph accordingly.

- [ ] **Step 5: Validate locally like CI does and commit**

```bash
SITE=https://matthiaskoenig.github.io BASE=/livermetabolism-site/ npm run build
SITE=https://matthiaskoenig.github.io BASE=/livermetabolism-site/ npm run e2e
grep -c 'href="/livermetabolism-site/' dist/index.html
uv run pytest tests/ -q && uv run python -m src.data
git add .github/workflows/site.yml README.md CLAUDE.md science_communication/project_output.md
git commit -m "Add GitHub Pages deployment workflow and update documentation"
```

Expected: the base-prefixed build passes e2e; the grep count is > 0 (links carry the base).

- [ ] **Step 6: Open the pull request**

```bash
git push -u origin astro-migration
```

Then in the browser: open `https://github.com/matthiaskoenig/livermetabolism-site/compare/main...astro-migration`, create the pull request titled "Migrate the site from Jekyll to Astro" with this body:

```
Replaces the Jekyll build with Astro + Vue islands + Tailwind, deployed to GitHub Pages by GitHub Actions. Feature parity: same pages, URLs, anchors, interactions, and look. Bootstrap, Sass, the Font Awesome kit, Docker/nginx, and all hand-written JS are removed. YAML in data/ stays the single database (pydantic + Zod).

Spec: docs/superpowers/specs/2026-09-11-astro-migration-design.md
Plan: docs/superpowers/plans/2026-09-11-astro-migration.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01EACGN79i4sGkmxT67hQuRJ
```

Wait for the `validate` and `build` checks to pass, then squash-merge.

---

### Task 21: After the merge — Pages source, required checks, first deployment

**Files:** none (repository settings).

- [ ] **Step 1: Enable GitHub Pages from Actions**

`Settings → Pages → Build and deployment → Source: GitHub Actions`. The merge commit's `Site` workflow run on `main` will have failed at `deploy` if this was not set before; re-run it from the Actions tab after enabling.

- [ ] **Step 2: Add the required status checks to the ruleset**

`Settings → Rules → Rulesets → main → Require status checks to pass`: check it, add `validate` and `build` (they appear once the workflow has run on a pull request), keep "Require branches to be up to date before merging" unchecked (matches the reference repos' `strict_required_status_checks_policy: false`). Save.

- [ ] **Step 3: Verify the live site**

Open `https://matthiaskoenig.github.io/livermetabolism-site/`: the homepage renders with styles, `…/people/#person-modal-matthias_koenig` opens the modal, `…/search.json` returns JSON, `…/sitemap-index.xml` exists, and a PDF under `…/assets/pdf/publication/` downloads.

- [ ] **Step 4: Record the domain switch as the next step**

Nothing to do now. When the domain is registered: in `.github/workflows/site.yml` set `SITE: https://livermetabolism.com` and `BASE: /`, add `public/CNAME` containing `livermetabolism.com`, set the custom domain under `Settings → Pages`, and open a pull request with those three changes.
