# Network Graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A navigable force-directed graph on `/network/` connecting the five research topics, people, publications, projects, and software, with image nodes that lead to the items on the site.

**Architecture:** see the spec. Thumbnails are generated once by a `sharp` script and committed; graph rows are derived at build time by a pure helper; one ECharts graph island renders them with legend, topic focus, tooltips, and click navigation.

**Tech Stack:** as the site (Astro 7, Vue 3, Tailwind 4, Vitest, Playwright, `echarts/core` + `GraphChart`, `sharp`).

**Spec:** `docs/superpowers/specs/2026-09-12-network-graph-design.md`. Patterns to mirror: `site/lib/publicationRows.ts` (pure rows + tests), `site/components/PublicationsChart.vue` (island with mode buttons, click handling, `useChart`), `site/lib/chartOptions.ts` (`PALETTE`, `TAG_PALETTE`, `tooltip()` helper), `scripts/fetch-scholar.ts` (script structure), `site/lib/citations.ts` (build-time citations read).

## Global Constraints

- `main` is protected: each task lands through its own branch and PR (`gh pr create`, `gh pr merge --squash --auto --delete-branch`); wait for `validate` and `build`; start each task from an updated `main`. Never `git add -A`.
- Verification before every commit: `npm run check`, `npm test`, `npm run build`, `npm run e2e` (`PREVIEW_PORT=4325 npx astro preview --background --port 4325` first, `npx astro preview stop` after; never `pkill -f`).
- CSP: no `'unsafe-inline'`, no new host; chart heights through the CSSOM; tooltips `renderMode: 'richText'`.
- Node hrefs are built through `url()` at build time; the click handler navigates only to an `href` starting with `import.meta.env.BASE_URL`.
- Islands: only `NetworkGraph.vue` (`client:load`) on the network page; everything else static.
- Commit trailer lines:

```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EACGN79i4sGkmxT67hQuRJ
```

---

### Task 1: Thumbnails and graph rows

**Branch:** `network-data`

**Files:**
- Create: `scripts/graph-thumbs.ts`, `scripts/lib/graph-thumbs.ts` (pure path mapping: `thumbJobs({ people, projects, software, tags, imageRoot })` → `{ source, target, size, shape: 'circle' | 'square' }[]`) + `scripts/lib/graph-thumbs.test.ts`, `public/assets/image/graph/**` (generated, committed), `site/lib/graphRows.ts` + `site/lib/graphRows.test.ts`, `docs/superpowers/specs/2026-09-12-network-graph-design.md` and `docs/superpowers/plans/2026-09-12-network-graph.md` (already in the working tree, untracked — add them to the first commit).
- Modify: `package.json` (`"graph:thumbs": "node scripts/graph-thumbs.ts"`), `CLAUDE.md` (repository layout: `public/assets/image/graph/`; a "Network graph" paragraph under UI conventions describing rows and thumbnails), `README.md` (one sentence).

**Interfaces:** as the spec's "Rows" section; `graphRows(input: { tags: TagInfo[]; people: Entry<PersonData>[]; publications: Entry<PublicationData>[]; projects: Entry<ProjectData>[]; software: Entry<SoftwareData>[]; citations: Citations; base: string })` where `base` is the deploy base (`import.meta.env.BASE_URL`), hrefs built as `${base}people/#person-modal-${id}` etc. (mirror `url()` semantics: base ends with `/`); `image` is `${base}assets/image/graph/<type>/<id>.webp` when the thumbnail exists in the `thumbs: Set<string>` input (paths relative to `public/`), else `null`.

- [ ] **Step 1 (TDD):** `graph-thumbs.test.ts`: jobs for a person (source `people/128/<image>`, target `graph/people/<id>.webp`, 96, circle), a project (first of `images`, square), a software with and without `image`, a topic (`tags/<graphic>` → `graph/topics/<slug>.webp`, 160); the graphics map for topics is the one in `site/pages/index.astro` (`graphics`) — move it into `site/lib/tagGraphics.ts` and import it from both places. Then implement the pure helper.
- [ ] **Step 2:** `scripts/graph-thumbs.ts`: loads the YAML (`js-yaml`, as `scripts/lib/repos.ts` reads `software.yml`), builds the jobs, and for each source that exists runs `sharp(source).resize(size, size, { fit: 'cover' })`, for circles composited with an SVG circle mask (`dest-in`) so the corners are transparent, `.webp({ quality: 82 })` to the target (directories created); skips a missing source with a warning; prints a summary. Run it; commit the output (expect 61 + 25 + 11 + 5 files, roughly 3–8 KB each).
- [ ] **Step 3 (TDD):** `graphRows.test.ts` with small fixtures, then one test over the real data (`getTags()` etc. are Astro-only; read the YAML through `js-yaml` + the Zod schemas in `site/lib/schemas.ts` as `schemas.test.ts` does): 5 topic nodes; node counts equal the table sizes; unique ids; every link endpoint exists; an author link per `people` entry of a publication; project→publication and software→publication links; person→project links; a person's topics are the union of their publications' tags; publication `value` = citation count (0 when absent); hrefs start with `base`. Then implement `graphRows.ts`.
- [ ] **Step 4:** docs, `package.json`; full verification; commit in groups (docs+spec first); PR; auto-merge; wait.

---

### Task 2: Network page, graph island, navigation

**Branch:** `network-page`

**Files:**
- Create: `site/pages/network.astro`, `site/components/NetworkGraph.vue`, `site/lib/networkOptions.ts` + test.
- Modify: `site/components/useChart.ts` (register `GraphChart`), `site/components/TopNav.astro` ("Network" top-level entry after Research; `active('network')`), `site/pages/index.astro` (a "Network" link in each topic section's `.tag-section-links`, `href={`${url('/network/')}?topic=${encodeURIComponent(s.tag)}`}`), `site/styles/global.css` (`.network-graph` container, topic buttons reuse `.chart-mode-btn`), `site/pages/search.json.ts` only if static pages are listed there (add the network page), `e2e/pages.spec.ts` (add `'network/'` to the pages list) and `e2e/interactions.spec.ts` (canvas + five topic buttons; `?topic=AI` → the AI button `.active`; zero console errors), `CLAUDE.md` (islands list, network page).

- [ ] **Step 1 (TDD):** `networkOptions.test.ts`: `neighbourhood(rows, slug)` returns the topic node, its items, and their direct neighbours; `networkOption(rows, null)` has five categories in order, `layout: 'force'`, `roam: true`, image symbols as `image://<url>` for nodes with an image and `'circle'` otherwise, publication `symbolSize` from the citation formula (8 at 0 citations, 28 cap), richText tooltip whose formatter returns `label\n type · detail`; `networkOption(rows, 'ai')` dims nodes and links outside the neighbourhood to 0.15 and leaves the rest at 1. Then implement.
- [ ] **Step 2:** `NetworkGraph.vue`: props `rows`, `topics: { tag, slug }[]`, `initialTopic: string | null`; state `focus`; the topic buttons; `useChart(() => networkOption(rows, focus), () => height)` with `height = Math.max(480, window.innerHeight * 0.7)` recomputed on resize; ECharts `click` on a `topic` node toggles `focus`, on any other node navigates when `href.startsWith(import.meta.env.BASE_URL)`; `?topic=` read on mount (match by tag, ignore unknown).
- [ ] **Step 3:** `network.astro` (`<Base title="Network" sectionid="network">`, intro paragraph explaining hubs, node types, and that clicking opens the item; the island `client:load`), nav, homepage links, CSS, e2e, docs; full verification; PR; auto-merge; wait; live check (canvas renders, buttons, a node click opens the right page in a headless run).

---

### Task 3: Release 0.8.0

**Branch:** `release-0.8.0`

- [ ] `package.json` and `pyproject.toml` → 0.8.0 (`npm install --package-lock-only`, `uv lock`); `release-notes/0.8.0.md` in the house style (Features: the network page; Development: thumbnail script, graph rows, tests); PR; auto-merge; wait; then the controller tags `0.8.0`.
