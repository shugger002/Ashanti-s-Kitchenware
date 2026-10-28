"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/server/auth/authorize";
import {
  archiveProduct,
  deleteProductImage,
  DuplicateSkuError,
  setProductActive,
  setProductImagePrimary,
  upsertProduct,
} from "@/server/catalog/admin";
import { saveProductPhoto } from "@/server/catalog/images";
import { setReviewPublished } from "@/server/reviews/service";

function bool(formData: FormData, name: string): boolean {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

function touchCatalog(productId?: string) {
  revalidateTag("catalog", { expire: 0 });
  revalidatePath("/admin/products");
  if (productId) revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/shop");
}

function uniqueKind(error: unknown): "sku" | "slug" | null {
  if (error instanceof DuplicateSkuError) return "sku";
  if (!error || typeof error !== "object") return null;
  const rec = error as { code?: string; constraint?: string; message?: string };
  if (rec.code !== "23505") return null;
  const hay = `${rec.constraint ?? ""} ${rec.message ?? ""}`.toLowerCase();
  if (hay.includes("slug")) return "slug";
  return "sku";
}

export async function saveProduct(formData: FormData) {
  const user = await requirePermission("products.write");
  const id = String(formData.get("id") || "") || undefined;
  const specsRaw = String(formData.get("specifications") ?? "").trim();
  const specifications: Record<string, string> = {};
  if (specsRaw) {
    for (const line of specsRaw.split("\n")) {
      const [key, ...rest] = line.split(":");
      if (key && rest.length) specifications[key.trim()] = rest.join(":").trim();
    }
  }
  const colors =
    formData.get("colorsPresent") === "1"
      ? formData.getAll("colorName").map((name, index) => ({
          id: String(formData.getAll("colorId")[index] ?? "") || undefined,
          name: String(name),
          hex: String(formData.getAll("colorHex")[index] ?? ""),
          stock: Number(formData.getAll("colorStock")[index] ?? 0),
        }))
      : undefined;
  let savedId: string;
  try {
    savedId = await upsertProduct(
      {
        name: String(formData.get("name") ?? ""),
        sku: String(formData.get("sku") ?? ""),
        slug: String(formData.get("slug") ?? "") || undefined,
        description: String(formData.get("description") ?? ""),
        categoryId: String(formData.get("categoryId") || "") || null,
        price: Number(formData.get("price")),
        salePrice: formData.get("salePrice") ? Number(formData.get("salePrice")) : null,
        specifications,
        isActive: bool(formData, "isActive"),
        isFeatured: bool(formData, "isFeatured"),
        isNew: bool(formData, "isNew"),
        lowStockThreshold: Number(formData.get("lowStockThreshold") ?? 3),
        seoTitle: String(formData.get("seoTitle") || "") || null,
        seoDescription: String(formData.get("seoDescription") || "") || null,
        initialStock: formData.get("initialStock") ? Number(formData.get("initialStock")) : 0,
        colors,
      },
      user.id,
      id,
    );
  } catch (error) {
    const kind = uniqueKind(error);
    if (kind) {
      const dest = id ? `/admin/products/${id}` : "/admin/products/new";
      redirect(`${dest}?error=${kind}`);
    }
    throw error;
  }
  const photos = formData.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
  for (const [index, file] of photos.entries()) {
    await saveProductPhoto({
      productId: savedId,
      file,
      alt: String(formData.get("name") ?? "Product"),
      isPrimary: !id && index === 0,
    });
  }
  touchCatalog(savedId);
  redirect(`/admin/products/${savedId}`);
}

export async function setProductActiveAction(formData: FormData) {
  const user = await requirePermission("products.write");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  await setProductActive(id, active, user.id);
  touchCatalog(id);
  const next = String(formData.get("next") ?? "").trim();
  if (next.startsWith("/admin/products")) redirect(next);
}

export async function setReviewPublishedAction(formData: FormData) {
  const user = await requirePermission("products.write");
  const reviewId = String(formData.get("reviewId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  await setReviewPublished({
    reviewId,
    published: formData.get("published") === "true",
    actorUserId: user.id,
  });
  touchCatalog(productId);
}

export async function setProductImagePrimaryAction(formData: FormData) {
  await requirePermission("products.write");
  const productId = String(formData.get("productId") ?? "");
  await setProductImagePrimary(productId, String(formData.get("imageId") ?? ""));
  touchCatalog(productId);
}

export async function deleteProductImageAction(formData: FormData) {
  await requirePermission("products.write");
  const productId = String(formData.get("productId") ?? "");
  await deleteProductImage(productId, String(formData.get("imageId") ?? ""));
  touchCatalog(productId);
}

export async function archiveProductAction(formData: FormData) {
  const user = await requirePermission("products.write");
  const id = String(formData.get("id"));
  await archiveProduct(id, user.id);
  touchCatalog(id);
  redirect("/admin/products");
}
