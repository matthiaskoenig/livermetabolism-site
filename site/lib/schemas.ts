/**
 * Zod mirror of src/data.py. pydantic stays the schema of record; this
 * makes the Astro build fail on the same malformed data, with the same
 * normalisation: "" and null both mean "unset", a blank list field means
 * [], a bare scalar in a list field means a one-element list, unknown
 * keys are errors. Dates come out as ISO YYYY-MM-DD strings so every
 * value is a plain, serialisable island prop.
 */
import { z } from 'astro/zod';

const blankToNull = (v: unknown) => (v === '' ? null : v);
const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

export const optStr = z.preprocess(blankToNull, z.string().nullable().optional());
export const reqStr = z.preprocess(blankToNull, z.string());
// pydantic's `int | None` field (e.g. Person.end_year) is lax: it coerces
// a numeric string like end_year: '2025' (quoted in the YAML) to int, so
// this preprocess step mirrors that instead of rejecting real data.
export const optInt = z.preprocess(blankToNull, z.coerce.number().int().nullable().optional());
export const optNum = z.preprocess(blankToNull, z.number().nullable().optional());
export const strList = z.preprocess(
  (v) => (v == null || v === '' ? [] : Array.isArray(v) ? v : [v]),
  z.array(z.string()),
);
export const optDate = z
  .preprocess(blankToNull, z.coerce.date().nullable().optional())
  .transform((d) => (d ? toIsoDate(d) : null));
export const reqDate = z.coerce.date().transform(toIsoDate);

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
  id, tag: reqStr, icon: reqStr, short_description: reqStr, description: reqStr, vision: reqStr,
}).strict();

export const countryFlagsSchema = z.record(z.string(), z.string());
export const countryFlagSchema = z.object({ id, flag: reqStr }).strict();

export const personSchema = z.object({
  id, status: PersonStatus, tenure: reqStr, name: reqStr, country: optStr, role: strList,
  image: optStr, orcid: optStr, repository: optStr, homepage: optStr, affiliation: optStr,
  description: optStr, end_year: optInt,
}).strict().refine((p) => p.status !== 'alumni' || p.end_year != null, { message: 'alumni need end_year' });

export const publicationSchema = z.object({
  id, tags: strList, people: strList, year: z.number().int(), date: optDate, pdf: optStr,
  authors: reqStr, affiliations: optStr, title: reqStr, journal: reqStr, journal_short: optStr,
  status: PublicationStatus, impact: optNum, position: AuthorPosition, doi: optStr, pmid: optInt,
  keywords: strList, homepage: optStr, repository: optStr, abstract: optStr,
}).strict();

export const projectSchema = z.object({
  id, tags: strList, people: strList, title: reqStr, status: ContentStatus, publications: strList,
  homepage: optStr, repository: optStr, cooperation_partners: optStr, images: strList,
  image_title: optStr, abstract: reqStr,
}).strict();

export const softwareSchema = z.object({
  id, tags: strList, people: strList, type: SoftwareType, name: reqStr, title: reqStr,
  description: reqStr, image: optStr, publications: strList, homepage: optStr, repository: optStr, doi: optStr,
}).strict();

export const editorSchema = z.object({
  id, tags: strList, status: PersonStatus, tenure: reqStr, name: reqStr, image: optStr,
  repository: optStr, homepage: optStr, description: reqStr,
}).strict();

export const fundingSchema = z.object({
  id, tags: strList, funder_short: reqStr, funder: reqStr, funder_link: optStr, funder_logo: optStr,
  grant: z.preprocess((v) => (v == null || v === '' ? null : String(v)), z.string().nullable().optional()),
  start: reqStr, end: reqStr, title: reqStr, role: FundingRole, amount: z.number().int(),
  personal_amount: z.number().int(), currency: reqStr, homepage: optStr, repository: optStr, description: reqStr,
}).strict();

export const newsSchema = z.object({
  id, tags: strList, people: strList, status: ContentStatus, title: reqStr, date: reqDate,
  image: optStr, image2: optStr, link: optStr, short: reqStr, abstract: optStr, video: optStr,
}).strict();

export const teachingSchema = z.object({
  id, tags: strList, people: strList, title: reqStr, title_german: optStr, date: reqStr,
  type: z.preprocess((v) => (v == null ? [] : v), z.array(TeachingType)), semester: reqStr,
  authors: reqStr, location: reqStr, image: optStr, caption: optStr, funding: optStr, content: reqStr,
}).strict();

export const presentationSchema = z.object({
  id, tags: strList, people: strList, type: TalkType, title: reqStr, authors: reqStr,
  affiliations: optStr, image: optStr, slides: optStr, video: optStr, event: reqStr,
  event_page: optStr, date: reqDate, date_display: optStr, location: optStr, repository: optStr,
  publications: strList, abstract: optStr, keywords: strList,
}).strict();

export const posterSchema = z.object({
  id, tags: strList, people: strList, year: z.number().int(), date: reqDate, pdf: reqStr,
  image: reqStr, authors: reqStr, affiliations: reqStr, title: reqStr, event: reqStr,
  event_page: optStr, doi: optStr, keywords: strList, homepage: optStr, repository: optStr, abstract: reqStr,
}).strict();

export const panelSchema = z.object({
  id, people: strList, type: PanelType, title: reqStr, authors: reqStr, slides: optStr,
  video: optStr, event: reqStr, event_page: optStr, date: reqDate, location: reqStr,
  repository: optStr, publications: strList, abstract: optStr, keywords: strList,
}).strict();

export const abstractSchema = z.object({
  id, people: strList, year: z.number().int(), date: optDate, title: reqStr, pdf: optStr,
  authors: reqStr, affiliations: optStr, abstract: optStr, keywords: strList, event: optStr,
  event_page: optStr, journal: optStr, doi: optStr, homepage: optStr, repository: optStr,
}).strict();

export const meetingSchema = z.object({
  id, tags: strList, people: strList, title: reqStr, description: reqStr, date: reqDate,
  date_display: optStr, location: reqStr, homepage: optStr, pdf: optStr, image: optStr, repository: optStr,
}).strict();

export const activitySchema = z.object({
  id, tenure: reqStr, title: reqStr, description: reqStr, link: reqStr,
}).strict();

export const linkedInSchema = z.object({ id, date: reqDate, content: reqStr }).strict();

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
