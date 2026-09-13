/**
 * The five entity types that have a detail fragment and a modal, as a leaf
 * module: `site/lib/details.ts` builds the models at build time and pulls in
 * the YAML/Zod/snapshot machinery with it, while the browser-side router
 * (`site/lib/detailModal.ts`, bundled into the site chrome of every page) and
 * the network island need nothing but these names. Importing them from here
 * keeps that build-time weight out of the client bundle.
 *
 * `details.ts` re-exports both, so the model side keeps one import.
 */
export type DetailType = 'person' | 'publication' | 'project' | 'software' | 'news';

export const DETAIL_TYPES = ['person', 'publication', 'project', 'software', 'news'] as const;
