# Standard detail modals: design

Date: 2026-09-13
Status: approved; implemented by `docs/superpowers/plans/2026-09-13-detail-modals.md`

## Goal

One standard detail view for a person, a publication, a project, a software entry, and a news item, with the same anatomy and design principles, opened as a modal from the cards, rows, search results, and the network graph — including in place on the network page.

## Decisions

| Topic | Decision |
|---|---|
| Form | Modals (not pages). One generic shell `DetailModal.astro` in the base layout on every page; the content of each entity is prerendered at build time as a static HTML fragment under `/detail/<type>/<id>/` and fetched on first open, then cached. |
| Entities | `person`, `publication`, `project`, `software`, `news` (the five node types of the network). Presentations, posters, abstracts, funding, teaching, meetings, and editors keep their cards and appear only as related rows. |
| Anatomy | Every detail renders, in this order: (1) header — image (round photo for a person; thumbnail for project, software, news; status badge and year for a publication), title, one subtitle line, the research-area tags, a row of external links as icons; (2) figures — live numbers where they exist; (3) body — description or abstract (HTML from the data, already trusted on the cards) and keywords; (4) related — sections of compact rows (small image, title, one line) for every connected entity; a related person/publication/project/software/news row opens its own modal (in-modal browsing with a Back button), a related presentation or poster links to its card on the publications page; (5) footer — "Show in list" link to the item's card or row. |
| Subtitle lines | person: role · tenure · affiliation; publication: authors (person chips) · journal · year; project: status · cooperation partners; software: title; news: date. |
| Figures | publication: citations (OpenAlex) and open access; software: stars, latest release, open issues, last push (GitHub snapshot); person: number of publications and their summed citations. From the build-time snapshots; no runtime refresh inside the modal. |
| Relations | Derived once, symmetrically, by `buildRelations()` from the data: person ↔ publication/project/software/news/presentation/poster via `people`; publication ↔ project/software/presentation via their `publications` lists. |
| Hash scheme | A modal is addressed as `#<type>/<id>` (e.g. `#publication/Koenig2012_x`), which never clashes with element ids. Legacy hashes `#person-modal-<id>`, `#project-modal-<id>`, `#news-modal-<id>` open the corresponding modal. List anchors (`#pub-<id>`, `#project-<id>`, `#news-<id>`, `#software-<id>`, new `#person-<id>` on person cards) keep scrolling and highlighting the card or row. |
| Triggers | Any element with `data-detail="<type>:<id>"` opens the modal on click or Enter/Space: person cards and avatars, project and news cards, publication titles, software card titles, search results, and related rows inside a modal. The network graph calls `openDetail()` directly on node click; node hrefs (fallback) become `<list page>#<type>/<id>`. |
| Router | `site/lib/modals.ts` keeps `openModal`/`closeModal`/`installModalRouter` for the remaining static dialogs (site search); `site/lib/detailModal.ts` adds `openDetail(type, id)`, `closeDetail()`, a history stack for Back, hash sync (`pushState` on open, `history.back()` on close when the modal was opened from a hash-less state), fragment fetch with an in-memory cache, and `installDetailRouter()` wired by the shell's script. |
| Fragments | `site/pages/detail/[type]/[id].astro` with `export const partial = true` (Astro page partial: no doctype, no layout) rendering `<DetailView model={…} />`; the client parses the response with `DOMParser` and adopts the fragment's root element into the dialog body. Trust boundary: fragments are the site's own build output from the same origin (`connect-src 'self'`); scripts inside would not execute on adoption anyway, and none are emitted. |
| Retired | `PersonModal.vue`, `ProjectModal.vue`, `NewsModal.vue`, their renders in `people.astro`/`projects.astro`/`news.astro`, and the per-page refs computation. |
| Security | No new CSP host; no `'unsafe-inline'`; the fragment is same-origin build output; the modal script writes only nodes from the parsed fragment, never strings from the URL (the `type`/`id` from a hash are validated against `^(person|publication|project|software|news)$` and `^[A-Za-z0-9_.-]+$` before a fetch). |
| Release | 0.9.0 with `release-notes/0.9.0.md`, tagged after the last task merges. |

## Model

```ts
type DetailType = 'person' | 'publication' | 'project' | 'software' | 'news';
interface DetailLink { label: string; href: string; icon: string; external: boolean }
interface DetailFigure { label: string; value: string; href?: string }
interface RelatedRow { type: DetailType | 'presentation' | 'poster'; id: string; title: string; line: string; image: string | null; href: string /* list anchor, used for presentation/poster and as the no-JS fallback */ }
interface DetailModel {
  type: DetailType; id: string; title: string; subtitle: string /* HTML-free text; authors rendered by the view via PersonChips */;
  authors?: { text: string; people: string[] };
  image: string | null; imageShape: 'round' | 'thumb'; badge?: { text: string; cls: string };
  tags: string[]; links: DetailLink[]; figures: DetailFigure[];
  body: string /* trusted HTML from the data */; keywords: string[];
  related: { label: string; rows: RelatedRow[] }[];
  listHref: string;
}
```

Built by `detailModel(type, id, ctx)` in `site/lib/details.ts`, where `ctx` carries the loaded collections, the `PeopleMap`, the tag info, the three snapshots, and the base URL; `buildRelations(ctx)` returns the symmetric index used by every builder.

## View

`site/components/DetailView.vue` (rendered statically, one component for all types): `.detail` root with `data-detail-type`, `.detail-header` (image, `.detail-title`, `.detail-subtitle`, `TagList`, `.detail-links`), `.detail-figures`, `.detail-body`, `.detail-related` (one `.detail-related-group` per section with `.related-row` items carrying `data-detail`), `.detail-footer`. Styling in `site/styles/global.css` with the site tokens; the modal shell reuses `.modal`, `.modal-header`, `.modal-body`, `.btn-close`, adds a `.modal-back` button and a loading state.

## Testing

Vitest: `buildRelations` symmetry and coverage on the real data; `detailModel` per type (title, subtitle, links, figures, related sections, listHref, base path); `detailModal.ts` on jsdom (opens by fetching once and caching, adopts nodes, Back pops the stack, hash open/close, legacy hash mapping, invalid type/id rejected without a fetch, related-row click opens the next detail). Playwright: a publication title, a person card, a project card, a news card, and a search result open the modal with the right title and at least one related row; a related row opens the next detail and Back returns; `/publications/#publication/<id>` opens on load; the old `#person-modal-<id>` link still opens; the network page opens a modal on node click; zero console errors on every page.
