/** Escape `%`, `_`, and `\` so a search term cannot widen an ILIKE pattern. */
export function escapeLike(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function likeContains(value: string) {
  return `%${escapeLike(value)}%`;
}

/** Postgres LIKE/ILIKE escape character as an SQL literal (one backslash). */
export const LIKE_ESCAPE_SQL = "E'\\\\'";

const STACKED_MUTATION =
  /;\s*(--|\/\*|(drop|alter|truncate|grant|revoke|create|copy|insert|update|delete)\b)/i;

export function assertSafeQueryText(text: string) {
  if (STACKED_MUTATION.test(text)) {
    throw new Error("Refused a query that looks like stacked SQL.");
  }
}
