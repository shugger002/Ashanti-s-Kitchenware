import { shopHours } from "@/config/brand";
import { formatGhs } from "@/lib/money";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { getAppUrl } from "@/server/env";
import { claimNotification } from "@/server/notifications/claim";
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

async function loadOrder(orderId: string) {
  const orderResult = await query<OrderRow>(sql`
    SELECT id, public_ref, email, full_name, phone, delivery_method,
           address_line1, city, region, total::text
      FROM orders WHERE id = ${orderId}
  `);
  const order = orderResult.rows[0];
  if (!order) return null;
  const items = await query<ItemRow>(sql`
    SELECT product_name, quantity, line_total::text
      FROM order_items WHERE order_id = ${orderId}
     ORDER BY id
  `);
  return { order, items: items.rows };
}

export async function sendPaidOrderEmails(orderId: string) {
  try {
    if (!(await claimNotification(`order-paid:${orderId}`))) return;
    const loaded = await loadOrder(orderId);
    if (!loaded) return;
    const { order, items } = loaded;
    const { contact } = await getStorefrontConfig();
    const whatsappDigits = contact.whatsappE164.replace(/\D/g, "");
    const whatsapp = whatsappDigits ? `https://wa.me/${whatsappDigits}` : contact.phoneDisplay;
    const track = `${getAppUrl()}/orders/track?ref=${encodeURIComponent(order.public_ref)}`;
    const lines = items.map((item) => `${item.quantity} × ${item.product_name} — ${formatGhs(item.line_total)}`).join("\n");
    const htmlLines = items
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
          `Ashanti's Kitchenware has your paid order ${order.public_ref}.`,
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
        <p>Ashanti's Kitchenware has your paid order <strong>${escapeHtml(order.public_ref)}</strong>.</p>
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
  } catch (error) {
    console.error("paid order email failed", error);
  }
}

export async function sendPackedOrderEmail(orderId: string, toStatus: string) {
  try {
    if (!(await claimNotification(`order-packed:${orderId}:${toStatus}`))) return;
    const loaded = await loadOrder(orderId);
    if (!loaded?.order.email) return;
    const { order, items } = loaded;
    const track = `${getAppUrl()}/orders/track?ref=${encodeURIComponent(order.public_ref)}`;
    const lines = items.map((item) => `${item.quantity} × ${item.product_name}`).join("\n");
    const heading =
      toStatus === "ready_for_collection"
        ? "Your order is packed and ready at the Accra shop."
        : "Your order is packed and on its way. Delivery timing is confirmed on WhatsApp.";
    await sendEmail({
      to: order.email,
      subject: `Order ${order.public_ref} is packed`,
      text: [`Hello ${order.full_name},`, "", heading, "", lines, "", `Track: ${track}`].join("\n"),
    });
  } catch (error) {
    console.error("packed order email failed", error);
  }
}

export async function sendFailedPaymentEmail(orderId: string) {
  try {
    if (!(await claimNotification(`order-pay-failed:${orderId}`))) return;
    const loaded = await loadOrder(orderId);
    if (!loaded?.order.email) return;
    const { order } = loaded;
    const track = `${getAppUrl()}/orders/track?ref=${encodeURIComponent(order.public_ref)}`;
    await sendEmail({
      to: order.email,
      subject: `Payment for ${order.public_ref} did not go through`,
      text: [
        `Hello ${order.full_name},`,
        "",
        `We could not confirm payment for order ${order.public_ref}. The order is not treated as paid.`,
        "Try checkout again, or WhatsApp the shop.",
        "",
        `Track: ${track}`,
      ].join("\n"),
    });
  } catch (error) {
    console.error("failed payment email failed", error);
  }
}
