import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({
    connectionString: url,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: process.env.NODE_ENV === "production" } : undefined,
  });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  const dir = path.join(process.cwd(), "db", "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const applied = await pool.query(`SELECT 1 FROM schema_migrations WHERE id = $1`, [file]);
    if (applied.rowCount) {
      console.log(`skip ${file}`);
      continue;
    }
    const sql = await readFile(path.join(dir, file), "utf8");
    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query(`INSERT INTO schema_migrations (id) VALUES ($1)`, [file]);
      await pool.query("COMMIT");
      console.log(`applied ${file}`);
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
