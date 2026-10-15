"use server";

import { requirePermission } from "@/server/auth/authorize";
import { runInventoryCsvImport } from "@/server/inventory/import-file";
import type { InventoryCsvResult } from "@/lib/desk-import";

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
