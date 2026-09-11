# livermetabolism-site

Source code and content for the König research group site at [https://www.livermetabolism.com/](https://www.livermetabolism.com/) — a static site built with [Astro](https://astro.build/) and Vue.

Structured content (publications, people, projects, software, news, funding, …) lives in `data/*.yml` and is validated against a shared [pydantic](https://docs.pydantic.dev/) schema. A small Python package under `src/` reuses that same YAML data to generate Typst-formatted documents (CV, selected-publications list, etc.).

**Bug Tracker**: https://github.com/matthiaskoenig/livermetabolism-site/issues

## Repository layout

| Path | Contents |
|---|---|
| `data/` | The YAML tables (publications, people, projects, …) — the single database for the site and the Python tooling |
| `public/` | Static files served as-is (`/assets/...`, favicon) |
| `assets_src/` | Raster masters of the images; not served (only the `.webp` renditions in `public/` are) |
| `site/` | Astro source: `pages/`, `layouts/`, `components/` (Vue), `lib/`, `styles/`, `content.config.ts` |
| `src/` | `uv`-managed Python package; `src/data.py` is the pydantic schema of the YAML, `src/cv/list_of_*.py` render tables to Typst |
| `tests/` | Pytest suite for `src/data.py` |
| `e2e/` | Playwright end-to-end tests |
| `science_communication/` | Planning notes (not part of the build) |

See [`CLAUDE.md`](./CLAUDE.md) for a more detailed guide to the codebase and data model.

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

## Python package (`src/`)

Generates Typst-formatted documents (CV, selected publications, funding, presentations, …) from the same `data/*.yml` used by the site.

```bash
uv sync
mkdir -p src/cv/results   # gitignored output dir; the scripts don't create it themselves
uv run python -m src.cv.list_of_publications
```

Scripts cross-import each other, so run them as modules (`-m src.cv.<script>`) from the repo root rather than invoking the file directly — not via a CLI entrypoint either. Edit the `selected`/`highlights` sets at the bottom of a script to change what's included in a given output. Compiling the CV itself additionally requires the `typst` CLI and local fonts (see the comment header in `src/cv/cv.py`).

## License

* Source Code: [MIT](https://opensource.org/licenses/mit)
* Documentation: [CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/)

----
&copy; 2016-2026 Matthias König.
