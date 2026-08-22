# livermetabolism-site

Source code and content for the König research group site at [https://www.livermetabolism.com/](https://www.livermetabolism.com/) — a static site built with [Jekyll](https://jekyllrb.com/) using the [Jekyll Doc Theme](https://aksakalli.github.io/jekyll-doc-theme/).

Structured content (publications, people, projects, software, news, funding, …) lives in `app/_data/*.yml` and is validated against a shared [pydantic](https://docs.pydantic.dev/) schema. A small Python package under `src/` reuses that same YAML data to generate Typst-formatted documents (CV, selected-publications list, etc.).

**Bug Tracker**: https://github.com/matthiaskoenig/livermetabolism-site/issues

## Repository layout

| Path | Contents |
|---|---|
| `app/` | Jekyll site source (`source: app` in `_config.yml`). Top-level `.html` pages, `_data/*.yml` structured content, `_includes/`/`_layouts/`/`_sass/` templates, `assets/` (images, PDFs, CV, presentations) |
| `web/` | Jekyll build output (`destination: web`, gitignored), served by nginx in production |
| `src/` | Standalone `uv`-managed Python package; `src/data.py` is the pydantic data model, `src/cv/list_of_*.py` scripts render `app/_data/*.yml` tables to Typst |
| `tests/` | Pytest suite for `src/data.py` (also run in CI on every push/PR) |
| `nginx/` | nginx config used on the production server |
| `science_communication/` | Planning notes and strategy documents (not part of the build) |

See [`CLAUDE.md`](./CLAUDE.md) for a more detailed guide to the codebase and data model.

## Local development

Run the Jekyll dev server (site available at `localhost:4000`, auto-rebuilds on change):

```bash
docker compose -f docker-compose-serve.yml up
```

Production-style build, written to `web/`:

```bash
docker compose -f docker-compose-build.yml up
```

Serve the built `web/` output via nginx:

```bash
docker compose up --build -d
```

## Editing content

Most day-to-day edits are to `app/_data/*.yml` (add a publication, person, news item, …) or to the `.html` pages/`_includes` under `app/`.

After **any** manual edit to `app/_data/*.yml`, validate it:

```bash
uv sync
uv run python -m src.data
```

This loads and cross-checks every table (person/tag/publication references, unique ids, referenced image/PDF files under `app/assets/`), printing every problem it finds and exiting non-zero on failure. The same check runs in CI (`.github/workflows/validate-data.yml`) on every push and PR, alongside the test suite:

```bash
uv run pytest tests/
```

## Python package (`src/`)

Generates Typst-formatted documents (CV, selected publications, funding, presentations, …) from the same `app/_data/*.yml` used by the Jekyll site.

```bash
uv sync
uv run python src/cv/list_of_publications.py
```

Scripts are run directly, not via a CLI entrypoint — edit the `selected`/`highlights` sets at the bottom of a script to change what's included in a given output. Compiling the CV itself additionally requires the `typst` CLI and local fonts (see the comment header in `src/cv/cv.py`).

## Deployment

```bash
sudo cp -v /var/git/livermetabolism-site/nginx/livermetabolism.com /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/livermetabolism.com /etc/nginx/sites-enabled/
sudo service nginx status
```

### HTTPS certificates

Initial certificates & renewal:

```bash
# access server
ssh denbi-head

sudo mkdir -p /usr/share/nginx/letsencrypt
sudo certbot certonly --webroot -w /usr/share/nginx/letsencrypt -d livermetabolism.com -d www.livermetabolism.com -d livermetabolism.de -d www.livermetabolism.de -d www.pharma-twin.eu -d pharma-twin.eu -d www.pharma-twin.de -d pharma-twin.de -d www.perfect-kid.eu -d perfect-kid.eu --dry-run
```

Renew certificates:

```bash
sudo certbot renew --dry-run
```

### Update site

Connect to server:

```bash
ssh denbi-node-7
```

Initial setup:

```bash
# download code
mkdir ~/git
cd ~/git
git clone https://github.com/matthiaskoenig/livermetabolism-site.git
cd livermetabolism-site
mkdir web
sudo chown $USER:$USER web
```

Update the page (pulls, rebuilds, restarts nginx):

```bash
ssh denbi-node-7
cd ~/git/livermetabolism-site
./deploy.sh
```

## License

* Source Code: [MIT](https://opensource.org/licenses/mit)
* Documentation: [CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/)

----
&copy; 2016-2026 Matthias König.
