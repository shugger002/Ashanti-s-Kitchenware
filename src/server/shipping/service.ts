import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";

export type ShippingRate = {
  id: string;
  name: string;
  amount: string;
  zoneName: string;
  isActive: boolean;
};

export type ShippingRateAdmin = ShippingRate & {
  zoneId: string;
  regionMatch: string | null;
  zoneActive: boolean;
};

export async function listAllShippingRates(): Promise<ShippingRateAdmin[]> {
  try {
  const result = await query<{
    id: string;
    name: string;
    amount: string;
    is_active: boolean;
    zone_id: string;
    zone_name: string;
    region_match: string | null;
    zone_active: boolean;
  }>(sql`
    SELECT r.id, r.name, r.amount::text, r.is_active, z.id AS zone_id,
            z.name AS zone_name, z.region_match, z.is_active AS zone_active
     FROM shipping_rates r
     JOIN shipping_zones z ON z.id = r.zone_id
     ORDER BY z.name, r.amount
  `);
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    amount: row.amount,
    zoneName: row.zone_name,
    isActive: row.is_active,
    zoneId: row.zone_id,
    regionMatch: row.region_match,
    zoneActive: row.zone_active,
  }));
  } catch {
    return [];
  }
}

export async function setShippingRateActive(rateId: string, isActive: boolean): Promise<void> {
  await query(sql`UPDATE shipping_rates SET is_active = ${isActive} WHERE id = ${rateId}`);
}

export async function listActiveShippingRates(): Promise<ShippingRate[]> {
  try {
    const result = await query<{
      id: string;
      name: string;
      amount: string;
      zone_name: string;
      is_active: boolean;
    }>(sql`
      SELECT r.id, r.name, r.amount::text, z.name AS zone_name, r.is_active
       FROM shipping_rates r
       JOIN shipping_zones z ON z.id = r.zone_id
       WHERE r.is_active = TRUE AND z.is_active = TRUE
       ORDER BY r.amount ASC
    `);
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      amount: row.amount,
      zoneName: row.zone_name,
      isActive: row.is_active,
    }));
  } catch {
    return [];
  }
}

export function resolveShippingAmount(
  rates: ShippingRate[],
  rateId: string | undefined,
): { amount: number; rate: ShippingRate } {
  if (rates.length === 0) {
    throw new Error("Delivery rates are not configured yet. Choose collection or contact the store.");
  }
  const rate = rateId ? rates.find((item) => item.id === rateId) : rates[0];
  if (!rate) throw new Error("Unknown shipping rate");
  return { amount: Number(rate.amount), rate };
}
