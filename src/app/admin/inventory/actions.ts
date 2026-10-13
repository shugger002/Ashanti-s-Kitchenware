"use server";

import { requirePermission } from "@/server/auth/authorize";
import { applyInventoryCsv } from "@/server/inventory/service";
import { assertCsvSize } from "@/lib/csv";
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
    return { ok: false, message: "Choose a CSV file first.", updated: [], skipped: [], errors: [] };
  }
  try {
    assertCsvSize(file.size);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The file is too large.",
      updated: [],
      skipped: [],
      errors: [],
    };
  }
  const text = await file.text();
  const parsed = parseInventoryCsv(text);
  if (parsed.rows.length === 0) {
    return {
      ok: false,
      message: parsed.errors[0] ?? "No product rows to apply.",
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
