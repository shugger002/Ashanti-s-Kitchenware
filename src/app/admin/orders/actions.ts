"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/auth/authorize";
import { addOrderNote, transitionOrder } from "@/server/orders/service";
import { recordManualPayment } from "@/server/checkout/service";

function touchOrders(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function transitionOrderAction(formData: FormData) {
  const actor = await requirePermission("orders.write");
  const orderId = String(formData.get("orderId"));
  await transitionOrder({
    orderId,
    toStatus: String(formData.get("toStatus")),
    actorUserId: actor.id,
    note: String(formData.get("note") ?? ""),
    trackingNumber: String(formData.get("trackingNumber") || "") || undefined,
  });
  touchOrders(orderId);
}

export async function addOrderNoteAction(formData: FormData) {
  const actor = await requirePermission("orders.write");
  const orderId = String(formData.get("orderId"));
  await addOrderNote(orderId, actor.id, String(formData.get("note")));
  touchOrders(orderId);
}

export async function capturePaymentAction(formData: FormData) {
  const actor = await requirePermission("payments.capture");
  const orderId = String(formData.get("orderId"));
  await recordManualPayment({
    orderId,
    providerRef: String(formData.get("providerRef")),
    actorUserId: actor.id,
    note: String(formData.get("note") ?? "Manual capture"),
  });
  touchOrders(orderId);
}
