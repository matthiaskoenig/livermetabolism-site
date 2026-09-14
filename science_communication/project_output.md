# Project Output

**Live site:** https://livermetabolism.com (status: release 0.10.0, 14 September 2026)

Within this project, a new version of the group website was developed based on the science-communication principles covered in the course.

## Why a relaunch was needed

- The old site was very outdated.
- Too much clutter and information.
- No clear structure.
- No communication strategy or defined target audience.

## Delivered updates, cleanups & improvements

- [x] Collecting, linking, and updating information
  - [x] Updated open positions
  - [x] Linked people to publications
  - [x] Updated projects (collected all current projects)
  - [x] Linked people to projects
  - [x] Linked projects to core tags
  - [x] Linked publications to core tags
  - [x] Linked presentations and posters to core tags
  - [x] Link presentations and posters to people
  - [x] Linked software entries to the people who built them
  - [x] Linked teaching entries to core tags
  - [x] Added the meetings organized by the group (COMBINE 2022, Open Science & Reproducibility workshop 2025)

- [x] Removed clutter
  - [x] Removed duplicate information from the landing page (publications, funding, ...)
  - [x] Collected all contact information and social links into the footer
  - [x] Gave news its own page as a card grid (same pattern as Projects/Research/Meetings), off the landing page
  - [x] Shortened texts and descriptions
  - [x] Merged Software, Funding, and Editorial roles into the Research page
  - [x] Merged People and Open Positions
  - [x] Consolidated Meetings into the Research nav dropdown (no separate top-level item)
  - [x] Fixed responsiveness on all pages
  - [x] Simplified and unified teaching content
  - [x] Removed unused assets and code (e.g. stale PDFs, unreferenced images, dead theme code)
  - [x] Gave posters, abstracts, and presentations their own dedicated entries

- [x] Database
  - [x] Added validation code for the database and its entries (pydantic)
  - [x] Fixed database errors
  - [x] Improved consistency: unified naming, established naming patterns for files and ids
  - [x] A second, independent schema check in the site build (Zod), so a broken reference fails the build
  - [x] Both checks run automatically on every pull request (currently 392 entries in 16 tables)

- [x] Addressing stakeholders
  - [x] Clear description of the lab's new orientation with the start of the professorship in Lübeck
  - [x] Added a vision statement
  - [x] Added core-expertise project highlights
  - [x] Introduced core tags (research areas): Digital Twins, AI, Digital Pathology, Pharmacometrics, Open & FAIR
  - [x] Structured and framed the site's content around the target audiences defined in `communication_concept.md` (patients, physicians, funders, collaborators, students, press)
  - [x] One vision statement per research area, each with its own full-screen section on the landing page
  - [x] Each research-area section links straight to the matching publications, projects, and software (pre-filtered) and to the network graph
  - [x] Open Positions topic tiles link to the research-area sections, so students see what they could work on

- [x] Design
  - [x] Simplified, modern styling and fonts
  - [x] Improved navigation/sub-navigation
  - [x] Added a logo (brand mark) and a full favicon set generated from it
  - [x] Landing page as a scrolling one-pager: start screen, then one section per research area, footer as the last page
  - [x] Color, icon, and artwork per research area, used consistently for badges, filters, charts, and section backgrounds

- [x] Usability
  - [x] Improved navigation (clearer navbar, fewer and better-structured items; Publications first, Network as its own entry)
  - [x] Mobile-friendly design, responsive layout
  - [x] Improved page load time — especially image sizes/asset optimization (the Projects page used to take forever to load with only a fraction of images visible)
  - [x] Moved hosting to a different server to fix extremely slow page load times (nginx reverse proxy serves livermetabolism.com; the site is also deployed to GitHub Pages at an interim URL)
  - [x] Split current members and alumni on the Team page
  - [x] Search functionality: a full-text search modal (open via the navbar icon, `/`, or Cmd/Ctrl+K) over a build-time JSON index (`search.json`) covering every publication, presentation, poster, abstract, project, software entry, funding source, editorial role, news item, meeting, teaching entry, person, research area, and static page, each result linking straight to the matching card/row/profile
  - [x] One standard detail view for people, publications, projects, software, and news: opened from every card, row, search result, and network node; shows the description, key figures, and related items, and one can click through from a person to a paper to its project without leaving the page
  - [x] Sitemap (`/sitemap-index.xml`)
  - [x] Discoverability for search engines and AI agents, generated automatically on every build: `robots.txt` (all crawlers welcome, AI crawlers included; points to the sitemap), `llms.txt` (a short Markdown overview of the group per https://llmstxt.org/) and `llms-full.txt` (all site content as one Markdown file)

- [x] Showing research impact with live data (collected daily by an automated workflow, no manual updates)
  - [x] At-a-glance strip on the homepage: publications, citations, h-index, team, software, funded projects
  - [x] Citation metrics from Google Scholar on the publications page, with citations-per-year and citations-over-time charts
  - [x] Citation count and open-access badge on every publication with a DOI (OpenAlex), plus a Year / Most cited toggle
  - [x] Publications-over-time chart, stacked by research area or by publication type
  - [x] Software activity from GitHub on the research page: latest releases, stars, open issues, commit activity
  - [x] Network page: interactive graph of people, publications, projects, and software, filterable by research area

- [x] Control & follow-up (see `communication_concept.md` → Control)
  - [x] Google Analytics (GA4) installed for traffic tracking
  - [x] Legal safeguards: added `/impressum/` and `/privacy/` pages, linked from the footer on every page (Lübeck address, per § 5 TMG / § 18 MStV; Datenschutzerklärung covers server logs and Google Analytics)
  - [x] Cookie-consent banner gating Google Analytics behind opt-in (GA script only requested from Google after Accept; choice changeable anytime from the privacy page)
  - [x] Regular feedback rounds in group meetings

- [x] Technology, security & maintenance
  - [x] Migrated the site from Jekyll to Astro (TypeScript, Vue components rendered statically with a few interactive islands, Tailwind) — same pages, URLs, and features
  - [x] Automatic checks on every change: data validation, type checks, 431 unit tests, 44 browser tests; `main` only accepts pull requests that pass them
  - [x] Automatic deployment to GitHub Pages on every merge plus a daily rebuild; `deploy.sh` pulls, builds, and restarts the self-hosted site
  - [x] Strict Content-Security-Policy; visitors' browsers never contact Google Scholar, GitHub's API, or OpenAlex (only the daily snapshot is loaded)
  - [x] Versioned releases with release notes (0.5.0 – 0.10.0)

## Open / next steps

- [ ] Switch the custom domain to the GitHub Pages deployment (currently interim URL `https://matthiaskoenig.github.io/livermetabolism-site/`)
- [ ] Evaluate the analytics data after a few months (entry pages, time on site, clicks on research areas)
- [ ] Semi-automatic social-media posts (LinkedIn) from news items
- [ ] Live data from PK-DB; embedding interactive web tools (e.g. visFEM) in the site

## Summary

Based on the science-communication principles from this course, the group's website (https://livermetabolism.com) was relaunched. The prior site was outdated, cluttered, and unstructured, with no clear communication strategy or target audience — a communication concept (`communication_concept.md`) was developed first to define target audiences, positioning, and concrete actions, and this project delivered on that plan.

Key results:
- **Restructured content**: all people, projects, publications, software, presentations, and posters now live in a validated, cross-linked database (YAML + a pydantic schema checked in CI), enabling consistent tagging and linking throughout the site.
- **Decluttered, focused design**: redundant content removed from the landing page, news moved to its own page as a card grid, contact information consolidated into the footer, and navigation simplified.
- **Clearer positioning**: a vision statement and description of the lab's new orientation (following the move to the professorship in Lübeck) were added, along with a logo and consistent modern styling. Five research areas structure the whole site; each has its own vision statement and landing-page section that leads visitors to the matching work.
- **Better usability and performance**: responsive/mobile-friendly design across all pages, faster page loads through image/asset optimization and improved hosting, full-text site search, and one standard detail view for people, publications, projects, software, and news.
- **Visible research impact**: citation metrics, per-paper citations, publication and software activity charts, and a network graph of people and their work, with the data collected daily without manual effort.
- **Legal compliance**: Impressum and Datenschutzerklärung pages, with Google Analytics gated behind a cookie-consent banner rather than loading unconditionally.
- **Maintainability**: the site was migrated from Jekyll to Astro, keeping the same pages and URLs. Every change is tested automatically before it goes live, and each release is documented with release notes.

The full checklist above documents each change against the plan in `communication_concept.md`.
