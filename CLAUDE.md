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
- `tests/` — pytest suite for `src/data.py` (model validators, cross-reference checks, end-to-end YAML loading). Run via `uv run pytest tests/`; also runs in CI (`.github/workflows/validate-data.yml` and the `validate` job of `.github/workflows/site.yml`) on every push/PR.
- `e2e/` — Playwright specs (`interactions.spec.ts`, `pages.spec.ts`) using base-relative paths (see `playwright.config.ts`, which derives `baseURL` from the `BASE` env var).
- `scripts/fetch-icons.sh` — downloads the Font Awesome 4 icon set into `site/icons/*.svg` (39 SVGs); `data/tags.yml` keeps the FA4 `icon` names that select among them.
- `science_communication/` — planning notes and strategy documents (not part of the build).

## Data model & validation

`src/data.py` defines a pydantic model for every table in `data/*.yml`, and cross-validates the relationships between them: `people: list[str]` fields (on publications/projects/software/news/teaching/presentations/posters/panels/abstracts) must resolve to real `people.yml` ids, `tags: list[str]` must be tags defined in `tags.yml`, `publications: list[str]` (on projects/software/presentations/panels) must resolve to real `publications.yml` ids, ids must be unique within their table, and referenced image/pdf files must exist under `public/assets/image/`/`public/assets/pdf/`.

After **any** manual edit to `data/*.yml`, run:
```bash
uv run python -m src.data
```
This loads and validates all of it, printing every problem found (not just the first) and exiting non-zero on failure — the same check `tests/test_real_data.py` runs in CI, so a bad edit fails the build before merge rather than silently breaking the live site.

The Astro build re-validates the same YAML independently through `site/lib/schemas.ts` (Zod schemas wired into `content.config.ts`'s collection loaders) and fails the build on a dangling `people`/`tags`/`publications` reference — the two schemas must be kept in sync by hand when a field is added or changed.

Astro's content layer does **not** preserve a YAML file's row order (it persists collections sorted alphabetically by id for deterministic build caching). The `yml()` loader in `content.config.ts` injects an `order` field recording each row's original position; `all()` in `site/lib/data.ts` sorts by it and strips it back out before returning, and `getTags()` goes through `toTagInfo()` in `site/lib/views.ts` to do the same for tags. Any new collection that cares about display order must go through `yml()`/`all()` rather than calling `getCollection()` directly.

Field names are unified across tables for the same concept: `people` is always the internal-person-id list (as opposed to `authors`, the free-text bibliographic string with affiliations/superscripts); `tags` always references `tags.yml`; `homepage` is always "this thing's own/associated external URL" (not `project`); `event`/`event_page` is always the conference/meeting a talk/poster/abstract belongs to (not `meeting`/`webpage`); `tenure` is always a free-text period range like `"2020-2025"` (not `year`/`term`, which were ambiguous with the single-year `int` used on bibliographic entries); `role` is a person's list of positions held (not `position`, which on `Publication` means author-order instead). Country flags are looked up from `country_flags.yml` by `person.country` rather than stored per-person.

## UI conventions

- **Components**: one Vue SFC per entry type (`PublicationRow`, `ProjectCard`, `PersonCard`, `NewsCard`, `SoftwareCard`, `FundingCard`, `EditorCard`, `MeetingCard`, `PresentationCard`, `PosterCard`, `AbstractCard`, `TeachingCard`, …), used statically (no `client:` directive) from `.astro` pages wherever no interactivity is needed. Only the section islands are hydrated, and only with `client:idle` — `*Section.vue` (`ProjectsSection`, `PublicationsSection`, `NewsSection`, `SoftwareSection`, `FundingSection`, `EditorsSection`, `MeetingsSection`), `PersonModals.vue`, `PersonAvatar.vue`, `SiteSearch.vue` — except `NavToggle.vue` and `CookieConsent.vue`, which use `client:load` since they must be interactive immediately on page load. `panels`, `activities`, and `linkedin` have collections and schemas but no components or pages — nothing rendered them on the old site either; they feed the Python CV tooling only.
- **Tag filtering**: `data/tags.yml` defines the tag set (with per-tag icon/color); `TagFilterBar.vue`/`TagList.vue` are the shared filter-bar and badge components, reused wherever a `*Section.vue` island filters by tag (projects, publications, software cards on the research page).
- **Person hover cards**: hovering/focusing a `PersonAvatar.vue` (photo wrapped around a `PersonCard.vue` popup with name/position/description) shows a positioned info card, clamped to stay within the viewport. Reused by the homepage people strip and the Team page's alumni timeline — add new instances by reusing `PersonAvatar.vue` rather than duplicating the hover logic.
- **Person chips**: a different, inline pattern — `PersonChips.vue` splices a small avatar + bold name into free-text author/people strings (used on the publications and teaching pages), matching "Initial. Surname" first and falling back to "Given Surname".
- **Detail modals**: native `<dialog class="modal">` elements, managed by one document-level router, `installModalRouter()` in `site/lib/modals.ts` — open one by putting `data-modal-target="<dialog id>"` on the trigger (used by `Modal.vue`/`PersonModal.vue`/`ProjectModal.vue`/`NewsModal.vue`, opened by `PersonModals.vue` and clickable project/news cards); a page loaded with a matching `#<dialog id>` hash opens that modal automatically (used by search results), and a non-dialog `#anchor` instead scrolls to and briefly highlights the target.
- **Links and assets**: every internal link and static-asset reference goes through `url()`/`asset()` in `site/lib/url.ts` so it carries the deploy's base path (`import.meta.env.BASE_URL`, `/` locally, `/livermetabolism-site/` on the interim GitHub Pages URL) — never hand-write a root-relative `href`/`src`.
- **Icons**: `site/icons/*.svg` (Font Awesome 4 names, fetched by `scripts/fetch-icons.sh`), rendered via `<Icon name="globe" />` (`site/components/Icon.vue`, backed by `site/lib/icons.ts`), inlined at build time with the old `fa fa-<name>` classes so the ported CSS keeps matching.
- **Styling**: `site/styles/global.css` — a Tailwind v4 `@theme` plus the hand-ported site rules, layered as `@layer theme, base, components, utilities, overrides;`. No CSS-framework classes beyond what's explicitly re-created (`btn*`, `container`, `modal*`, `navbar*`, …); notably `.container` lives in the `overrides` layer because Tailwind's own built-in `.container` utility would otherwise win and conflict with the site's.
- **Site search**: `site/pages/search.json.ts` builds a JSON index of every `data/*.yml` table plus the static pages at build time; add a new table there if it should be searchable. `SiteSearch.vue` (opened via the navbar icon, `/`, or Cmd/Ctrl+K) scores/filters that index client-side and deep-links into the modal router above.

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
- **GitHub Pages size caveat**: `public/assets/pdf` is about 871 MB, against GitHub Pages' 1 GB per-site limit — be mindful of this when adding large PDFs (posters, theses).

## Branches and deployment

`main` is protected by a repository ruleset (pull requests only, linear history, squash or rebase merges, required status checks `validate` and `build`); there is no `develop` branch — work on a topic branch and open a PR against `main`. `.github/workflows/site.yml` runs on every push and PR: `validate` (Python: pytest + `src.data`), then `build` (Node: `astro check`, vitest, `astro build`, Playwright e2e against the built site), then — only on a push to `main`, not on a PR — `deploy`, which publishes `dist/` to GitHub Pages via `actions/deploy-pages`. The build currently targets the interim project-pages URL (`SITE=https://matthiaskoenig.github.io`, `BASE=/livermetabolism-site/`); switching to the custom domain means changing those two env vars to `SITE=https://livermetabolism.com`/`BASE=/`, adding `public/CNAME`, and configuring the domain in the repository's Pages settings. `.github/workflows/validate-data.yml` still runs the Python-only validation independently of `site.yml`.
