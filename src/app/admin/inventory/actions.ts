"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/server/auth/authorize";
import { adjustStock } from "@/server/inventory/service";
import { runInventoryCsvImport } from "@/server/inventory/import-file";
import type { InventoryCsvResult } from "@/lib/desk-import";

function touchStock() {
  revalidateTag("catalog", { expire: 0 });
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
}

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
