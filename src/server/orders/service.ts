import { query, withTransaction } from "@/server/db/pool";
import { LIKE_ESCAPE_SQL, likeContains } from "@/server/db/sql";
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
  const where = ["TRUE"];
  const params: unknown[] = [];
  const add = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  if (filters.q) {
    const p = add(likeContains(filters.q));
    where.push(
      `(public_ref ILIKE ${p} ESCAPE ${LIKE_ESCAPE_SQL} OR full_name ILIKE ${p} ESCAPE ${LIKE_ESCAPE_SQL} OR phone ILIKE ${p} ESCAPE ${LIKE_ESCAPE_SQL})`,
    );
  }
  if (filters.status && filters.status in ORDER_TRANSITIONS) {
    where.push(`status = ${add(filters.status)}`);
  }
  if (filters.paymentStatus && ["pending", "unpaid", "paid", "failed", "successful"].includes(filters.paymentStatus)) {
    where.push(`payment_status = ${add(filters.paymentStatus)}`);
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
  }>(
    `SELECT id, public_ref, full_name, phone, status, payment_status, delivery_method, total::text, created_at
     FROM orders
     WHERE ${where.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT 100`,
    params,
  );
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
  const order = await query<Record<string, unknown>>(`SELECT * FROM orders WHERE id = $1`, [id]);
  if (!order.rows[0]) return null;
  const items = await query<{
    id: string;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: string;
    line_total: string;
  }>(
    `SELECT id, product_name, sku, quantity, unit_price::text, line_total::text FROM order_items WHERE order_id = $1`,
    [id],
  );
  const history = await query(`SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC`, [id]);
  const payments = await query(`SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at ASC`, [id]);
  const shipments = await query(`SELECT * FROM shipments WHERE order_id = $1`, [id]);
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
  }>(
    `SELECT id, public_ref, full_name, phone, status, payment_status, delivery_method, total::text, created_at
     FROM orders
     WHERE customer_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [customerId],
  );
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

  const select = `SELECT id, public_ref, status, payment_status, total::text, phone, delivery_method
     FROM orders`;

  if (ORDER_REF.test(q)) {
    const byRef = await query<TrackOrderRow>(`${select} WHERE lower(public_ref) = lower($1) LIMIT 1`, [q]);
    return {
      orders: await Promise.all(byRef.rows.map(async (order) => ({ order, items: await orderItems(order.id) }))),
    };
  }

  const digits = q.replace(/\D/g, "");
  if (digits.length < 9) return { orders: [] };
  const lastNine = digits.slice(-9);
  const byPhone = await query<TrackOrderRow>(
    `${select} WHERE right(regexp_replace(phone, '[^0-9]', '', 'g'), 9) = $1
     ORDER BY created_at DESC LIMIT 5`,
    [lastNine],
  );
  return {
    orders: await Promise.all(byPhone.rows.map(async (order) => ({ order, items: await orderItems(order.id) }))),
  };
}

async function orderItems(orderId: string) {
  const items = await query<{ id: string; product_name: string; quantity: number }>(
    `SELECT id, product_name, quantity FROM order_items WHERE order_id = $1`,
    [orderId],
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
  }>(
    `SELECT id, public_ref, status, payment_status, total::text
     FROM orders WHERE public_ref = $1 AND phone = $2`,
    [publicRef.trim(), phone.trim()],
  );
  if (!order.rows[0]) return null;
  const items = await query<{ id: string; product_name: string; quantity: number }>(
    `SELECT id, product_name, quantity FROM order_items WHERE order_id = $1`,
    [order.rows[0].id],
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
  await withTransaction(async (client) => {
    const current = await client.query<{ status: string }>(
      `SELECT status FROM orders WHERE id = $1 FOR UPDATE`,
      [input.orderId],
    );
    const from = current.rows[0]?.status;
    if (!from) throw new Error("Order not found");
    const allowed = ORDER_TRANSITIONS[from] ?? [];
    if (!allowed.includes(input.toStatus)) {
      throw new Error(`Cannot move from ${from} to ${input.toStatus}`);
    }
    await client.query(`UPDATE orders SET status = $2, updated_at = now() WHERE id = $1`, [
      input.orderId,
      input.toStatus,
    ]);
    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, actor_user_id, note)
       VALUES ($1,$2,$3,$4,$5)`,
      [input.orderId, from, input.toStatus, input.actorUserId, input.note ?? null],
    );
    if (input.trackingNumber) {
      await client.query(
        `INSERT INTO shipments (order_id, tracking_number, status)
         VALUES ($1, $2, $3)`,
        [input.orderId, input.trackingNumber, input.toStatus === "shipped" ? "shipped" : "pending"],
      );
    }
    await writeAuditLog(
      {
        actorUserId: input.actorUserId,
        action: "order.transition",
        entityType: "order",
        entityId: input.orderId,
        metadata: { from, to: input.toStatus },
      },
      client,
    );
  });
}

export async function addOrderNote(orderId: string, actorUserId: string, note: string): Promise<void> {
  await query(
    `INSERT INTO order_status_history (order_id, from_status, to_status, actor_user_id, note)
     SELECT id, status, status, $2, $3 FROM orders WHERE id = $1`,
    [orderId, actorUserId, note],
  );
}
