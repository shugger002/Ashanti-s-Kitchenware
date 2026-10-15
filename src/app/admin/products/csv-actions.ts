"use server";

import { requirePermission } from "@/server/auth/authorize";
import { importProductsFromCsv } from "@/server/catalog/admin";
import { attachPhotosBySku } from "@/server/catalog/images";
import { parseProductCsv } from "@/server/catalog/csv";
import { assertTableUploadSize, extractSpreadsheetText } from "@/lib/table-upload";
import { revalidatePath } from "next/cache";

export type ProductCsvState = {
  ok: boolean;
  message: string;
  created: string[];
  skipped: string[];
  attached: string[];
  unmatched: string[];
  errors: string[];
} | null;

export async function importProductsCsv(
  _prev: ProductCsvState,
  formData: FormData,
): Promise<NonNullable<ProductCsvState>> {
  const user = await requirePermission("products.write");
  const file = formData.get("file");
  const photos = formData.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
  const empty = { created: [] as string[], skipped: [] as string[], attached: [] as string[], unmatched: [] as string[], errors: [] as string[] };
  if (!(file instanceof File) || file.size === 0) {
    if (photos.length === 0) {
      return { ok: false, message: "Choose a CSV or PDF and/or product photographs.", ...empty };
    }
    const photosResult = await attachPhotosBySku(photos);
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/shop");
    return {
      ok: photosResult.attached.length > 0,
      message:
        photosResult.attached.length > 0
          ? `Attached ${photosResult.attached.length} photograph${photosResult.attached.length === 1 ? "" : "s"}.`
          : "No photographs matched a SKU.",
      ...empty,
      attached: photosResult.attached,
      unmatched: photosResult.unmatched,
      errors: photosResult.errors,
    };
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
      message: error instanceof Error ? error.message : "Could not read that CSV or PDF.",
      ...empty,
    };
  }
  const parsed = parseProductCsv(text);
  if (parsed.rows.length === 0 && photos.length === 0) {
    return {
      ok: false,
      message: parsed.errors[0] ?? "No product rows to add.",
      ...empty,
      errors: parsed.errors,
    };
  }
  const result =
    parsed.rows.length > 0
      ? await importProductsFromCsv({ rows: parsed.rows, actorId: user.id })
      : { created: [], skipped: [], errors: [] as string[] };
  const photosResult = photos.length > 0 ? await attachPhotosBySku(photos) : { attached: [], unmatched: [], errors: [] };
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
  const errors = [...parsed.errors, ...result.errors, ...photosResult.errors];
  const created = result.created.length;
  const attached = photosResult.attached.length;
  return {
    ok: created > 0 || attached > 0,
    message:
      created > 0 || attached > 0
        ? `Added ${created} product${created === 1 ? "" : "s"}${attached > 0 ? ` and attached ${attached} photograph${attached === 1 ? "" : "s"}` : ""}.`
        : "No new products or photographs were added.",
    created: result.created,
    skipped: result.skipped,
    attached: photosResult.attached,
    unmatched: photosResult.unmatched,
    errors,
  };
}
