/**
 * Zod mirror of src/data.py. pydantic stays the schema of record; this
 * makes the Astro build fail on the same malformed data, with the same
 * normalisation: "" and null both mean "unset", a blank list field means
 * [], unknown keys are errors. A bare scalar coercing to a one-element
 * list is *not* general: pydantic's `_as_list` only applies to
 * `Project.images` (see `scalarOrList`) — every other list field
 * (`tags`, `people`, `publications`, `keywords`, `role`) only gets
 * `_none_to_list`, so a bare scalar there is a validation error, same as
 * pydantic. Dates come out as ISO YYYY-MM-DD strings so every value is a
 * plain, serialisable island prop.
 */
import { z } from 'astro/zod';

const blankToNull = (v: unknown) => (v === '' ? null : v);
const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

export const optStr = z.preprocess(blankToNull, z.string().nullable().optional());
export const reqStr = z.preprocess(blankToNull, z.string());
// pydantic's lax `int` fields (e.g. Person.end_year, Publication.year)
// coerce a numeric string (some are quoted in the YAML, e.g.
// end_year: '2025') to int, so these preprocess/coerce steps mirror that
// instead of rejecting real data.
export const optInt = z.preprocess(blankToNull, z.coerce.number().int().nullable().optional());
export const reqInt = z.coerce.number().int();
export const optNum = z.preprocess(blankToNull, z.number().nullable().optional());
// null/blank -> []; anything else must already be an array (mirrors
// pydantic's `_none_to_list`, which does NOT wrap a bare scalar).
export const strList = z.preprocess(
  (v) => (v == null || v === '' ? [] : v),
  z.array(z.string()),
);
// null/blank -> []; a bare scalar -> a one-element list; an array is kept
// as-is (mirrors pydantic's `_as_list`, used only by `Project.images`).
export const scalarOrList = z.preprocess(
  (v) => (v == null || v === '' ? [] : Array.isArray(v) ? v : [v]),
  z.array(z.string()),
);
export const optDate = z
  .preprocess(blankToNull, z.coerce.date().nullable().optional())
  .transform((d) => (d ? toIsoDate(d) : null));
export const reqDate = z.coerce.date().transform(toIsoDate);

// news.yml's `video` embeds a YouTube player directly (see NewsModal.vue);
// restrict it to the two hosts astro.config.mjs's CSP frame-src allows, so a
// bad or hand-edited URL fails the data build instead of a silently-blocked
// iframe on the live site.
const YOUTUBE_EMBED_PREFIXES = ['https://www.youtube.com/embed/', 'https://www.youtube-nocookie.com/embed/'] as const;
export const optYoutubeEmbedUrl = z.preprocess(
  blankToNull,
  z
    .string()
    .refine((v) => YOUTUBE_EMBED_PREFIXES.some((p) => v.startsWith(p)), {
      message: `video must start with ${YOUTUBE_EMBED_PREFIXES.join(' or ')}`,
    })
    .nullable()
    .optional(),
);

export const PersonStatus = z.enum(['current', 'alumni']);
export const ContentStatus = z.enum(['current', 'old']);
export const PublicationStatus = z.enum(['thesis', 'report', 'preprint', 'publication', 'review', 'proceeding', 'chapter', 'abstract']);
export const AuthorPosition = z.enum(['first', 'first_equal', 'index', 'last_equal', 'last']);
export const FundingRole = z.enum(['Recipient', 'Co-Investigator']);
export const TalkType = z.enum(['invited_talk', 'selected_talk']);
export const PanelType = z.enum(['panelist']);
export const SoftwareType = z.enum(['software', 'database']);
export const TeachingType = z.enum(['lecture', 'course', 'seminar']);

// `id` is optional here because Astro's file() loader may lift it out of
// the row; code always reads `entry.id`, never `entry.data.id`.
const id = z.string().optional();

export const tagSchema = z.object({
  id, order: z.number().default(0), tag: reqStr, icon: reqStr, short_description: reqStr, description: reqStr, vision: reqStr,
}).strict();

export const countryFlagsSchema = z.record(z.string(), z.string());
export const countryFlagSchema = z.object({ id, flag: reqStr }).strict();

export const personSchema = z.object({
  id, order: z.number().default(0), status: PersonStatus, tenure: reqStr, name: reqStr, country: optStr, role: strList,
  image: optStr, orcid: optStr, repository: optStr, homepage: optStr, affiliation: optStr,
  description: optStr, end_year: optInt,
}).strict().refine((p) => p.status !== 'alumni' || p.end_year != null, { message: 'alumni need end_year' });

export const publicationSchema = z.object({
  id, order: z.number().default(0), tags: strList, people: strList, year: reqInt, date: optDate, pdf: optStr,
  authors: reqStr, affiliations: optStr, title: reqStr, journal: reqStr, journal_short: optStr,
  status: PublicationStatus, impact: optNum, position: AuthorPosition, doi: optStr, pmid: optInt,
  keywords: strList, homepage: optStr, repository: optStr, abstract: optStr,
}).strict();

export const projectSchema = z.object({
  id, order: z.number().default(0), tags: strList, people: strList, title: reqStr, status: ContentStatus, publications: strList,
  homepage: optStr, repository: optStr, cooperation_partners: optStr, images: scalarOrList,
  image_title: optStr, abstract: reqStr,
}).strict();

export const softwareSchema = z.object({
  id, order: z.number().default(0), tags: strList, people: strList, type: SoftwareType, name: reqStr, title: reqStr,
  description: reqStr, image: optStr, publications: strList, homepage: optStr, repository: optStr, doi: optStr,
}).strict();

export const editorSchema = z.object({
  id, order: z.number().default(0), tags: strList, status: PersonStatus, tenure: reqStr, name: reqStr, image: optStr,
  repository: optStr, homepage: optStr, description: reqStr,
}).strict();

export const fundingSchema = z.object({
  id, order: z.number().default(0), tags: strList, funder_short: reqStr, funder: reqStr, funder_link: optStr, funder_logo: optStr,
  grant: z.preprocess((v) => (v == null || v === '' ? null : String(v)), z.string().nullable().optional()),
  start: reqStr, end: reqStr, title: reqStr, role: FundingRole, amount: reqInt,
  personal_amount: reqInt, currency: reqStr, homepage: optStr, repository: optStr, description: reqStr,
}).strict();

export const newsSchema = z.object({
  id, order: z.number().default(0), tags: strList, people: strList, status: ContentStatus, title: reqStr, date: reqDate,
  image: optStr, image2: optStr, link: optStr, short: reqStr, abstract: optStr, video: optYoutubeEmbedUrl,
}).strict();

export const teachingSchema = z.object({
  id, order: z.number().default(0), tags: strList, people: strList, title: reqStr, title_german: optStr, date: reqStr,
  type: z.preprocess((v) => (v == null ? [] : v), z.array(TeachingType)), semester: reqStr,
  authors: reqStr, location: reqStr, image: optStr, caption: optStr, funding: optStr, content: reqStr,
}).strict();

export const presentationSchema = z.object({
  id, order: z.number().default(0), tags: strList, people: strList, type: TalkType, title: reqStr, authors: reqStr,
  affiliations: optStr, image: optStr, slides: optStr, video: optStr, event: reqStr,
  event_page: optStr, date: reqDate, date_display: optStr, location: optStr, repository: optStr,
  publications: strList, abstract: optStr, keywords: strList,
}).strict();

export const posterSchema = z.object({
  id, order: z.number().default(0), tags: strList, people: strList, year: reqInt, date: reqDate, pdf: reqStr,
  image: reqStr, authors: reqStr, affiliations: reqStr, title: reqStr, event: reqStr,
  event_page: optStr, doi: optStr, keywords: strList, homepage: optStr, repository: optStr, abstract: reqStr,
}).strict();

export const panelSchema = z.object({
  id, order: z.number().default(0), people: strList, type: PanelType, title: reqStr, authors: reqStr, slides: optStr,
  video: optStr, event: reqStr, event_page: optStr, date: reqDate, location: reqStr,
  repository: optStr, publications: strList, abstract: optStr, keywords: strList,
}).strict();

export const abstractSchema = z.object({
  id, order: z.number().default(0), people: strList, year: reqInt, date: optDate, title: reqStr, pdf: optStr,
  authors: reqStr, affiliations: optStr, abstract: optStr, keywords: strList, event: optStr,
  event_page: optStr, journal: optStr, doi: optStr, homepage: optStr, repository: optStr,
}).strict();

export const meetingSchema = z.object({
  id, order: z.number().default(0), tags: strList, people: strList, title: reqStr, description: reqStr, date: reqDate,
  date_display: optStr, location: reqStr, homepage: optStr, pdf: optStr, image: optStr, repository: optStr,
}).strict();

export const activitySchema = z.object({
  id, order: z.number().default(0), tenure: reqStr, title: reqStr, description: reqStr, link: reqStr,
}).strict();

export const linkedInSchema = z.object({ id, order: z.number().default(0), date: reqDate, content: reqStr }).strict();

export type TagData = z.output<typeof tagSchema>;
export type CountryFlagData = z.output<typeof countryFlagSchema>;
export type PersonData = z.output<typeof personSchema>;
export type PublicationData = z.output<typeof publicationSchema>;
export type ProjectData = z.output<typeof projectSchema>;
export type SoftwareData = z.output<typeof softwareSchema>;
export type EditorData = z.output<typeof editorSchema>;
export type FundingData = z.output<typeof fundingSchema>;
export type NewsData = z.output<typeof newsSchema>;
export type TeachingData = z.output<typeof teachingSchema>;
export type PresentationData = z.output<typeof presentationSchema>;
export type PosterData = z.output<typeof posterSchema>;
export type PanelData = z.output<typeof panelSchema>;
export type AbstractData = z.output<typeof abstractSchema>;
export type MeetingData = z.output<typeof meetingSchema>;
export type ActivityData = z.output<typeof activitySchema>;
export type LinkedInData = z.output<typeof linkedInSchema>;
