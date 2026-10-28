"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/auth/authorize";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { setShippingRateActive } from "@/server/shipping/service";
import { updateSetting } from "@/server/store/settings";

function touchDelivery() {
  revalidatePath("/admin/delivery");
  revalidatePath("/checkout");
  revalidatePath("/admin");
}

export async function saveFulfillmentAction(formData: FormData) {
  await requirePermission("settings.write");
  await updateSetting("fulfillment", {
    coverage: formData.get("coverage") === "nationwide" ? "nationwide" : "accra",
    collectionEnabled: formData.get("collectionEnabled") === "on",
    deliveryEnabled: formData.get("deliveryEnabled") === "on",
    coverageNote: String(formData.get("coverageNote") ?? ""),
  });
  touchDelivery();
}

export async function addStaffNoteAction(formData: FormData) {
  await requirePermission("settings.write");
  const zone = await query<{ id: string }>(sql`
    INSERT INTO shipping_zones (name, region_match, is_active)
     VALUES (${String(formData.get("zoneName"))}, ${String(formData.get("regionMatch") ?? "")}, TRUE)
     RETURNING id
  `);
  await query(sql`
    INSERT INTO shipping_rates (zone_id, name, amount, is_active)
     VALUES (${zone.rows[0].id}, ${String(formData.get("rateName"))}, ${Number(formData.get("amount"))}, TRUE)
  `);
  touchDelivery();
}

export async function toggleStaffNoteAction(formData: FormData) {
  await requirePermission("settings.write");
  await setShippingRateActive(String(formData.get("rateId")), formData.get("active") === "true");
  touchDelivery();
}
