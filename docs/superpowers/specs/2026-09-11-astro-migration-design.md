# Jekyll to Astro migration: design

Date: 2026-09-11
Status: approved design, awaiting implementation plan

## Goal

Replace the Jekyll build of https://livermetabolism.com with an Astro site that
reproduces every page, URL, interaction, and visual of the current site, drops
Bootstrap and all other legacy frontend technology, and deploys to GitHub Pages
from GitHub Actions. No visitor-facing feature is added, removed, or changed in
this step. New capabilities (interactive statistics, MDX content, image
pipeline, more personal profiles) are separate follow-up projects.

## Decisions

| Topic | Decision |
|---|---|
| Framework | Astro, static output, current stable release |
| Styling | Tailwind v4 via the Vite plugin; Bootstrap, Bootswatch, Sass removed |
| Interactivity | Vue 3 islands through Astro's Vue integration; all existing JS retired |
| Icons | Inline SVG `Icon` component built from the Font Awesome free set; the hosted Font Awesome kit script is removed |
| Fonts | Google Fonts links kept as today |
| Data | YAML in `data/` stays the single database; pydantic (`src/data.py`) stays the schema of record; Astro content collections with mirrored Zod schemas |
| Repo | Same repository, migrated in place; Jekyll files deleted at the end |
| Hosting | GitHub Pages via GitHub Actions; interim URL under `matthiaskoenig.github.io/livermetabolism-site/`, custom domain attached afterwards |
| Branches | Default branch renamed `master` to `main`; `develop` deleted; ruleset on `main` mirroring the `develop` ruleset of pymetadata/sbmlutils |
| PDFs | Stay in the repository for now; the GitHub Pages 1 GB limit is a recorded risk, see Follow-ups |

## Repository layout after migration

```
astro.config.mjs, package.json, package-lock.json, tsconfig.json
data/*.yml                 17 YAML tables, moved from app/_data
public/assets/…            moved from app/assets; served at /assets/… unchanged
public/favicon.ico
assets_src/image/…         png/jpg/gif masters, moved out of the served tree
site/                      Astro source (astro.config: srcDir "site")
  content.config.ts        collections and Zod schemas
  layouts/Base.astro
  pages/                   index, projects, publications, people, research,
                           meetings, news, teaching, cv, impressum, privacy,
                           404, search.json.ts
  components/              static .astro components and .vue islands
  lib/                     typed data views and helpers
  styles/global.css        Tailwind import, theme tokens, component styles
src/, tests/               Python package, unchanged except data paths
site/**/*.test.ts          Vitest unit tests, colocated with the code under test
e2e/                       Playwright end-to-end tests and the screenshot script
.github/workflows/         validate-data.yml (kept), site.yml (new)
docs/superpowers/specs/    this document
science_communication/     unchanged
```

Deleted: `app/` (after all content is ported), `_config.yml`, `Gemfile`,
`Gemfile.lock`, `docker-compose*.yml`, `deploy.sh`, `nginx/`, `web/`.

`srcDir` is set to `site/` because Astro's default `src/` collides with the
Python package `src/`, and renaming the package would change every
`python -m src.…` command, test, and CI step.

The raster masters (275 files, about 80 MB) are referenced by no page and no
YAML entry; only `.webp` renditions and one SVG are. They move to
`assets_src/` so nothing ships them, which is what Jekyll's `exclude` list does
today.

`.gitignore` drops `web`, `Gemfile.lock`, `.sass-cache`, `app/vendor/` and adds
`dist/`, `node_modules/`, `.astro/`.

## Data layer

### Collections

`site/content.config.ts` defines one collection per list-shaped YAML table using
Astro's built-in `file()` loader on `data/<table>.yml`: people, publications,
projects, software, news, teaching, presentations, posters, abstracts, panels,
funding, editors, activities, meetings, linkedin, tags. Every entry already has
a unique `id`, used as the entry key. `country_flags.yml` is a map, not a list,
and is imported directly as a typed object.

### Schemas

Each collection has a Zod schema mirroring the pydantic model field for field:

- same literal enums (`PublicationStatus`, `AuthorPosition`, `TalkType`,
  `PanelType`, `SoftwareType`, `TeachingType`, `PersonStatus`,
  `ContentStatus`, `FundingRole`);
- `null` normalised to an empty list for `tags`, `people`, `publications`,
  `keywords`, `role`, `images`, `type`;
- unknown keys rejected (`.strict()`), matching `StrictModel`;
- `people`, `tags`, `publications` declared with Astro's `reference()` so a
  dangling id fails the build.

File-existence checks for images and PDFs are not duplicated in Zod; the
pydantic loader covers them and runs before every build in CI.

### Data views

`site/lib/data.ts` wraps `getCollection()` with the derived views the pages
need, replacing the Liquid `where`/`sort`/`group_by` chains in templates:
people by status and tenure, publications grouped by year and ordered by date,
tag lookups, person lookup by id, entries per tag for the homepage counts.
This module is the only place data logic lives; pages and components receive
plain typed arrays.

### Python side

`DATA_DIR` in `src/data.py` and the seven `Path(__file__)…` expressions in
`src/cv/*.py` point at `data/` instead of `app/_data/`. The `app_dir` context
used for image and PDF existence checks points at `public/assets/`. Docstrings,
`CLAUDE.md`, `README.md`, and the CI step names are updated. Nothing else in
the Python package changes.

## Pages and components

### Layout

`Base.astro` replaces `default.html` and `page.html`. It renders head, navbar,
the page slot, footer, cookie banner, search modal, and takes `title` and
`sectionid` props. The `onepager` class on the root element of the homepage is
kept because the stylesheet keys on it.

Head reproduces what `jekyll-seo-tag` emits: `<title>`, description,
canonical, Open Graph, Twitter card meta, plus the favicon set and Google
Fonts links. The RSS `<link>` is dropped (there are no posts and the feed was
empty).

### Pages

One `.astro` file per page, same URLs: `/`, `/projects/`, `/publications/`,
`/people/`, `/research/`, `/meetings/`, `/news/`, `/teaching/`, `/cv/`,
`/impressum/`, `/privacy/`, `/404`. Anchor ids inside pages (`#pub-<id>`,
`#presentation-<id>`, `#poster-<id>`, `#abstract-<id>`, `#project-<id>`,
`#current-members`, `#open-positions`, `#alumni`, `#software`, `#funding`,
`#editors`, tag slugs on the homepage) are preserved because search results,
navbar dropdowns, and homepage links target them.

`site/pages/search.json.ts` is an Astro endpoint producing the same record
shape as today's Liquid `search.json`: `{type, title, text, url}` per entry,
for every table and static page currently indexed. Sitemap from
`@astrojs/sitemap`.

### Components

Static `.astro` components replace the includes: `Head`, `TopNav`, `Footer`,
`TagFilter` (static shell, see islands), `PersonChips`, `Icon`.

One component per YAML entry type, taking the typed collection entry as its
prop: `PublicationRow`, `PersonCard`, `ProjectCard`, `SoftwareCard`,
`PresentationCard`, `PosterCard`, `AbstractCard`, `FundingCard`,
`EditorCard`, `NewsCard`, `TeachingCard`, `MeetingCard`, `PanelRow`,
`ActivityRow`. Pages compose these; no card markup is duplicated between
pages. Entry-type components that appear inside a filtered list
(publications, projects, software) exist as `.vue` so `TagFilter` can render
them; the `.astro` variant is used where the same type renders statically.
Both variants share class names and structure.

Liquid helpers move to `site/lib/`: `slugify`, chip name matching
("Initial. Surname" first, then "Given Surname"), date formatting, tag slug
and colour lookups.

### Bootstrap markup

`container`/`row`/`col-*`, `btn*`, `badge`, `text-*`, `img-fluid`, `lead`,
and the modal/navbar/collapse/dropdown structures are replaced by semantic
elements with Tailwind utilities and the site's own component classes. Modals
are native `<dialog>` elements with the same ids (`#person-modal-<id>`,
`#project-modal-<id>`, `#news-modal-<id>`, `#site-search-modal`).

### Icons

`Icon.astro` takes a `name` prop and inlines the SVG path for that glyph from
a small map of the roughly twenty Font Awesome free icons the site uses
(search, globe, github, orcid, file-pdf, the five tag icons from `tags.yml`,
chevrons, close, external link, and the social icons in the footer). The
`icon` field in `tags.yml` keeps its current Font Awesome class-name values;
the map translates them.

## Styling

### Setup

`site/styles/global.css` imports Tailwind and declares tokens in `@theme`:

- colours: Flatly primary `#2C3E50`, success/accent `#18BC9C`, info, warning,
  danger, the gray scale 100 to 900, body background and text;
- fonts: Source Serif 4 (display serif), Space Grotesk (brand), the sans body
  stack;
- layout constants: navbar height 64px;
- the tag colours and hero section colours currently in `$tag-colors` and
  `$hero-section-colors`.

Tailwind's Preflight replaces Bootstrap Reboot. Typography defaults that
Bootstrap supplied (body font and size, heading scale, link colour and hover)
are declared once in `@layer base`.

### Component styles

The 1,730-line `main.scss` is ported into `global.css` under
`@layer components`, keeping every class name, rewriting Sass into plain CSS:
variables to `var(--…)`, nesting kept as native CSS nesting,
`color.adjust()` to `color-mix()`, the `@each` loops over tags expanded into
explicit rules. Tailwind utilities are used in markup only where Bootstrap
utility or layout classes used to be.

### Reproduced Bootstrap looks

Re-created explicitly, each a few lines: fixed dark navbar with mobile
collapse panel and desktop hover dropdowns; modal dialog with backdrop and
scrollable body; primary, secondary, and outline buttons; badge pills; the
responsive column layouts on the Team and Meetings pages.

## Client-side behaviour (Vue islands)

Astro's Vue integration. Static markup stays `.astro`; interactive parts are
`.vue` single-file components hydrated with `client:idle`, or `client:visible`
for below-the-fold islands. Astro passes typed entries as props at build time;
islands never load YAML. Base path in both `.astro` and `.vue` comes from
`import.meta.env.BASE_URL`.

| Island | Responsibility |
|---|---|
| `TagFilter.vue` | Filter bar plus the list it filters. Active tag state, `?tag=` read on mount and written on change, filters by `tags`, hides empty year groups. Renders the `.vue` entry components. |
| `PersonAvatar.vue` | Photo plus positioned hover card; open on hover/focus/click, close on leave/blur/outside click, clamped to the viewport. Used by the homepage strip and the alumni timeline. |
| `Modal.vue` | Generic native `<dialog>`: open/close, Escape, backdrop click, close button, body scroll lock, auto-open when the page loads with a matching `#anchor` or the hash changes. |
| `PersonModal.vue`, `ProjectModal.vue`, `NewsModal.vue` | Built on `Modal.vue` with the detail content; triggered by clicking the card, including keyboard activation. Links inside a clickable card do not open the modal. |
| `SiteSearch.vue` | Search modal: lazy fetch of `search.json` on first open, cached; tokenised scoring; results list; `/` and Cmd/Ctrl+K shortcuts; navbar button trigger. |
| `CookieConsent.vue` | Banner, stored choice, Google Analytics injected only after opt-in, "change your choice" control on the privacy page through a shared store. |

Retired: `main.js`, `search.js`, `cookie-consent.js`,
`bootstrap.bundle.min.js`. Nothing is ported line by line.

Not used in this step: view transitions, client-side routing, islands other
than Vue.

## Build and deployment

### Local

`npm install`; `npm run dev`; `npm run build` to `dist/`; `npm run preview`;
`npm run check` (`astro check`); `npm test` (Vitest); `npm run e2e`
(Playwright). Node 24 is the target.

### Config

`astro.config.mjs`: Vue and sitemap integrations, Tailwind Vite plugin,
`srcDir: "site"`, `output: "static"`, Google Analytics id `G-FDNGDW6G09`
exposed to the cookie consent island. `site` and `base` come from `SITE` and
`BASE` environment variables with local defaults (`http://localhost:4321`,
`/`).

### Workflow `site.yml`

Triggers: pull requests, pushes to `main`, manual dispatch. Jobs:

1. `validate`: the existing Python steps (uv sync, pytest, `python -m
   src.data`).
2. `build`: needs `validate`; Node setup with npm cache, `npm ci`, `astro
   check`, Vitest, `astro build` with `SITE`/`BASE` set for Pages, Playwright
   end-to-end tests against the build, upload of `dist/` as the Pages
   artifact.
3. `deploy`: needs `build`, runs only on pushes to `main`; `deploy-pages`.

`validate-data.yml` keeps running on every branch. Pages source is set to
"GitHub Actions" once by hand in the repository settings.

### Domain switch later

Set `BASE` to `/` and `SITE` to the domain in the workflow, add `public/CNAME`,
configure the domain in repository settings. Templates need no change.

## Branch model and protection

- Default branch renamed from `master` to `main` on GitHub and locally; all
  references in workflows and docs updated.
- `develop` (local and remote) deleted; it is stale.
- Ruleset `main`, created by hand in repository settings and documented in
  `README.md`: block deletion, block force pushes, require linear history,
  require a pull request (0 approvals, dismiss stale reviews on push, all
  review threads resolved, merge methods squash and rebase), required status
  checks `validate` and `build` from `site.yml`. No bypass actors.
- The rename, deletion, and ruleset are the first implementation step, before
  any migration code. The migration itself lands through pull requests on a
  feature branch.

## Testing

- Python: existing pytest suite unchanged.
- Vitest: one test loads all 16 collections and asserts the entry count equals
  the YAML list length; unit tests for `site/lib/` helpers (grouping, sorting,
  chip matching, slugify); Vue Test Utils tests for island logic (tag filter
  state and URL parameter, modal open/close and anchor auto-open, search
  scoring order, consent persistence and conditional script injection).
- `astro check` for types across `.astro`, `.ts`, `.vue`.
- Build-level: after `astro build`, assert every URL in the current Jekyll
  sitemap exists in `dist/`, `search.json` record counts per type equal the
  Jekyll version, and no page references a missing `/assets/…` path.
- Playwright end-to-end: open each page, open a person/project/news modal,
  hover a person avatar, filter by tag, run a search and follow a result,
  accept cookies and confirm the analytics request is only then made.
- Visual parity: a local Playwright script screenshots every page at desktop
  (1280px) and phone (400px) width from the Jekyll build in `web/` and the
  Astro build, writing side-by-side images for manual review. Not a CI gate.
  `web/` is kept on disk as the reference until the migration is merged.

## Documentation updates

`CLAUDE.md` and `README.md` are rewritten for the new layout, commands, data
paths, branch rules, and deployment. `science_communication/project_output.md`
marks the migration item done.

## Follow-ups (out of scope)

- GitHub Pages size: the built site is 892 MB, 881 MB of it PDFs, against a
  1 GB site limit and a 100 GB per month bandwidth soft limit. Options when it
  bites: move PDFs to GitHub Releases or a Zenodo community with absolute
  links in YAML, or keep PDFs on a separate host.
- Astro image pipeline for the `.webp` renditions.
- Framework islands for interactive statistics, MDX content, more personal
  profiles.
- Self-hosting Google Fonts.
