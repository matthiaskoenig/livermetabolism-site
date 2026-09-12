# Live Google Scholar data on the publications page: design

Date: 2026-09-12
Status: approved; implemented by `docs/superpowers/plans/2026-09-12-scholar-live-data.md`

## Goal

Show the citation metrics of the group leader's Google Scholar profile on the publications page (total citations, h-index, i10-index, citations per year, and the citation count over time), refreshed daily without redeploying the site. Same delivery model as the live GitHub data (`2026-09-12-github-live-data-design.md`): a daily snapshot on the `github-data` branch, read at build time and in the browser.

## Decisions

| Topic | Decision |
|---|---|
| Source | The public profile page `https://scholar.google.com/citations?user=xD9IjnYAAAAJ&hl=en`, fetched once a day from the Actions runner with a browser-like `User-Agent`. Google Scholar has no API; SerpAPI (paid third party) and OpenAlex/Semantic Scholar (different, lower numbers; OpenAlex mis-merges the ORCID) were rejected. |
| Content | Summary strip (citations, h-index, i10-index, each "all" and "since <year>" as Scholar shows them; the site's own publication count), a citations-per-year bar chart (Scholar's histogram), and a citations-over-time line built from the daily snapshots. No per-publication counts. |
| Freshness | Same daily workflow (05:00 UTC) and manual dispatch; snapshot `scholar.json` next to `github.json` on the orphan branch `github-data`. |
| Robustness | A blocked request (CAPTCHA/429/redirect) or a page whose structure no longer parses fails the fetch step **without** failing the GitHub step or overwriting the previous `scholar.json`, so the page keeps the last good data. |
| Privacy | Visitors' browsers never contact Google: the page fetches only the snapshot from `raw.githubusercontent.com` (already in `connect-src`). |
| Charts | `echarts/core`, reusing `useChart.ts`; `BarChart` and `LineChart` only (plus the already registered components). |
| Release | Part of 0.6.0 together with the GitHub data. |

## Pipeline

`scripts/fetch-scholar.ts` (Node 24, TypeScript, no dependencies beyond Zod) with `scripts/lib/scholar.ts`:

- `fetchProfileHtml(userId, fetchImpl)`: GET with `User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0` and `Accept-Language: en`; throws on a non-200 status, on a redirect to `/sorry/` or a body containing the CAPTCHA form (`id="gs_captcha_f"`), and on a body without `id="gsc_rsb_st"`.
- `parseProfile(html)`: pure, regex-based on the known markup (no HTML library): name from `<div id="gsc_prf_in">`; the stats table `<table id="gsc_rsb_st">` with the header cells `gsc_rsb_sth` ("All", "Since YYYY") and the three rows Citations / h-index / i10-index (`gsc_rsb_std` cells); the histogram from the `gsc_g_t` year labels and the `gsc_g_a` bars (`gsc_g_al` counts), paired by index when the counts match and otherwise by their `right:<n>px` positions (bars sit 5 px right of their label). Throws with a precise message when a part is missing, so a layout change is visible in the workflow log.
- `mergeHistory(previous, point)`: keeps at most one point per UTC day (a later run the same day replaces it), appends in order, never drops older points.
- `buildScholarSnapshot(parsed, previous, now)`.
- The script reads the previous snapshot from the path given as its argument if the file exists, validates it with the schema (an invalid previous file is treated as absent with a warning, so the history restarts rather than the run failing), fetches, parses, merges, validates the result, and writes atomically to that path.

`.github/workflows/github-data.yml` gains, after the GitHub fetch: a step `Fetch Google Scholar` (`npm run fetch:scholar -- ../data/scholar.json`, `continue-on-error: true`) that runs **after** the worktree checkout so the previous snapshot is available; the commit step adds both files and commits when either changed. The step order therefore becomes: fetch GitHub → prepare worktree → fetch Scholar into the worktree → copy `github.json` → add, commit, push.

## Snapshot

```
fetchedAt: ISO string
profile: { userId, name, htmlUrl }
sinceYear: number                      # the "Since YYYY" column
citations: { all: number, since: number }
hIndex:    { all: number, since: number }
i10Index:  { all: number, since: number }
citationsPerYear: [ { year: number, count: number } ]   # ascending years
history:   [ { date: 'YYYY-MM-DD', citations, hIndex, i10Index } ]  # one per day, ascending
```

`site/lib/scholarSchema.ts`: `scholarSchema` (`.strict()`), `Scholar`, `emptyScholar()` (`fetchedAt` = epoch, zeros, empty lists), `SCHOLAR_URL`.

## Page

`site/pages/publications.astro`, above the tag filter, a `<section id="scholar">` rendered by `site/components/ScholarStats.astro`:

- A summary strip `.scholar-strip` (static markup): four figures with labels — Citations, h-index, i10-index (each with a small "since <year>: n" line), and Publications (the count of `publications.yml` entries with status `publication`, `review`, `proceeding`, or `chapter`, from the site data, not Scholar). Values in `<span data-field="citations|citations-since|h-index|h-index-since|i10-index|i10-index-since">` so the updater can patch text. A link "Google Scholar profile" to `profile.htmlUrl`. When the build-time snapshot is empty, the strip renders with the fields hidden and the runtime fills them; when there is no data at all, the note says so.
- Two `client:visible` islands: `CitationsPerYearChart.vue` (bars, `citationsPerYear` rows) and `CitationHistoryChart.vue` (line, `history` rows; with fewer than two points it shows the single point and the note "history starts <date>"). Rows are computed at build time by pure helpers in `site/lib/scholarRows.ts` and recomputed on mount from `loadLiveScholar()` (`site/lib/scholarLive.ts`, memoized, `null` on failure) when its `fetchedAt` is newer.
- The same "Data from Google Scholar, updated <relative time>" note, patched by a bundled `<script>` in `ScholarStats.astro` using `site/lib/scholarStats.ts` (text nodes only).
- `site/lib/scholar.ts`: build-time read, 10 s timeout, `emptyScholar()` fallback with a warning.

Styling in the site's tokens (`.scholar-strip` a wrapping flex row of `.scholar-figure` blocks: large tabular number, small label, muted "since" line); chart containers as for the GitHub charts. Tooltips `renderMode: 'richText'`. No `'unsafe-inline'`, no new CSP host.

## Testing

Vitest: `parseProfile` against `tests/fixtures/scholar/profile.html` (a recorded copy of the profile page, trimmed to the `gsc_prf_in`, `gsc_rsb_st`, and histogram markup, values as recorded on 2026-09-12: citations 3827 / 2659 since 2021, h-index 26 / 23, i10-index 36 / 33, 16 histogram years from 2011), the CAPTCHA and missing-table failures, `mergeHistory` (same day replaces, ordering, empty previous), the schema (round trip, extra key rejected, `emptyScholar()` parses), the row helpers, the strip updater. Playwright: the publications page renders `#scholar [data-field="citations"]` matching `/\d/`, a canvas after scrolling `#scholar` into view, zero console errors. Existing suites stay green.

## Release

Part of 0.6.0; `release-notes/0.6.0.md` gains the Scholar items.
