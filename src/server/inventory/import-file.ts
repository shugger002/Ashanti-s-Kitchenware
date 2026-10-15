import { applyInventoryCsv, listInventory } from "@/server/inventory/service";
import { assertTableUploadSize, extractSpreadsheetText } from "@/lib/table-upload";
import { parseInventoryCsv } from "@/server/inventory/csv";
import type { InventoryCsvResult } from "@/lib/desk-import";
import { revalidatePath } from "next/cache";
import type { AdminUser } from "@/server/auth/types";

export type { InventoryCsvResult };

const empty = {
  updated: [] as { sku: string; from: number; to: number }[],
  skipped: [] as string[],
  errors: [] as string[],
};

export async function runInventoryCsvImport(formData: FormData, user: AdminUser): Promise<InventoryCsvResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a CSV or PDF file first.", ...empty };
  }
  try {
    assertTableUploadSize(file.size);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The file is too large.",
      ...empty,
    };
  }
  let text = "";
  try {
    text = await extractSpreadsheetText(file);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not read that file.",
      ...empty,
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
      ...empty,
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
    message: applied > 0 ? `Updated ${applied} SKU${applied === 1 ? "" : "s"}.` : "No shelf counts changed.",
    updated: result.updated,
    skipped: result.skipped,
    errors,
  };
}
