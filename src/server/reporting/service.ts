import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";

export async function dashboardMetrics() {
  const [totals, stock, recent, best, catalogue, today] = await Promise.all([
    query<{
      total_orders: string;
      paid_orders: string;
      pending_orders: string;
      packing_orders: string;
      ready_to_pack: string;
      out_for_delivery: string;
      revenue: string;
      aov: string;
    }>(sql`
      SELECT
         count(*)::text AS total_orders,
         count(*) FILTER (WHERE payment_status = 'paid' AND status NOT IN ('cancelled','refunded'))::text AS paid_orders,
         count(*) FILTER (WHERE payment_status IN ('pending','unpaid') AND status = 'pending_payment')::text AS pending_orders,
         count(*) FILTER (WHERE payment_status = 'paid' AND status = 'paid')::text AS ready_to_pack,
         count(*) FILTER (WHERE status = 'packing')::text AS packing_orders,
         count(*) FILTER (WHERE status IN ('shipped','ready_for_collection'))::text AS out_for_delivery,
         COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND status NOT IN ('cancelled','refunded')), 0)::text AS revenue,
         COALESCE(AVG(total) FILTER (WHERE payment_status = 'paid' AND status NOT IN ('cancelled','refunded')), 0)::text AS aov
       FROM orders
    `),
    query<{ low: string; out: string }>(sql`
      SELECT
         count(*) FILTER (WHERE on_hand - reserved > 0 AND on_hand - reserved <= low_stock_threshold)::text AS low,
         count(*) FILTER (WHERE on_hand - reserved <= 0)::text AS out
       FROM inventory
    `),
    query<{
      id: string;
      public_ref: string;
      full_name: string;
      total: string;
      status: string;
      payment_status: string;
      delivery_method: string;
      created_at: Date;
    }>(sql`
      SELECT id, public_ref, full_name, total::text, status, payment_status, delivery_method, created_at
       FROM orders ORDER BY created_at DESC LIMIT 8
    `),
    query<{ product_name: string; units: number; revenue: string }>(sql`
      SELECT oi.product_name, SUM(oi.quantity)::int AS units, SUM(oi.line_total)::text AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.payment_status = 'paid' AND o.status NOT IN ('cancelled','refunded')
       GROUP BY oi.product_name
       HAVING SUM(oi.quantity) > 0
       ORDER BY units DESC
       LIMIT 5
    `),
    query<{ demo: string; promo: string; total_products: string }>(sql`
      SELECT
         count(*) FILTER (WHERE archived_at IS NULL)::text AS total_products,
         count(*) FILTER (WHERE archived_at IS NULL AND sku ILIKE 'DEMO-%')::text AS demo,
         count(*) FILTER (WHERE archived_at IS NULL AND sale_price IS NOT NULL AND sale_price < price)::text AS promo
       FROM products
    `),
    query<{
      today_orders: string;
      today_revenue: string;
      fulfilled_today: string;
      new_customers_today: string;
    }>(sql`
      WITH gh AS (
         SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date AS day
       )
       SELECT
         (SELECT count(*)::text FROM orders o, gh
           WHERE (o.created_at AT TIME ZONE 'Africa/Accra')::date = gh.day) AS today_orders,
         (SELECT COALESCE(SUM(o.total), 0)::text FROM orders o, gh
           WHERE (o.created_at AT TIME ZONE 'Africa/Accra')::date = gh.day
             AND o.payment_status = 'paid'
             AND o.status NOT IN ('cancelled','refunded')) AS today_revenue,
         (SELECT count(*)::text FROM orders o, gh
           WHERE o.status IN ('delivered','collected')
             AND (o.updated_at AT TIME ZONE 'Africa/Accra')::date = gh.day) AS fulfilled_today,
         (SELECT count(*)::text FROM customers c, gh
           WHERE (c.created_at AT TIME ZONE 'Africa/Accra')::date = gh.day) AS new_customers_today
    `),
  ]);

  return {
    ...totals.rows[0],
    total_products: catalogue.rows[0]?.total_products ?? "0",
    today_orders: today.rows[0]?.today_orders ?? "0",
    today_revenue: today.rows[0]?.today_revenue ?? "0",
    fulfilled_today: today.rows[0]?.fulfilled_today ?? "0",
    new_customers_today: today.rows[0]?.new_customers_today ?? "0",
    lowStock: stock.rows[0]?.low ?? "0",
    outOfStock: stock.rows[0]?.out ?? "0",
    demoListings: catalogue.rows[0]?.demo ?? "0",
    promoListings: catalogue.rows[0]?.promo ?? "0",
    recent: recent.rows,
    bestSellers: best.rows,
  };
}

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
