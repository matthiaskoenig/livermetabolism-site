# Audit Fixes Implementation Plan

Status: executed in full; PRs #17, #18, #22, #25; final deviations: ModalRouter became a bundled script in Base.astro (Task 4), FilteredGrid's #modal slot and the client:visible *Section islands from Task 2 were removed by Task 3.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Apply the findings of the 12 September 2026 site audit: delete unreferenced assets and re-export oversized images, close the quick security/quality/performance items, then remove the duplicated data from the list pages and the Vue runtime from pages that do not need it.

**Architecture:** Same Astro 7 + Vue + Tailwind site. Task 3 changes the island design: list rows, cards, and modals are rendered statically (Vue components without a client directive) and a small `TagFilter.vue` island toggles `[data-tags]` elements in the static DOM, so no record is serialised into island props any more; a single `ModalRouter.vue` island installs the document-level modal router (superseded, see status). Task 4 rewrites the navbar toggle, cookie banner, and site search as Astro components with bundled TypeScript `<script>` blocks, so the Vue runtime ships only on pages that hydrate a Vue island.

**Tech Stack:** unchanged (Astro 7, Vue 3, Tailwind 4, Vitest, Playwright, ImageMagick + Pillow for the one-off re-exports).

**Spec:** the audit page https://claude.ai/code/artifact/2f9a71ac-af64-45f8-9c6c-6523422cd471 and the three underlying reports the controller holds. This plan restates every item it acts on, so executors need only this file.

## Global Constraints

- Feature parity with the current site: same pages, URLs, element ids (`pub-<id>`, `project-modal-<id>`, `news-modal-<id>`, `person-modal-<id>`, `#<type>-tag-filter`, grid ids), same interactions (tag filter with `?tag=`, modals with deep links, hover cards, search with `/` and Cmd/Ctrl+K, consent gating), same look. The Playwright suite (`e2e/*.spec.ts`, 21 tests) and Vitest suite must stay green; add tests where the plan says so.
- `main` is protected: each task lands through its own branch and pull request (`gh pr create`, then `gh pr merge --squash --auto --delete-branch`); wait for `validate` and `build` before starting the next task, and start each task from an updated `main`.
- Verification before every commit: `npm run check`, `npm test`, `npm run build`, `npm run e2e` (start `npx astro preview --background` first, stop it afterwards with `npx astro preview stop`; never `pkill -f`), plus `uv run python -m src.data` and `uv run pytest tests/ -q` whenever `data/`, `src/`, or `tests/` change.
- No data content changes except the image-reference edits this plan names; never delete a file this plan does not list.
- Commit trailer lines on every commit:

```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EACGN79i4sGkmxT67hQuRJ
```

---

### Task 1: Delete unreferenced assets and re-export oversized images

**Branch:** `audit/assets`

**Files:**
- Delete (served, referenced by nothing; verified by the audit against YAML fields, inline `/assets/` paths, site source, and built HTML):
  - `public/assets/pdf/presentation/2023-06-16_wcm2023.liver.function.pdf`
  - `public/assets/pdf/presentation/2022-10-12_icsb.fair.indicators.daw.pdf`
  - `public/assets/pdf/presentation/2026-08-25_ekf.msg.digital.twins.jpg`
  - `public/assets/pdf/poster/ICSB2022_poster_v07.pdf` (and `assets_src/pdf/poster/ICSB2022_poster_v07.*` if a master exists)
  - `public/assets/image/tags/{ai,digital_pathology,digital_twins,fair_open,pharmacometrics}.webp` and the five `*_transparent.webp` siblings, plus their masters `assets_src/image/tags/<same stems>.png`
- Re-export in place (same file names, so no reference changes):
  - `public/assets/image/tags/*_upscayl_3x_digital-art-4x.webp` (5 files) from `assets_src/image/tags/<stem>.png`: `convert <stem>.png -resize '900x>' -quality 55 -define webp:method=6 <stem>.webp`; target under 80 KB each (they render at 10% opacity).
  - `public/assets/image/news/projects_ennie_michelle.webp` from `assets_src/image/news/projects_ennie_michelle.gif`: first frame only, `convert 'projects_ennie_michelle.gif[0]' -resize '400x400>' -quality 80 …webp`.
  - `public/assets/image/news/dhpe.webp` from `assets_src/image/news/dhpe.gif`, first frame, `'200x200>'`.
  - `public/assets/image/meetings/Open_Science_Workshop2025.webp` and `public/assets/image/news/Open_Science_Workshop2025.webp` (3-frame animation) from `assets_src/image/meetings/Open_Science_Workshop2025.gif`, first frame, `'900x>'`.
  - News and project card images: for every `public/assets/image/news/*.webp` and `public/assets/image/projects/*.webp` whose width exceeds 800 px, re-export from its `assets_src` master with `-resize '800x>' -quality 78`; images already at or below 800 px stay untouched. (800 px, not the card width: the same files fill the news modal and the project gallery.)
- Replace: `public/assets/image/software/cobrapy.svg` (868 KB, embedded rasters) with `public/assets/image/software/cobrapy.webp` rendered at 300 px (`convert -density 150 -background none cobrapy.svg -resize '300x300>' cobrapy.webp`; if ImageMagick cannot rasterise it, use `rsvg-convert` or Pillow via `cairosvg` if available, otherwise report BLOCKED with the error). Update `data/software.yml` `image: cobrapy.svg` → `image: cobrapy.webp`; remove the `.svg` from `public/` and from `assets_src/image/software/` if a copy exists there.
- Overwrite `public/favicon.ico` with `public/assets/favicon/favicon.ico` (the root file is the pre-brand-mark icon).

**Interfaces:** none.

- [x] **Step 1:** `git checkout main && git pull --ff-only && git checkout -b audit/assets`.
- [x] **Step 2:** Record before-sizes: `du -sh public/assets/image/tags public/assets/image/news public/assets/image/projects public/assets/pdf` and `ls -l` of the files to be re-exported.
- [x] **Step 3:** `git rm` the deletion list. Confirm `grep -rn "<basename>" data/ site/ public/assets/favicon 2>/dev/null` finds nothing for each deleted basename.
- [x] **Step 4:** Run the re-exports. Verify with Pillow (`python3 -c "from PIL import Image; …"`) that each output opens, has the expected size, and that the previously animated files now have one frame (`getattr(im, 'n_frames', 1) == 1`).
- [x] **Step 5:** cobrapy replacement and the `software.yml` edit; `uv run python -m src.data` and `uv run pytest tests/ -q` must pass.
- [x] **Step 6:** favicon overwrite; `sha256sum public/favicon.ico public/assets/favicon/favicon.ico` must match.
- [x] **Step 7:** `npm run build`, then `npm run e2e` (the "every /assets/ reference resolves" test proves nothing referenced a deleted file). Take one Playwright screenshot of `/` at 1280 px and one of `/research/` and look at them: background art and the cobrapy logo must still render.
- [x] **Step 8:** Record after-sizes; commit "Remove unreferenced assets and re-export oversized images" with the before/after table in the body; push; open the PR; enable auto-merge; wait for the checks.

---

### Task 2: Quick security, quality, and performance fixes

**Branch:** `audit/quick-fixes`

**Files:** `astro.config.mjs`, `nginx/nginx.conf`, `.github/workflows/site.yml`, delete `.github/workflows/validate-data.yml`, add `.github/dependabot.yml`, `site/components/FilteredGrid.vue`, `ProjectsSection.vue`, `NewsSection.vue`, `site/lib/data.ts`, `site/components/PersonAvatar.vue`, `e2e/interactions.spec.ts`, `site/lib/iconSprite.test.ts`, `src/data.py`, `site/styles/global.css`, `site/lib/schemas.ts` (+ test), `site/lib/url.ts`, `site/components/TopNav.astro`, every component with an `<img>`, all `client:idle` usages in `site/pages/*.astro`, `site/pages/site.webmanifest.ts` (new) + `site/components/Head.astro`, delete `public/assets/favicon/site.webmanifest`, `package.json`, `CLAUDE.md`.

**Interfaces:** `FilteredGrid.vue` gains an optional `#modal` scoped slot rendered once per item after the grid (unfiltered) (superseded, see status); `all<K extends keyof CollectionData>(key: K): Promise<Entry<CollectionData[K]>[]>` in `site/lib/data.ts`.

- [x] **Step 1: Content Security Policy.** In `astro.config.mjs` add

```js
security: {
  csp: {
    directives: [
      "default-src 'self'",
      "img-src 'self' data: https://img.youtube.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
      "object-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ],
    scriptDirective: { resources: ["'self'", 'https://www.googletagmanager.com'] },
    styleDirective: { resources: ["'self'", 'https://fonts.googleapis.com'] },
  },
},
```

Read `node_modules/astro/dist/types/public/config.d.ts` around `security.csp` for the exact option names before writing this (`scriptDirective.resources`, `styleDirective.resources`, `directives`). Build, then load `/`, `/publications/`, `/news/` (open a video news modal), `/people/` and `/cv/` in Playwright and assert zero console errors (the `pages.spec.ts` test already does this for every page; extend `interactions.spec.ts` so the consent test asserts no CSP console error after the GA script loads). The `<object>` PDF embed on `/cv/` needs `object-src 'self'`. If Astro cannot hash a script the `<astro-island>` runtime injects, read the docs section on `security.csp` before adding any `'unsafe-inline'`; report what you had to allow and why.

- [x] **Step 2: nginx headers.** `nginx/nginx.conf`: add `add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()" always;`; remove the container's `X-Frame-Options` and `X-Content-Type-Options` if `nginx/ssl.conf` (host proxy) already sets them (check; keep whichever header the host does not set); remove the `error_page 500 502 503 504 /50x.html` block and its `location`. Validate with `docker run --rm -v $PWD/nginx/nginx.conf:/etc/nginx/nginx.conf:ro nginx:1.31.5-alpine nginx -t`.

- [x] **Step 3: Workflows.** Look up the current major of each action (`gh api repos/actions/checkout/releases/latest --jq .tag_name`, likewise `actions/setup-node`, `actions/upload-artifact`, `actions/upload-pages-artifact`, `actions/deploy-pages`, `astral-sh/setup-uv`) and bump `site.yml` to them; read the release notes of `actions/checkout` and `astral-sh/setup-uv` for default changes and adapt (the `validate` job may need `enable-cache: true` semantics checked). Delete `.github/workflows/validate-data.yml` (the `validate` job in `site.yml` is the required check; nothing else references the `test` check). Add `.github/dependabot.yml` with weekly updates for `github-actions` and `npm` (grouped minor/patch) and `uv`/`pip` if supported. Update the comment in `README.md`/`CLAUDE.md` that names `validate-data.yml`.

- [x] **Step 4: `FilteredGrid` modal slot.** (superseded, see status) Add `defineSlots<{ item(props: { item: T }): unknown; modal?(props: { item: T }): unknown }>()` and, after the grid `div`, `<template v-for="it in items" :key="`m-${it.id}`"><slot name="modal" :item="it" /></template>`. Rewrite `ProjectsSection.vue` and `NewsSection.vue` to use `FilteredGrid` with `filter-id="project"`/`"news"` and `grid-id="project-grid"`/`"news-grid"`, passing the card in `#item` and the modal in `#modal`; delete their own `TagFilterBar`/`useTagFilter` code. Rendered ids and classes must not change (compare `dist/projects/index.html` and `dist/news/index.html` id lists before and after).

- [x] **Step 5: Typed collection map.** In `site/lib/data.ts` add `interface CollectionData { people: S.PersonData; publications: S.PublicationData; … }` for every collection `all()` serves, change `plain`/`all` to `all<K extends keyof CollectionData>(key: K): Promise<Entry<CollectionData[K]>[]>`, and drop the free `T` from the one-line wrappers. `npm run check` must pass.

- [x] **Step 6: Registry typing.** `PersonAvatar.vue`: replace `(globalThis as any).__personAvatarCloseAll` with a `declare global { var __personAvatarCloseAll: Set<() => void> | undefined }` block (in `site/env.d.ts` if a `.vue` file cannot host it) and `globalThis.__personAvatarCloseAll ??= new Set()`.

- [x] **Step 7: e2e assertions.** `e2e/interactions.spec.ts`: replace `await page.waitForTimeout(500)` in the consent test with `await page.waitForRequest((r) => r.url().includes('googletagmanager.com'))` placed before the click (`const req = page.waitForRequest(...)` then click, then `await req`); narrow the search-result URL regex to `/#(pub|presentation|poster|abstract|project-modal|software|funding|editor|news-modal|meeting|teaching|person-modal)-/`.

- [x] **Step 8: Icon list test.** In `site/lib/iconSprite.test.ts` add a test that the set of `site/icons/*.svg` file stems (via `import.meta.glob('../icons/*.svg')` keys or `fs.readdirSync`) equals `new Set(iconNames())`, so an orphaned or unlisted icon fails.

- [x] **Step 9: Validator coverage.** `src/data.py` `IMAGE_FIELDS`: add `"publications": [("pdf", "assets/pdf", False)]` and `"funding": [("funder_logo", "assets/image/funding", False)]`. Update `tests/test_load_yaml.py`'s minimal fixture if it now needs the files to exist (create the touched files the same way the fixture creates `example.pdf`). `uv run pytest tests/ -q` and `uv run python -m src.data` must pass.

- [x] **Step 10: Dead CSS and stale comments.** Remove `.person-flag` from `site/styles/global.css`; change the two comments that say "ported from `app/assets/css/main.scss`" to say the rules were ported from the former Jekyll stylesheet.

- [x] **Step 11: Schema hardening.** `site/lib/schemas.ts`: `newsSchema.video` must be `null`/absent or start with `https://www.youtube.com/embed/` or `https://www.youtube-nocookie.com/embed/` (all three current values are `https://www.youtube.com/embed/…`); add a test. Add a comment above `link()` in `site/lib/url.ts` stating that it trusts its input to come from `data/*.yml` and must get a scheme allow-list if ever fed anything else. `TopNav.astro`: the CV link gets `rel="noopener noreferrer"`.

- [x] **Step 12: Images.** Add `decoding="async"` to every `<img>` in `site/components/*.vue` and `site/pages/*.astro`; add `loading="lazy"` in `PeopleAvatars.vue` and `TeachingCard.vue`; add `width`/`height` where the rendered size is fixed by CSS and known: avatars (`PersonAvatar` 52 for the strip, 40 with `alumni-photo`; `.member-photo` 56; `.author-avatar` 18; `.project-avatar` 30; `.person-modal-photo` 96; footer photo 48) and the teaching banner (`1800` × `191`). Leave card images (CSS fixes their height) alone.

- [x] **Step 13: `client:visible`.** (superseded, see status) Change `client:idle` to `client:visible` for `PublicationsSection`, `NewsSection`, `ProjectsSection`, `SoftwareSection`, `FundingSection`, `EditorsSection`, `MeetingsSection`, and `PersonAvatar`. Keep `PersonModals` on `client:idle`: its root holds only closed `<dialog>` elements, which never intersect the viewport, so `client:visible` would never hydrate it and deep links would break. Run the e2e suite.

- [x] **Step 14: Web manifest route.** Create `site/pages/site.webmanifest.ts` (an endpoint like `search.json.ts`) returning the manifest JSON with icon `src` values built through `asset('favicon/android-chrome-192x192.png')` etc. and `Content-Type: application/manifest+json`; point `Head.astro`'s manifest link at `url('/site.webmanifest')`; delete `public/assets/favicon/site.webmanifest`. Build and `curl` the route under `BASE=/livermetabolism-site/` to confirm the prefixed paths.

- [x] **Step 15: Dependencies.** `npm install js-yaml@5 @types/js-yaml@latest` if `@types/js-yaml` 4 does not type v5 (v5 may ship its own types; check `node_modules/js-yaml/package.json` `types`), fix any API change in `content.config.ts`/`schemas.test.ts`; `npm update happy-dom`. `npm audit` must stay clean.

- [x] **Step 16: Docs.** `CLAUDE.md`: mention the CSP config and that new third-party hosts must be added there; the `#modal` slot (superseded, see status); the `CollectionData` map; the manifest route; the `client:visible` rule and the `PersonModals` exception (superseded, see status); the validator's two new checks. Remove the `validate-data.yml` mention.

- [x] **Step 17:** Full verification (constraints above), commit in logical groups (security; workflows; Vue/TS quality; e2e/tests; images/islands; manifest/deps/docs), push, PR, auto-merge, wait for checks.

---

### Task 3: Static-first list pages — no records in island props

**Branch:** `audit/static-lists`

**Why:** the four heaviest pages serialise every record into `astro-island` props and render it again as HTML (publications 86% of the page, news 93%). Rendering rows, cards and modals statically and filtering the static DOM removes the props copy entirely and makes the `*Section` islands and `PersonModals` unnecessary.

**Files:**
- New: `site/components/TagFilter.vue` (island), `site/components/ModalRouter.vue` (island, renders nothing) (superseded, see status), `site/components/Modal.test.ts` adjusted, `site/components/TagFilter.test.ts`.
- Modified: `FilteredGrid.vue` (becomes a static wrapper or is deleted), `PublicationsSection.vue`, `ProjectsSection.vue`, `NewsSection.vue`, `SoftwareSection.vue`, `FundingSection.vue`, `EditorsSection.vue`, `MeetingsSection.vue`, `PersonModals.vue` (all deleted or reduced to static wrappers), `Modal.vue` (drop `onMounted` router install; keep markup), `site/pages/{publications,projects,news,research,meetings,people}.astro`, `site/layouts/Base.astro` (mount `ModalRouter`), `site/lib/tagFilter.ts`, `CLAUDE.md`.

**Interfaces:**
- `TagFilter.vue` props: `id: string` (renders `#<id>-tag-filter`), `tags: TagInfo[]`, `target: string` (id of the container holding `[data-tags]` items), `groupSelector?: string` (default `.pub-year-group`: groups inside the target that hide when none of their `[data-tags]` children is visible). On mount it reads `?tag=` (unknown tags ignored), applies the filter by toggling the `hidden` attribute on `[data-tags]` elements and on empty groups, and re-applies on button click. Filtering uses `hidden`, not inline `display`, so the e2e test that checks `style.display === 'none'` must be updated to check `hidden`.
- `ModalRouter.vue`: `onMounted(() => installModalRouter())`, no template output (`<template><span hidden></span></template>` or a render function returning `null`). Mounted once in `Base.astro` with `client:idle`. Because every `<dialog>` is now in the static HTML, the router's single initial hash check is sufficient; remove the per-`Modal` hash check added earlier and its test, and update `Modal.test.ts` to cover the router-only behaviour. (superseded, see status)
- Pages render the card/row/modal Vue components statically (no client directive) inside a container with the existing grid/list id, and place `<TagFilter client:idle …/>` where the filter bar was. Publications keep the year-group wrapper with class `pub-year-group`.

- [x] **Step 1:** Write `TagFilter.test.ts` first (mount with a fake target in `document.body` containing `[data-tags]` items and a group; assert `hidden` toggling, `?tag=` pre-apply, unknown-tag fallback, empty-group hiding). Then implement `TagFilter.vue` on top of `useTagFilter()`.
- [x] **Step 2:** `ModalRouter.vue` + mount in `Base.astro`; `Modal.vue` loses its `onMounted`; adjust `Modal.test.ts`; `modals.test.ts` stays.
- [x] **Step 3:** Convert `publications.astro`: static `PublicationRow` rows grouped by year (`groupByYear`), `<TagFilter client:idle id="publication" :tags target="publication-list" />`. Delete `PublicationsSection.vue`.
- [x] **Step 4:** Convert `projects.astro` and `news.astro` (cards static, modals static after the grid, `TagFilter` island). Delete `ProjectsSection.vue`, `NewsSection.vue`.
- [x] **Step 5:** Convert `research.astro` (three grids, three `TagFilter` islands sharing `?tag=`) and `meetings.astro`. Delete the four section components and `FilteredGrid.vue`.
- [x] **Step 6:** Convert `people.astro`: render `PersonModal` statically for each person with modal; delete `PersonModals.vue`. `PersonAvatar` stays an island.
- [x] **Step 7:** Update `e2e/interactions.spec.ts` (hidden attribute instead of `style.display`), run the full suite, and record the before/after gzip sizes of `dist/publications/index.html`, `news`, `people`, `projects` in the commit body. Expect publications to drop by roughly 35–40% gzipped.
- [x] **Step 8:** `CLAUDE.md`: describe the static-first design (which components are islands: `TagFilter`, `ModalRouter`, `PersonAvatar`, `SiteSearch`, `CookieConsent`, `NavToggle`) (superseded, see status) and remove the `*Section`/`PersonModals` mentions. Commit, PR, auto-merge, wait.

---

### Task 4: Navbar toggle, cookie banner, and search without Vue

**Branch:** `audit/vanilla-chrome`

**Why:** these three are on every page and are the only reason the Vue runtime (29 KB gzipped) loads on pages with no list island. After Task 3 the light pages (teaching, cv, impressum, privacy, 404) have no other island.

**Files:**
- Replace `site/components/NavToggle.vue` with markup in `TopNav.astro` plus a bundled `<script>` (Astro processes it as TypeScript) toggling `.show` on `#navbar` and `aria-expanded`.
- Replace `site/components/CookieConsent.vue` with `site/components/CookieConsent.astro`: the same markup (ids and classes unchanged) plus a `<script>` importing `site/lib/consent.ts`; the GA id and privacy URL are passed through `data-*` attributes on the banner element. It must also bind `#cookie-consent-reset` on the privacy page.
- Replace `site/components/SiteSearch.vue` with `site/components/SiteSearch.astro`: static `<dialog id="site-search-modal" class="modal modal-centered">` markup identical to today's rendered output, plus a `<script>` importing `rankRecords`/`SEARCH_TYPE_ICONS` from `site/lib/search.ts`, `openModal`/`closeModal` from `site/lib/modals.ts`, and `iconSvg` from `site/lib/icons.ts`; behaviour identical (lazy fetch on first `modal:open`, render on input, `/` and Cmd/Ctrl+K shortcuts, close on result click, reset on close). Result rows are built with `document.createElement` and `textContent` for title/type (no HTML string interpolation of record fields) with the icon inserted via `insertAdjacentHTML` from the allow-listed `iconSvg`.
- Delete the three `.vue` files. `Base.astro` and `TopNav.astro` updated.
- Tests: add `site/lib/search.test.ts` cases if any helper is added; keep the existing e2e tests (search, consent, mobile navbar) as the behavioural gate.

- [x] **Step 1:** NavToggle → script in `TopNav.astro`; e2e mobile test passes.
- [x] **Step 2:** CookieConsent → `.astro` + script; e2e consent test and the privacy-page reset button pass (add an e2e case: on `/privacy/`, after declining, clicking `#cookie-consent-reset` shows the banner again).
- [x] **Step 3:** SiteSearch → `.astro` + script; e2e search test passes; verify manually via Playwright that Escape, backdrop click, and result click close it.
- [x] **Step 4:** Confirm `dist/cv/index.html` (and teaching/impressum/privacy/404) no longer reference `runtime-core.esm-bundler` or any `astro-island`; record the per-page JS totals before/after in the commit body.
- [x] **Step 5:** `CLAUDE.md`: the site chrome (navbar, cookie banner, search) is plain TypeScript in Astro `<script>` blocks; Vue is used for entry components (statically rendered) and the four small islands. Commit, PR, auto-merge, wait.
