# Live Google Scholar Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Citation metrics of the group leader's Google Scholar profile on the publications page, refreshed daily from a snapshot on the `github-data` branch, without redeploying the site.

**Architecture:** see the spec. The existing daily workflow gains a Scholar fetch that parses the public profile page and writes `scholar.json` (with an accumulated daily history) next to `github.json`; the publications page reads it at build time and in the browser like the GitHub data.

**Tech Stack:** as the site (Astro 7, Vue 3, Tailwind 4, Vitest, Playwright, `echarts/core`). Node 24 runs the TypeScript script directly.

**Spec:** `docs/superpowers/specs/2026-09-12-scholar-live-data-design.md`. Patterns to mirror: `scripts/fetch-github.ts`, `scripts/lib/github-client.ts`, `site/lib/githubSchema.ts`, `site/lib/github.ts`, `site/lib/githubLive.ts`, `site/lib/githubRows.ts`, `site/lib/githubStats.ts`, `site/components/SoftwareLive.astro`, `site/components/StarsChart.vue`, `site/components/useChart.ts`, `site/lib/chartOptions.ts`.

## Global Constraints

- `main` is protected: each task lands through its own branch and PR (`gh pr create`, `gh pr merge --squash --auto --delete-branch`); wait for `validate` and `build`; start each task from an updated `main`. Never `git add -A`. Branch names must not start with `github-data/` (the `github-data` branch exists).
- Verification before every commit: `npm run check`, `npm test`, `npm run build`, `npm run e2e` (`npx astro preview --background` first, `npx astro preview stop` after).
- CSP: no `'unsafe-inline'`; no new host is needed (`raw.githubusercontent.com` is already in `connect-src`).
- No snapshot content is ever inserted as HTML; the only strings from the snapshot are the profile name and URL, rendered as text and as an `href`.
- The Scholar fetch must never fail the GitHub fetch or overwrite a good `scholar.json` with nothing.
- Commit trailer lines:

```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EACGN79i4sGkmxT67hQuRJ
```

---

### Task 1: Scholar fetch script, parser, schema, workflow step

**Branch:** `scholar-pipeline`

**Files:**
- Create: `scripts/fetch-scholar.ts`, `scripts/lib/scholar.ts`, `scripts/lib/scholar.test.ts`, `site/lib/scholarSchema.ts`, `site/lib/scholarSchema.test.ts`, `tests/fixtures/scholar/profile.html`, `docs/superpowers/specs/2026-09-12-scholar-live-data-design.md` and `docs/superpowers/plans/2026-09-12-scholar-live-data.md` (copied verbatim from the paths given in the dispatch).
- Modify: `package.json` (`"fetch:scholar": "node scripts/fetch-scholar.ts"`), `.github/workflows/github-data.yml`, `.gitignore` (`/scholar.json`), `CLAUDE.md` ("Live GitHub data" section becomes "Live GitHub and Scholar data"), `README.md`.

**Interfaces:**
- `site/lib/scholarSchema.ts`: `scholarSchema` (Zod, `.strict()` throughout), `type Scholar = z.output<typeof scholarSchema>`, `type HistoryPoint`, `emptyScholar(): Scholar`, `SCHOLAR_URL = 'https://raw.githubusercontent.com/matthiaskoenig/livermetabolism-site/github-data/scholar.json'`, `SCHOLAR_USER_ID = 'xD9IjnYAAAAJ'`.
- `scripts/lib/scholar.ts`: `profileUrl(userId)`, `fetchProfileHtml(userId, fetchImpl = fetch): Promise<string>`, `parseProfile(html): ParsedProfile` (`{ name, sinceYear, citations: {all, since}, hIndex: {all, since}, i10Index: {all, since}, citationsPerYear: {year, count}[] }`), `mergeHistory(previous: HistoryPoint[], point: HistoryPoint): HistoryPoint[]`, `buildScholarSnapshot(parsed, previous: Scholar | null, now: Date, userId): Scholar`.

- [ ] **Step 1 (TDD):** record the profile page as `tests/fixtures/scholar/profile.html`, trimmed to the markup the parser needs (keep the `gsc_prf_in` div, the whole `gsc_rsb_st` table, and the histogram container with all `gsc_g_t` and `gsc_g_a` elements; drop scripts and the publication list). Write `scholar.test.ts`: the fixture parses to the recorded values (citations 3827/2659, since 2021, h-index 26/23, i10 36/33, 16 years starting 2011 with the first three counts 25, 46, 93 — check the fixture for the exact remaining values); a fixture with the bars shuffled/one year without a bar pairs by position; a body containing `id="gs_captcha_f"` throws "blocked"; a body without `gsc_rsb_st` throws; `mergeHistory` keeps one point per day (same day replaces), appends ascending, tolerates an empty previous; `buildScholarSnapshot` with `previous = null` starts a one-point history and with a previous snapshot carries its history forward. Then implement `scholar.ts`.
- [ ] **Step 2 (TDD):** `scholarSchema.test.ts` (a built snapshot parses, an extra key is rejected, `emptyScholar()` parses and its `fetchedAt` sorts before any real one) → implement `scholarSchema.ts`.
- [ ] **Step 3:** `fetch-scholar.ts`: `argv[2]` (default `./scholar.json`) is both the previous-snapshot path (if it exists and validates; otherwise a warning and `null`) and the output path; fetch with `fetchProfileHtml`, parse, build, validate with `scholarSchema`, write via temp file + rename; log one line with the headline numbers and the history length; exit 1 with the message on any failure (nothing written). Run it locally once to a scratch path and inspect the result.
- [ ] **Step 4:** workflow: restructure `github-data.yml` so the worktree is prepared before the Scholar step:

```yaml
      - run: npm run fetch:github -- github.json
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Prepare the github-data worktree
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
      - name: Fetch Google Scholar
        continue-on-error: true
        run: npm run fetch:scholar -- ../data/scholar.json
      - name: Commit to the github-data branch
        run: |
          cp github.json ../data/github.json
          cd ../data
          git add github.json scholar.json 2>/dev/null || git add github.json
          if git diff --cached --quiet; then echo "no change"; exit 0; fi
          git commit -m "Update data snapshots $(date -u +%Y-%m-%dT%H:%MZ)"
          git push origin HEAD:github-data
```

- [ ] **Step 5:** docs, `.gitignore`, the spec and plan files; full verification; commit in groups; PR; auto-merge; wait.
- [ ] **Step 6 (after merge):** `gh workflow run github-data.yml --ref main`, wait, confirm `curl -s $SCHOLAR_URL` parses with `scholarSchema` (one history point) and that `github.json` is still present on the branch. If the Scholar step was blocked by Google on the runner, report the log line; the page task still proceeds with the schema (the build falls back to `emptyScholar()`).

---

### Task 2: Publications page — summary strip, charts, live refresh

**Branch:** `scholar-page`

**Files:**
- Create: `site/lib/scholar.ts` (build-time `loadScholar()`), `site/lib/scholarLive.ts` (`loadLiveScholar()`, `isScholarFresherThan()`), `site/lib/scholarRows.ts` + test (`perYearRows(scholar)`, `historyRows(scholar)`, `stripValues(scholar)`), `site/lib/scholarStats.ts` + test (DOM patching of `[data-field]` text nodes and the note), `site/components/ScholarStats.astro`, `site/components/CitationsPerYearChart.vue`, `site/components/CitationHistoryChart.vue`, chart option builders added to `site/lib/chartOptions.ts` (+ tests: richText tooltips, ascending years, single-point history).
- Modify: `site/components/useChart.ts` (register `LineChart`), `site/pages/publications.astro` (`<section id="scholar">` above the tag filter; the publication count from the site data), `site/styles/global.css` (`.scholar-strip`, `.scholar-figure`, chart containers), `e2e/interactions.spec.ts` (publications page: `#scholar [data-field="citations"]` matches `/\d/`, a canvas in `#scholar` after scrolling it into view, zero console errors), `site/components/TopNav.astro` only if the Publications dropdown lists anchors (add "Citations" → `/publications/#scholar` if so), `CLAUDE.md` (islands list, the Scholar section).

**Interfaces:** islands receive plain rows as props and refresh on mount via `loadLiveScholar()`; `ScholarStats.astro` renders the strip and note statically and its bundled `<script>` patches them via `scholarStats.ts`.

- [ ] **Step 1 (TDD):** `scholarRows.test.ts` → `scholarRows.ts`; `scholar.test.ts`/`scholarLive` tests with an injected fetch (parse, HTTP error, schema mismatch, single shared fetch, null on failure, freshness).
- [ ] **Step 2:** `ScholarStats.astro` + `scholarStats.ts` + CSS; the strip renders its skeleton with hidden fields when the build-time snapshot is empty; the note says "no data yet" for the epoch.
- [ ] **Step 3:** the two chart islands + option builders; `LineChart` registration; tooltips `renderMode: 'richText'`.
- [ ] **Step 4:** page integration, e2e, docs; full verification; PR; auto-merge; wait; check the live page.

---

### Task 3: Release 0.6.0

**Branch:** `release-0.6.0`

- [ ] `package.json` and `pyproject.toml` → 0.6.0 (`uv lock` if the lockfile records the version); `release-notes/0.6.0.md` from the controller's draft with the Scholar items added; PR; auto-merge; wait; then the controller tags `0.6.0`.
