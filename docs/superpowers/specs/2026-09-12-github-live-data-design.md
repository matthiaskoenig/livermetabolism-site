# Live GitHub data on the software page: design

Date: 2026-09-12
Status: approved; implemented by `docs/superpowers/plans/2026-09-12-github-live-data.md`

## Goal

Show live GitHub information for the lab's software on the research page (latest releases, release history, stars, commit activity, and per-card stats), refreshed daily without redeploying the site. Reuse the interactive components of https://matthiaskoenig.github.io (source: `../matthiaskoenig/site`), adapted to this site's static-first design.

## Decisions

| Topic | Decision |
|---|---|
| Components | Release feed, release timeline (ECharts), stars chart (ECharts), commit-activity chart (ECharts), live stats line on every software card. The personal contribution calendar and contributions chart stay on the personal page. |
| Repositories | The `repository` URL of every `data/software.yml` entry, plus this site: a new `livermetabolism-site` entry ("livermetabolism.com", the website source) in `software.yml`. Trailing slashes and `www` in URLs are normalised to `owner/name`. |
| Freshness | Daily snapshot (05:00 UTC) plus manual dispatch. |
| Delivery | Snapshot committed to the orphan branch `github-data` as `github.json`, read from `https://raw.githubusercontent.com/matthiaskoenig/livermetabolism-site/github-data/github.json` at build time (server-rendered fallback) and at runtime (fresh data), never through a redeploy. |
| Charts | `echarts/core` with only the needed renderers and components, loaded by `client:visible` islands on the research page only. |
| Security | Snapshot carries text only (release summaries are plain text); every read is validated with the same Zod schema; CSP `connect-src` gains `https://raw.githubusercontent.com`; the workflow token has `contents: write` and pushes only to `github-data`. |

## Pipeline

`scripts/fetch-github.ts` (Node 24, TypeScript) collects the repository list from `data/software.yml`, calls the GitHub REST API per repository (metadata, releases up to 20, latest commit, weekly commit activity for 52 weeks with retry on 202), parses every response with Zod, and writes `github.json` atomically. `scripts/lib/github-client.ts`, `scripts/lib/transform.ts`, and `scripts/lib/schemas.ts` are ported from the personal page; transformations are pure and unit-tested with recorded fixtures.

`.github/workflows/github-data.yml`: schedule + `workflow_dispatch`; `permissions: contents: write`; checkout `main`, `npm ci`, `npm run fetch:github` with `GITHUB_TOKEN`, then checkout `github-data` into a worktree (create as orphan if missing), copy the file, commit and push only if changed.

## Snapshot

```
fetchedAt: ISO string
repos: { [fullName]: { name, owner, fullName, description, htmlUrl, homepage, stars, forks,
         openIssues, language, license, topics, pushedAt, archived, defaultBranch,
         latestCommit: { sha, date, message, htmlUrl } | null,
         latestRelease: { tag, name, publishedAt, htmlUrl } | null,
         commitActivity: [ { week: ISO date, total: number } ] } }
releases: { [fullName]: [ { tag, name, publishedAt, htmlUrl, prerelease, summary } ] }
```

`summary` is the first paragraph of the release body with markdown stripped, at most 300 characters. Drafts are excluded; prereleases are kept and flagged.

## Page

`site/pages/research.astro`, software section:

- Each `SoftwareCard.vue` gains a `.software-stats` line under the description with `data-repo="<fullName>"`: latest release tag linked to the release with its date, stars, open issues, last push as a relative date, language, license. Rendered from the build-time snapshot; a card whose repository is absent from the snapshot shows no line.
- After the grid, three new anchored blocks: `#releases` ("Latest releases": `ReleaseFeed.vue` with the latest release per repository from the last two years, newest first, and "Release history": `ReleaseTimeline.vue`), `#activity` ("Commit activity": `CommitActivityChart.vue`, weekly commits over the last year stacked per repository, and "Stars": `StarsChart.vue`).
- Islands hydrate with `client:visible` and receive rows computed at build time as props. On mount each calls `loadLiveSnapshot()` from `site/lib/githubLive.ts` (one memoized fetch per page, validated with the Zod schema) and recomputes its rows when the live `fetchedAt` is newer than the build's. A small bundled `<script>` in `SoftwareLive.astro` updates the `.software-stats` lines the same way. A "Data from GitHub, updated <relative time>" note shows the effective `fetchedAt`.
- `site/lib/github.ts` (build-time read with a 10 s timeout and an empty-snapshot fallback) and `site/lib/githubRows.ts` (pure: latest per repo, timeline rows, stars rows, activity rows, relative dates) are shared by build and runtime code.

## Testing

Vitest: transform and summary extraction against recorded API fixtures; snapshot schema round-trip; every row helper; the software.yml repository extraction. Playwright: the research page renders the stats line for `matthiaskoenig/sbmlutils` and the release feed with at least one row (the data branch exists before the page merges); zero console errors (CSP). The existing suites stay green.

## Release

Version 0.6.0 with `release-notes/0.6.0.md` covering the feature; tagged after the page merges.
