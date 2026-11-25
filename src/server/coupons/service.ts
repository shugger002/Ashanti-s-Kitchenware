import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { writeAuditLog } from "@/server/auth/audit";

export type Coupon = {
  id: string;
  code: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  max_discount: string | null;
  min_spend: string;
  max_uses: number | null;
  uses: number;
  is_active: boolean;
  created_at: Date;
};

export async function listCoupons() {
  const result = await query<Coupon>(sql`
    SELECT id, code, description, discount_type, discount_value::text, max_discount::text,
            min_spend::text, max_uses, uses, is_active, created_at
     FROM coupons
     ORDER BY created_at DESC
  `);
  return result.rows;
}

export class DuplicateCouponError extends Error {
  constructor(public code: string) {
    super(`Code ${code} is already on the desk.`);
    this.name = "DuplicateCouponError";
  }
}

type CouponWrite = {
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxDiscount: number | null;
  minSpend: number;
  maxUses: number | null;
};

function isUniqueCodeError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const rec = error as { code?: string; constraint?: string; message?: string };
  if (rec.code !== "23505") return false;
  const hay = `${rec.constraint ?? ""} ${rec.message ?? ""}`.toLowerCase();
  return hay.includes("code") || hay.includes("coupons");
}

export async function createCoupon(input: CouponWrite & { code: string }, actorId: string) {
  const code = input.code.trim().toUpperCase();
  try {
    const result = await query<{ id: string }>(sql`
    INSERT INTO coupons (code, description, discount_type, discount_value, max_discount, min_spend, max_uses)
     VALUES (${code},${input.description.trim()},${input.discountType},${input.discountValue},${input.maxDiscount},${input.minSpend},${input.maxUses})
     RETURNING id
  `);
    const id = result.rows[0]?.id;
    await writeAuditLog({
      actorUserId: actorId,
      action: "coupon.create",
      entityType: "coupon",
      entityId: id,
      metadata: { code },
    });
  } catch (error) {
    if (error instanceof DuplicateCouponError) throw error;
    if (isUniqueCodeError(error)) throw new DuplicateCouponError(code);
    throw error;
  }
}

export async function updateCoupon(id: string, input: CouponWrite, actorId: string) {
  await query(sql`
    UPDATE coupons SET
      description = ${input.description.trim()},
      discount_type = ${input.discountType},
      discount_value = ${input.discountValue},
      max_discount = ${input.maxDiscount},
      min_spend = ${input.minSpend},
      max_uses = ${input.maxUses}
     WHERE id = ${id}
  `);
  await writeAuditLog({
    actorUserId: actorId,
    action: "coupon.update",
    entityType: "coupon",
    entityId: id,
  });
}

export class CouponError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CouponError";
  }
}

export async function quoteCoupon(code: string, subtotal: number) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const result = await query<Coupon>(sql`
    SELECT id, code, description, discount_type, discount_value::text, max_discount::text,
            min_spend::text, max_uses, uses, is_active, created_at
     FROM coupons
     WHERE upper(code) = ${normalized}
  `);
  const coupon = result.rows[0];
  if (!coupon || !coupon.is_active) throw new CouponError("That code is not active.");
  if (coupon.max_uses != null && coupon.uses >= coupon.max_uses) {
    throw new CouponError("That code has been used up.");
  }
  const minSpend = Number(coupon.min_spend);
  if (subtotal + 0.001 < minSpend) {
    throw new CouponError(`This code needs a basket of at least GH₵${minSpend.toFixed(2)}.`);
  }
  const value = Number(coupon.discount_value);
  let discount = coupon.discount_type === "percent" ? (subtotal * value) / 100 : value;
  if (coupon.max_discount != null) discount = Math.min(discount, Number(coupon.max_discount));
  discount = Math.min(Math.round(discount * 100) / 100, Math.round(subtotal * 100) / 100);
  if (discount <= 0) throw new CouponError("That code does not change this order.");
  return { id: coupon.id, code: coupon.code, discount };
}

export async function setCouponActive(id: string, isActive: boolean, actorId: string) {
  await query(sql`UPDATE coupons SET is_active = ${isActive} WHERE id = ${id}`);
  await writeAuditLog({
    actorUserId: actorId,
    action: isActive ? "coupon.activate" : "coupon.deactivate",
    entityType: "coupon",
    entityId: id,
    metadata: {},
  });
}
