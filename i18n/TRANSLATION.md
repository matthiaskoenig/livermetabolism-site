# Translating this site into German

The English text in `data/*.yml` (and the English UI strings) is the source.
German is generated into the catalogs under `i18n/de/` and **never edited by
hand** - the next generation run overwrites whatever is there. If you are
reading this because you are about to translate something, work from
`npm run i18n:check`'s output, not from scanning the YAML yourself.

## Workflow

1. Run `npm run i18n:check`.
2. Translate **only** the entries it lists. Do not "improve" German text it
   did not flag, and do not translate rows it does not mention.
3. Re-run `npm run i18n:check` until it reports zero issues.

Its output names four fields per issue: `locale`, `table`, `id`, `field`
(printed as `locale/table/id.field`). Each issue has one of four kinds:

| Kind | Meaning | What to do |
|---|---|---|
| `missing` | No German entry exists yet for this field. | Translate it, write the entry with the current source hash (`sha`). |
| `stale` | The English source changed since this German text was generated (the recorded `sha` no longer matches). | Re-translate from the current English; replace the German text and `sha`. |
| `orphaned` | The German entry exists but the English row it belonged to is gone. | Delete the entry. |
| `unknown-field` | The German entry's field is not in the registry below. | Delete the entry. |

`site/lib/i18n/fields.ts` is the **single registry** of which
`<table>.<field>` pairs are translatable. Nothing outside it is translated,
regardless of what the YAML contains. As of this writing it lists:

| Table | Fields |
|---|---|
| `tags` | `short_description`, `description`, `vision` |
| `people` | `description`, `role` |
| `projects` | `title`, `abstract`, `image_title` |
| `software` | `title`, `description` |
| `editors` | `name`, `description` |
| `funding` | `title`, `description` |
| `news` | `title`, `short`, `abstract` |
| `teaching` | `title`, `content`, `caption`, `funding` |
| `meetings` | `title`, `description` |
| `activities` | `title`, `description` |

Plus the UI catalog, `i18n/de/ui.yml`, which mirrors the English strings
baked into the site chrome (`site/lib/i18n/en.ts` or equivalent) key by key.

## What is never translated

- **Bibliographic records.** The `publications`, `posters`, `presentations`,
  `abstracts` and `panels` tables are never translated - titles, abstracts,
  authors, journals, event names, all of it stays in English. A paper's
  title is its citation identity: a German rendering matches nothing in the
  literature, in Scholar, or in OpenAlex. This is not an oversight; these
  five tables are deliberately absent from `fields.ts`.
- **`tags.tag`.** Never translated. It is simultaneously a reference key, a
  URL slug, a chart series name and a filter value - translating it would
  break all four at once. As shipped, the tag chip itself also renders
  `tags.tag` verbatim on both languages (`toTagInfo()` in
  `site/lib/views.ts` copies `tag: d.tag` with no locale lookup) - there
  is currently no separate German display label for a tag, despite a
  stale comment in `site/lib/i18n/fields.ts` describing one; do not add
  translated tag-chip text unless that mechanism is actually built.
  Two of the five tag names - `"Digital Twins"` and `"AI"` - are also
  ordinary English words that appear, translated, in unrelated prose (see
  the domain glossary below and `footer.tagline`): translate the words
  when they are prose, never touch them when they are the `tag:` value or
  a `tags:` list entry.
- **Names of people, institutions and funders.** `Humboldt-Universität zu
  Berlin`, `BMFTR`, `de.NBI` stay exactly as written.
- **Identifiers and paths.** ids, DOIs, ORCIDs, PMIDs, URLs, image and PDF
  paths, dates.

### Proper nouns pinned inside otherwise-translatable UI strings

Two UI-catalog keys are ordinary translatable sentence fragments that happen
to hold a **brand name**. Translate the sentence around them; leave these
two values byte-identical to the English on every regeneration:

| Key | Value (do not change) |
|---|---|
| `research.fundingLinkText` | `de.NBI` |
| `positions.internship.linkText` | `Humboldt Internship Program` |

A regeneration pass that rewrites either of these has translated a brand
name by accident. Check them explicitly after any bulk UI-catalog run.

### Known single-language surfaces

`site/pages/site.webmanifest.ts` is one root-level file, not routed per
locale, so it cannot show German on `/de/` and English elsewhere - it has
one `name`/`short_name` for every visitor. Its `name` hard-codes
`König Lab - Systems Medicine, Digital Twins & AI` (matching the English
`footer.tagline`, not the German one). This is intentional and correct as
shipped: leave it in English. Do not "fix" it to German, and do not
expect `footer.tagline` and the manifest `name` to read the same on a
German page - they are two different surfaces with different constraints.

### `editors.name` holds role titles, not people's names

`data/editors.yml` rows look like they name a person but do not - `name`
holds a **role title**: `COMBINE coordinator`, `PETab editor`, `SBML
editor`, `SED-ML editor`. It is easy to mistake this for a proper noun and
skip it, or to mistake it for a person and refuse to translate it. Do
neither: translate the role word, keep the standard's own name as-is.

| English | German |
|---|---|
| COMBINE coordinator | COMBINE-Koordinator |
| PETab editor | PETab-Editor |
| SBML editor | SBML-Editor |
| SED-ML editor | SED-ML-Editor |

## Style rules

### Gender-inclusive language

Use **spelled-out pairs or neutral participles only.** Examples already
shipped: `Forschende`, `Studierende`, `Ingenieurinnen und Ingenieure`,
`Informatikerin oder Informatiker`, `Nachwuchswissenschaftlerinnen und
-wissenschaftler`.

Never use:
- Slash notation (`Informatiker/in`)
- The gender asterisk (`Informatiker*in`)
- The gender colon (`Informatiker:in`)

This was mixed at first (slash notation crept in during early generations)
and was deliberately unified to the spelled-out/participle style across the
whole site. Do not reintroduce the other forms even for a single entry.

### No em dash, anywhere

Never use the em dash character (Unicode U+2014), in German or English
text, including inside translated prose. Use a plain dash `-`, spaced on
both sides, in its place.

**The trap:** English source sentences sometimes use an em dash character
directly abutting the words on both sides, with no spaces, to set off a
parenthetical - for example `researchers` and `and` bracketing `especially
women`, joined with no surrounding spaces. When you translate this, it
does not become a hyphen and the words do not run together - it becomes a
*spaced* plain dash: `Forschende - insbesondere Frauen - und`. Losing the
spaces reads as an unrelated compound word in German; keeping the em dash
character reintroduces the forbidden character. Check every translated
sentence that came from an English original containing that character.

### Formal address

Use formal `Sie` throughout. The site addresses prospective students and
collaborators, not friends.

### Typography

- German quotation marks: `„…"`, not `"…"`.
- Use `ß` where the Duden does (`Schließen`, not `Schliessen`).
- No em dash (see above); plain `-` only.

### Source variant

The English side is US English: `-ize`, `color`, `center`. Do not "correct"
it to British spelling before translating from it - the German is a
translation of the American original, and "fixing" the English is out of
scope and will itself get flagged as an unrelated diff.

## Checking what the German actually asserts

A grammatically correct translation can still make a **false claim** if a
pronoun resolves to the wrong subject. This already happened once and is
worth checking for deliberately, especially on legal and consent text where
a visitor acts on what they read.

**Worked example.** The first generated cookie banner read:

> Diese Website verwendet Google Analytics, um zu verstehen, wie sie genutzt
> wird. **Sie läuft nur, wenn Sie zustimmen** - siehe die Datenschutzerklärung.

`Sie läuft` grammatically resolves to `die Website` (the nearest feminine
singular noun) - so the sentence states that **the site itself only runs if
the visitor consents**. That is not true: the site runs regardless; only
Google Analytics is gated on consent. The fix was to name Google Analytics
as the explicit subject:

> ... **Google Analytics läuft nur, wenn Sie zustimmen** - siehe die
> Datenschutzerklärung.

When translating a sentence with a pronoun, ask what noun it grammatically
binds to in German (not what you intended it to mean), and check that the
resulting claim is still true. This matters most on the cookie banner, the
impressum and the privacy page, where an incorrect claim is a legal
liability, not just an awkward sentence.

## Established vocabulary - reuse it, do not re-invent

The German text already shipped for these terms. A regeneration must match
it, not propose a new rendering.

**Publication status badges** (`Publication.status` in `src/data.py` /
`site/lib/schemas.ts`):

| Status | German |
|---|---|
| `publication` | Publikation |
| `review` | Übersichtsartikel |
| `proceeding` | Tagungsband |
| `thesis` | Abschlussarbeit |
| `preprint` | Preprint (unübersetzt) |
| `abstract` | Abstract (unübersetzt) |
| `report` | Bericht - already translated in `i18n/de/ui.yml` (`status.report`), currently unused by `data/publications.yml`. |
| `chapter` | Buchkapitel - already translated in `i18n/de/ui.yml` (`status.chapter`), currently unused by `data/publications.yml`. |

**Search index / record types** (the labels shown next to a search result
and anywhere a record's kind is named in the UI):

| English | German |
|---|---|
| news | Aktuelles |
| research area | Forschungsbereich |
| funding | Förderung |
| editorial role | Herausgeberschaft |
| teaching | Lehre |
| meeting | Tagung |
| presentation | Vortrag |
| page | Seite |
| project | Projekt |
| abstract | Abstract (unübersetzt) |
| poster | Poster (unübersetzt) |
| person | Person (unübersetzt) |
| software | Software (unübersetzt) |

**Other pinned single terms:**

| English | German | Note |
|---|---|---|
| peer-reviewed (adjective) | begutachtet | `scholar.peerReviewed` in `i18n/de/ui.yml`. Not "peer-reviewt" - that is Denglish and was rejected. This exact key shipped as the literal English string `peer-reviewed` for a time (a mixed-language regression on the German citation-stats strip, the same defect class as the citation/status badge fixes below); it is fixed as of this revision - if `i18n:check` or a page render ever shows this key in English again, treat it as the same bug and fix the catalog value, not just this guide. |
| peer-reviewed (noun phrase, e.g. "peer-reviewed papers") | Begutachtete Arbeiten | `home.linkPublicationsText` ("Begutachtete Arbeiten, Preprints und offene Datensätze aus dem Labor."). Two different keys hold two different grammatical forms of the same term - translate each to fit its own sentence, do not force one key's wording onto the other. |
| deployed (footer's deployed commit) | bereitgestellt | Not "veröffentlicht" - that word is already used for release notes (`footer.releaseNotes`) and reusing it for "deployed" would make the footer ambiguous between the two concepts. |

**Academic roles.** Use the official German terms, not literal
translations:

| English | German |
|---|---|
| Group Leader | Gruppenleiter |
| PhD student | Doktorand / Doktorandin |
| Postdoc | Postdoktorand / Postdoktorandin |
| Master Thesis | Masterarbeit |
| Bachelor Thesis | Bachelorarbeit |
| Internship | Praktikum |
| Student Assistant | Studentische Hilfskraft |
| Technical Assistant | Technische Assistentin (TA) |

Some `people.role` values in `data/people.yml` are already German. Keep
them as written rather than "correcting" them - `people.role` is in the
translatable registry, but a value that is already German needs no work,
and re-translating it risks drifting from the established wording above.

This table governs a *person's* role (`people.role`). An advertised
*position* is a different context and keeps the established
German-academic form "PostDoc" rather than "Postdoktorand/-in": the UI
keys `positions.postdoc.title`, `positions.postdoc.text1`,
`positions.postdoc.text2` and `sitePages.openPositions` already ship
"PostDoc"/"PostDoc-Stelle"/"PostDoc-Projekte" and must be left as they
are - do not "fix" them to match the table above.

**Domain glossary.**

| English | German |
|---|---|
| digital twin | digitaler Zwilling |
| AI | KI - already shipped in `home.visionAfter` ("KI-gestützte Modelle") and in `footer.tagline` ("... & KI"). Only in prose; the `"AI"` tag name itself is never translated (see `tags.tag` above). |
| systems medicine | Systemmedizin |
| systems biology | Systembiologie |
| liver | Leber |
| metabolism | Stoffwechsel |
| hepatic | hepatisch |
| whole-slide image | Ganzschnittbild |
| digital pathology | digitale Pathologie |
| pharmacokinetics | Pharmakokinetik |
| physiologically based | physiologiebasiert |
| open science | Open Science (unübersetzt) |
| FAIR data | FAIR-Daten |
| machine learning | maschinelles Lernen |
| research area | Forschungsbereich |
| peer-reviewed | begutachtet (adjective) / Begutachtete Arbeiten (noun phrase - see the pinned-terms table above for which key gets which form) |
| open access | Open Access (unübersetzt) |
| preprint | Preprint (unübersetzt) |
| grant | Förderung |
| funding | Förderung |
| teaching | Lehre |
| course | Kurs |
| lecture | Vorlesung |
| seminar | Seminar |

Established English terms that the German-language field itself already
uses (Open Science, Open Access, Preprint, Repository, Commit, Release)
stay English - do not translate a loanword the site has already adopted.

## HTML-bearing fields vs. plain-text UI strings

These are two different rules for two different kinds of field. Do not mix
them up.

### UI-catalog values are always plain text

**No UI-catalog value (`i18n/de/ui.yml`) is ever rendered as HTML.** A
catalog string must be plain text - no tags, no entities beyond what YAML
itself needs. Where a sentence needs an inline link (like the cookie
banner's link to the privacy page), the sentence is **split into
fragments** in the catalog and the anchor element lives in the Astro/Vue
template, built from those fragments with plain `{t('...')}`
interpolations - never by assembling an HTML string from catalog text and
feeding it to `set:html`.

This rule exists because the German catalog is machine-generated: a
`set:html` fed by generated text is an injection surface, since nothing
downstream of the generation step re-validates that the text is inert
markup rather than something a later regeneration accidentally makes
executable. This was found and fixed **twice** during this work (once on
the cookie-consent banner, see the worked example above; the UI-catalog
migration task generalized the fix). Do not reintroduce `set:html` (or
equivalent) over any catalog value, however convenient it looks for a
single sentence with a link in the middle.

### Some data fields keep their HTML - translate text nodes only

**The rule is by cause, not by a fixed list:** any field whose value
reaches `DetailModel.body` (built in `site/lib/details.ts`) or is bound
with Vue's `v-html` anywhere in `site/components/` is markup-bearing,
whether or not today's data for that field happens to contain a tag. A
field can be markup-bearing and still look like plain text in every
current row - the first row that gains an inline link is what exposes it,
so check the code path, not the current YAML content, when in doubt.

As of this writing, the markup-bearing fields are:

- `news.abstract`
- `news.short`
- `people.description`
- `projects.abstract` - reaches `DetailModel.body` via `details.ts`'s
  project model, and `ProjectCard.vue` calls `stripHtml(project.abstract)`
  on the card preview, which only makes sense if the field can carry
  markup.
- `software.description` - reaches `DetailModel.body` via `details.ts`'s
  software model.
- `teaching.content`
- `teaching.caption`
- `teaching.funding`

For these fields: translate the text nodes, and leave every tag,
attribute, `href` and `src` byte-identical to the English source, with the
same elements in the same order. Do not add, remove, or reorder markup;
do not translate a URL, a class name, or an attribute value.

## Placeholders

Tokens like `{query}`, `{tag}`, `{date}`, `{n}` and similar must survive
verbatim in the German text:

- Keep the exact token, including the braces and the name inside them.
  Never translate the name inside the braces (`{n}` stays `{n}`, not `{anzahl}`).
- Place the token wherever German word order requires for the sentence to
  read naturally - the token's *position* can move, its *contents* cannot.
- Read the resulting German sentence with a plausible substitution in mind
  and confirm it is grammatical, including case (`{tag}` substituted into
  a dative slot must still make sense as a German noun phrase around it).

## Dates

`date_display` in the data holds English-formatted text and is **not**
translated. `site/lib/i18n/dates.ts` reformats dates for German display
programmatically. Leave `date_display` values alone; do not hand-translate
month names or date order.

## YAML indentation

`js-yaml` (the parser the Astro build uses) follows YAML 1.2, which
requires the continuation lines of a multi-line quoted string to be
indented **deeper than their key**. A generated German block whose
continuation lines are flush with the key builds locally with PyYAML but
fails the Astro build with "deficient indentation". After writing or
editing any `i18n/de/*.yml` file by hand, either keep continuation lines
indented deeper than their key, or run:

```bash
uv run python scripts/reindent_yaml.py
```

(`--check` reports without writing.) It re-indents only the continuation
lines and refuses to write if `yaml.safe_load()` no longer returns the
same object - so it is safe to run after every catalog edit.

## The legal pages invert the direction

`i18n/de/pages/impressum.yml` and `i18n/de/pages/privacy.yml` are the
**source**, not a generated target: they are authored directly in German,
because the German text is the legally binding one for a site operated
under German law. Their English counterparts under `i18n/en/pages/` are
*generated from the German*, in the opposite direction from every other
table on this site.

When asked to translate the legal pages, translate the German **into**
English faithfully, add nothing beyond what the German says, and keep the
generated English page's line stating that only the German version is
legally binding. Never treat English as the source for these two files,
and never hand-edit the generated English side directly - edit the German
source and regenerate.
