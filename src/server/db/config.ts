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
  if (flag === "true" || flag === "1" || isSupabaseUrl(url) || process.env.VERCEL) {
    return { rejectUnauthorized: true };
  }
  return undefined;
}

export function createPgPool(kind: "runtime" | "migrate" = "runtime"): Pool {
  const connectionString = requiredUrl(kind);
  const onVercel = Boolean(process.env.VERCEL);
  return new Pool({
    connectionString,
    ssl: databaseSsl(connectionString),
    max: onVercel ? 1 : 10,
    idleTimeoutMillis: onVercel ? 5_000 : 10_000,
    connectionTimeoutMillis: 8_000,
    allowExitOnIdle: onVercel,
    statement_timeout: 8_000,
    idle_in_transaction_session_timeout: 10_000,
  });
}
