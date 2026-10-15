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

function connectionStringForPool(url: string) {
  if (!isSupabaseUrl(url)) return url;
  return url
    .replace(/([?&])sslmode=[^&]*/g, "$1")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");
}

export function createPgPool(kind: "runtime" | "migrate" = "runtime"): Pool {
  const connectionString = connectionStringForPool(requiredUrl(kind));
  const onVercel = Boolean(process.env.VERCEL);
  return new Pool({
    connectionString,
    ssl: databaseSsl(connectionString),
    max: onVercel ? 3 : 10,
    idleTimeoutMillis: onVercel ? 5_000 : 10_000,
    connectionTimeoutMillis: 8_000,
    allowExitOnIdle: onVercel,
    statement_timeout: 8_000,
    idle_in_transaction_session_timeout: 10_000,
  });
}
