import { attachAsanteContainerPhotos } from "@/server/catalog/container-stock";
import { getPool } from "@/server/db/pool";

async function main() {
  const result = await attachAsanteContainerPhotos();
  console.log("listed", result.listed.join(", ") || "(none)");
  console.log("attached", result.attached.length);
  if (result.attached.length) console.log(result.attached.join("\n"));
  if (result.errors.length) console.log("errors\n" + result.errors.join("\n"));
  await getPool().end();
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
