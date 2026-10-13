import { randomBytes } from "node:crypto";
import { z } from "zod";
import { parseMoney } from "@/lib/money";
import { query, withTransaction } from "@/server/db/pool";
import { lockAndReserve, convertReservationToSale, releaseReservation } from "@/server/inventory/service";
import { getPaymentProvider } from "@/server/payments";
import { getAppUrl } from "@/server/env";
import { writeAuditLog } from "@/server/auth/audit";
import { isDemoListing } from "@/lib/listing";

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(9).max(20),
  deliveryMethod: z.enum(["delivery", "collection"]),
  addressLine1: z.string().trim().max(200).optional(),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  region: z.string().trim().max(80).optional(),
  deliveryInstructions: z.string().trim().max(500).optional(),
  shippingRateId: z.string().uuid().optional(),
  idempotencyKey: z.string().min(8).max(80),
  paymentProvider: z.enum(["hubtel", "moolre", "paystack"]).optional(),
  momoChannel: z.enum(["13", "6", "7"]).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().nullable(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

function publicRef(): string {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `AK-${stamp}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function placeOrder(input: CheckoutInput, sessionCustomerId?: string) {
  const parsed = checkoutSchema.parse(input);
  if (parsed.deliveryMethod === "delivery") {
    if (!parsed.addressLine1 || !parsed.city || !parsed.region) {
      throw new Error("Delivery address, city, and region are required");
    }
  }

  const existing = await query<{
    id: string;
    public_ref: string;
    payment_status: string;
  }>(`SELECT id, public_ref, payment_status FROM orders WHERE idempotency_key = $1`, [
    parsed.idempotencyKey,
  ]);
  if (existing.rows[0]) {
    return { orderId: existing.rows[0].id, publicRef: existing.rows[0].public_ref, alreadyExisted: true as const };
  }

  const shippingAmount = 0;
  const deliveryInstructions =
    parsed.deliveryMethod === "delivery"
      ? [parsed.deliveryInstructions, "Delivery charge and timing to be confirmed on WhatsApp."]
          .filter((part) => part && part.trim())
          .join(" ")
      : parsed.deliveryInstructions ?? null;

  const provider = getPaymentProvider(parsed.paymentProvider);
  if (provider.id === "disabled") {
    throw new Error("Online payment is not configured. Call or WhatsApp the shop to place an order.");
  }

  const created = await withTransaction(async (client) => {
    let customerId = sessionCustomerId;
    if (customerId) {
      const owned = await client.query<{ id: string }>(
        `SELECT id FROM customers WHERE id = $1 AND password_hash IS NOT NULL`,
        [customerId],
      );
      if (!owned.rows[0]) throw new Error("Account not found");
      await client.query(
        `UPDATE customers SET full_name = $2, phone = $3, email = COALESCE($4, email) WHERE id = $1`,
        [customerId, parsed.fullName, parsed.phone, parsed.email || null],
      );
    } else {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO customers (email, full_name, phone)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [parsed.email || null, parsed.fullName, parsed.phone],
      );
      customerId = inserted.rows[0].id;
    }
    if (!customerId) throw new Error("Could not attach customer");

    const orderIdResult = await client.query<{ id: string }>(
      `SELECT gen_random_uuid() AS id`,
    );
    const orderId = orderIdResult.rows[0].id;
    const ref = publicRef();

    let subtotal = 0;
    const lines: {
      productId: string;
      variantId: string | null;
      name: string;
      sku: string;
      unitPrice: number;
      quantity: number;
    }[] = [];

    for (const item of parsed.items) {
      const product = await client.query<{
        id: string;
        name: string;
        sku: string;
        slug: string;
        price: string;
        sale_price: string | null;
        is_active: boolean;
        archived_at: Date | null;
      }>(
        `SELECT id, name, sku, slug, price::text, sale_price::text, is_active, archived_at
         FROM products WHERE id = $1`,
        [item.productId],
      );
      const p = product.rows[0];
      if (!p || !p.is_active || p.archived_at) {
        throw new Error("One or more products are no longer available");
      }
      if (isDemoListing(p.sku, p.slug)) {
        throw new Error("Demo listings are not for sale. Ask the shop for photographed stock.");
      }
      let sku = p.sku;
      let name = p.name;
      let unit = parseMoney(p.sale_price ?? p.price);
      if (item.variantId) {
        const variant = await client.query<{
          sku: string;
          name: string;
          price_override: string | null;
          is_active: boolean;
        }>(`SELECT sku, name, price_override::text, is_active FROM product_variants WHERE id = $1 AND product_id = $2`, [
          item.variantId,
          item.productId,
        ]);
        const v = variant.rows[0];
        if (!v || !v.is_active) throw new Error("Selected option is unavailable");
        sku = v.sku;
        name = `${p.name} — ${v.name}`;
        if (v.price_override) unit = parseMoney(v.price_override);
      }
      await lockAndReserve(client, {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        orderId,
      });
      subtotal += unit * item.quantity;
      lines.push({
        productId: p.id,
        variantId: item.variantId,
        name,
        sku,
        unitPrice: unit,
        quantity: item.quantity,
      });
    }

    const total = parseMoney(subtotal + shippingAmount);
    await client.query(
      `INSERT INTO orders (
         id, public_ref, customer_id, email, full_name, phone, delivery_method,
         address_line1, address_line2, city, region, delivery_instructions,
         status, payment_status, subtotal, shipping_amount, total, idempotency_key
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
         'pending_payment','pending',$13,$14,$15,$16
       )`,
      [
        orderId,
        ref,
        customerId,
        parsed.email || null,
        parsed.fullName,
        parsed.phone,
        parsed.deliveryMethod,
        parsed.addressLine1 ?? null,
        parsed.addressLine2 ?? null,
        parsed.city ?? null,
        parsed.region ?? null,
        deliveryInstructions,
        subtotal,
        shippingAmount,
        total,
        parsed.idempotencyKey,
      ],
    );
    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, note)
       VALUES ($1, NULL, 'pending_payment', 'Order created')`,
      [orderId],
    );
    for (const line of lines) {
      await client.query(
        `INSERT INTO order_items (
           order_id, product_id, variant_id, product_name, sku, unit_price, quantity, line_total
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          orderId,
          line.productId,
          line.variantId,
          line.name,
          line.sku,
          line.unitPrice,
          line.quantity,
          parseMoney(line.unitPrice * line.quantity),
        ],
      );
    }

    return { orderId, ref, total, email: parsed.email || "orders@ashantisakitchenware.com" };
  });

  const intent = await provider.createIntent({
    orderId: created.orderId,
    publicRef: created.ref,
    email: created.email,
    fullName: parsed.fullName,
    phone: parsed.phone,
    amountGhs: created.total,
    callbackUrl: `${getAppUrl()}/checkout/success?ref=${encodeURIComponent(created.ref)}`,
    momoChannel: parsed.momoChannel,
  });

  await query(
    `INSERT INTO payments (order_id, provider, provider_ref, amount, status)
     VALUES ($1,$2,$3,$4,$5)`,
    [created.orderId, intent.provider, intent.providerRef, created.total, intent.status],
  );

  return {
    orderId: created.orderId,
    publicRef: created.ref,
    redirectUrl: intent.redirectUrl,
    provider: intent.provider,
    alreadyExisted: false as const,
  };
}

export async function markOrderPaid(input: {
  publicRef: string;
  providerRef: string;
  providerEventId: string;
  provider: string;
  amountGhs: number;
  payload: Record<string, unknown>;
}): Promise<void> {
  await withTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO payment_events (provider, provider_event_id, event_type, payload)
       VALUES ($1, $2, 'charge.success', $3::jsonb)
       ON CONFLICT (provider, provider_event_id) DO NOTHING
       RETURNING id`,
      [input.provider, input.providerEventId, JSON.stringify(input.payload)],
    );
    if (inserted.rowCount === 0) return;

    const order = await client.query<{
      id: string;
      payment_status: string;
      total: string;
    }>(`SELECT id, payment_status, total::text FROM orders WHERE public_ref = $1 FOR UPDATE`, [
      input.publicRef,
    ]);
    const row = order.rows[0];
    if (!row) throw new Error("Order not found");
    if (row.payment_status === "paid") return;
    if (parseMoney(row.total) !== parseMoney(input.amountGhs)) {
      throw new Error("Paid amount does not match order total");
    }
    await client.query(
      `UPDATE orders SET payment_status = 'paid', status = 'paid', updated_at = now() WHERE id = $1`,
      [row.id],
    );
    await client.query(
      `UPDATE payments SET status = 'successful', provider_ref = $2, updated_at = now()
       WHERE order_id = $1`,
      [row.id, input.providerRef],
    );
    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, note)
       VALUES ($1, 'pending_payment', 'paid', 'Payment verified')`,
      [row.id],
    );
    await convertReservationToSale(client, { orderId: row.id });
  });
}

export async function recordManualPayment(input: {
  orderId: string;
  providerRef: string;
  actorUserId: string;
  note: string;
}): Promise<void> {
  await withTransaction(async (client) => {
    const order = await client.query<{
      id: string;
      payment_status: string;
      public_ref: string;
      total: string;
    }>(`SELECT id, payment_status, public_ref, total::text FROM orders WHERE id = $1 FOR UPDATE`, [
      input.orderId,
    ]);
    const row = order.rows[0];
    if (!row) throw new Error("Order not found");
    if (row.payment_status === "paid") return;
    await client.query(
      `UPDATE orders SET payment_status = 'paid', status = 'paid', updated_at = now() WHERE id = $1`,
      [row.id],
    );
    await client.query(
      `INSERT INTO payments (order_id, provider, provider_ref, amount, status)
       VALUES ($1, 'manual', $2, $3, 'successful')`,
      [row.id, input.providerRef, row.total],
    );
    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, actor_user_id, note)
       VALUES ($1, 'pending_payment', 'paid', $2, $3)`,
      [row.id, input.actorUserId, input.note],
    );
    await convertReservationToSale(client, { orderId: row.id });
    await writeAuditLog(
      {
        actorUserId: input.actorUserId,
        action: "payments.capture",
        entityType: "order",
        entityId: row.id,
        metadata: { providerRef: input.providerRef },
      },
      client,
    );
  });
}

export async function cancelUnpaidOrder(orderId: string, actorUserId: string | null): Promise<void> {
  await withTransaction(async (client) => {
    const order = await client.query<{ payment_status: string; status: string }>(
      `SELECT payment_status, status FROM orders WHERE id = $1 FOR UPDATE`,
      [orderId],
    );
    const row = order.rows[0];
    if (!row) throw new Error("Order not found");
    if (row.payment_status === "paid") {
      throw new Error("Paid orders cannot be cancelled this way");
    }
    await client.query(
      `UPDATE orders SET status = 'cancelled', payment_status = 'failed', updated_at = now() WHERE id = $1`,
      [orderId],
    );
    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, actor_user_id, note)
       VALUES ($1, $2, 'cancelled', $3, 'Cancelled')`,
      [orderId, row.status, actorUserId],
    );
    await releaseReservation(client, { orderId });
  });
}
