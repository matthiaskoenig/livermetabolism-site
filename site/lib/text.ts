/** Jekyll `slugify` (default mode): lowercase, non-letter/digit runs -> "-", trimmed. */
export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
}

/** Liquid `strip_html`. */
export function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

/** Liquid `truncatewords: n` (appends "..." only when it cut). */
export function truncateWords(s: string, n: number): string {
  const words = s.trim().split(/\s+/).filter(Boolean);
  return words.length <= n ? words.join(' ') : words.slice(0, n).join(' ') + '...';
}

/** Liquid `capitalize`. */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
