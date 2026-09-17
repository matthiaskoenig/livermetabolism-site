---
name: translate-de
description: Use when German translations need regenerating - after editing English prose in data/*.yml or site/lib/i18n/ui.en.ts, after editing the German legal-page source (i18n/de/pages/impressum.yml or privacy.yml), when `npm run i18n:check` reports missing/stale/orphaned/unknown-field entries for the data tables, the UI catalog (i18n/de/ui.yml), or the page catalogs (i18n/{de,en}/pages/*.yml), or when asked to update/refresh/audit the German (or, for the legal pages, English) version of the site.
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

## What `npm run i18n:check` actually covers

Run it to see the work:

```bash
npm run i18n:check
```

It audits **the nine data tables registered in `site/lib/i18n/fields.ts`**
(`tags`, `people`, `projects`, `software`, `editors`, `funding`, `news`,
`teaching`, `meetings`) against their `i18n/de/<table>.yml`
catalogs, **the UI catalog** (`i18n/de/ui.yml`) against
`site/lib/i18n/ui.en.ts`, **and the legal-page catalogs**
(`i18n/{de,en}/pages/impressum.yml` and `.../privacy.yml`, the long-form
legal-page prose) against each other. A data-table line reads
`<locale>/<table>/<id>.<field>`, e.g.
`de/people/matthias_koenig.description`; a UI line reads
`<locale>/ui/<dotted.key>`, e.g. `de/ui/nav.publications`; a page-catalog
line reads `<locale>/pages/<page>/<field>`, e.g.
`en/pages/impressum/heading` (the UI and page catalogs have no per-row id
the way a data table does - see `auditUi()`/`auditPage()` in
`scripts/lib/i18n-check.ts` for why they print this way). The output groups
issues into three sections - "Data tables", "UI catalog", "Page catalogs" -
so you can tell at a glance which kind of catalog needs work. Every line is
grouped under one of four kinds within its section:

| Kind | Meaning | Action |
|---|---|---|
| `missing` | No translated entry for this field/key yet. | Translate it. |
| `stale` | The recorded `sha` no longer matches the current source value. | Re-translate from the current source, replace the text and `sha`. |
| `orphaned` | A data-table entry's row no longer exists in `data/<table>.yml`. Cannot occur for the UI or page catalogs - see below. | Delete the entry. |
| `unknown-field` | The entry's field/key is not in `fields.ts` (data tables), `ui.en.ts` (UI catalog), or the page's own source catalog (page catalogs). | Delete the entry. |

It exits `0` only when there is nothing left to do; otherwise it exits `1`
and ends with "Run the translate-de skill to regenerate the affected
entries."

**The legal pages invert the direction, and the audit follows it.**
`impressum` and `privacy` are authored in German (`i18n/de/pages/*.yml`,
the legally binding text), so their `i18n/en/pages/*.yml` rendering is the
*generated* side there - the opposite of every other catalog, where English
is the source. `PAGE_SOURCE_LOCALE` (`site/lib/i18n/pageLocales.ts`) says
which is which per page, and `scripts/i18n-check.ts` reads that same map
to audit the correct direction - see "The legal pages invert the
direction" in `i18n/TRANSLATION.md` for the full design, including the one
field (`bindingNotice`) that is locale-only by design and excluded from the
audit entirely. If you are asked to update `i18n/de/pages/impressum.yml`
or `privacy.yml` (the binding source), `i18n:check` will now tell you if
`i18n/en/pages/` needs regenerating from it - the same as any other source
edit.

**Why the UI and page catalogs never report `orphaned`:** both are one flat
map of key -> `{sha, text}`, not rows keyed by id the way a data table is.
A stray key that no longer exists in the source is reported as
`unknown-field` instead - the same actionable outcome (delete the entry),
just under the kind that actually fits a flat catalog's shape.

**This subsumes, but does not replace, a separate build-time guard:**
`loadUi()` (`site/lib/i18n/catalog.ts`) still throws at build/runtime if
`i18n/de/ui.yml`'s key set doesn't **exactly** match `ui.en.ts`'s - the
same condition `i18n:check`'s `missing`/`unknown-field` kinds now catch
earlier and more legibly. Keep relying on both: `i18n:check` is the fast,
CI-friendly signal; `npm run build` is the one that actually fails the
site if a key is ever missed regardless.

Earlier tasks (through Task 16a) had every entry in `i18n/de/ui.yml` carrying
a placeholder `sha: '0000000000000000'`, which made `i18n:check` report all
of them `stale` at once - that batch was cleared and every entry now carries
its real sha, computed from its actual English source the same as a data-table
entry. Do not expect to see the placeholder again; if `i18n:check` (or a page
render) ever shows one, treat it as a regression, not the normal state.

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

2. **Run `npm run i18n:check`.** This is the work list for the nine data
   tables, the UI catalog, **and** the two page catalogs
   (impressum/privacy). Translate **only** what it lists - re-translating
   current entries produces diff churn for no gain.

3. **For each listed data-table or UI entry**, read the source with
   `node scripts/i18n-sha.ts <table> <id> <field>` (prints the sha and the
   exact source value in one step - see above). For a page-catalog entry,
   use `node scripts/i18n-sha.ts pages <page> <field>` instead - it reads
   whichever locale is that page's actual source (`PAGE_SOURCE_LOCALE`;
   German for impressum/privacy) and prints it, so you always translate
   from the right side even though the direction is inverted for these two
   pages.

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

8. **The UI catalog (`i18n/de/ui.yml`) entries `npm run i18n:check` listed
   in step 2** get the same treatment as a data-table entry: translate a
   `missing`/`stale` one (source via
   `node scripts/i18n-sha.ts ui <dotted.key>`, e.g. `nav.publications` or
   `tags.label.digitalTwins`), delete an `unknown-field` one. Two UI-only
   points to keep in mind:
   - A `stale` UI entry with the placeholder `sha: '0000000000000000'`
     still needs its `text` checked against the current English and
     `i18n/TRANSLATION.md` before you trust it - the placeholder means "sha
     never computed", not "text is wrong"; it may already be correct
     German, in which case only the `sha` needs updating.
   - The five `tags.label.*` keys are the translated research-area display
     labels - a different thing from `tags.tag` (never translated, see
     `i18n/TRANSLATION.md`) and from the `tags.yml` data-table catalog
     fields (`short_description`/`description`/`vision`).

   `i18n/de/ui.yml` must also keep **exactly** the key set of `ui.en.ts` -
   do not add a key `i18n:check` didn't ask for. `loadUi()`
   (`site/lib/i18n/catalog.ts`) throws on any mismatch at build time as a
   second, independent guard - `npm run build` is where that would
   actually surface.

9. **A page-catalog (`pages/impressum`/`pages/privacy`) entry `npm run
   i18n:check` listed in step 2** goes into the *generated* locale's file
   for that page - `i18n/en/pages/<page>.yml` for impressum/privacy, since
   German is their source (`PAGE_SOURCE_LOCALE`). Entry shape is the same
   as any other catalog:

   ```yaml
   <field>:
     sha: <16 hex chars from `node scripts/i18n-sha.ts pages <page> <field>`>
     text: <the translated text>
   ```

   Skip `bindingNotice` if `i18n:check` ever lists it - it is locale-only by
   design (`PAGE_LOCALE_ONLY_FIELDS` in `site/lib/i18n/pageLocales.ts`; see
   "The legal pages invert the direction" in `i18n/TRANSLATION.md`) and
   should never actually appear as an issue; if it does, treat that as a
   bug in the exclusion list, not a translation task. Never hand-edit
   `i18n/de/pages/*.yml` as part of a *translation* run - it is the
   authored legal source, edited only when the owner actually changes the
   legal text, which is a content change, not a translation one.

10. **Verify.**

    ```bash
    npm run i18n:check        # must exit 0
    npm run check
    npx vitest run
    npm run build
    ```

11. **Commit only the catalogs** touched by the run - `i18n/de/*.yml` for a
    data-table or UI change, `i18n/en/pages/*.yml` for an impressum/privacy
    change (never `i18n/de/pages/*.yml`, the authored source) - nothing
    under `data/`, `site/`, or `scripts/`. If `npm run i18n:check` still
    reports anything, go back to step 2 rather than committing.

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
