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

function isTransientDbError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "57P01" ||
    code === "57P03" ||
    code === "08000" ||
    code === "08001" ||
    code === "08006" ||
    message.includes("connection terminated") ||
    message.includes("timeout expired") ||
    message.includes("server closed the connection")
  );
}

function resetPool() {
  const previous = globalThis.__ashantisaPool;
  globalThis.__ashantisaPool = undefined;
  void previous?.end().catch(() => undefined);
}

async function runQuery<T extends QueryResultRow>(
  exec: (text: string, values: unknown[]) => Promise<QueryResult<T>>,
  q: SqlQuery,
): Promise<QueryResult<T>> {
  assertSafeQueryText(q.text);
  return exec(q.text, q.values);
}

export async function query<T extends QueryResultRow = QueryResultRow>(q: SqlQuery): Promise<QueryResult<T>> {
  try {
    return await runQuery((text, values) => getPool().query<T>(text, values), q);
  } catch (error) {
    if (!isTransientDbError(error)) throw error;
    resetPool();
    return runQuery((text, values) => getPool().query<T>(text, values), q);
  }
}

async function connectClient() {
  try {
    return await getPool().connect();
  } catch (error) {
    if (!isTransientDbError(error)) throw error;
    resetPool();
    return getPool().connect();
  }
}

export async function withTransaction<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const client = await connectClient();
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
