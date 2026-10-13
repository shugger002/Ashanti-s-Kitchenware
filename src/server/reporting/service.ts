import { query } from "@/server/db/pool";

export async function dashboardMetrics() {
  const totals = await query<{
    total_orders: string;
    paid_orders: string;
    pending_orders: string;
    packing_orders: string;
    ready_to_pack: string;
    out_for_delivery: string;
    revenue: string;
    aov: string;
  }>(
    `SELECT
       count(*)::text AS total_orders,
       count(*) FILTER (WHERE payment_status = 'paid' AND status NOT IN ('cancelled','refunded'))::text AS paid_orders,
       count(*) FILTER (WHERE payment_status IN ('pending','unpaid') AND status = 'pending_payment')::text AS pending_orders,
       count(*) FILTER (WHERE payment_status = 'paid' AND status = 'paid')::text AS ready_to_pack,
       count(*) FILTER (WHERE status = 'packing')::text AS packing_orders,
       count(*) FILTER (WHERE status IN ('shipped','ready_for_collection'))::text AS out_for_delivery,
       COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND status NOT IN ('cancelled','refunded')), 0)::text AS revenue,
       COALESCE(AVG(total) FILTER (WHERE payment_status = 'paid' AND status NOT IN ('cancelled','refunded')), 0)::text AS aov
     FROM orders`,
  );

  const stock = await query<{ low: string; out: string }>(
    `SELECT
       count(*) FILTER (WHERE on_hand - reserved > 0 AND on_hand - reserved <= low_stock_threshold)::text AS low,
       count(*) FILTER (WHERE on_hand - reserved <= 0)::text AS out
     FROM inventory`,
  );

  const recent = await query<{
    id: string;
    public_ref: string;
    full_name: string;
    total: string;
    status: string;
    payment_status: string;
    delivery_method: string;
    created_at: Date;
  }>(
    `SELECT id, public_ref, full_name, total::text, status, payment_status, delivery_method, created_at
     FROM orders ORDER BY created_at DESC LIMIT 8`,
  );

  const best = await query<{ product_name: string; units: number; revenue: string }>(
    `SELECT oi.product_name, SUM(oi.quantity)::int AS units, SUM(oi.line_total)::text AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.payment_status = 'paid' AND o.status NOT IN ('cancelled','refunded')
     GROUP BY oi.product_name
     HAVING SUM(oi.quantity) > 0
     ORDER BY units DESC
     LIMIT 5`,
  );

  const catalogue = await query<{ demo: string; promo: string }>(
    `SELECT
       count(*) FILTER (WHERE sku ILIKE 'DEMO-%')::text AS demo,
       count(*) FILTER (WHERE sale_price IS NOT NULL AND sale_price < price)::text AS promo
     FROM products`,
  );

  return {
    ...totals.rows[0],
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
  }>(
    `SELECT c.id, c.full_name, c.email, c.phone, c.created_at,
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
  }>(
    `SELECT a.id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at,
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
  }>(
    `SELECT u.id, u.email, u.full_name, u.is_active,
            array_remove(array_agg(ur.role_slug), NULL) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     GROUP BY u.id
     ORDER BY u.email`,
  );
  return result.rows;
}
