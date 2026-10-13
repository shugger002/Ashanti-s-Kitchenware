import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

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
  return getPool().query<T>(text, params);
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
