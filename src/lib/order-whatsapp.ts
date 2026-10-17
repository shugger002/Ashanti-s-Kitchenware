import { ghanaInternationalMsisdn } from "@/lib/phone-gh";

export type PackLine = {
  name: string;
  quantity: number;
  sku?: string;
};

export function packLines(items: PackLine[]): string {
  if (items.length === 0) return "No pieces listed";
  return items.map((item) => `${item.name} × ${item.quantity}`).join(" · ");
}

export function customerWhatsAppHref(input: {
  phone: string;
  publicRef: string;
  fullName: string;
  items: PackLine[];
  totalLabel?: string;
  deliveryMethod?: string;
}): string | null {
  const digits = ghanaInternationalMsisdn(input.phone);
  if (digits.length < 11) return null;
  const pack = input.items.map((item) => `• ${item.name} × ${item.quantity}`).join("\n");
  const delivery =
    input.deliveryMethod === "collection"
      ? "This is for collection at the Accra shop."
      : "Please confirm your location so we can quote the delivery charge.";
  const parts = [
    `Ashanti's Kitchenware, ${input.publicRef}`,
    `Hi ${input.fullName}, we have your order.`,
    pack || null,
    input.totalLabel ? `Total ${input.totalLabel}` : null,
    delivery,
  ].filter(Boolean);
  return `https://wa.me/${digits}?text=${encodeURIComponent(parts.join("\n\n"))}`;
}
