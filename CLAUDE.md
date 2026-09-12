# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static site source for the König research group site (https://www.livermetabolism.com/), built with [Astro](https://astro.build/) (static output) and [Vue](https://vuejs.org/) islands, styled with Tailwind v4. A small Python/uv package under `src/` generates Typst-formatted content (publication lists, CV, funding, presentations, etc.) from the same YAML data used by the Astro site. That YAML data has a pydantic schema (`src/data.py`) mirrored by a Zod schema (`site/lib/schemas.ts`) — see "Data model & validation" below before editing `data/*.yml` by hand.

## Repository layout

- `site/` — Astro site source (Astro's own default `src/` is taken by the Python package here, so the app lives under `site/` instead). `pages/` are routes (`.astro`); `layouts/` wraps them; `components/` holds both `.astro` templates and Vue SFCs; `lib/` is the shared TypeScript (data loading, URL/asset helpers, modals, search, icons — each with a co-located `*.test.ts`); `styles/global.css` is the Tailwind theme plus ported rules; `content.config.ts` defines Astro's content-layer collections over `data/*.yml`.
- `data/` — the single database: YAML tables (publications, people, projects, software, presentations, posters, funding, news, activities, editors, panels, teaching, abstracts, meetings, linkedin, plus `tags.yml`/`country_flags.yml` reference tables), validated by both `src/data.py` (pydantic, Python tooling) and `site/lib/schemas.ts` (Zod, the Astro build) — keep the two schemas in sync when adding a field.
- `public/` — static files served as-is at `/...` (`assets/image/`, `assets/pdf/`, `assets/cv/`, favicon).
- `assets_src/` — raster masters of the images; not served, only their `.webp` renditions under `public/assets/image/` are.
- `src/` — standalone Python package (not part of the Astro build). `src/data.py` is the pydantic data model for `data/*.yml` (see below). Each `src/cv/list_of_*.py` script reads one `data/*.yml` file into a pandas DataFrame and renders it to a Typst (`.typ`) file in `src/cv/results/`, e.g. for the CV. Scripts are invoked as modules (`uv run python -m src.cv.list_of_publications`), not via a CLI entrypoint — edit the `selected`/`highlights` sets at the bottom of a script to change what gets included in a given output. Not every `data/*.yml` file has a corresponding generator script.
- `tests/` — pytest suite for `src/data.py` (model validators, cross-reference checks, end-to-end YAML loading). Run via `uv run pytest tests/`; also runs in CI (the `validate` job of `.github/workflows/site.yml`) on every push/PR.
- `e2e/` — Playwright specs (`interactions.spec.ts`, `pages.spec.ts`) using base-relative paths (see `playwright.config.ts`, which derives `baseURL` from the `BASE` env var).
- `nginx/`, `docker-compose*.yml`, `deploy.sh` — self-hosted deployment (see Branches and deployment).
- `scripts/fetch-icons.sh` — downloads the Font Awesome 4 icon set into `site/icons/*.svg` (39 SVGs); `data/tags.yml` keeps the FA4 `icon` names that select among them.
- `science_communication/` — planning notes and strategy documents (not part of the build).

## Data model & validation

`src/data.py` defines a pydantic model for every table in `data/*.yml`, and cross-validates the relationships between them: `people: list[str]` fields (on publications/projects/software/news/teaching/presentations/posters/panels/abstracts) must resolve to real `people.yml` ids, `tags: list[str]` must be tags defined in `tags.yml`, `publications: list[str]` (on projects/software/presentations/panels) must resolve to real `publications.yml` ids, ids must be unique within their table, and referenced image/pdf files must exist under `public/assets/image/`/`public/assets/pdf/` — including `publications.pdf` and `funding.funder_logo` (see `IMAGE_FIELDS` in `src/data.py`).

After **any** manual edit to `data/*.yml`, run:
```bash
uv run python -m src.data
```
This loads and validates all of it, printing every problem found (not just the first) and exiting non-zero on failure — the same check `tests/test_real_data.py` runs in CI, so a bad edit fails the build before merge rather than silently breaking the live site.

The Astro build re-validates the same YAML independently through `site/lib/schemas.ts` (Zod schemas wired into `content.config.ts`'s collection loaders) and fails the build on a dangling `people`/`tags`/`publications` reference — the two schemas must be kept in sync by hand when a field is added or changed.

Astro's content layer does **not** preserve a YAML file's row order (it persists collections sorted alphabetically by id for deterministic build caching). The `yml()` loader in `content.config.ts` injects an `order` field recording each row's original position; `all()` in `site/lib/data.ts` sorts by it and strips it back out before returning, and `getTags()` goes through `toTagInfo()` in `site/lib/views.ts` to do the same for tags. Any new collection that cares about display order must go through `yml()`/`all()` rather than calling `getCollection()` directly.

`site/lib/data.ts`'s `all<K extends keyof CollectionData>(key: K)` infers its return type from `key` alone via a `CollectionData` interface mapping every collection it serves to its schema type — add a new collection there (not as a caller-supplied generic) when adding a `get*()` wrapper.

Field names are unified across tables for the same concept: `people` is always the internal-person-id list (as opposed to `authors`, the free-text bibliographic string with affiliations/superscripts); `tags` always references `tags.yml`; `homepage` is always "this thing's own/associated external URL" (not `project`); `event`/`event_page` is always the conference/meeting a talk/poster/abstract belongs to (not `meeting`/`webpage`); `tenure` is always a free-text period range like `"2020-2025"` (not `year`/`term`, which were ambiguous with the single-year `int` used on bibliographic entries); `role` is a person's list of positions held (not `position`, which on `Publication` means author-order instead). Country flags are looked up from `country_flags.yml` by `person.country` rather than stored per-person.

## UI conventions

- **Static-first islands**: list pages are plain HTML. One Vue SFC per entry type (`PublicationRow`, `ProjectCard`, `PersonCard`, `NewsCard`, `SoftwareCard`, `FundingCard`, `EditorCard`, `MeetingCard`, `PresentationCard`, `PosterCard`, `AbstractCard`, `TeachingCard`, …) plus every modal (`PersonModal`, `ProjectModal`, `NewsModal`) is rendered from the `.astro` page **without** a `client:` directive, so no record is ever serialised a second time into `astro-island` props. Keep it that way: a new card or modal belongs in the page's `.map()`, not in a wrapper island. Only six components hydrate, and only these may take a `client:` directive:
  - `TagFilter.vue` (`client:idle`) — the tag filter bar on publications/projects/news/research/meetings.
  - `ModalRouter.vue` (`client:idle`, in `Base.astro`, renders a hidden span) — installs the one document-level modal router.
  - `PersonAvatar.vue` (`client:visible`) — the hover cards on the homepage people strip and the alumni timeline.
  - `SiteSearch.vue` (`client:idle`) — must be ready for the `/`/Cmd-K shortcut before the user scrolls.
  - `NavToggle.vue` and `CookieConsent.vue` (`client:load`) — interactive immediately on page load.

  Anything rendered statically must not rely on `onMounted`/`onUnmounted`: they never run. `Modal.vue` therefore keeps only its listener wiring for the `open`/`close` emits, which `SiteSearch` (a real island) is the sole user of. `panels`, `activities`, and `linkedin` have collections and schemas but no components or pages — nothing rendered them on the old site either; they feed the Python CV tooling only.
- **Tag filtering**: `data/tags.yml` defines the tag set (with per-tag icon/color); `TagList.vue` renders the badges and `TagFilterBar.vue` the buttons (`#<id>-tag-filter`, `data-tag`, `.active`) that `TagFilter.vue` wraps. `TagFilter` filters the *static DOM*: given `target` (the id of the container holding the cards/rows) it toggles the `hidden` attribute on every `[data-tags]` element inside it, and on every `groupSelector` wrapper (default `.pub-year-group`, the publications year groups) left with no visible item. `?tag=` pre-applies on mount and an unknown tag is ignored; `research.astro` mounts three of them over one `?tag=`. So a filterable card only needs `:data-tags="item.tags.join('|')"` and a container with an id — never an island. Visibility is the `hidden` attribute (Tailwind preflight's `[hidden]{display:none!important}`), never an inline `display`.
- **Person hover cards**: hovering/focusing a `PersonAvatar.vue` (photo wrapped around a `PersonCard.vue` popup with name/position/description) shows a positioned info card, clamped to stay within the viewport. Reused by the homepage people strip and the Team page's alumni timeline — add new instances by reusing `PersonAvatar.vue` rather than duplicating the hover logic.
- **Person chips**: a different, inline pattern — `PersonChips.vue` splices a small avatar + bold name into free-text author/people strings (used on the publications and teaching pages), matching "Initial. Surname" first and falling back to "Given Surname".
- **Detail modals**: native `<dialog class="modal">` elements, managed by one document-level router, `installModalRouter()` in `site/lib/modals.ts` — open one by putting `data-modal-target="<dialog id>"` on the trigger (used by `Modal.vue`/`PersonModal.vue`/`ProjectModal.vue`/`NewsModal.vue` and clickable project/news cards). The dialogs are static HTML and the router is installed exactly once, by `ModalRouter.vue` in `Base.astro`; its single initial hash check is what opens a deep-linked dialog, so no modal re-checks the hash itself; a page loaded with a matching `#<dialog id>` hash opens that modal automatically (used by search results), and a non-dialog `#anchor` instead scrolls to and briefly highlights the target.
- **Links and assets**: every internal link and static-asset reference goes through `url()`/`asset()` in `site/lib/url.ts` so it carries the deploy's base path (`import.meta.env.BASE_URL`, `/` locally, `/livermetabolism-site/` on the interim GitHub Pages URL) — never hand-write a root-relative `href`/`src`.
- **Icons**: `site/icons/*.svg` (Font Awesome 4 names, fetched by `scripts/fetch-icons.sh`), rendered via `<Icon name="globe" />` (`site/components/Icon.vue`, backed by `site/lib/icons.ts`), inlined at build time with the old `fa fa-<name>` classes so the ported CSS keeps matching.
- **Styling**: `site/styles/global.css` — a Tailwind v4 `@theme` plus the hand-ported site rules, layered as `@layer theme, base, components, utilities, overrides;`. No CSS-framework classes beyond what's explicitly re-created (`btn*`, `container`, `modal*`, `navbar*`, …); notably `.container` lives in the `overrides` layer because Tailwind's own built-in `.container` utility would otherwise win and conflict with the site's.
- **Site search**: `site/pages/search.json.ts` builds a JSON index of every `data/*.yml` table plus the static pages at build time; add a new table there if it should be searchable. `SiteSearch.vue` (opened via the navbar icon, `/`, or Cmd/Ctrl+K) scores/filters that index client-side and deep-links into the modal router above.
- **Web manifest**: `site/pages/site.webmanifest.ts` is an Astro endpoint (route derived from the file name, like `search.json.ts` -> `/search.json`) rather than a static file under `public/`, so its `icons[].src` values go through `asset()` and carry the deploy's base path; `Head.astro` links `url('/site.webmanifest')`.

## Commands

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview    # serve dist/
npm run check      # astro check (types)
npm test           # vitest — unit tests live next to the code as site/**/*.test.ts
npm run e2e        # playwright (needs a build); specs in e2e/ use base-relative paths
# Under an AI-agent environment (e.g. Claude Code) `astro preview` backgrounds itself,
# so Playwright's webServer cannot attach: start `npx astro preview --background` first,
# run `npm run e2e` (it reuses the running server), then `npx astro preview stop`.
```

Python package (`src/`) setup and running a generator script:
```bash
uv sync
mkdir -p src/cv/results   # gitignored output dir; the scripts don't create it themselves
uv run python -m src.cv.list_of_publications   # run as a module from the repo root
```
Generator scripts live under `src/cv/` and cross-import each other (e.g. `from src.cv.list_of_software import read_data`), so run them with `-m src.cv.<script>` from the repo root rather than invoking the file directly. Each script resolves `data/*.yml` and its own `src/cv/results/` output directory relative to `Path(__file__)`, so the current working directory doesn't matter.

Validate `data/*.yml` (run after any manual edit) and run the test suite:
```bash
uv run python -m src.data
uv run pytest tests/
```

Typst CV compilation requires the `typst` CLI and local fonts installed (see comment header in `src/cv/cv.py` for font setup); invoked via the `typst` Python package.

## Notable conventions

- Publication entries have a `status` field (`thesis`, `report`, `preprint`, `publication`, `review`, `proceeding`, `chapter`, `abstract`) and a `position` field (`first`, `first_equal`, `index`, `last_equal`, `last`) that drive both the publications page and the Typst generation logic in `src/cv/list_of_publications.py`; both are enums in `src/data.py`'s `Publication` model (and in `site/lib/schemas.ts`'s Zod equivalent). On the site, `status` also selects the `.status-{status}` badge style in `global.css` (`publication` is the solid/prominent one; the rest are muted outline pills).
- `pdf`/`image` fields in `data/*.yml` (e.g. `publications.yml`, `posters.yml`) are paths relative to `public/assets/pdf/`, including the status subfolder (e.g. `'publication/Foo2026_bar.pdf'` → `public/assets/pdf/publication/Foo2026_bar.pdf`); Typst generators build the live PDF link as `https://livermetabolism.com/assets/pdf/{e.pdf}`, and the site does the equivalent via `asset()`.
- Google Analytics only loads after cookie-consent opt-in (`CookieConsent.vue`, gated by a `gaId` prop passed from `site/layouts/Base.astro`) — never add another third-party/tracking script unconditionally; gate it the same way. `site/pages/impressum.astro`/`privacy.astro` document what's actually collected, so update them if that changes.
- **Content-Security-Policy**: `astro.config.mjs`'s `security.csp` renders a per-page `<meta http-equiv="content-security-policy">`; Astro hashes its own bundled/inline scripts and styles (including the Vue island hydration runtime) automatically, so only third-party hosts need to be listed in `directives`/`scriptDirective.resources`/`styleDirective.resources` by hand — add any new one there. `style-src` includes `'unsafe-inline'` because `PersonAvatar.vue` sets a runtime `transform` inline style (viewport-clamping its hover card) whose value can't be pre-hashed; `script-src` must never get `'unsafe-inline'`.
- **GitHub Pages size caveat**: `public/assets/pdf` is about 871 MB, against GitHub Pages' 1 GB per-site limit — be mindful of this when adding large PDFs (posters, theses).

## Branches and deployment

`main` is protected by a repository ruleset (pull requests only, linear history, squash or rebase merges, required status checks `validate` and `build`); there is no `develop` branch — work on a topic branch and open a PR against `main`. `.github/workflows/site.yml` runs on every push and PR: `validate` (Python: pytest + `src.data`), then `build` (Node: `astro check`, vitest, `astro build`, Playwright e2e against the built site), then — only on a push to `main`, not on a PR — `deploy`, which publishes `dist/` to GitHub Pages via `actions/deploy-pages`. The build currently targets the interim project-pages URL (`SITE=https://matthiaskoenig.github.io`, `BASE=/livermetabolism-site/`); switching to the custom domain means changing those two env vars to `SITE=https://livermetabolism.com`/`BASE=/`, adding `public/CNAME`, and configuring the domain in the repository's Pages settings.

Two deployment paths exist and must both keep working: GitHub Pages (`.github/workflows/site.yml`, base path `/livermetabolism-site/` until the domain moves) and the self-hosted nginx container (`docker-compose.yml` serves `dist/` built by `docker-compose-build.yml` with `SITE=https://livermetabolism.com`, `BASE=/`; `deploy.sh` runs both on the server; `nginx/` holds the container config plus the host reverse-proxy/SSL configs). `docker-compose-serve.yml` is the containerised `npm run dev`. `dist/` is gitignored and built on the server.
