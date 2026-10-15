import { NextResponse } from "next/server";
import { readSessionUser } from "@/server/auth/session";
import { hasPermission } from "@/server/auth/types";
import { listInventory } from "@/server/inventory/service";
import { csvCell } from "@/lib/csv";

export async function GET() {
  const user = await readSessionUser();
  if (!user || !hasPermission(user.roles, "inventory.write")) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
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
