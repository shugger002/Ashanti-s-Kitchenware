import { shopHours } from "@/config/brand";
import { formatGhs } from "@/lib/money";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { getAppUrl } from "@/server/env";
import { escapeHtml, sendEmail } from "@/server/notifications/email";
import { getStorefrontConfig } from "@/server/store/settings";

type OrderRow = {
  id: string;
  public_ref: string;
  email: string | null;
  full_name: string;
  phone: string;
  delivery_method: string;
  address_line1: string | null;
  city: string | null;
  region: string | null;
  total: string;
};

type ItemRow = {
  product_name: string;
  quantity: number;
  line_total: string;
};

function fulfilmentLine(order: OrderRow) {
  if (order.delivery_method === "collection") {
    return "Collection at 108 Dansoman-Sakaman, Alui Mahama Street, Blue Lagoon Loop, Accra.";
  }
  const where = [order.address_line1, order.city, order.region].filter(Boolean).join(", ");
  return where
    ? `Delivery to ${where}. Delivery cost and timing are confirmed on WhatsApp.`
    : "Delivery cost and timing are confirmed on WhatsApp.";
}

export async function sendPaidOrderEmails(orderId: string) {
  try {
    await sendPaidOrderEmailsUnsafe(orderId);
  } catch (error) {
    console.error("paid order email failed", error);
  }
}

async function sendPaidOrderEmailsUnsafe(orderId: string) {
  const orderResult = await query<OrderRow>(sql`
    SELECT id, public_ref, email, full_name, phone, delivery_method,
           address_line1, city, region, total::text
      FROM orders WHERE id = ${orderId}
  `);
  const order = orderResult.rows[0];
  if (!order) return;

  const items = await query<ItemRow>(sql`
    SELECT product_name, quantity, line_total::text
      FROM order_items WHERE order_id = ${orderId}
     ORDER BY id
  `);
  const { contact } = await getStorefrontConfig();
  const whatsappDigits = contact.whatsappE164.replace(/\D/g, "");
  const whatsapp = whatsappDigits ? `https://wa.me/${whatsappDigits}` : contact.phoneDisplay;
  const track = `${getAppUrl()}/orders/track?ref=${encodeURIComponent(order.public_ref)}`;
  const lines = items.rows
    .map((item) => `${item.quantity} × ${item.product_name} — ${formatGhs(item.line_total)}`)
    .join("\n");
  const htmlLines = items.rows
    .map(
      (item) =>
        `<tr><td style="padding:6px 0;">${escapeHtml(String(item.quantity))} × ${escapeHtml(item.product_name)}</td><td style="padding:6px 0;text-align:right;">${escapeHtml(formatGhs(item.line_total))}</td></tr>`,
    )
    .join("");
  const fulfil = fulfilmentLine(order);

  if (order.email) {
    await sendEmail({
      to: order.email,
      subject: `We have your order ${order.public_ref}`,
      text: [
        `Hello ${order.full_name},`,
        "",
        `Ashanti's Kitchenware has your order ${order.public_ref}.`,
        "",
        lines,
        "",
        `Total: ${formatGhs(order.total)}`,
        fulfil,
        `Shop hours: ${shopHours}`,
        "",
        `Track: ${track}`,
        `WhatsApp the shop: ${whatsapp}`,
      ].join("\n"),
      html: `
        <p>Hello ${escapeHtml(order.full_name)},</p>
        <p>Ashanti's Kitchenware has your order <strong>${escapeHtml(order.public_ref)}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;">${htmlLines}
          <tr><td style="padding-top:12px;"><strong>Total</strong></td><td style="padding-top:12px;text-align:right;"><strong>${escapeHtml(formatGhs(order.total))}</strong></td></tr>
        </table>
        <p>${escapeHtml(fulfil)}</p>
        <p>Shop hours: ${escapeHtml(shopHours)}</p>
        <p><a href="${escapeHtml(track)}">Track this order</a><br />
        <a href="${escapeHtml(whatsapp)}">WhatsApp the shop</a></p>
      `,
    });
  }

  await sendEmail({
    to: contact.email,
    replyTo: order.email ?? undefined,
    subject: `Paid order ${order.public_ref}`,
    text: [
      `${order.full_name} paid for ${order.public_ref}.`,
      `Phone: ${order.phone}`,
      order.email ? `Email: ${order.email}` : null,
      "",
      lines,
      "",
      `Total: ${formatGhs(order.total)}`,
      fulfil,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
