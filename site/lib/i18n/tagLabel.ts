import type { TFn } from './catalog';
import type { UiKey } from './ui.en';

/**
 * Maps a research-area tag's slug (`slugify(tag.tag)`, e.g. 'digital-twins' -
 * the same key `TAG_PALETTE`/`TAG_GRAPHICS` in `tagGraphics.ts` use) to its
 * translated display label via the `tags.label.*` UI-catalog keys. The tag
 * VALUE itself (a `data-tag`/`?tag=`/`?topic=` value, a chart series name, a
 * `tags:` cross-reference, the `slugify()` input) is never translated - only
 * this label is; see i18n/TRANSLATION.md's "tags.tag" section and the
 * `TRANSLATABLE` registry's comment in `site/lib/i18n/fields.ts`.
 *
 * Adding a research area to data/tags.yml means adding its slug here and its
 * `tags.label.*` key to both `ui.en.ts` and `i18n/de/ui.yml` (`loadUi()`
 * throws on a key-set mismatch, so both catalogs land in the same commit). A
 * slug missing from this map falls back to itself rather than failing the
 * build, so a forgotten label shows up as a raw slug during review instead
 * of crashing the site.
 */
const TAG_LABEL_KEY: Record<string, UiKey> = {
  'digital-twins': 'tags.label.digitalTwins',
  ai: 'tags.label.ai',
  'digital-pathology': 'tags.label.digitalPathology',
  pharmacometrics: 'tags.label.pharmacometrics',
  'open-fair': 'tags.label.openFair',
};

export function tagLabel(slug: string, t: TFn): string {
  const key = TAG_LABEL_KEY[slug];
  return key ? t(key) : slug;
}
