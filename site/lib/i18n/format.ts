/**
 * Placeholder interpolation for the UI catalogs, in a leaf module with no
 * dependencies so the browser-side chrome (githubStats.ts, the search
 * dialog) can use the same function on the same templates the build used.
 * An unknown placeholder is left in place: a visible "{tag}" in the UI is a
 * bug report, a silent "undefined" is not.
 */
export function fmt(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}
