# Per-paper citations, publications chart, homepage strip: design

Date: 2026-09-12
Status: approved; implemented by `docs/superpowers/plans/2026-09-12-citations-chart-strip.md`

## Goal

Three further interactive components on top of the live-data infrastructure of 0.6.0 (`2026-09-12-github-live-data-design.md`, `2026-09-12-scholar-live-data-design.md`):

1. **Citation counts per publication** on the publications page (exact, by DOI, from OpenAlex), with an open-access badge and a Year / Most cited ordering toggle.
2. **A publications-over-time chart** on the publications page: papers per year stacked by research area (or by status), clicking into the existing tag filter.
3. **An at-a-glance strip on the homepage** with six figures: publications, citations, h-index, team, software, funded projects.

## Decisions

| Topic | Decision |
|---|---|
| Citation source | OpenAlex `GET /works?filter=doi:<a>|<b>|…&select=doi,cited_by_count,open_access,counts_by_year,id&per-page=50` in batches of 50 DOIs (110 DOIs today → 3 requests). No key. An optional contact address for OpenAlex's polite pool comes from the repository variable `OPENALEX_MAILTO` (`mailto=` parameter, only if set). Crossref (`is-referenced-by-count`) is the documented fallback source if OpenAlex ever requires a key; not implemented now. |
| DOI normalisation | lowercase, strip `https://doi.org/`, `http://dx.doi.org/`, `doi:` prefixes and whitespace; the snapshot is keyed by the normalised DOI; a DOI OpenAlex does not return is absent from the snapshot (no badge). |
| Snapshot | `citations.json` on the orphan branch `github-data`, next to `github.json` and `scholar.json`; third step of the daily workflow, `continue-on-error: true`, writes nothing on failure. |
| Row badges | "cited N" (omitted when N is 0 or unknown) linking to `https://openalex.org/<id>` where `<id>` matches `^W\d+$` (validated by the schema); "open access" badge without a link when `isOa`. Server-rendered from the build snapshot, patched in the browser from the live snapshot. |
| Ordering | A Year / Most cited toggle next to the tag filter. "Most cited" moves the existing row nodes into one flat table ordered by count descending (ties by year descending), hides the year groups; "Year" restores the original order. The tag filter keeps working in both orders. No second copy of the rows. |
| Chart | `PublicationsChart.vue` island (`client:visible`) above the tag filter: papers per year, stacked by research area in the tag colours; a Research area / Status switch (two static buttons) swaps the series. Rows computed at build time from `publications.yml` and `tags.yml`; no live part. Click on a segment presses the matching tag-filter button and scrolls to the list; click on a year label scrolls to that year group. Caption: a paper with several areas counts once per area. |
| Homepage strip | Six figures under the hero subtitle, each a link: Publications (`/publications/`), Citations and h-index (`/publications/#scholar`), Team "n members · m alumni" (`/people/`), Software "n packages · m stars" (`/research/#software`), Funded projects (`/research/#funding`). Build-time only: no fetch script on the homepage. |
| Daily rebuild | `site.yml` gains `schedule: cron "0 6 * * *"` (one hour after the data run) so every build-time number is at most a day old; the existing deploy condition (`github.ref == 'refs/heads/main'` and not a pull request) already covers scheduled runs. |
| Release | 0.7.0 with `release-notes/0.7.0.md`, tagged after the last task merges. |

## Pipeline

`scripts/fetch-citations.ts` with `scripts/lib/openalex.ts` (`normalizeDoi(raw): string | null`, `doisFromPublications(yamlText): string[]` unique in file order, `chunk(list, 50)`, `fetchWorks(dois, fetchImpl, mailto?)` with the same retry policy as the GitHub client (3 attempts on 429/5xx/network, honours `retry-after`), `toCitationEntry(apiWork)`, `buildCitations(entries, now)`). Zod schemas of the API objects live beside the client, as in `github-client.ts`. The script reads `data/publications.yml`, fetches, validates the output with `citationsSchema`, and writes atomically to `argv[2]` (default `./citations.json`, gitignored).

Workflow (`github-data.yml`): after the Scholar step, `Fetch citations` (`npm run fetch:citations -- ../data/citations.json`, `continue-on-error: true`, `env: OPENALEX_MAILTO: ${{ vars.OPENALEX_MAILTO }}`); the commit step adds `citations.json` the same tolerant way as `scholar.json`.

## Snapshot

```
fetchedAt: ISO string
works: { [doi]: { openalexId: 'W…', citedByCount: number, isOa: boolean,
                  oaStatus: 'gold' | 'green' | 'hybrid' | 'bronze' | 'diamond' | 'closed' | string,
                  countsByYear: [ { year: number, count: number } ] } }
```

`site/lib/citationsSchema.ts`: `citationsSchema` (`.strict()`), `Citations`, `CitationEntry`, `emptyCitations()` (epoch), `CITATIONS_URL`.

## Page: publications

- `PublicationRow.vue` gains an optional `citation?: CitationEntry | null` prop and renders, inside `.pub-links`, `<span class="pub-cites" data-doi="<normalised doi>">` with `<a data-field="cited" hidden>` ("cited N", `href` to OpenAlex) and `<span data-field="oa" hidden>` ("open access"); the row's `data-cited="<N>"` attribute (0 when unknown) drives the ordering. The skeleton is rendered for every row with a DOI, so a build without the snapshot fills in at runtime.
- `site/lib/citations.ts` (build-time read, 10 s timeout, empty fallback), `site/lib/citationsLive.ts` (memoized runtime read), `site/lib/citationsStats.ts` (patches the badges and `data-cited`, text nodes and `href`/`hidden` only), `site/lib/pubOrder.ts` (`orderByCitations(root)`, `restoreOrder(root)`: remembers each row's original parent and next sibling, moves nodes, toggles `hidden` on the year groups and shows/hides the flat table `#publication-list-flat`).
- `PublicationsOrder.astro`: the two-button toggle (`#publication-order`, `data-order="year|cited"`, `.active`) with its bundled script; `?order=cited` pre-applies. "Data from OpenAlex, updated …" note next to the toggle.
- `PublicationsChart.vue` + `site/lib/publicationRows.ts` (`publicationsPerYear(publications, tags)` → `{ years: number[], byTag: { tag, slug, counts: number[] }[], byStatus: { status, counts: number[] }[] }`); chart option in `chartOptions.ts` with the tag palette mirrored from the `--color-tag-*` tokens (documented duplication, as for the GitHub charts); tooltips `renderMode: 'richText'`. Clicks are wired in the component: `document.querySelector('#publication-tag-filter [data-tag="<tag>"]').click()` then scroll to `#publication-list`.

## Page: homepage

`HomeStats.astro` under the hero subtitle: `.home-stats` with six `.home-stat` links (large tabular number, small label, optional muted second line). Numbers from the data (`publications` with status publication/review/proceeding/chapter; `people` by status; `software` count; `funding` count) and the two build-time snapshots (Scholar citations and h-index; sum of `stars` over the GitHub snapshot). Figures whose snapshot is empty are omitted rather than shown as 0.

## Testing

Vitest: DOI normalisation and extraction from the real `publications.yml` (110 unique), chunking, the client's retry and parse, the transform against a recorded OpenAlex response (`tests/fixtures/openalex/works.json`), the schema round trip, the row helpers, `pubOrder` on a jsdom fixture (order, restore, tag filter interplay), `publicationsPerYear` counts, the strip helpers. Playwright: publications page shows a `.pub-cites [data-field="cited"]:not([hidden])` for `Koenig2012_*`-era papers (at least one visible badge), the toggle reorders (first visible row after "Most cited" has the largest `data-cited`), the chart canvas appears, the homepage strip shows six figures with digits; zero console errors on every page.
