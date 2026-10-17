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

export function formatOrderAddress(parts: Array<string | null | undefined>): string {
  return parts.map((part) => (part ?? "").trim()).filter(Boolean).join(", ");
}

export function customerWhatsAppHref(input: {
  phone: string;
  publicRef: string;
  fullName: string;
  items: PackLine[];
  totalLabel?: string;
  deliveryMethod?: string;
  address?: string;
  deliveryNote?: string;
}): string | null {
  const digits = ghanaInternationalMsisdn(input.phone);
  if (digits.length < 11) return null;

  const greetingName = input.fullName.trim() || "there";
  const pack = input.items.map((item) => `• ${item.name} × ${item.quantity}`).join("\n");
  const collection = input.deliveryMethod === "collection";
  const address = (input.address ?? "").trim();
  const note = (input.deliveryNote ?? "")
    .replace(/Delivery charge and timing to be confirmed on WhatsApp\.?/gi, "")
    .replace(/Sample order so staff can see the desk\.?/gi, "")
    .trim();

  const place = collection
    ? [
        "You asked to collect this at the Accra shop:",
        "108 Dansoman-Sakaman, Alui Mahama Street, Blue Lagoon Loop.",
        "Please tell us which day you can come.",
      ].join("\n")
    : address
      ? [
          "You asked for delivery to:",
          address,
          note ? `Note on the order: ${note}` : null,
          "Please confirm this is where you want the goods, and any landmark nearby, so we can quote the delivery charge and timing.",
        ]
          .filter(Boolean)
          .join("\n")
      : "You asked for delivery. Please send the place you want the goods, and any landmark, so we can quote the delivery charge and timing.";

  const parts = [
    "Ashanti's Kitchenware",
    `Hi ${greetingName},`,
    `We have your order ${input.publicRef}.`,
    pack || null,
    input.totalLabel ? `Goods total ${input.totalLabel}. Delivery is not in this amount.` : null,
    place,
  ].filter(Boolean);

  return `https://wa.me/${digits}?text=${encodeURIComponent(parts.join("\n\n"))}`;
}
