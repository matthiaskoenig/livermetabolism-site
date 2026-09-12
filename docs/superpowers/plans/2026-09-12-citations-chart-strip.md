# Citations, Publications Chart, Homepage Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Per-paper citation counts with an ordering toggle and a publications-over-time chart on the publications page, and an at-a-glance strip on the homepage, on the daily-snapshot infrastructure.

**Architecture:** see the spec. A third daily fetch writes `citations.json`; the publications page renders badges from it and refreshes them in the browser; the chart and the strip are build-time only, kept fresh by a daily scheduled deploy.

**Tech Stack:** as the site (Astro 7, Vue 3, Tailwind 4, Vitest, Playwright, `echarts/core`).

**Spec:** `docs/superpowers/specs/2026-09-12-citations-chart-strip-design.md`. Patterns to mirror: `scripts/fetch-scholar.ts`, `scripts/lib/github-client.ts`, `site/lib/scholarSchema.ts`, `site/lib/scholar.ts`, `site/lib/scholarLive.ts`, `site/lib/scholarStats.ts`, `site/components/ScholarStats.astro`, `site/components/CitationsPerYearChart.vue`, `site/lib/chartOptions.ts`, `site/lib/githubStats.test.ts` (jsdom DOM tests).

## Global Constraints

- `main` is protected: each task lands through its own branch and PR (`gh pr create`, `gh pr merge --squash --auto --delete-branch`); wait for `validate` and `build`; start each task from an updated `main`. Never `git add -A`. Branch names must not start with `github-data/`.
- Verification before every commit: `npm run check`, `npm test`, `npm run build`, `npm run e2e` (`PREVIEW_PORT=4325 npx astro preview --background --port 4325` first, `npx astro preview stop` after; never `pkill -f`).
- CSP: no `'unsafe-inline'`; no new host is needed for the pages (the browser only fetches `raw.githubusercontent.com`). OpenAlex is contacted by the workflow only.
- No snapshot content is ever inserted as HTML; the only snapshot strings that reach the page are the OpenAlex work id (validated `^W\d+$`) and the OA status.
- Islands only where the spec says (`PublicationsChart.vue` with `client:visible`); everything else is static markup plus bundled `<script>`s.
- Commit trailer lines:

```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EACGN79i4sGkmxT67hQuRJ
```

---

### Task 1: Citations fetch, schema, workflow step, daily deploy

**Branch:** `citations-pipeline`

**Files:**
- Create: `scripts/fetch-citations.ts`, `scripts/lib/openalex.ts`, `scripts/lib/openalex.test.ts`, `site/lib/citationsSchema.ts`, `site/lib/citationsSchema.test.ts`, `tests/fixtures/openalex/works.json` (a recorded response for two or three real DOIs from `data/publications.yml`, fetched with `curl` and trimmed to the selected fields).
- Modify: `package.json` (`"fetch:citations": "node scripts/fetch-citations.ts"`), `.gitignore` (`/citations.json`), `.github/workflows/github-data.yml` (third fetch step + commit line), `.github/workflows/site.yml` (`schedule: - cron: "0 6 * * *"`), `CLAUDE.md`, `README.md`.

**Interfaces:**
- `site/lib/citationsSchema.ts`: `citationsSchema`, `Citations`, `CitationEntry`, `emptyCitations()`, `CITATIONS_URL = 'https://raw.githubusercontent.com/matthiaskoenig/livermetabolism-site/github-data/citations.json'`; `openalexId: z.string().regex(/^W\d+$/)`.
- `scripts/lib/openalex.ts`: `normalizeDoi(raw: string): string | null`, `doisFromPublications(yamlText: string): string[]`, `chunk<T>(list: T[], size: number): T[][]`, `fetchWorks(dois: string[], fetchImpl?: typeof fetch, mailto?: string, sleep?: (ms: number) => Promise<void>): Promise<ApiWork[]>`, `toCitationEntry(work: ApiWork): [doi: string, entry: CitationEntry] | null`, `buildCitations(works: ApiWork[], now: Date): Citations`.

- [ ] **Step 1 (TDD):** `openalex.test.ts`: `normalizeDoi` cases (`10.1515/JIB-2026-0006` → `10.1515/jib-2026-0006`, `https://doi.org/10.1/x`, `doi:10.1/x`, ` 10.1/x `, empty/non-DOI → null); `doisFromPublications` on the real file yields 110 unique DOIs in file order; `chunk`; `fetchWorks` with a stub fetch: builds the `filter=doi:a|b` URL with `per-page=50`, `select`, and `mailto` only when given; retries 429 then succeeds; gives up after three 5xx; `toCitationEntry` maps the fixture (DOI normalised from `https://doi.org/…`, `id` `https://openalex.org/W…` → `W…`, `counts_by_year` ascending); `buildCitations` keys by DOI. Then implement.
- [ ] **Step 2 (TDD):** `citationsSchema.test.ts` (round trip, extra key rejected, bad id rejected, `emptyCitations()` parses) → implement.
- [ ] **Step 3:** `fetch-citations.ts` (reads `data/publications.yml` relative to the script, batches of 50, validates, atomic write, one log line with the number of works and the sum of citations, exit 1 on failure with nothing written). Run it once locally to a scratch path and report the totals.
- [ ] **Step 4:** workflow steps; `site.yml` schedule; docs (`CLAUDE.md` "Live GitHub and Scholar data" section covers the third snapshot and the daily deploy; `README.md` one sentence); full verification; commit in groups; PR; auto-merge; wait.
- [ ] **Step 5 (after merge):** `gh workflow run github-data.yml --ref main`, wait, confirm `curl -s $CITATIONS_URL` parses with the schema and the other two files are still on the branch. Report the number of works found and the sum of citations.

---

### Task 2: Publication rows — citation and OA badges, ordering toggle, live refresh

**Branch:** `citations-rows`

**Files:**
- Create: `site/lib/citations.ts`, `site/lib/citationsLive.ts`, `site/lib/citationsStats.ts` + test, `site/lib/pubOrder.ts` + test (jsdom), `site/components/PublicationsOrder.astro`.
- Modify: `site/components/PublicationRow.vue` (badges, `data-cited`), `site/pages/publications.astro` (read the snapshot, pass `citation` per row, the toggle + note, the empty flat table `<table id="publication-list-flat" class="table publication-table" hidden>` after the year groups inside `#publication-list`), `site/styles/global.css` (`.pub-cites`, `.pub-badge-oa`, `#publication-order`), `e2e/interactions.spec.ts`, `CLAUDE.md`.

**Interfaces:** `PublicationRow` prop `citation?: CitationEntry | null`; `pubOrder.ts` exports `orderByCitations(root: HTMLElement): void` and `restoreOrder(root: HTMLElement): void` (idempotent, remember original positions in a `WeakMap`), `applyOrder(root, order: 'year' | 'cited')`; `citationsStats.ts` exports `applyCitations(root: ParentNode, citations: Citations): void` and `refreshNote(el, fetchedAt)`.

- [ ] **Step 1 (TDD):** `pubOrder.test.ts` with a jsdom fixture of two year groups and four rows with `data-cited` and `data-tags`: "cited" order puts rows into the flat table by count desc then year desc, hides the year groups, shows the flat table; "year" restores the exact original DOM order and visibility; a row hidden by the tag filter stays hidden after re-ordering. Then implement.
- [ ] **Step 2 (TDD):** `citationsStats.test.ts`: fills a hidden badge from a snapshot, updates `data-cited`, leaves rows without a DOI alone, never writes HTML (an `<img onerror>`-shaped status stays text), the note handles the epoch as "no data yet". Then implement, plus `citations.ts`/`citationsLive.ts` mirrored from the Scholar readers (with their tests).
- [ ] **Step 3:** `PublicationRow.vue` badges; `publications.astro` integration; `PublicationsOrder.astro` (buttons, `?order=cited`, script: `applyOrder` on click and on load; then `loadLiveCitations()` → `applyCitations` → re-apply the current order if it is `cited`). CSS.
- [ ] **Step 4:** e2e: at least one visible `cited` badge; "Most cited" makes the first visible row's `data-cited` the maximum; "Year" restores year headings; `?tag=AI` still hides non-matching rows in cited order; zero console errors. Full verification, PR, auto-merge, wait, check the live page.

---

### Task 3: Publications-over-time chart

**Branch:** `publications-chart`

**Files:**
- Create: `site/lib/publicationRows.ts` + test, `site/components/PublicationsChart.vue`.
- Modify: `site/lib/chartOptions.ts` (+ test: `publicationsOption(rows, mode)` with `TAG_PALETTE` mirroring `--color-tag-*`, stacked bars, richText tooltip, year categories ascending), `site/pages/publications.astro` (`<section id="publications-chart">` with the two mode buttons, the island `client:visible`, the caption), `site/styles/global.css`, `e2e/interactions.spec.ts` (canvas in `#publications-chart` after scrolling; clicking the "AI" segment is hard to hit on a canvas — instead assert the mode switch re-renders without errors), `CLAUDE.md` (islands list).

- [ ] **Step 1 (TDD):** `publicationRows.test.ts`: years ascending and contiguous from min to max, per-tag counts (a two-tag paper counts in both), per-status counts, totals equal the number of papers for the status split. Then implement.
- [ ] **Step 2:** chart option + component (mode as reactive state toggled by the buttons via a `data-mode` attribute the component watches, or the buttons inside the component — component-local buttons are simpler and allowed since the island is already hydrated); segment click → tag-filter button `.click()` + scroll; year label click → scroll to `.pub-year-group` whose heading text equals the year.
- [ ] **Step 3:** page integration, CSS, e2e, docs; full verification; PR; auto-merge; wait; live check.

---

### Task 4: Homepage at-a-glance strip

**Branch:** `home-strip`

**Files:**
- Create: `site/components/HomeStats.astro`, `site/lib/homeStats.ts` + test (`homeFigures({ publications, people, software, funding, github, scholar })` → ordered list of `{ id, value: number, label, sub?: string, href }`, omitting figures whose snapshot is empty).
- Modify: `site/pages/index.astro` (strip under the hero subtitle), `site/styles/global.css` (`.home-stats`, `.home-stat`, responsive wrap; readable on the hero background), `e2e/pages.spec.ts` or `interactions.spec.ts` (homepage shows six `.home-stat` with digits; with the snapshots available in CI all six are present), `CLAUDE.md`.

- [ ] **Step 1 (TDD):** `homeStats.test.ts` with small fixtures (counts by status, current/alumni split, stars sum, omission on empty snapshots) → implement.
- [ ] **Step 2:** component, page, CSS, e2e, docs; full verification; PR; auto-merge; wait; live check. Report the homepage HTML gzip size before/after.

---

### Task 5: Release 0.7.0

**Branch:** `release-0.7.0`

- [ ] `package.json` and `pyproject.toml` → 0.7.0 (`uv lock`); `release-notes/0.7.0.md` in the house style (Features: the three components; Security: OpenAlex contacted only by the workflow, validated ids; Performance: daily scheduled deploy, homepage without fetch scripts, sizes; Fixes if any; Development: pipeline, schema, tests counts); PR; auto-merge; wait; then the controller tags `0.7.0`.
