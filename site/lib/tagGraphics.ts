/**
 * The graphics of each research area, keyed by the tag slug
 * (`slugify(tag.tag)`): the decorative artwork and the area's colour.
 *
 * Several consumers share them: `site/pages/index.astro` paints the artwork
 * as the background of the tag section, `scripts/lib/graph-thumbs.ts` derives
 * the topic hub thumbnails of the network graph from the same files and rings
 * them in the area's colour, and the charts colour their series by it — so
 * the maps live here instead of in a page or a chart module. This module is
 * free of imports on purpose: the thumbnail generator runs it through Node's
 * type stripping, which cannot resolve an extensionless import.
 */
export const TAG_GRAPHICS: Record<string, string> = {
  'digital-twins': 'digital_twins_upscayl_3x_digital-art-4x.webp',
  'ai': 'ai_upscayl_3x_digital-art-4x.webp',
  'digital-pathology': 'digital_pathology_upscayl_3x_digital-art-4x.webp',
  'pharmacometrics': 'pharmacometrics_upscayl_3x_digital-art-4x.webp',
  'open-fair': 'fair_open_upscayl_3x_digital-art-4x.webp',
};

/**
 * The research-area colours by tag slug, repeating the `--color-tag-*`
 * tokens of `site/styles/global.css` (a canvas cannot read CSS custom
 * properties) — keep the two in sync. A tag without an entry here falls back
 * to the chart palette. Re-exported by `site/lib/chartOptions.ts`, which is
 * where the charts read it from.
 */
export const TAG_PALETTE: Record<string, string> = {
  'digital-twins': '#3498db',
  ai: '#f39c12',
  'digital-pathology': '#e74c3c',
  pharmacometrics: '#18bc9c',
  'open-fair': '#2c3e50',
};
