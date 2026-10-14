import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { assertSafeQueryText } from "@/server/db/sql";

declare global {
  var __ashantisaPool: Pool | undefined;
}

function createPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const ssl =
    process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1"
      ? { rejectUnauthorized: process.env.NODE_ENV === "production" }
      : undefined;
  return new Pool({
    connectionString: url,
    max: 10,
    ssl,
    statement_timeout: 8_000,
    idle_in_transaction_session_timeout: 10_000,
  });
}

export function getPool(): Pool {
  if (!globalThis.__ashantisaPool) {
    globalThis.__ashantisaPool = createPool();
  }
  return globalThis.__ashantisaPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  assertSafeQueryText(text);
  return getPool().query<T>(text, params);
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  const nativeQuery = client.query;
  client.query = ((config: unknown, values?: unknown, callback?: unknown) => {
    const text =
      typeof config === "string"
        ? config
        : config && typeof config === "object" && "text" in config
          ? String((config as { text: string }).text)
          : "";
    if (text) assertSafeQueryText(text);
    return nativeQuery.call(client, config as never, values as never, callback as never);
  }) as PoolClient["query"];
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.query = nativeQuery;
    client.release();
  }
}
