import { describe, expect, it } from 'vitest';
import { tagLabel } from './tagLabel';
import { uiFor } from './catalog';

describe('tagLabel', () => {
  it('resolves a known slug to its translated tags.label.* key', () => {
    const { t } = uiFor('en');
    expect(tagLabel('digital-twins', t, 'Digital Twins')).toBe('Digital Twins');
    expect(tagLabel('ai', t, 'AI')).toBe('AI');
  });

  it('falls back to the given tag value, not the slug, for an unmapped slug', () => {
    const { t } = uiFor('en');
    // e.g. a sixth research area added to data/tags.yml before TAG_LABEL_KEY
    // is updated - the reader should still see readable English, not a raw
    // slug like "metabolic-modeling" (pre-i18n, label was always tag.tag).
    expect(tagLabel('metabolic-modeling', t, 'Metabolic Modeling')).toBe('Metabolic Modeling');
  });

  it('falls back the same way in German', () => {
    const { t } = uiFor('de');
    expect(tagLabel('metabolic-modeling', t, 'Metabolic Modeling')).toBe('Metabolic Modeling');
    expect(tagLabel('digital-twins', t, 'Digital Twins')).toBe('Digitale Zwillinge');
  });
});
