"use server";

import { requirePermission } from "@/server/auth/authorize";
import { applyInventoryCsv, listInventory } from "@/server/inventory/service";
import { assertTableUploadSize, extractInventorySpreadsheetText } from "@/lib/table-upload";
import { parseInventoryCsv } from "@/server/inventory/csv";
import { revalidatePath } from "next/cache";

export type InventoryCsvState = {
  ok: boolean;
  message: string;
  updated: { sku: string; from: number; to: number }[];
  skipped: string[];
  errors: string[];
} | null;

export async function importInventoryCsv(
  _prev: InventoryCsvState,
  formData: FormData,
): Promise<NonNullable<InventoryCsvState>> {
  const user = await requirePermission("inventory.write");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a CSV or PDF file first.", updated: [], skipped: [], errors: [] };
  }
  try {
    assertTableUploadSize(file.size);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The file is too large.",
      updated: [],
      skipped: [],
      errors: [],
    };
  }
  let text = "";
  try {
    text = await extractInventorySpreadsheetText(file);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not read that file.",
      updated: [],
      skipped: [],
      errors: [],
    };
  }
  const shelf = await listInventory();
  const catalog = shelf.flatMap((row) => {
    const names = [row.productName];
    if (row.variantName) names.push(`${row.productName} ${row.variantName}`, row.variantName);
    return names.map((name) => ({ sku: row.sku, name }));
  });
  const parsed = parseInventoryCsv(text, catalog);
  if (parsed.rows.length === 0) {
    return {
      ok: false,
      message: "Could not read restock rows from that file.",
      updated: [],
      skipped: [],
      errors: parsed.errors,
    };
  }
  const result = await applyInventoryCsv({ rows: parsed.rows, actorUserId: user.id });
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  const errors = [...parsed.errors, ...result.errors];
  const applied = result.updated.length;
  return {
    ok: applied > 0,
    message:
      applied > 0
        ? `Updated ${applied} SKU${applied === 1 ? "" : "s"}.`
        : "No shelf counts changed.",
    updated: result.updated,
    skipped: result.skipped,
    errors,
  };
}
