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
| `site/` | Astro source: `pages/`, `layouts/`, `components/` (`.astro` templates and Vue single-file components, rendered statically; `TagFilter`/`PersonAvatar` hydrate), `lib/`, `styles/`, `content.config.ts` |
| `src/` | `uv`-managed Python package; `src/data.py` is the pydantic schema of the YAML, `src/cv/list_of_*.py` render tables to Typst |
| `tests/` | Pytest suite for `src/data.py` |
| `e2e/` | Playwright end-to-end tests |
| `science_communication/` | Planning notes (not part of the build) |

See [`CLAUDE.md`](./CLAUDE.md) for a more detailed guide to the codebase and data model.

## Local development

```bash
npm install
npm run dev        # http://localhost:4321 (or: docker compose -f docker-compose-serve.yml up)
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

## Live GitHub data

`scripts/fetch-github.ts` collects stars, releases, the latest commit and the weekly commit activity of every repository listed in `data/software.yml` and writes them as one snapshot, `github.json`. The workflow `.github/workflows/github-data.yml` runs it daily (05:00 UTC, plus manual dispatch) and commits the result to the orphan branch [`github-data`](https://github.com/matthiaskoenig/livermetabolism-site/tree/github-data), from where the site reads it — at build time and again in the browser — so the numbers stay current without a redeploy. Run it locally with a token (the file is gitignored):

```bash
GITHUB_TOKEN=$(gh auth token) npm run fetch:github -- github.json
```

## Branches and deployment

`main` is protected (ruleset "main": pull requests only, linear history, squash or rebase merges, required checks `validate` and `build`). Work on a branch and open a pull request.

The site has two deployment paths:

**GitHub Pages** (automatic): merging to `main` builds and deploys through `.github/workflows/site.yml`. Domain switch: set `SITE`/`BASE` in the workflow, add `public/CNAME`, configure the domain in the repository's Pages settings.

**Self-hosted with nginx** (Docker): the same site served by an `nginx` container behind the host's reverse proxy.

```bash
docker compose -f docker-compose-build.yml run --rm -T site   # build dist/ in a node container
docker compose up -d                                          # serve dist/ with nginx on port 80
docker compose down                                           # stop
```

On the production host, `./deploy.sh` does all of that (pull, build, restart nginx). A local test can bind another port: `NGINX_PORT=8080 docker compose up -d`. The host-level nginx reverse proxy and certificate configs live in `nginx/` (`livermetabolism.com`, `nginx_ssl.conf`, `ssl.conf`); the container's own config is `nginx/nginx.conf`.

Initial server setup and certificates:

```bash
sudo cp -v nginx/livermetabolism.com /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/livermetabolism.com /etc/nginx/sites-enabled/
sudo mkdir -p /usr/share/nginx/letsencrypt
sudo certbot certonly --webroot -w /usr/share/nginx/letsencrypt -d livermetabolism.com -d www.livermetabolism.com -d livermetabolism.de -d www.livermetabolism.de -d www.pharma-twin.eu -d pharma-twin.eu -d www.pharma-twin.de -d pharma-twin.de -d www.perfect-kid.eu -d perfect-kid.eu --dry-run
sudo certbot renew --dry-run   # renewal
```

## Releases

1. bump the version in `package.json` and `pyproject.toml` (and run `uv lock`, which records it), keeping the two in sync;
2. write the release notes for the new version in `release-notes/<version>.md` (sbmlutils style: breaking changes, features, fixes, …);
3. merge all of that to `main` through a pull request;
4. tag the merge commit and push the tag:

```bash
git tag 0.5.0 && git push origin 0.5.0
```

`.github/workflows/release.yml` then creates the GitHub release with `release-notes/<tag>.md` as its body, after checking that the tag matches both version fields and that the notes exist.

Tags carry **no** `v` prefix (`0.5.0`, not `v0.5.0`; the old `v0.1.0` tag predates this convention). The footer of the deployed site shows the version and the commit it was built from, linking to the release and to the commit on GitHub.

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
