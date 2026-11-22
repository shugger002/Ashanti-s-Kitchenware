import { Pool, type PoolConfig } from "pg";

function requiredUrl(kind: "runtime" | "migrate"): string {
  const url =
    kind === "migrate"
      ? process.env.DIRECT_URL || process.env.DATABASE_URL
      : process.env.DATABASE_URL;
  if (!url) {
    throw new Error(kind === "migrate" ? "DIRECT_URL or DATABASE_URL is not set" : "DATABASE_URL is not set");
  }
  return url;
}

export function isSupabaseUrl(url: string) {
  return /supabase\.(co|com)/i.test(url);
}

export function databaseSsl(url: string): PoolConfig["ssl"] {
  const flag = process.env.DATABASE_SSL;
  if (flag === "false" || flag === "0") return undefined;
  if (isSupabaseUrl(url)) {
    // Transaction/session pooler presents a chain that Node verify-full rejects.
    return { rejectUnauthorized: false };
  }
  if (flag === "true" || flag === "1" || process.env.VERCEL) {
    return { rejectUnauthorized: true };
  }
  return undefined;
}

function withoutSslMode(url: string) {
  return url
    .replace(/([?&])sslmode=[^&]*/g, "$1")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");
}

/**
 * The session pooler (port 5432) refuses new clients once pool_size is full.
 * Serverless checkouts use the transaction pooler (port 6543) instead.
 * Migrations stay on the session/direct URI.
 */
export function databaseUrlForPool(url: string, kind: "runtime" | "migrate" = "runtime") {
  const stripped = isSupabaseUrl(url) ? withoutSslMode(url) : url;
  if (kind !== "runtime") return stripped;
  return stripped.replace(/(pooler\.supabase\.(?:com|co)):5432(?=\/|\?|$)/i, "$1:6543");
}

export function createPgPool(kind: "runtime" | "migrate" = "runtime"): Pool {
  const connectionString = databaseUrlForPool(requiredUrl(kind), kind);
  const onVercel = Boolean(process.env.VERCEL);
  return new Pool({
    connectionString,
    ssl: databaseSsl(connectionString),
    max: onVercel ? 1 : 10,
    idleTimeoutMillis: onVercel ? 5_000 : 10_000,
    // Serverless + paused Postgres: first handshake often exceeds 8s.
    connectionTimeoutMillis: onVercel ? 20_000 : 8_000,
    allowExitOnIdle: onVercel,
    statement_timeout: onVercel ? 20_000 : 8_000,
    idle_in_transaction_session_timeout: 15_000,
  });
}
