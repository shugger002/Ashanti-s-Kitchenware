import { cache } from "react";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";

type RecentOrder = {
  id: string;
  public_ref: string;
  full_name: string;
  phone: string;
  total: string;
  status: string;
  payment_status: string;
  delivery_method: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  delivery_instructions: string | null;
  created_at: string;
  items: { name: string; quantity: number }[] | null;
};

type BestSeller = {
  product_name: string;
  units: number;
  revenue: string;
};

function asRows<T>(value: T[] | string | null | undefined): T[] {
  if (!value) return [];
  if (typeof value === "string") return JSON.parse(value) as T[];
  return value;
}

export const dashboardMetrics = cache(async () => {
  const result = await query<{
    total_orders: string;
    paid_orders: string;
    pending_orders: string;
    packing_orders: string;
    ready_to_pack: string;
    out_for_delivery: string;
    revenue: string;
    aov: string;
    today_orders: string;
    today_revenue: string;
    fulfilled_today: string;
    new_customers_today: string;
    low: string;
    out: string;
    total_products: string;
    demo: string;
    promo: string;
    recent: RecentOrder[] | null;
    best_sellers: BestSeller[] | null;
  }>(sql`
    WITH gh AS (
      SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date AS day
    ),
    order_agg AS (
      SELECT
        count(*)::text AS total_orders,
        count(*) FILTER (WHERE payment_status = 'paid' AND status NOT IN ('cancelled','refunded'))::text AS paid_orders,
        count(*) FILTER (WHERE payment_status IN ('pending','unpaid') AND status = 'pending_payment')::text AS pending_orders,
        count(*) FILTER (WHERE payment_status = 'paid' AND status = 'paid')::text AS ready_to_pack,
        count(*) FILTER (WHERE status = 'packing')::text AS packing_orders,
        count(*) FILTER (WHERE status IN ('shipped','ready_for_collection'))::text AS out_for_delivery,
        COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND status NOT IN ('cancelled','refunded')), 0)::text AS revenue,
        COALESCE(AVG(total) FILTER (WHERE payment_status = 'paid' AND status NOT IN ('cancelled','refunded')), 0)::text AS aov,
        count(*) FILTER (WHERE (created_at AT TIME ZONE 'Africa/Accra')::date = (SELECT day FROM gh))::text AS today_orders,
        COALESCE(SUM(total) FILTER (
          WHERE (created_at AT TIME ZONE 'Africa/Accra')::date = (SELECT day FROM gh)
            AND payment_status = 'paid'
            AND status NOT IN ('cancelled','refunded')
        ), 0)::text AS today_revenue,
        count(*) FILTER (
          WHERE status IN ('delivered','collected')
            AND (updated_at AT TIME ZONE 'Africa/Accra')::date = (SELECT day FROM gh)
        )::text AS fulfilled_today
      FROM orders
    ),
    stock_agg AS (
      SELECT
        count(*) FILTER (
          WHERE NOT (COALESCE(v.sku, p.sku) ILIKE 'DEMO-%' OR p.slug ILIKE 'demo-%')
            AND i.on_hand - i.reserved > 0
            AND i.on_hand - i.reserved <= i.low_stock_threshold
        )::text AS low,
        count(*) FILTER (
          WHERE NOT (COALESCE(v.sku, p.sku) ILIKE 'DEMO-%' OR p.slug ILIKE 'demo-%')
            AND i.on_hand - i.reserved <= 0
        )::text AS out
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      LEFT JOIN product_variants v ON v.id = i.variant_id
      WHERE p.archived_at IS NULL
    ),
    catalogue_agg AS (
      SELECT
        count(*) FILTER (WHERE archived_at IS NULL)::text AS total_products,
        count(*) FILTER (WHERE archived_at IS NULL AND sku ILIKE 'DEMO-%')::text AS demo,
        count(*) FILTER (WHERE archived_at IS NULL AND sale_price IS NOT NULL AND sale_price < price)::text AS promo
      FROM products
    ),
    new_cust AS (
      SELECT count(*)::text AS new_customers_today
      FROM customers, gh
      WHERE (created_at AT TIME ZONE 'Africa/Accra')::date = gh.day
    )
    SELECT
      o.total_orders,
      o.paid_orders,
      o.pending_orders,
      o.packing_orders,
      o.ready_to_pack,
      o.out_for_delivery,
      o.revenue,
      o.aov,
      o.today_orders,
      o.today_revenue,
      o.fulfilled_today,
      n.new_customers_today,
      s.low,
      s.out,
      c.total_products,
      c.demo,
      c.promo,
      (
        SELECT COALESCE(json_agg(r), '[]'::json)
        FROM (
          SELECT o3.id, o3.public_ref, o3.full_name, o3.phone, o3.total::text AS total, o3.status, o3.payment_status, o3.delivery_method,
                 o3.address_line1, o3.address_line2, o3.city, o3.region, o3.delivery_instructions, o3.created_at,
                 (
                   SELECT COALESCE(json_agg(json_build_object('name', oi.product_name, 'quantity', oi.quantity) ORDER BY oi.product_name), '[]'::json)
                   FROM order_items oi
                   WHERE oi.order_id = o3.id
                 ) AS items
          FROM orders o3
          ORDER BY o3.created_at DESC
          LIMIT 8
        ) r
      ) AS recent,
      (
        SELECT COALESCE(json_agg(b), '[]'::json)
        FROM (
          SELECT oi.product_name, SUM(oi.quantity)::int AS units, SUM(oi.line_total)::text AS revenue
          FROM order_items oi
          JOIN orders o2 ON o2.id = oi.order_id
          WHERE o2.payment_status = 'paid' AND o2.status NOT IN ('cancelled','refunded')
          GROUP BY oi.product_name
          HAVING SUM(oi.quantity) > 0
          ORDER BY SUM(oi.quantity) DESC
          LIMIT 5
        ) b
      ) AS best_sellers
    FROM order_agg o
    CROSS JOIN stock_agg s
    CROSS JOIN catalogue_agg c
    CROSS JOIN new_cust n
  `);

  const row = result.rows[0];
  return {
    total_orders: row?.total_orders ?? "0",
    paid_orders: row?.paid_orders ?? "0",
    pending_orders: row?.pending_orders ?? "0",
    packing_orders: row?.packing_orders ?? "0",
    ready_to_pack: row?.ready_to_pack ?? "0",
    out_for_delivery: row?.out_for_delivery ?? "0",
    revenue: row?.revenue ?? "0",
    aov: row?.aov ?? "0",
    total_products: row?.total_products ?? "0",
    today_orders: row?.today_orders ?? "0",
    today_revenue: row?.today_revenue ?? "0",
    fulfilled_today: row?.fulfilled_today ?? "0",
    new_customers_today: row?.new_customers_today ?? "0",
    lowStock: row?.low ?? "0",
    outOfStock: row?.out ?? "0",
    demoListings: row?.demo ?? "0",
    promoListings: row?.promo ?? "0",
    recent: asRows(row?.recent),
    bestSellers: asRows(row?.best_sellers),
  };
});

export async function listCustomers() {
  const result = await query<{
    id: string;
    full_name: string;
    email: string | null;
    phone: string;
    created_at: Date;
    order_count: number;
    paid_total: string;
  }>(sql`
    SELECT c.id, c.full_name, c.email, c.phone, c.created_at,
            count(o.id)::int AS order_count,
            COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'paid'), 0)::text AS paid_total
     FROM customers c
     LEFT JOIN orders o ON o.customer_id = c.id
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT 100`,
  );
  return result.rows;
}

export async function listAuditLogs() {
  const result = await query<{
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    metadata: Record<string, unknown>;
    created_at: Date;
    actor_email: string | null;
  }>(sql`
    SELECT a.id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at,
            u.email AS actor_email
     FROM admin_audit_logs a
     LEFT JOIN users u ON u.id = a.actor_user_id
     ORDER BY a.created_at DESC
     LIMIT 80`,
  );
  return result.rows;
}

export async function listAdminUsers() {
  const result = await query<{
    id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    roles: string[] | null;
  }>(sql`
    SELECT u.id, u.email, u.full_name, u.is_active,
            array_remove(array_agg(ur.role_slug), NULL) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     GROUP BY u.id
     ORDER BY u.email`,
  );
  return result.rows;
}
