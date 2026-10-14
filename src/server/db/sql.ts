const SQL = Symbol("sql");

export type SqlQuery = {
  readonly text: string;
  readonly values: unknown[];
  readonly [SQL]: true;
};

export function isSqlQuery(value: unknown): value is SqlQuery {
  return Boolean(value && typeof value === "object" && SQL in value);
}

function shiftPlaceholders(text: string, offset: number) {
  if (offset === 0) return text;
  return text.replace(/\$(\d+)/g, (_, n: string) => `$${Number(n) + offset}`);
}

/** Tagged template: SQL text is the command; interpolations are bound values, never concatenated. */
export function sql(strings: TemplateStringsArray, ...parts: unknown[]): SqlQuery {
  let text = strings[0] ?? "";
  const values: unknown[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (isSqlQuery(part)) {
      text += shiftPlaceholders(part.text, values.length);
      values.push(...part.values);
    } else {
      values.push(part);
      text += `$${values.length}`;
    }
    text += strings[i + 1] ?? "";
  }
  return { text, values, [SQL]: true };
}

export function sqlAnd(parts: SqlQuery[]): SqlQuery {
  if (parts.length === 0) return sql`TRUE`;
  return parts.reduce((left, right) => sql`${left} AND ${right}`);
}

/** Escape `%`, `_`, and `\` so a search term cannot widen an ILIKE pattern. */
export function escapeLike(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function likeContains(value: string) {
  return `%${escapeLike(value)}%`;
}

const STACKED_MUTATION =
  /;\s*(--|\/\*|(drop|alter|truncate|grant|revoke|create|copy|insert|update|delete)\b)/i;

export function assertSafeQueryText(text: string) {
  if (STACKED_MUTATION.test(text)) {
    throw new Error("Refused a query that looks like stacked SQL.");
  }
}
