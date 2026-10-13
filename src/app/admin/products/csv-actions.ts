"use server";

import { requirePermission } from "@/server/auth/authorize";
import { importProductsFromCsv } from "@/server/catalog/admin";
import { parseProductCsv } from "@/server/catalog/csv";
import { assertCsvSize } from "@/lib/csv";
import { revalidatePath } from "next/cache";

export type ProductCsvState = {
  ok: boolean;
  message: string;
  created: string[];
  skipped: string[];
  errors: string[];
} | null;

export async function importProductsCsv(
  _prev: ProductCsvState,
  formData: FormData,
): Promise<NonNullable<ProductCsvState>> {
  const user = await requirePermission("products.write");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a CSV file first.", created: [], skipped: [], errors: [] };
  }
  try {
    assertCsvSize(file.size);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The file is too large.",
      created: [],
      skipped: [],
      errors: [],
    };
  }
  const parsed = parseProductCsv(await file.text());
  if (parsed.rows.length === 0) {
    return {
      ok: false,
      message: parsed.errors[0] ?? "No product rows to add.",
      created: [],
      skipped: [],
      errors: parsed.errors,
    };
  }
  const result = await importProductsFromCsv({ rows: parsed.rows, actorId: user.id });
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
  const errors = [...parsed.errors, ...result.errors];
  const created = result.created.length;
  return {
    ok: created > 0,
    message: created > 0 ? `Added ${created} product${created === 1 ? "" : "s"}.` : "No new products were added.",
    created: result.created,
    skipped: result.skipped,
    errors,
  };
}
