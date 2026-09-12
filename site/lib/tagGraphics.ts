/**
 * The decorative artwork of each research area, keyed by the tag slug
 * (`slugify(tag.tag)`), relative to `public/assets/image/tags/`.
 *
 * Two consumers share it: `site/pages/index.astro` paints it as the
 * background of the tag section, and `scripts/lib/graph-thumbs.ts` derives
 * the topic hub thumbnails of the network graph from the same files — so the
 * map lives here instead of in the page.
 */
export const TAG_GRAPHICS: Record<string, string> = {
  'digital-twins': 'digital_twins_upscayl_3x_digital-art-4x.webp',
  'ai': 'ai_upscayl_3x_digital-art-4x.webp',
  'digital-pathology': 'digital_pathology_upscayl_3x_digital-art-4x.webp',
  'pharmacometrics': 'pharmacometrics_upscayl_3x_digital-art-4x.webp',
  'open-fair': 'fair_open_upscayl_3x_digital-art-4x.webp',
};
