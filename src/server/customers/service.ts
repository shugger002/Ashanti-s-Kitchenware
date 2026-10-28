import { query } from "@/server/db/pool";
import { likeContains, sql, sqlAnd } from "@/server/db/sql";
import { isUuid } from "@/lib/utils";

const MATCHES_CUSTOMER = sql`(
  o.customer_id = c.id
  OR (
    length(regexp_replace(c.phone, '[^0-9]', '', 'g')) >= 9
    AND right(regexp_replace(o.phone, '[^0-9]', '', 'g'), 9)
      = right(regexp_replace(c.phone, '[^0-9]', '', 'g'), 9)
  )
)`;

const HAS_OPEN_ORDER = sql`EXISTS (
  SELECT 1 FROM orders o
   WHERE ${MATCHES_CUSTOMER}
     AND o.status NOT IN ('delivered', 'collected', 'cancelled', 'refunded')
)`;

export type CustomerNeedFilter = "work" | "new" | "account" | "all";

export type CustomerListItem = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  createdAt: string;
  hasAccount: boolean;
  orderCount: number;
  openCount: number;
  paidTotal: string;
  lastOrderRef: string | null;
  lastOrderStatus: string | null;
};

export async function findOrCreateGuestCustomer(input: {
  fullName: string;
  phone: string;
  email: string | null;
}): Promise<string> {
  const existing = await query<{ id: string }>(sql`
    SELECT id FROM customers
     WHERE phone = ${input.phone} AND (${input.email}::text IS NULL OR lower(email) = lower(${input.email}))
     ORDER BY created_at DESC
     LIMIT 1
  `);
  if (existing.rows[0]) return existing.rows[0].id;
  const inserted = await query<{ id: string }>(
    sql`INSERT INTO customers (email, full_name, phone) VALUES (${input.email}, ${input.fullName}, ${input.phone}) RETURNING id`,
  );
  return inserted.rows[0].id;
}

export async function listCustomers(filters: {
  q?: string;
  need?: CustomerNeedFilter;
}): Promise<CustomerListItem[]> {
  const where = [];
  if (filters.q?.trim()) {
    const pattern = likeContains(filters.q.trim());
    where.push(
      sql`(c.full_name ILIKE ${pattern} ESCAPE E'\\\\' OR c.phone ILIKE ${pattern} ESCAPE E'\\\\' OR COALESCE(c.email, '') ILIKE ${pattern} ESCAPE E'\\\\')`,
    );
  }
  if (filters.need === "work") {
    where.push(HAS_OPEN_ORDER);
  } else if (filters.need === "new") {
    where.push(sql`(c.created_at AT TIME ZONE 'Africa/Accra')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date`);
  } else if (filters.need === "account") {
    where.push(sql`c.password_hash IS NOT NULL`);
  }
  const result = await query<{
    id: string;
    full_name: string;
    email: string | null;
    phone: string;
    created_at: Date;
    has_account: boolean;
    order_count: number;
    open_count: number;
    paid_total: string;
    last_order_ref: string | null;
    last_order_status: string | null;
  }>(sql`
    SELECT c.id, c.full_name, c.email, c.phone, c.created_at,
            (c.password_hash IS NOT NULL) AS has_account,
            COALESCE(agg.order_count, 0)::int AS order_count,
            COALESCE(agg.open_count, 0)::int AS open_count,
            COALESCE(agg.paid_total, 0)::text AS paid_total,
            last_order.public_ref AS last_order_ref,
            last_order.status AS last_order_status
     FROM customers c
     LEFT JOIN LATERAL (
       SELECT count(*)::int AS order_count,
              count(*) FILTER (WHERE o.status NOT IN ('delivered', 'collected', 'cancelled', 'refunded'))::int AS open_count,
              COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'paid'), 0) AS paid_total
        FROM orders o
        WHERE ${MATCHES_CUSTOMER}
     ) agg ON TRUE
     LEFT JOIN LATERAL (
       SELECT o.public_ref, o.status
        FROM orders o
        WHERE ${MATCHES_CUSTOMER}
        ORDER BY o.created_at DESC
        LIMIT 1
     ) last_order ON TRUE
     WHERE ${sqlAnd(where)}
     ORDER BY c.created_at DESC
     LIMIT 100
  `);
  return result.rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at.toISOString(),
    hasAccount: row.has_account,
    orderCount: row.order_count,
    openCount: row.open_count,
    paidTotal: row.paid_total,
    lastOrderRef: row.last_order_ref,
    lastOrderStatus: row.last_order_status,
  }));
}

export async function countCustomerGlance(): Promise<{
  people: number;
  work: number;
  newToday: number;
  paidTotal: string;
}> {
  const result = await query<{
    people: string;
    work: string;
    new_today: string;
    paid_total: string;
  }>(sql`
    SELECT
      (SELECT count(*)::text FROM customers) AS people,
      (SELECT count(*)::text FROM customers c WHERE ${HAS_OPEN_ORDER}) AS work,
      (
        SELECT count(*)::text FROM customers
         WHERE (created_at AT TIME ZONE 'Africa/Accra')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date
      ) AS new_today,
      (
        SELECT COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0)::text FROM orders
      ) AS paid_total
  `);
  const row = result.rows[0];
  return {
    people: Number(row?.people ?? 0),
    work: Number(row?.work ?? 0),
    newToday: Number(row?.new_today ?? 0),
    paidTotal: row?.paid_total ?? "0",
  };
}

export type CustomerOrderRow = {
  id: string;
  publicRef: string;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  total: string;
  createdAt: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  deliveryInstructions: string | null;
};

export async function getCustomerDesk(id: string): Promise<{
  customer: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    createdAt: string;
    hasAccount: boolean;
  };
  orders: CustomerOrderRow[];
  openItems: { name: string; quantity: number; sku: string }[];
} | null> {
  if (!isUuid(id)) return null;
  const person = await query<{
    id: string;
    full_name: string;
    email: string | null;
    phone: string;
    created_at: Date;
    has_account: boolean;
  }>(sql`
    SELECT id, full_name, email, phone, created_at, (password_hash IS NOT NULL) AS has_account
     FROM customers WHERE id = ${id}
  `);
  const customer = person.rows[0];
  if (!customer) return null;

  const orders = await query<{
    id: string;
    public_ref: string;
    status: string;
    payment_status: string;
    delivery_method: string;
    total: string;
    created_at: Date;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    region: string | null;
    delivery_instructions: string | null;
  }>(sql`
    SELECT o.id, o.public_ref, o.status, o.payment_status, o.delivery_method, o.total::text, o.created_at,
            o.address_line1, o.address_line2, o.city, o.region, o.delivery_instructions
     FROM orders o
     JOIN customers c ON c.id = ${id}
     WHERE ${MATCHES_CUSTOMER}
     ORDER BY o.created_at DESC
     LIMIT 50
  `);

  const mapped: CustomerOrderRow[] = orders.rows.map((row) => ({
    id: row.id,
    publicRef: row.public_ref,
    status: row.status,
    paymentStatus: row.payment_status,
    deliveryMethod: row.delivery_method,
    total: row.total,
    createdAt: row.created_at.toISOString(),
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    region: row.region,
    deliveryInstructions: row.delivery_instructions,
  }));

  const open = mapped.find((row) => !["delivered", "collected", "cancelled", "refunded"].includes(row.status));
  let openItems: { name: string; quantity: number; sku: string }[] = [];
  if (open) {
    const items = await query<{ product_name: string; quantity: number; sku: string }>(
      sql`SELECT product_name, quantity, sku FROM order_items WHERE order_id = ${open.id} ORDER BY product_name`,
    );
    openItems = items.rows.map((row) => ({
      name: row.product_name,
      quantity: row.quantity,
      sku: row.sku,
    }));
  }

  return {
    customer: {
      id: customer.id,
      fullName: customer.full_name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.created_at.toISOString(),
      hasAccount: customer.has_account,
    },
    orders: mapped,
    openItems,
  };
}
