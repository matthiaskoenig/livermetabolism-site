# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static site source for the König research group site (https://www.livermetabolism.com/), built with Jekyll. A small Python/uv package under `src/` generates Typst-formatted content (publication lists, CV, funding, presentations, etc.) from the same YAML data used by the Jekyll site.

## Repository layout

- `app/` — Jekyll site source (`source: app` in `_config.yml`). Pages are `.html` files at the top level; `_data/*.yml` holds structured content (publications, people, presentations, posters, funding, projects, software, news, activities, editors, panels, teaching); `_includes/`, `_layouts/`, `_sass/`, `_docs/` follow standard Jekyll conventions from the Jekyll Doc Theme.
- `web/` — Jekyll build output (`destination: web`), gitignored. Served by nginx in production.
- `src/` — standalone Python package (not part of the Jekyll build). Each `list_of_*.py` script reads one `app/_data/*.yml` file into a pandas DataFrame and renders it to a Typst (`.typ`) file in `src/results/`, e.g. for the CV. Scripts are run directly (`if __name__ == "__main__"`), not via a CLI entrypoint — edit the `selected`/`highlights` sets at the bottom of a script to change what gets included in a given output.
- `nginx/` — nginx config used on the production server, referenced in `docker-compose-serve.yml`/deployment.

## Working with site content

Most day-to-day edits are to `app/_data/*.yml` (add a publication, person, news item, etc.) or to the `.html` pages/`_includes` in `app/`. Changes to `src/*.py` outputs (e.g. CV, selected-publications Typst) only matter when regenerating those derived documents.

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

Typst CV compilation requires the `typst` CLI and local fonts installed (see comment header in `src/cv.py` for font setup); invoked via the `typst` Python package.

## Notable conventions

- Jekyll version is pinned (`jekyll 3.8.6`) with `ffi < 1.17.0` pinned in the Gemfile as a compatibility fix — don't bump these without checking the Docker image tag in the compose files matches.
- `_config.yml` defines two collections: `docs` (`/docs/:path/`) and `posts` (`/blog/:year/:month/:day/:title/`).
- Publication entries have a `status` field (`thesis`, `report`, `preprint`, `publication`, `review`, `proceeding`, `chapter`) and a `position` field (`first`, `first_equal`, `index`, `last_equal`, `last`) that drive both the Jekyll publications page and the Typst generation logic in `src/list_of_publications.py`.
