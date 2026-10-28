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

export type OrderPackLine = {
  name: string;
  quantity: number;
  sku: string;
  unitPrice: string;
  lineTotal: string;
  imageUrl: string | null;
};

export type OrderListItem = {
  id: string;
  publicRef: string;
  fullName: string;
  phone: string;
  email: string | null;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  deliveryInstructions: string | null;
  subtotal: string;
  shippingAmount: string;
  total: string;
  createdAt: string;
  items: OrderPackLine[];
};

export type OrderNeedFilter = "work" | "out" | "done";

export async function listOrders(filters: {
  q?: string;
  status?: string;
  paymentStatus?: string;
  need?: OrderNeedFilter;
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
  } else if (filters.need === "work") {
    where.push(sql`status NOT IN ('delivered', 'collected', 'cancelled', 'refunded')`);
  } else if (filters.need === "out") {
    where.push(sql`status IN ('shipped', 'ready_for_collection')`);
  } else if (filters.need === "done") {
    where.push(sql`status IN ('delivered', 'collected')`);
  }
  if (filters.paymentStatus && ["pending", "unpaid", "paid", "failed", "successful"].includes(filters.paymentStatus)) {
    where.push(sql`payment_status = ${filters.paymentStatus}`);
  }
  const result = await query<{
    id: string;
    public_ref: string;
    full_name: string;
    phone: string;
    email: string | null;
    status: string;
    payment_status: string;
    delivery_method: string;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    region: string | null;
    delivery_instructions: string | null;
    subtotal: string;
    shipping_amount: string;
    total: string;
    created_at: Date;
    items: OrderPackLine[] | string | null;
  }>(sql`
    SELECT o.id, o.public_ref, o.full_name, o.phone, o.email, o.status, o.payment_status, o.delivery_method,
            o.address_line1, o.address_line2, o.city, o.region, o.delivery_instructions,
            o.subtotal::text, o.shipping_amount::text, o.total::text, o.created_at,
            COALESCE(
              (
                SELECT json_agg(
                  json_build_object(
                    'name', oi.product_name,
                    'quantity', oi.quantity,
                    'sku', oi.sku,
                    'unitPrice', oi.unit_price::text,
                    'lineTotal', oi.line_total::text,
                    'imageUrl', img.url
                  ) ORDER BY oi.product_name
                )
                FROM order_items oi
                LEFT JOIN LATERAL (
                  SELECT pi.url
                  FROM product_images pi
                  WHERE pi.product_id = oi.product_id
                  ORDER BY pi.is_primary DESC, pi.sort_order ASC
                  LIMIT 1
                ) img ON TRUE
                WHERE oi.order_id = o.id
              ),
              '[]'::json
            ) AS items
     FROM orders o
     WHERE ${sqlAnd(where)}
     ORDER BY o.created_at DESC
     LIMIT 100
  `);
  return result.rows.map((row) => ({
    id: row.id,
    publicRef: row.public_ref,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    status: row.status,
    paymentStatus: row.payment_status,
    deliveryMethod: row.delivery_method,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    region: row.region,
    deliveryInstructions: row.delivery_instructions,
    subtotal: row.subtotal,
    shippingAmount: row.shipping_amount,
    total: row.total,
    createdAt: row.created_at.toISOString(),
    items: parsePackLines(row.items),
  }));
}

export async function countOrderGlance(): Promise<{
  waitingPay: number;
  toPack: number;
  packing: number;
  out: number;
  done: number;
  work: number;
}> {
  const result = await query<{
    waiting_pay: string;
    to_pack: string;
    packing: string;
    out: string;
    done: string;
    work: string;
  }>(sql`
    SELECT
      count(*) FILTER (WHERE status = 'pending_payment')::text AS waiting_pay,
      count(*) FILTER (WHERE status = 'paid')::text AS to_pack,
      count(*) FILTER (WHERE status = 'packing')::text AS packing,
      count(*) FILTER (WHERE status IN ('shipped', 'ready_for_collection'))::text AS out,
      count(*) FILTER (WHERE status IN ('delivered', 'collected'))::text AS done,
      count(*) FILTER (WHERE status NOT IN ('delivered', 'collected', 'cancelled', 'refunded'))::text AS work
     FROM orders
  `);
  const row = result.rows[0];
  return {
    waitingPay: Number(row?.waiting_pay ?? 0),
    toPack: Number(row?.to_pack ?? 0),
    packing: Number(row?.packing ?? 0),
    out: Number(row?.out ?? 0),
    done: Number(row?.done ?? 0),
    work: Number(row?.work ?? 0),
  };
}

function parsePackLines(value: OrderPackLine[] | string | null | undefined): OrderPackLine[] {
  if (!value) return [];
  const rows = typeof value === "string" ? (JSON.parse(value) as OrderPackLine[]) : value;
  return rows.map((row) => ({
    name: String(row.name ?? ""),
    quantity: Number(row.quantity ?? 0),
    sku: String(row.sku ?? ""),
    unitPrice: String(row.unitPrice ?? "0"),
    lineTotal: String(row.lineTotal ?? "0"),
    imageUrl: row.imageUrl ? String(row.imageUrl) : null,
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
    image_url: string | null;
  }>(sql`
    SELECT oi.id, oi.product_name, oi.sku, oi.quantity, oi.unit_price::text, oi.line_total::text, img.url AS image_url
     FROM order_items oi
     LEFT JOIN LATERAL (
       SELECT pi.url
       FROM product_images pi
       WHERE pi.product_id = oi.product_id
       ORDER BY pi.is_primary DESC, pi.sort_order ASC
       LIMIT 1
     ) img ON TRUE
     WHERE oi.order_id = ${id}
     ORDER BY oi.product_name
  `);
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
    email: null,
    status: row.status,
    paymentStatus: row.payment_status,
    deliveryMethod: row.delivery_method,
    addressLine1: null,
    addressLine2: null,
    city: null,
    region: null,
    deliveryInstructions: null,
    subtotal: row.total,
    shippingAmount: "0",
    total: row.total,
    createdAt: row.created_at.toISOString(),
    items: [],
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
