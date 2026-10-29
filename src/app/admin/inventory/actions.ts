"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/server/auth/authorize";
import { adjustStock } from "@/server/inventory/service";
import { runInventoryCsvImport } from "@/server/inventory/import-file";
import type { InventoryCsvResult } from "@/lib/desk-import";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";

function touchStock() {
  revalidateTag("catalog", { expire: 0 });
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/shop");
}

const soldInShopSchema = z.object({
  inventoryId: z.string().uuid(),
  qty: z.coerce.number().int().min(1).max(99),
});

export async function restockAction(formData: FormData) {
  const user = await requirePermission("inventory.write");
  const qty = Math.max(0, Number(formData.get("qty")));
  if (qty <= 0) return;
  await adjustStock({
    inventoryId: String(formData.get("inventoryId")),
    deltaOnHand: qty,
    reason: "Restock",
    notes: String(formData.get("notes") ?? ""),
    actorUserId: user.id,
    source: "restock",
  });
  touchStock();
}

export async function soldInShopAction(formData: FormData) {
  const user = await requirePermission("inventory.write");
  const parsed = soldInShopSchema.safeParse({
    inventoryId: formData.get("inventoryId"),
    qty: formData.get("qty") ?? 1,
  });
  if (!parsed.success) return;
  const row = await query<{ sku: string }>(sql`
    SELECT COALESCE(v.sku, p.sku) AS sku
     FROM inventory i
     JOIN products p ON p.id = i.product_id
     LEFT JOIN product_variants v ON v.id = i.variant_id
     WHERE i.id = ${parsed.data.inventoryId}
  `);
  const sku = row.rows[0]?.sku ?? "";
  if (!sku || sku.toUpperCase().startsWith("DEMO-")) return;
  try {
    await adjustStock({
      inventoryId: parsed.data.inventoryId,
      deltaOnHand: -parsed.data.qty,
      reason: "Sold in shop",
      notes: "",
      actorUserId: user.id,
      source: "sale",
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("reserved")) {
      throw new Error("That many are not free to sell. Some may sit in unpaid website orders.");
    }
    throw error;
  }
  touchStock();
}

export async function adjustStockAction(formData: FormData) {
  const user = await requirePermission("inventory.write");
  await adjustStock({
    inventoryId: String(formData.get("inventoryId")),
    deltaOnHand: Number(formData.get("delta")),
    reason: String(formData.get("reason") ?? "Adjustment"),
    notes: String(formData.get("notes") ?? ""),
    actorUserId: user.id,
  });
  touchStock();
}

export type InventoryCsvState = InventoryCsvResult | null;

export async function importInventoryCsv(
  _prev: InventoryCsvState,
  formData: FormData,
): Promise<InventoryCsvResult> {
  try {
    const user = await requirePermission("inventory.write");
    return await runInventoryCsvImport(formData, user);
  } catch (error) {
    const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest?: string }).digest) : "";
    if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")) throw error;
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not import that file.",
      updated: [],
      skipped: [],
      errors: [],
    };
  }
}
