import { randomBytes } from "node:crypto";
import { z } from "zod";
import { parseMoney } from "@/lib/money";
import { query, withTransaction } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
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
  }>(sql`SELECT id, public_ref, payment_status FROM orders WHERE idempotency_key = ${parsed.idempotencyKey}`);
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

  const created = await withTransaction(async (db) => {
    let customerId = sessionCustomerId;
    if (customerId) {
      const owned = await db.query<{ id: string }>(
        sql`SELECT id FROM customers WHERE id = ${customerId} AND password_hash IS NOT NULL`,
      );
      if (!owned.rows[0]) throw new Error("Account not found");
      await db.query(sql`
        UPDATE customers SET full_name = ${parsed.fullName}, phone = ${parsed.phone}, email = COALESCE(${parsed.email || null}, email) WHERE id = ${customerId}
      `);
    } else {
      const inserted = await db.query<{ id: string }>(sql`
        INSERT INTO customers (email, full_name, phone)
         VALUES (${parsed.email || null}, ${parsed.fullName}, ${parsed.phone})
         RETURNING id
      `);
      customerId = inserted.rows[0].id;
    }
    if (!customerId) throw new Error("Could not attach customer");

    const orderIdResult = await db.query<{ id: string }>(sql`SELECT gen_random_uuid() AS id`);
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
      const product = await db.query<{
        id: string;
        name: string;
        sku: string;
        slug: string;
        price: string;
        sale_price: string | null;
        is_active: boolean;
        archived_at: Date | null;
      }>(sql`
        SELECT id, name, sku, slug, price::text, sale_price::text, is_active, archived_at
         FROM products WHERE id = ${item.productId}
      `);
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
        const variant = await db.query<{
          sku: string;
          name: string;
          price_override: string | null;
          is_active: boolean;
        }>(
          sql`SELECT sku, name, price_override::text, is_active FROM product_variants WHERE id = ${item.variantId} AND product_id = ${item.productId}`,
        );
        const v = variant.rows[0];
        if (!v || !v.is_active) throw new Error("Selected option is unavailable");
        sku = v.sku;
        name = `${p.name}, ${v.name}`;
        if (v.price_override) unit = parseMoney(v.price_override);
      }
      await lockAndReserve(db, {
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
    await db.query(sql`
      INSERT INTO orders (
         id, public_ref, customer_id, email, full_name, phone, delivery_method,
         address_line1, address_line2, city, region, delivery_instructions,
         status, payment_status, subtotal, shipping_amount, total, idempotency_key
       ) VALUES (
         ${orderId},${ref},${customerId},${parsed.email || null},${parsed.fullName},${parsed.phone},${parsed.deliveryMethod},${parsed.addressLine1 ?? null},${parsed.addressLine2 ?? null},${parsed.city ?? null},${parsed.region ?? null},${deliveryInstructions},
         'pending_payment','pending',${subtotal},${shippingAmount},${total},${parsed.idempotencyKey}
       )
    `);
    await db.query(sql`
      INSERT INTO order_status_history (order_id, from_status, to_status, note)
       VALUES (${orderId}, NULL, 'pending_payment', 'Order created')
    `);
    for (const line of lines) {
      await db.query(sql`
        INSERT INTO order_items (
           order_id, product_id, variant_id, product_name, sku, unit_price, quantity, line_total
         ) VALUES (${orderId},${line.productId},${line.variantId},${line.name},${line.sku},${line.unitPrice},${line.quantity},${parseMoney(line.unitPrice * line.quantity)})
      `);
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

  await query(sql`
    INSERT INTO payments (order_id, provider, provider_ref, amount, status)
     VALUES (${created.orderId},${intent.provider},${intent.providerRef},${created.total},${intent.status})
  `);

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
  await withTransaction(async (db) => {
    const inserted = await db.query(sql`
      INSERT INTO payment_events (provider, provider_event_id, event_type, payload)
       VALUES (${input.provider}, ${input.providerEventId}, 'charge.success', ${JSON.stringify(input.payload)}::jsonb)
       ON CONFLICT (provider, provider_event_id) DO NOTHING
       RETURNING id
    `);
    if (inserted.rowCount === 0) return;

    const order = await db.query<{
      id: string;
      payment_status: string;
      total: string;
    }>(sql`SELECT id, payment_status, total::text FROM orders WHERE public_ref = ${input.publicRef} FOR UPDATE`);
    const row = order.rows[0];
    if (!row) throw new Error("Order not found");
    if (row.payment_status === "paid") return;
    if (parseMoney(row.total) !== parseMoney(input.amountGhs)) {
      throw new Error("Paid amount does not match order total");
    }
    await db.query(sql`UPDATE orders SET payment_status = 'paid', status = 'paid', updated_at = now() WHERE id = ${row.id}`);
    await db.query(sql`
      UPDATE payments SET status = 'successful', provider_ref = ${input.providerRef}, updated_at = now()
       WHERE order_id = ${row.id}
    `);
    await db.query(sql`
      INSERT INTO order_status_history (order_id, from_status, to_status, note)
       VALUES (${row.id}, 'pending_payment', 'paid', 'Payment verified')
    `);
    await convertReservationToSale(db, { orderId: row.id });
  });
}

export async function recordManualPayment(input: {
  orderId: string;
  providerRef: string;
  actorUserId: string;
  note: string;
}): Promise<void> {
  await withTransaction(async (db) => {
    const order = await db.query<{
      id: string;
      payment_status: string;
      public_ref: string;
      total: string;
    }>(sql`SELECT id, payment_status, public_ref, total::text FROM orders WHERE id = ${input.orderId} FOR UPDATE`);
    const row = order.rows[0];
    if (!row) throw new Error("Order not found");
    if (row.payment_status === "paid") return;
    await db.query(sql`UPDATE orders SET payment_status = 'paid', status = 'paid', updated_at = now() WHERE id = ${row.id}`);
    await db.query(sql`
      INSERT INTO payments (order_id, provider, provider_ref, amount, status)
       VALUES (${row.id}, 'manual', ${input.providerRef}, ${row.total}, 'successful')
    `);
    await db.query(sql`
      INSERT INTO order_status_history (order_id, from_status, to_status, actor_user_id, note)
       VALUES (${row.id}, 'pending_payment', 'paid', ${input.actorUserId}, ${input.note})
    `);
    await convertReservationToSale(db, { orderId: row.id });
    await writeAuditLog(
      {
        actorUserId: input.actorUserId,
        action: "payments.capture",
        entityType: "order",
        entityId: row.id,
        metadata: { providerRef: input.providerRef },
      },
      db,
    );
  });
}

export async function cancelUnpaidOrder(orderId: string, actorUserId: string | null): Promise<void> {
  await withTransaction(async (db) => {
    const order = await db.query<{ payment_status: string; status: string }>(
      sql`SELECT payment_status, status FROM orders WHERE id = ${orderId} FOR UPDATE`,
    );
    const row = order.rows[0];
    if (!row) throw new Error("Order not found");
    if (row.payment_status === "paid") {
      throw new Error("Paid orders cannot be cancelled this way");
    }
    await db.query(
      sql`UPDATE orders SET status = 'cancelled', payment_status = 'failed', updated_at = now() WHERE id = ${orderId}`,
    );
    await db.query(sql`
      INSERT INTO order_status_history (order_id, from_status, to_status, actor_user_id, note)
       VALUES (${orderId}, ${row.status}, 'cancelled', ${actorUserId}, 'Cancelled')
    `);
    await releaseReservation(db, { orderId });
  });
}
