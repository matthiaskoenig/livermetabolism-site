# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static site source for the König research group site (https://www.livermetabolism.com/), built with Jekyll. A small Python/uv package under `src/` generates Typst-formatted content (publication lists, CV, funding, presentations, etc.) from the same YAML data used by the Jekyll site. That YAML data has a pydantic schema (`src/data.py`) — see "Data model & validation" below before editing `app/_data/*.yml` by hand.

## Repository layout

- `app/` — Jekyll site source (`source: app` in `_config.yml`). Pages are `.html` files at the top level; `_data/*.yml` holds structured content (publications, people, projects, software, presentations, posters, funding, news, activities, editors, panels, teaching, abstracts, linkedin, plus `tags` and `country_flags` reference tables); `_includes/`, `_layouts/`, `_sass/` follow standard Jekyll conventions from the Jekyll Doc Theme; `assets/` holds static files (`cv/`, `image/`, `pdf/`, `presentations/`) served at `/assets/...`.
- `web/` — Jekyll build output (`destination: web`), gitignored. Served by nginx in production.
- `src/` — standalone Python package (not part of the Jekyll build). `src/data.py` is the pydantic data model for `app/_data/*.yml` (see below). Each `list_of_*.py` script reads one `app/_data/*.yml` file into a pandas DataFrame and renders it to a Typst (`.typ`) file in `src/results/`, e.g. for the CV. Scripts are run directly (`if __name__ == "__main__"`), not via a CLI entrypoint — edit the `selected`/`highlights` sets at the bottom of a script to change what gets included in a given output. Not every `_data/*.yml` file has a corresponding generator script.
- `tests/` — pytest suite for `src/data.py` (model validators, cross-reference checks, end-to-end YAML loading). Run via `uv run pytest tests/`; also runs in CI (`.github/workflows/validate-data.yml`) on every push/PR.
- `nginx/` — nginx config used on the production server, referenced in `docker-compose-serve.yml`/deployment.
- `science_communication/` — planning notes and strategy documents (not part of the build).

## Data model & validation

`src/data.py` defines a pydantic model for every table in `app/_data/*.yml`, and cross-validates the relationships between them: `people: list[str]` fields (on publications/projects/software/news/teaching/presentations/posters/panels/abstracts) must resolve to real `people.yml` ids, `tags: list[str]` must be tags defined in `tags.yml`, `publications: list[str]` (on projects/software/presentations/panels) must resolve to real `publications.yml` ids, ids must be unique within their table, and referenced image/pdf files must exist under `app/assets/image/`/`app/assets/pdf/`.

After **any** manual edit to `app/_data/*.yml`, run:
```bash
uv run python -m src.data
```
This loads and validates all of it, printing every problem found (not just the first) and exiting non-zero on failure — the same check `tests/test_real_data.py` runs in CI, so a bad edit fails the build before merge rather than silently breaking the live site.

Field names are unified across tables for the same concept: `people` is always the internal-person-id list (as opposed to `authors`, the free-text bibliographic string with affiliations/superscripts); `tags` always references `tags.yml`; `homepage` is always "this thing's own/associated external URL" (not `project`); `event`/`event_page` is always the conference/meeting a talk/poster/abstract belongs to (not `meeting`/`webpage`); `tenure` is always a free-text period range like `"2020-2025"` (not `year`/`term`, which were ambiguous with the single-year `int` used on bibliographic entries); `role` is a person's list of positions held (not `position`, which on `Publication` means author-order instead). Country flags are looked up from `country_flags.yml` by `person.country` rather than stored per-person.

## Working with site content

Most day-to-day edits are to `app/_data/*.yml` (add a publication, person, news item, etc.) or to the `.html` pages/`_includes` in `app/`. Changes to `src/*.py` outputs (e.g. CV, selected-publications Typst) only matter when regenerating those derived documents.

## UI conventions

- **Tag filtering**: `_data/tags.yml` defines the tag set (with per-tag icon/color); `.tag-filter`/`.tag-filter-btn` and `.tag-list`/`.tag-badge` (in `main.scss`) are the shared filter-bar and badge components reused across `projects.html`, `publications.html` (`tags` lives directly on each publication entry), and the software cards on `research.html`.
- **Person hover cards**: hovering/focusing a `.person-avatar` (photo wrapped around a `.person-card` popup with name/position/description) shows a positioned info card, clamped to stay within the viewport. The behavior lives once in `app/js/main.js` and is reused by the homepage people-strip and the Team page's alumni timeline — add new instances by reusing this markup/class pattern rather than duplicating the JS.
- **Person chips**: a different, inline pattern — `.person-chip` splices a small avatar + bold name into free-text author/people strings (used in `publications.html` and `teaching.html`), matching "Initial. Surname" first and falling back to "Given Surname".

## Commands

Run Jekyll dev server (site available at `localhost:4000`):
```bash
docker compose -f docker-compose-serve.yml up
```

Production-style build (writes to `web/`):
```bash
docker compose -f docker-compose-build.yml up
```

Serve the built `web/` output via nginx:
```bash
docker compose up --build -d
```

Deploy on the production host (pulls, rebuilds, restarts nginx):
```bash
./deploy.sh
```

Python package (`src/`) setup and running a generator script:
```bash
uv sync
uv run python src/list_of_publications.py   # run from src/, writes to results/ relative to cwd
```
Note the generator scripts write to a relative `results/` path, so run them with `src/` as the working directory (`cd src && uv run python list_of_publications.py`).

Validate `app/_data/*.yml` (run after any manual edit) and run the test suite:
```bash
uv run python -m src.data
uv run pytest tests/
```

Typst CV compilation requires the `typst` CLI and local fonts installed (see comment header in `src/cv.py` for font setup); invoked via the `typst` Python package.

## Notable conventions

- Jekyll version is pinned (`jekyll 4.4.1`, Ruby/Dart-Sass toolchain via `jekyll-sass-converter` 3.x) in the Gemfile — keep it in sync with the `jekyll/jekyll` image tag in the compose files when bumping either. `Gemfile.lock` is regenerated by `bundle install` on each container start (gitignored, not committed). The `jekyll/jekyll` image no longer auto-runs `bundle install` on `docker compose up` (its entrypoint changed upstream), so the compose `command:` explicitly runs `bundle install && bundle exec jekyll ...`.
- No `_posts`/collections are defined or used — content lives entirely in the top-level `.html` pages and `_data/*.yml`, not in a blog/docs collection.
- Publication entries have a `status` field (`thesis`, `report`, `preprint`, `publication`, `review`, `proceeding`, `chapter`, `abstract`) and a `position` field (`first`, `first_equal`, `index`, `last_equal`, `last`) that drive both the Jekyll publications page and the Typst generation logic in `src/list_of_publications.py`; both are enums in `src/data.py`'s `Publication` model. On the site, `status` also selects the `.status-{status}` badge style in `main.scss` (`publication` is the solid/prominent one; the rest are muted outline pills).
