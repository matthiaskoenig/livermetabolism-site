# Live GitHub Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Live GitHub data (releases, stars, commit activity, per-card stats) on the research page, refreshed daily from a snapshot on the `github-data` branch, without redeploying the site.

**Architecture:** see the spec. A scheduled workflow writes `github.json` to the `github-data` branch; the site reads it at build time for server-rendered content and at runtime for fresh data; ECharts islands and a card updater script render it.

**Tech Stack:** as the site (Astro 7, Vue 3, Tailwind 4, Vitest, Playwright) plus `echarts` (core build). Node 24 runs the TypeScript fetch script directly.

**Spec:** `docs/superpowers/specs/2026-09-12-github-live-data-design.md`. The personal page's implementation to port from: `/home/mkoenig/git/matthiaskoenig/site` (`scripts/lib/github-client.ts`, `scripts/lib/transform.ts`, `scripts/lib/schemas.ts`, `scripts/fetch-github.ts`, `tests/fixtures/*.json`, `src/components/ReleaseFeed.vue`, `ReleaseTimeline.vue`, `StarsChart.vue`, `useChart.ts`, `src/lib/chart-options.ts`, `src/lib/charts.ts`, `src/lib/merge.ts`).

## Global Constraints

- `main` is protected: each task lands through its own branch and PR (`gh pr create`, `gh pr merge --squash --auto --delete-branch`); wait for `validate` and `build`; start each task from an updated `main`. Never `git add -A`.
- Verification before every commit: `npm run check`, `npm test`, `npm run build`, `npm run e2e` (`npx astro preview --background` first, `npx astro preview stop` after), and `uv run python -m src.data` + `uv run pytest tests/ -q` when `data/` changes.
- CSP: no `'unsafe-inline'`; every new third-party host goes into `astro.config.mjs` `security.csp`; the e2e pages spec (zero console errors on every page) is the gate.
- No HTML from the snapshot is ever inserted into the page; summaries are text.
- Commit trailer lines:

```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EACGN79i4sGkmxT67hQuRJ
```

---

### Task 1: Fetch script, snapshot schema, data workflow, software entry

**Branch:** `github-data/pipeline`

**Files:**
- Create: `scripts/fetch-github.ts`, `scripts/lib/github-client.ts`, `scripts/lib/transform.ts`, `scripts/lib/repos.ts` (repository list from `data/software.yml`), `site/lib/githubSchema.ts` (Zod schema of the snapshot, shared by the script and the site), `scripts/lib/transform.test.ts`, `scripts/lib/repos.test.ts`, `site/lib/githubSchema.test.ts`, `tests/fixtures/github/*.json` (recorded API responses, copied/adapted from the personal page), `.github/workflows/github-data.yml`.
- Modify: `package.json` (`"fetch:github": "node scripts/fetch-github.ts"`), `vitest.config.ts` (include `scripts/**/*.test.ts`), `data/software.yml` (new `livermetabolism-site` entry), `.gitignore` (`github.json` at the root, the local output), `CLAUDE.md`, `README.md`.

**Interfaces:**
- `site/lib/githubSchema.ts`: `snapshotSchema` (Zod, `.strict()`), `type Snapshot = z.output<typeof snapshotSchema>`, `type RepoEntry`, `type ReleaseEntry`, `emptySnapshot(): Snapshot`, `SNAPSHOT_URL = 'https://raw.githubusercontent.com/matthiaskoenig/livermetabolism-site/github-data/github.json'`.
- `scripts/lib/repos.ts`: `repoFullName(url: string): string | null` (`https://github.com/sys-bio/roadrunner/` → `sys-bio/roadrunner`; non-GitHub or malformed → null), `reposFromSoftware(yamlText: string): string[]` (unique, in file order).
- `scripts/lib/transform.ts`: `toRepoEntry(api, latestCommit, latestRelease, activity)`, `toReleaseEntries(fullName, apiReleases)`, `summarize(body: string | null): string` (first paragraph, markdown stripped, ≤300 chars), `buildSnapshot(...)`.
- `scripts/lib/github-client.ts`: `GitHubClient` with `repo(fullName)`, `releases(fullName)`, `latestCommit(fullName)`, `commitActivity(fullName)` (retries 202 up to 5 times with backoff), all returning parsed API objects; `fetch` injectable for tests.
- Workflow job name `github-data`.

- [ ] **Step 1:** Branch; add the `livermetabolism-site` software entry (id `livermetabolism-site`, tags `['Open & FAIR']`, type `software`, name `livermetabolism.com`, title `Source of this website`, description one sentence, no image, people `[matthias_koenig]`, homepage `https://livermetabolism.com`, repository `https://github.com/matthiaskoenig/livermetabolism-site`); `uv run python -m src.data` passes.
- [ ] **Step 2 (TDD):** write `repos.test.ts` (URL normalisation cases including trailing slash, `.git` suffix, `www.github.com`, non-GitHub → null; extraction from the real `data/software.yml` yields 12 names) → implement.
- [ ] **Step 3 (TDD):** write `transform.test.ts` against fixtures (repo, releases with drafts/prereleases, commit, commit_activity) and `githubSchema.test.ts` (a built snapshot parses; a snapshot with an extra key is rejected; `emptySnapshot()` parses) → implement transform and schema.
- [ ] **Step 4:** `github-client.ts` with an injectable `fetch`; test the 202 retry and the error on non-2xx with a stub fetch.
- [ ] **Step 5:** `fetch-github.ts`: reads `data/software.yml`, fetches with `mapLimit` 4, writes `github.json` atomically to the path given as argv[2] (default `./github.json`). Run it locally with `GITHUB_TOKEN` from `gh auth token` and inspect the output (all 12 repos present, sizes, `fetchedAt`).
- [ ] **Step 6:** workflow `github-data.yml`:

```yaml
name: GitHub data
on:
  schedule:
    - cron: "0 5 * * *"
  workflow_dispatch:
permissions:
  contents: write
jobs:
  github-data:
    name: github-data
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run fetch:github -- github.json
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Commit to the github-data branch
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          if git ls-remote --exit-code --heads origin github-data; then
            git fetch origin github-data
            git worktree add ../data origin/github-data
          else
            git worktree add --detach ../data
            git -C ../data checkout --orphan github-data
            git -C ../data rm -rfq . || true
          fi
          cp github.json ../data/github.json
          cd ../data
          git add github.json
          if git diff --cached --quiet; then echo "no change"; exit 0; fi
          git commit -m "Update GitHub snapshot $(date -u +%Y-%m-%dT%H:%MZ)"
          git push origin HEAD:github-data
```

Use the current majors of the actions (check `.github/workflows/site.yml` for the versions already in use).

- [ ] **Step 7:** docs (`CLAUDE.md`: pipeline, snapshot, branch, how to run the fetch locally; `README.md`: one paragraph), `.gitignore` `github.json`. Full verification; commit in groups; PR; auto-merge; wait.
- [ ] **Step 8 (after merge):** `gh workflow run github-data.yml --ref main`, wait for it, confirm `git ls-remote --heads origin github-data` and that `curl -s $SNAPSHOT_URL | node -e '...'` parses with 12 repos. Report the size.

---

### Task 2: Research page — stats lines, release feed, charts, live refresh

**Branch:** `github-data/page`

**Files:**
- Create: `site/lib/github.ts` (build-time `loadSnapshot()`), `site/lib/githubLive.ts` (runtime `loadLiveSnapshot()`), `site/lib/githubRows.ts` + test (`latestReleases(snapshot, repos, sinceDays=730)`, `releaseTimelineRows`, `starsRows`, `activityRows(snapshot, repos, weeks=52)`, `relativeDate(iso, now)`, `statsFor(snapshot, fullName)`), `site/components/ReleaseFeed.vue`, `ReleaseTimeline.vue`, `StarsChart.vue`, `CommitActivityChart.vue`, `useChart.ts`, `site/lib/chartOptions.ts`, `site/components/SoftwareLive.astro` (bundled script updating `.software-stats[data-repo]` and the "updated" note), tests for the row helpers and the relative date.
- Modify: `site/components/SoftwareCard.vue` (stats line; props gain `stats: RepoStats | null`), `site/pages/research.astro`, `astro.config.mjs` (`connect-src` + `https://raw.githubusercontent.com`), `site/styles/global.css` (`.software-stats`, chart containers, feed rows in the site's tokens), `package.json` (`echarts`), `e2e/interactions.spec.ts` or `pages.spec.ts` (research page assertions), `CLAUDE.md`.

**Interfaces:** props of every island are plain arrays of rows from `githubRows.ts`; each island exposes nothing and refetches via `loadLiveSnapshot()` on mount. `SoftwareCard` renders `<p class="software-stats" data-repo="…">` with spans `data-field="release|stars|issues|pushed|language|license"` so the updater can patch text in place.

- [ ] **Step 1 (TDD):** `githubRows.test.ts` with a fixture snapshot → implement `githubRows.ts`.
- [ ] **Step 2:** `github.ts` (fetch with `AbortSignal.timeout(10000)`, parse with `snapshotSchema`, fallback `emptySnapshot()` with a console warning) and `githubLive.ts` (memoized; `cache: 'default'`; returns `null` on any failure).
- [ ] **Step 3:** `SoftwareCard.vue` stats line; `research.astro` computes `statsFor` per card from the build snapshot; `SoftwareLive.astro` script patches on load. CSS for the line (small, muted, wraps).
- [ ] **Step 4:** `ReleaseFeed.vue` (static list markup: logo-less rows with repo, tag linked, date, summary text; hydrates only to refresh) and the three ECharts islands using `echarts/core` (`CanvasRenderer`, `BarChart`, `ScatterChart`, `GridComponent`, `TooltipComponent`, `LegendComponent`) via `useChart.ts` (resize observer, dispose on unmount). Colours from the site tokens (`--color-primary`, `--color-success`, tag colours). Tooltip `renderMode: 'richText'` if the default HTML tooltip triggers a CSP style violation (check the console in e2e).
- [ ] **Step 5:** `research.astro`: the `#releases` and `#activity` blocks with headings, the "Data from GitHub, updated …" note, islands `client:visible`. Add the two anchors to the Research dropdown in `TopNav.astro` ("Releases", "Activity").
- [ ] **Step 6:** CSP host; e2e: research page has `.software-stats[data-repo="matthiaskoenig/sbmlutils"]` with non-empty release text, `#releases .release-row` count ≥ 1, canvas elements present after scrolling the charts into view, zero console errors. Full verification, PR, auto-merge, wait; then check the live Pages research page.

---

### Task 3: Release 0.6.0

**Branch:** `release/0.6.0`

- [ ] `package.json` and `pyproject.toml` → 0.6.0; `release-notes/0.6.0.md` in the house style (Features: live GitHub data section; Development: pipeline, workflow, echarts dependency, tests; Fixes if any surfaced); `CLAUDE.md`/`README.md` already updated in Tasks 1–2. PR, auto-merge, wait; then the controller tags `0.6.0`.
