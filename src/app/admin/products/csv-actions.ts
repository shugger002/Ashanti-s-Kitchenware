"use server";

import { requirePermission } from "@/server/auth/authorize";
import { runProductCsvImport } from "@/server/catalog/import-file";
import { importAsanteContainerStock } from "@/server/catalog/container-stock";
import type { ProductCsvResult } from "@/lib/desk-import";
import { revalidatePath } from "next/cache";

export type ProductCsvState = ProductCsvResult | null;

export async function loadContainerStock(): Promise<ProductCsvResult> {
  try {
    const user = await requirePermission("products.write");
    const result = await importAsanteContainerStock(user.id);
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/shop");
    return result;
  } catch (error) {
    const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest?: string }).digest) : "";
    if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")) throw error;
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not load the container list.",
      created: [],
      skipped: [],
      attached: [],
      unmatched: [],
      errors: [],
    };
  }
}

export async function importProductsCsv(
  _prev: ProductCsvState,
  formData: FormData,
): Promise<ProductCsvResult> {
  try {
    const user = await requirePermission("products.write");
    return await runProductCsvImport(formData, user);
  } catch (error) {
    const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest?: string }).digest) : "";
    if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")) throw error;
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not import that file.",
      created: [],
      skipped: [],
      attached: [],
      unmatched: [],
      errors: [],
    };
  }
}
