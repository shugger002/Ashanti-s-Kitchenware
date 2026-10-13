"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/server/auth/authorize";
import { archiveProduct, upsertProduct } from "@/server/catalog/admin";
import { setReviewPublished } from "@/server/reviews/service";

function bool(formData: FormData, name: string): boolean {
  return formData.get(name) === "on" || formData.get(name) === "true";
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
  const savedId = await upsertProduct(
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
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect(`/admin/products/${savedId}`);
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
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
}

export async function archiveProductAction(formData: FormData) {
  const user = await requirePermission("products.write");
  await archiveProduct(String(formData.get("id")), user.id);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
