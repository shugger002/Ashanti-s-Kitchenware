import { requirePermission } from "@/server/auth/authorize";
import { listInventory } from "@/server/inventory/service";

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

export async function GET() {
  await requirePermission("inventory.write");
  const rows = await listInventory();
  const lines = ["sku,restock,on_hand"];
  for (const row of rows) {
    lines.push(`${csvCell(row.sku)},,${row.onHand}`);
  }
  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="inventory-restock.csv"',
      "Cache-Control": "no-store",
    },
  });
}
