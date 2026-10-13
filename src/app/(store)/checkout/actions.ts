"use server";

import { placeOrder } from "@/server/checkout/service";
import { readStoreCustomer } from "@/server/customers/session";

export async function submitCheckout(formData: FormData) {
  const items = JSON.parse(String(formData.get("items") ?? "[]")) as {
    productId: string;
    variantId: string | null;
    quantity: number;
  }[];
  try {
    const customer = await readStoreCustomer();
    const result = await placeOrder(
      {
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        deliveryMethod: formData.get("deliveryMethod") === "collection" ? "collection" : "delivery",
        addressLine1: String(formData.get("addressLine1") ?? ""),
        addressLine2: String(formData.get("addressLine2") ?? ""),
        city: String(formData.get("city") ?? ""),
        region: String(formData.get("region") ?? ""),
        deliveryInstructions: String(formData.get("deliveryInstructions") ?? ""),
        shippingRateId: String(formData.get("shippingRateId") || "") || undefined,
        idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
        paymentProvider: (["hubtel", "moolre", "paystack"] as const).find(
          (id) => id === formData.get("paymentProvider"),
        ),
        momoChannel: (["13", "6", "7"] as const).find((id) => id === formData.get("momoChannel")),
        items,
      },
      customer?.id,
    );
    return { ok: true as const, redirectUrl: result.redirectUrl, publicRef: result.publicRef };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Checkout failed" };
  }
}
