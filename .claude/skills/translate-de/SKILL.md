---
name: translate-de
description: Use when German translations need regenerating - after editing English prose in data/*.yml or site/lib/i18n/ui.en.ts, when `npm run i18n:check` reports missing/stale/orphaned/unknown-field entries, when i18n/de/ui.yml has placeholder shas ('0000000000000000') to reconcile, or when asked to update/refresh/audit the German version of the site.
---

# Regenerating the German catalogs

The English text in `data/*.yml` and `site/lib/i18n/ui.en.ts` is the source.
German lives in `i18n/de/` and is generated - never hand-edit a catalog
outside this workflow, and never edit `data/*.yml` to make a translation
fit.

**`i18n/TRANSLATION.md` is the authority on what correct German looks
like** - glossary, style rules (gender-inclusive language, no em dash,
`Sie`, quotation marks), the HTML-bearing-field rules, the placeholder
rules, and the list of known traps (pronoun-resolution errors, the
`tags.tag`-vs-`tags.label.*` split, `editors.name` holding role titles not
people's names, pinned brand names). **Read it before translating anything,
every time** - this skill only owns the mechanical workflow around it, not
translation content, and the two must never contradict each other.

## What `npm run i18n:check` actually covers - and what it does not

Run it to see the work:

```bash
npm run i18n:check
```

It audits **only the ten data tables registered in
`site/lib/i18n/fields.ts`** (`tags`, `people`, `projects`, `software`,
`editors`, `funding`, `news`, `teaching`, `meetings`, `activities`) against
their `i18n/de/<table>.yml` catalogs. Each printed line has the form
`<locale>/<table>/<id>.<field>`, e.g. `de/people/matthias_koenig.description`,
grouped under one of four kinds:

| Kind | Meaning | Action |
|---|---|---|
| `missing` | No German entry for this field yet. | Translate it. |
| `stale` | The recorded `sha` no longer matches the current English source. | Re-translate from the current English, replace the text and `sha`. |
| `orphaned` | The German entry's row no longer exists in `data/<table>.yml`. | Delete the entry. |
| `unknown-field` | The entry's field is not in `fields.ts` (e.g. a bibliographic field). | Delete the entry. |

It exits `0` only when there is nothing left to do; otherwise it exits `1`
and ends with "Run the translate-de skill to regenerate the affected
entries."

**It never looks at `i18n/de/ui.yml`.** The UI catalog is a different
mechanism entirely: `loadUi()` (`site/lib/i18n/catalog.ts`) enforces at
build/runtime that `i18n/de/ui.yml` carries **exactly** the key set of
`site/lib/i18n/ui.en.ts` (a missing or unknown key throws and fails the
build) - but nothing anywhere checks a UI entry's `sha` against its current
English source the way `i18n:check` does for the ten data tables. **A clean
`npm run i18n:check` says nothing about whether `i18n/de/ui.yml` is
current.** As of this writing every entry in `i18n/de/ui.yml` carries the
placeholder `sha: '0000000000000000'` written by hand in earlier tasks;
since nothing flags these automatically, reconciling them is a manual step
(below) - do not skip it and do not assume a clean `i18n:check` means the
site's UI strings are done.

## Computing the sha correctly

**Do not hand-copy English text into a shell command and hand-compute a
hash from it** - a field can be a multi-line YAML scalar that folds into a
single space-joined line, or a `string[]` (e.g. `people.role`) whose sha is
taken over its JSON form, not its display text, and shell-quoting arbitrary
English prose (apostrophes, quotes, `$`, backticks) is a silent way to hash
the wrong bytes with no error.

Instead, use the committed helper, which reads the row straight out of
`data/<table>.yml` (or `site/lib/i18n/ui.en.ts` for a UI key) - the exact
same values `npm run i18n:check` reads - and prints both the sha and the
exact value it covers:

```bash
node scripts/i18n-sha.ts <table> <id> <field>     # a data-table field
node scripts/i18n-sha.ts ui <dotted.key>          # a UI-catalog key
```

Verified invocations and their real output:

```
$ node scripts/i18n-sha.ts editors combine name
sha:   971c83aa87e262d3
value: "COMBINE coordinator"

$ node scripts/i18n-sha.ts people matthias_koenig role
sha:   05b509640d6a7098
value: ["Group Leader"]

$ node scripts/i18n-sha.ts people shubhankar_palwankar role
sha:   764120e7164be8a8
value: ["Master Thesis","Scientific Researcher"]

$ node scripts/i18n-sha.ts tags "Digital Twins" short_description
sha:   c03f44b3377e2d2b
value: "Physiologically based models that mirror individual patients, from molecule to whole body."

$ node scripts/i18n-sha.ts ui nav.publications
sha:   82b2eb07aaea1da8
value: "Publications"
```

For a `tags` row, `<id>` is the tag's `tag` value (e.g. `"Digital Twins"`),
matching how `i18n:check` keys that table. For an array field (currently
only `people.role`), the "value" printed is a JSON array - translate each
element and write the German `text` as a YAML list in the same order (see
shape below); do not join the items into one string.

Written this way, the printed `sha` is guaranteed to match what
`npm run i18n:check` computes, because both read the same source through
the same YAML/module loader.

## Steps

1. **Read `i18n/TRANSLATION.md`.** Every time, even on a small run - it has
   the glossary, the style rules and the traps that make a translation
   wrong even when it is fluent.

2. **Run `npm run i18n:check`.** This is the work list for the ten data
   tables. Translate **only** what it lists - re-translating current
   entries produces diff churn for no gain. (It does not surface UI-catalog
   drift; see the UI-catalog step below.)

3. **For each listed entry**, read the English source with
   `node scripts/i18n-sha.ts <table> <id> <field>` (prints the sha and the
   exact source value in one step - see above).

4. **Translate**, following `i18n/TRANSLATION.md`: plain prose for a
   `short_description`/`description`/`title`/etc., text-nodes-only for an
   HTML-bearing field (leave every tag, attribute, `href`/`src` and element
   order byte-identical), array-element-by-element for `people.role`.

5. **Write the German** into `i18n/de/<table>.yml`, creating the file with
   the header if it does not exist yet. Entry shape:

   ```yaml
   # AUTO-GENERATED by .claude/skills/translate-de. Do not edit by hand.
   <row id>:
     <field>:
       sha: <16 hex chars from the helper above>
       text: <the German text>
   ```

   An array field's `text` is a YAML list:

   ```yaml
   shubhankar_palwankar:
     role:
       sha: 764120e7164be8a8
       text:
         - Masterarbeit
         - Wissenschaftliche Hilfskraft
   ```

   For a `tags` row the catalog key is the same `tag` value used to look it
   up in step 3 (e.g. `"Digital Twins"`).

6. **Delete `orphaned` and `unknown-field` entries** reported in step 2 -
   do not try to fix or keep them.

7. **Mind YAML indentation.** `js-yaml` (YAML 1.2) rejects a multi-line
   quoted string whose continuation lines sit flush with their key -
   `PyYAML` accepts it, the Astro build does not. Keep continuation lines
   indented deeper than their key, or run:

   ```bash
   uv run python scripts/reindent_yaml.py
   ```

8. **Reconcile the UI catalog.** `npm run i18n:check` does not do this
   step for you (see above). For every key in `site/lib/i18n/ui.en.ts`
   (flattened, dotted, e.g. `nav.publications`, `tags.label.digitalTwins`):
   - Run `node scripts/i18n-sha.ts ui <key>` and compare its `sha` to the
     one recorded in `i18n/de/ui.yml` (including every placeholder
     `'0000000000000000'`, which can never match and must be replaced).
   - If the sha differs (placeholder or genuinely stale), re-check the
     German `text` against the current English and `i18n/TRANSLATION.md`;
     fix the text if it no longer matches, then write the freshly computed
     sha regardless (even when the text itself was already correct - a
     placeholder must not survive the run).
   - `i18n/de/ui.yml` must keep **exactly** the key set of `ui.en.ts` - do
     not add or drop a key (`loadUi()` throws on any mismatch at build
     time); `npm run build` is how a key-set mismatch actually surfaces.
   - The five `tags.label.*` keys are the translated research-area display
     labels - a different thing from `tags.tag` (never translated, see
     `i18n/TRANSLATION.md`) and from the `tags.yml` data-table catalog
     fields (`short_description`/`description`/`vision`).

9. **Verify.**

   ```bash
   npm run i18n:check        # must exit 0
   npm run check
   npx vitest run
   npm run build
   ```

10. **Commit only the catalogs** (`i18n/de/*.yml`), nothing under `data/`,
    `site/`, or `scripts/`. If `npm run i18n:check` still reports anything,
    go back to step 2 rather than committing.

## Never

- Never translate a bibliographic field (`publications`, `posters`,
  `presentations`, `abstracts`, `panels` are deliberately absent from
  `fields.ts`). If one shows up in a catalog, `i18n:check` reports it as
  `unknown-field` - delete it, do not add it to `fields.ts`.
- Never change an `id`, a URL, a DOI, an image path or a date.
- Never alter the markup inside an HTML-bearing field - translate text
  nodes only, keep tags/attributes/`href` byte-identical, same elements in
  the same order.
- Never drop or rename a `{placeholder}` token.
- Never put markup inside a UI-catalog value (`i18n/de/ui.yml` is always
  plain text - see `i18n/TRANSLATION.md`).
- Never edit `data/*.yml` to make a translation fit.
- Never hand-edit a German catalog outside this workflow.
- Never leave a placeholder `sha: '0000000000000000'` in place after
  touching that entry - always write the sha the helper computes.
