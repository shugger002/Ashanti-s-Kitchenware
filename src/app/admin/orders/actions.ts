"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/auth/authorize";
import { addOrderNote, transitionOrder } from "@/server/orders/service";
import { recordManualPayment } from "@/server/checkout/service";
import { confirmAdminPassword } from "@/server/ops/reauth";
import { redirect } from "next/navigation";

function touchOrders(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/pack");
}

export async function transitionOrderAction(formData: FormData) {
  const toStatus = String(formData.get("toStatus"));
  const actor =
    toStatus === "refunded" ? await requirePermission("payments.capture") : await requirePermission("orders.write");
  const orderId = String(formData.get("orderId"));
  if (toStatus === "refunded" || toStatus === "cancelled") {
    const password = String(formData.get("confirmPassword") ?? "");
    if (!(await confirmAdminPassword(actor.id, password))) {
      redirect(`/admin/orders/${orderId}?error=` + encodeURIComponent("Enter your admin password to cancel or refund."));
    }
  }
  await transitionOrder({
    orderId,
    toStatus,
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
