import { type Pool, type QueryResult, type QueryResultRow } from "pg";
import { createPgPool } from "@/server/db/config";
import { assertSafeQueryText, type SqlQuery } from "@/server/db/sql";

declare global {
  var __ashantisaPool: Pool | undefined;
}

export function getPool(): Pool {
  if (!globalThis.__ashantisaPool) {
    globalThis.__ashantisaPool = createPgPool("runtime");
  }
  return globalThis.__ashantisaPool;
}

export type Db = {
  query<T extends QueryResultRow = QueryResultRow>(q: SqlQuery): Promise<QueryResult<T>>;
};

async function runQuery<T extends QueryResultRow>(
  exec: (text: string, values: unknown[]) => Promise<QueryResult<T>>,
  q: SqlQuery,
): Promise<QueryResult<T>> {
  assertSafeQueryText(q.text);
  return exec(q.text, q.values);
}

export async function query<T extends QueryResultRow = QueryResultRow>(q: SqlQuery): Promise<QueryResult<T>> {
  return runQuery((text, values) => getPool().query<T>(text, values), q);
}

export async function withTransaction<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  const db: Db = {
    query: (q) => runQuery((text, values) => client.query(text, values), q),
  };
  try {
    await client.query("BEGIN");
    const result = await fn(db);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
