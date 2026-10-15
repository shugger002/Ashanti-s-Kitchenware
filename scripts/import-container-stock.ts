import { importAsanteContainerStock } from "@/server/catalog/container-stock";
import { getPool, query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";

async function main() {
  const users = await query<{ id: string }>(sql`SELECT id FROM users WHERE is_active = TRUE ORDER BY created_at ASC LIMIT 1`);
  const actorId = users.rows[0]?.id;
  if (!actorId) throw new Error("No staff user to record the import.");
  const result = await importAsanteContainerStock(actorId);
  console.log(result.message);
  console.log("created", result.created.length, "skipped", result.skipped.length, "errors", result.errors.length);
  if (result.errors.length) console.log(result.errors.join("\n"));
  await getPool().end();
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
