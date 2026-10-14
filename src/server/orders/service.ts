import { query, withTransaction } from "@/server/db/pool";
import { likeContains, sql, sqlAnd } from "@/server/db/sql";
import { writeAuditLog } from "@/server/auth/audit";
import { hitRateLimit } from "@/server/auth/rate-limit";

export const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ["cancelled", "paid"],
  paid: ["packing", "cancelled"],
  packing: ["shipped", "ready_for_collection", "cancelled"],
  shipped: ["delivered"],
  ready_for_collection: ["collected", "cancelled"],
  delivered: [],
  collected: [],
  cancelled: [],
  refunded: [],
};

export type OrderListItem = {
  id: string;
  publicRef: string;
  fullName: string;
  phone: string;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  total: string;
  createdAt: string;
};

export async function listOrders(filters: {
  q?: string;
  status?: string;
  paymentStatus?: string;
}): Promise<OrderListItem[]> {
  const where = [];
  if (filters.q) {
    const pattern = likeContains(filters.q);
    where.push(
      sql`(public_ref ILIKE ${pattern} ESCAPE E'\\\\' OR full_name ILIKE ${pattern} ESCAPE E'\\\\' OR phone ILIKE ${pattern} ESCAPE E'\\\\')`,
    );
  }
  if (filters.status && filters.status in ORDER_TRANSITIONS) {
    where.push(sql`status = ${filters.status}`);
  }
  if (filters.paymentStatus && ["pending", "unpaid", "paid", "failed", "successful"].includes(filters.paymentStatus)) {
    where.push(sql`payment_status = ${filters.paymentStatus}`);
  }
  const result = await query<{
    id: string;
    public_ref: string;
    full_name: string;
    phone: string;
    status: string;
    payment_status: string;
    delivery_method: string;
    total: string;
    created_at: Date;
  }>(sql`
    SELECT id, public_ref, full_name, phone, status, payment_status, delivery_method, total::text, created_at
     FROM orders
     WHERE ${sqlAnd(where)}
     ORDER BY created_at DESC
     LIMIT 100
  `);
  return result.rows.map((row) => ({
    id: row.id,
    publicRef: row.public_ref,
    fullName: row.full_name,
    phone: row.phone,
    status: row.status,
    paymentStatus: row.payment_status,
    deliveryMethod: row.delivery_method,
    total: row.total,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function getOrderById(id: string) {
  const order = await query<Record<string, unknown>>(sql`SELECT * FROM orders WHERE id = ${id}`);
  if (!order.rows[0]) return null;
  const items = await query<{
    id: string;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: string;
    line_total: string;
  }>(sql`SELECT id, product_name, sku, quantity, unit_price::text, line_total::text FROM order_items WHERE order_id = ${id}`);
  const history = await query(sql`SELECT * FROM order_status_history WHERE order_id = ${id} ORDER BY created_at ASC`);
  const payments = await query(sql`SELECT * FROM payments WHERE order_id = ${id} ORDER BY created_at ASC`);
  const shipments = await query(sql`SELECT * FROM shipments WHERE order_id = ${id}`);
  return { order: order.rows[0], items: items.rows, history: history.rows, payments: payments.rows, shipments: shipments.rows };
}

export async function listOrdersForCustomer(customerId: string): Promise<OrderListItem[]> {
  const result = await query<{
    id: string;
    public_ref: string;
    full_name: string;
    phone: string;
    status: string;
    payment_status: string;
    delivery_method: string;
    total: string;
    created_at: Date;
  }>(sql`
    SELECT id, public_ref, full_name, phone, status, payment_status, delivery_method, total::text, created_at
     FROM orders
     WHERE customer_id = ${customerId}
     ORDER BY created_at DESC
     LIMIT 50
  `);
  return result.rows.map((row) => ({
    id: row.id,
    publicRef: row.public_ref,
    fullName: row.full_name,
    phone: row.phone,
    status: row.status,
    paymentStatus: row.payment_status,
    deliveryMethod: row.delivery_method,
    total: row.total,
    createdAt: row.created_at.toISOString(),
  }));
}

const ORDER_REF = /^AK-\d{8}-[0-9A-Fa-f]{6}$/;

type TrackOrderRow = {
  id: string;
  public_ref: string;
  status: string;
  payment_status: string;
  total: string;
  phone: string;
  delivery_method: string;
};

export async function findOrdersForTracking(queryText: string, ip: string | null): Promise<{
  orders: { order: TrackOrderRow; items: { id: string; product_name: string; quantity: number }[] }[];
  error?: string;
}> {
  const q = queryText.trim();
  if (!q) return { orders: [] };
  if (await hitRateLimit(`track:${ip ?? "unknown"}`, 12, ip)) {
    return { orders: [], error: "Too many lookups. Try again in 15 minutes." };
  }

  if (ORDER_REF.test(q)) {
    const byRef = await query<TrackOrderRow>(
      sql`SELECT id, public_ref, status, payment_status, total::text, phone, delivery_method
     FROM orders WHERE lower(public_ref) = lower(${q}) LIMIT 1`,
    );
    return {
      orders: await Promise.all(byRef.rows.map(async (order) => ({ order, items: await orderItems(order.id) }))),
    };
  }

  const digits = q.replace(/\D/g, "");
  if (digits.length < 9) return { orders: [] };
  const lastNine = digits.slice(-9);
  const byPhone = await query<TrackOrderRow>(sql`
    SELECT id, public_ref, status, payment_status, total::text, phone, delivery_method
     FROM orders WHERE right(regexp_replace(phone, '[^0-9]', '', 'g'), 9) = ${lastNine}
     ORDER BY created_at DESC LIMIT 5
  `);
  return {
    orders: await Promise.all(byPhone.rows.map(async (order) => ({ order, items: await orderItems(order.id) }))),
  };
}

async function orderItems(orderId: string) {
  const items = await query<{ id: string; product_name: string; quantity: number }>(
    sql`SELECT id, product_name, quantity FROM order_items WHERE order_id = ${orderId}`,
  );
  return items.rows;
}

export async function getOrderByPublicRef(publicRef: string, phone: string) {
  const order = await query<{
    id: string;
    public_ref: string;
    status: string;
    payment_status: string;
    total: string;
  }>(sql`
    SELECT id, public_ref, status, payment_status, total::text
     FROM orders WHERE public_ref = ${publicRef.trim()} AND phone = ${phone.trim()}
  `);
  if (!order.rows[0]) return null;
  const items = await query<{ id: string; product_name: string; quantity: number }>(
    sql`SELECT id, product_name, quantity FROM order_items WHERE order_id = ${order.rows[0].id}`,
  );
  return { order: order.rows[0], items: items.rows };
}

export async function transitionOrder(input: {
  orderId: string;
  toStatus: string;
  actorUserId: string;
  note?: string;
  trackingNumber?: string;
}): Promise<void> {
  await withTransaction(async (db) => {
    const current = await db.query<{ status: string }>(
      sql`SELECT status FROM orders WHERE id = ${input.orderId} FOR UPDATE`,
    );
    const from = current.rows[0]?.status;
    if (!from) throw new Error("Order not found");
    const allowed = ORDER_TRANSITIONS[from] ?? [];
    if (!allowed.includes(input.toStatus)) {
      throw new Error(`Cannot move from ${from} to ${input.toStatus}`);
    }
    await db.query(sql`UPDATE orders SET status = ${input.toStatus}, updated_at = now() WHERE id = ${input.orderId}`);
    await db.query(sql`
      INSERT INTO order_status_history (order_id, from_status, to_status, actor_user_id, note)
       VALUES (${input.orderId},${from},${input.toStatus},${input.actorUserId},${input.note ?? null})
    `);
    if (input.trackingNumber) {
      await db.query(sql`
        INSERT INTO shipments (order_id, tracking_number, status)
         VALUES (${input.orderId}, ${input.trackingNumber}, ${input.toStatus === "shipped" ? "shipped" : "pending"})
      `);
    }
    await writeAuditLog(
      {
        actorUserId: input.actorUserId,
        action: "order.transition",
        entityType: "order",
        entityId: input.orderId,
        metadata: { from, to: input.toStatus },
      },
      db,
    );
  });
}

export async function addOrderNote(orderId: string, actorUserId: string, note: string): Promise<void> {
  await query(sql`
    INSERT INTO order_status_history (order_id, from_status, to_status, actor_user_id, note)
     SELECT id, status, status, ${actorUserId}, ${note} FROM orders WHERE id = ${orderId}
  `);
}
