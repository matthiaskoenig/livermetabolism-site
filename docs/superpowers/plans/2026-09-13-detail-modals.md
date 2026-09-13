# Standard Detail Modals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One standard detail modal for people, publications, projects, software, and news, prerendered as fragments and opened from cards, rows, search, and the network graph.

**Architecture:** see the spec. A pure model builder feeds one `DetailView` component; Astro page partials emit one fragment per entity; a generic modal shell on every page fetches, caches, and shows them; the old per-page modals are retired.

**Tech Stack:** as the site (Astro 7, Vue 3, Tailwind 4, Vitest with jsdom, Playwright).

**Spec:** `docs/superpowers/specs/2026-09-13-detail-modals-design.md`. Patterns: `site/lib/modals.ts` (router), `site/components/Modal.vue`/`PersonModal.vue` (current markup and CSS classes), `site/lib/graphRows.ts` (relations from the data, hrefs with base), `site/lib/githubStats.test.ts` (jsdom tests), `site/pages/search.json.ts` (record URLs).

## Global Constraints

- `main` is protected: each task lands through its own branch and PR (`gh pr create`, `gh pr merge --squash --auto --delete-branch`); wait for `validate` and `build`; start each task from an updated `main`. Never `git add -A`.
- Verification before every commit: `npm run check`, `npm test`, `npm run build`, `npm run e2e` (`PREVIEW_PORT=4325 npx astro preview --background --port 4325` first, `npx astro preview stop` after; never `pkill -f`).
- CSP: no `'unsafe-inline'`, no new host; fragments are same-origin; never insert strings from the URL or from a fetch as HTML — adopt parsed nodes only.
- Static-first: `DetailView.vue` renders without hydration; the shell is static markup plus one bundled `<script>`; no new islands.
- Every internal href goes through `url()`/`asset()` or the `base` passed to the model builder.
- Commit trailer lines:

```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EACGN79i4sGkmxT67hQuRJ
```

---

### Task 1: Detail model, view, and fragments

**Branch:** `detail-model`

**Files:**
- Create: `site/lib/details.ts` + `site/lib/details.test.ts`, `site/components/DetailView.vue`, `site/pages/detail/[type]/[id].astro`, `docs/superpowers/specs/2026-09-13-detail-modals-design.md` and `docs/superpowers/plans/2026-09-13-detail-modals.md` (untracked in the working tree; add them to the first commit).
- Modify: `site/styles/global.css` (`.detail-*` rules), `CLAUDE.md` (a "Detail modals" paragraph: model, view, fragments), `e2e/pages.spec.ts` (add one fragment URL, e.g. `detail/publication/<an id>/`, to the zero-console-error check only if the spec's page list tolerates a partial; otherwise a dedicated e2e that fetches it and asserts status 200 and a `.detail` root).

**Interfaces:** as the spec's "Model" section. `site/lib/details.ts` exports the types, `buildRelations(ctx)`, `detailModel(type, id, ctx)`, `detailIds(ctx): { type, id }[]` (every entity that gets a fragment), `listAnchor(type, id, base)` (`people/#person-<id>`, `publications/#pub-<id>`, `projects/#project-<id>`, `research/#software-<id>`, `news/#news-<id>`), and `DetailContext` (`{ people, publications, projects, software, news, presentations, posters, tags, peopleMap, github, scholar, citations, base }`).

- [ ] **Step 1 (TDD):** `details.test.ts` with small fixtures and one real-data test (load the YAML through `js-yaml` + the Zod schemas as `graphRows.test.ts` does; snapshots via `emptySnapshot()`/`emptyScholar()`/`emptyCitations()`): relations are symmetric (a person listed on a publication has that publication, and vice versa); a publication's related projects/software/presentations come from their `publications` lists; `detailModel` per type yields title, subtitle, links (person: homepage/ORCID/repository; publication: DOI/PubMed/PDF/homepage/repository; project: homepage/repository; software: homepage/repository/DOI; news: link/video), figures (publication citations from `citations.works`, software from `statsFor`, person counts), related sections in the spec's order, `listHref` with the base; `detailIds` counts equal the table sizes. Then implement.
- [ ] **Step 2:** `DetailView.vue` per the spec's "View" section (static; `PersonChips` for authors; `TagList` for tags; `Icon` for links; related rows with `data-detail="<type>:<id>"` for the five modal types and a plain `href` for presentation/poster rows; `v-html` only for `body`, which is the data's own HTML as on the cards). CSS.
- [ ] **Step 3:** `site/pages/detail/[type]/[id].astro`: `export const partial = true;` `getStaticPaths()` from `detailIds(ctx)`; renders `<DetailView model={detailModel(type, id, ctx)} />` and nothing else. Build; confirm `dist/detail/publication/<id>/index.html` starts with `<div class="detail"` (no doctype), count the fragments (5 tables → about 300).
- [ ] **Step 4:** docs; full verification; commit in groups; PR; auto-merge; wait.

---

### Task 2: Modal shell, detail router, triggers, retirement of the old modals

**Branch:** `detail-modal`

**Files:**
- Create: `site/components/DetailModal.astro` (shell + bundled script), `site/lib/detailModal.ts` + `site/lib/detailModal.test.ts` (jsdom).
- Modify: `site/layouts/Base.astro` (shell in the global slot), `site/lib/modals.ts` (delegate `[data-detail]` clicks/keys and detail hashes to the detail router; keep the rest), `site/components/PersonCard.vue`, `PersonAvatar.vue`, `ProjectCard.vue`, `NewsCard.vue`, `PublicationRow.vue` (title becomes a `data-detail` trigger), `SoftwareCard.vue` (name becomes a trigger), `site/pages/people.astro`, `projects.astro`, `news.astro` (remove the old modal renders and refs), `site/pages/search.json.ts` (record URLs → `#<type>/<id>`), `site/lib/graphRows.ts` (hrefs → `#<type>/<id>`) and `site/components/NetworkGraph.vue` (node click → `openDetail`), `site/components/SiteSearch.astro` only if result rows need `data-detail` (they navigate by URL; a same-page hash change must open the modal — the router listens to `hashchange`), `site/styles/global.css` (shell, Back button, loading state), `e2e/interactions.spec.ts` (replace the three old modal tests; add the spec's cases), `CLAUDE.md` (UI conventions: detail modals replace the per-page modals; hash scheme; triggers), `site/components/Modal.vue` stays for the search dialog.
- Delete: `site/components/PersonModal.vue`, `ProjectModal.vue`, `NewsModal.vue`; `site/lib/people.ts` refs helpers if unused.

**Interfaces:** `site/lib/detailModal.ts` exports `installDetailRouter(opts: { base: string; fetchImpl?: typeof fetch })`, `openDetail(type: DetailType, id: string, opts?: { push?: boolean })`, `closeDetail()`, `parseDetailHash(hash: string): { type, id } | null` (new scheme and legacy `#…-modal-<id>`), `isValidId(id)`.

- [ ] **Step 1 (TDD):** `detailModal.test.ts` on jsdom with a stub fetch returning a `<div class="detail">…</div>` fragment: open fetches `${base}detail/<type>/<id>/` once and caches; the dialog shows the fragment's root and the title; a `[data-detail]` click inside the dialog opens the next detail and Back returns to the previous one (stack); `closeDetail` empties the body; `parseDetailHash` handles `#publication/x`, `#person-modal/x`… legacy forms, and rejects `#foo/bar` and ids with `/` or `<`; an invalid type/id never fetches; a failed fetch shows an error line in the dialog. Then implement.
- [ ] **Step 2:** shell + script in `Base.astro`; router integration (`installModalRouter` calls `installDetailRouter`; a hash on load and on `hashchange` opens the detail; closing a detail opened from a hash restores the URL without the hash via `history.replaceState`).
- [ ] **Step 3:** triggers on the cards/rows/avatars; retire the three modals and the page refs; search and graph hrefs; network click; CSS.
- [ ] **Step 4:** e2e; docs; full verification; PR; auto-merge; wait; live check (open a publication modal on the live site headlessly and a node on the network page).

---

### Task 3: Release 0.9.0

**Branch:** `release-0.9.0`

- [ ] `package.json` and `pyproject.toml` → 0.9.0 (`npm install --package-lock-only`, `uv lock`); `release-notes/0.9.0.md` in the house style (Breaking changes: the per-page modals and their hashes are replaced — legacy hashes still open the modal; Features: the standard detail modal, in-modal browsing, network opens details in place, research page order and navbar order from PR #53; Security: same-origin fragments, node adoption, hash validation; Performance: list pages without inline modal bodies (sizes before/after for people, projects, news); Development: model, fragments, tests); PR; auto-merge; wait; then the controller tags `0.9.0`.
