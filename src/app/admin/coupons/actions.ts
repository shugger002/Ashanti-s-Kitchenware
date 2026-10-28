"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/server/auth/authorize";
import { createCoupon, DuplicateCouponError, setCouponActive, updateCoupon } from "@/server/coupons/service";

function touchCoupons() {
  revalidatePath("/admin/coupons");
  revalidatePath("/admin/promotions");
  revalidatePath("/checkout");
  revalidatePath("/cart");
}

function readCouponFields(formData: FormData) {
  const type = String(formData.get("discountType")) === "fixed" ? "fixed" : "percent";
  const maxRaw = String(formData.get("maxDiscount") ?? "").trim();
  const usesRaw = String(formData.get("maxUses") ?? "").trim();
  return {
    description: String(formData.get("description") ?? ""),
    discountType: type as "percent" | "fixed",
    discountValue: Number(formData.get("discountValue")),
    maxDiscount: maxRaw ? Number(maxRaw) : null,
    minSpend: Number(formData.get("minSpend") ?? 0),
    maxUses: usesRaw ? Number(usesRaw) : null,
  };
}

export async function addCouponAction(formData: FormData) {
  const user = await requirePermission("products.write");
  try {
    await createCoupon(
      {
        code: String(formData.get("code") ?? ""),
        ...readCouponFields(formData),
      },
      user.id,
    );
  } catch (error) {
    if (error instanceof DuplicateCouponError) {
      redirect("/admin/coupons?error=code");
    }
    throw error;
  }
  touchCoupons();
  redirect("/admin/coupons");
}

export async function updateCouponAction(formData: FormData) {
  const user = await requirePermission("products.write");
  await updateCoupon(String(formData.get("id") ?? ""), readCouponFields(formData), user.id);
  touchCoupons();
  const next = String(formData.get("next") ?? "").trim();
  if (next.startsWith("/admin/coupons")) redirect(next);
}

export async function toggleCouponAction(formData: FormData) {
  const user = await requirePermission("products.write");
  await setCouponActive(String(formData.get("id")), formData.get("active") === "1", user.id);
  touchCoupons();
  const next = String(formData.get("next") ?? "").trim();
  if (next.startsWith("/admin/coupons")) redirect(next);
}
