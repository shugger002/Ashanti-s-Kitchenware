import { requirePermission } from "@/server/auth/authorize";
import { listInventory } from "@/server/inventory/service";
import { csvCell } from "@/lib/csv";

export async function GET() {
  await requirePermission("inventory.write");
  const rows = await listInventory();
  const lines = ["sku,restock,on_hand"];
  for (const row of rows) {
    lines.push(`${csvCell(row.sku)},,${row.onHand}`);
  }
  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="inventory-restock.csv"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
