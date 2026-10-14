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

export async function createCoupon(
  input: {
    code: string;
    description: string;
    discountType: "percent" | "fixed";
    discountValue: number;
    maxDiscount: number | null;
    minSpend: number;
    maxUses: number | null;
  },
  actorId: string,
) {
  const code = input.code.trim().toUpperCase();
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
