"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/server/auth/authorize";
import { setProductSalePrice } from "@/server/catalog/admin";
import { parseMoney } from "@/lib/money";

function touchSale(productId: string) {
  revalidateTag("catalog", { expire: 0 });
  revalidatePath("/admin/promotions");
  revalidatePath("/admin/products/discounts");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/shop");
  revalidatePath("/promo");
}

export async function applySalePriceAction(formData: FormData) {
  const user = await requirePermission("products.write");
  const productId = String(formData.get("productId") ?? "");
  const price = parseMoney(String(formData.get("price") ?? "0"));
  const next = String(formData.get("next") ?? "").trim();

  if (formData.get("clear") === "1") {
    await setProductSalePrice(productId, null, user.id);
  } else {
    const saleRaw = String(formData.get("salePrice") ?? "").trim();
    const pctRaw = String(formData.get("discountPercent") ?? "").trim();
    let sale: number | null = null;
    if (saleRaw) {
      sale = parseMoney(saleRaw);
    } else if (pctRaw) {
      const percent = Number(pctRaw);
      if (Number.isFinite(percent) && percent > 0 && percent < 100) {
        sale = parseMoney(price * (1 - percent / 100));
      }
    }
    if (sale == null || sale <= 0 || sale >= price) {
      await setProductSalePrice(productId, null, user.id);
    } else {
      await setProductSalePrice(productId, sale, user.id);
    }
  }

  touchSale(productId);
  if (next.startsWith("/admin/promotions") || next.startsWith("/admin/products/discounts")) {
    redirect(next);
  }
}
