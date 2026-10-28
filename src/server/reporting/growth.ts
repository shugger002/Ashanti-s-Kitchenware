import { cache } from "react";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";

const PAID = sql`payment_status = 'paid' AND status NOT IN ('cancelled', 'refunded')`;

function asRows<T>(value: T[] | string | null | undefined): T[] {
  if (!value) return [];
  if (typeof value === "string") return JSON.parse(value) as T[];
  return value;
}

function toIsoDay(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const raw = String(value ?? "");
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export type GrowthDay = {
  day: string;
  paid_ghs: string;
  paid_orders: number;
  all_orders: number;
};

export type GrowthShare = {
  label: string;
  orders: number;
  revenue: string;
};

export type DashboardGrowth = {
  thisPaid: number;
  prevPaid: number;
  thisOrders: number;
  prevOrders: number;
  thisAov: number;
  prevAov: number;
  thisCustomers: number;
  prevCustomers: number;
  allTimePaid: number;
  allTimeOrders: number;
  days: { day: string; paidGhs: number; paidOrders: number; allOrders: number }[];
  sellers: { name: string; units: number; revenue: number }[];
  regions: { label: string; orders: number; revenue: number }[];
  deliveryOrders: number;
  collectionOrders: number;
  guestPaid: number;
  firstPaid: number;
  returningPaid: number;
  pipeline: { label: string; count: number }[];
  visitDays: { day: string; views: number }[];
};

export const dashboardGrowth = cache(async (): Promise<DashboardGrowth> => {
  const result = await query<{
    this_paid: string;
    prev_paid: string;
    this_orders: string;
    prev_orders: string;
    this_aov: string;
    prev_aov: string;
    this_customers: string;
    prev_customers: string;
    all_paid: string;
    all_orders: string;
    days: GrowthDay[] | null;
    sellers: { product_name: string; units: number; revenue: string }[] | null;
    regions: GrowthShare[] | null;
    delivery_orders: string;
    collection_orders: string;
    guest_paid: string;
    first_paid: string;
    returning_paid: string;
    waiting: string;
    packing: string;
    out: string;
    done: string;
  }>(sql`
    WITH bounds AS (
      SELECT
        (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date AS today,
        (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 6 AS this_start,
        (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 13 AS prev_start,
        (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 7 AS prev_end,
        (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 29 AS month_start,
        (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 13 AS series_start
    ),
    paid AS (
      SELECT *
       FROM orders, bounds
       WHERE ${PAID}
    ),
    lifetime AS (
      SELECT customer_id, count(*)::int AS n
       FROM orders
       WHERE ${PAID} AND customer_id IS NOT NULL
       GROUP BY customer_id
    )
    SELECT
      COALESCE(SUM(p.total) FILTER (
        WHERE (p.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN b.this_start AND b.today
      ), 0)::text AS this_paid,
      COALESCE(SUM(p.total) FILTER (
        WHERE (p.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN b.prev_start AND b.prev_end
      ), 0)::text AS prev_paid,
      count(*) FILTER (
        WHERE (p.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN b.this_start AND b.today
      )::text AS this_orders,
      count(*) FILTER (
        WHERE (p.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN b.prev_start AND b.prev_end
      )::text AS prev_orders,
      COALESCE(AVG(p.total) FILTER (
        WHERE (p.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN b.this_start AND b.today
      ), 0)::text AS this_aov,
      COALESCE(AVG(p.total) FILTER (
        WHERE (p.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN b.prev_start AND b.prev_end
      ), 0)::text AS prev_aov,
      (SELECT count(*)::text FROM customers c, bounds b2
        WHERE (c.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN b2.this_start AND b2.today) AS this_customers,
      (SELECT count(*)::text FROM customers c, bounds b2
        WHERE (c.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN b2.prev_start AND b2.prev_end) AS prev_customers,
      COALESCE((SELECT SUM(total) FROM orders WHERE ${PAID}), 0)::text AS all_paid,
      (SELECT count(*) FROM orders WHERE ${PAID})::text AS all_orders,
      (
        SELECT COALESCE(json_agg(d ORDER BY d.day), '[]'::json)
        FROM (
          SELECT gs.day::text AS day,
                 COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'paid' AND o.status NOT IN ('cancelled','refunded')), 0)::text AS paid_ghs,
                 count(*) FILTER (WHERE o.payment_status = 'paid' AND o.status NOT IN ('cancelled','refunded'))::int AS paid_orders,
                 count(o.id)::int AS all_orders
           FROM generate_series(
             (SELECT series_start FROM bounds),
             (SELECT today FROM bounds),
             interval '1 day'
           ) AS gs(day)
           LEFT JOIN orders o ON (o.created_at AT TIME ZONE 'Africa/Accra')::date = gs.day
           GROUP BY gs.day
        ) d
      ) AS days,
      (
        SELECT COALESCE(json_agg(s), '[]'::json)
        FROM (
          SELECT oi.product_name, SUM(oi.quantity)::int AS units, SUM(oi.line_total)::text AS revenue
           FROM order_items oi
           JOIN orders o ON o.id = oi.order_id, bounds b3
           WHERE o.payment_status = 'paid' AND o.status NOT IN ('cancelled','refunded')
             AND (o.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN b3.month_start AND b3.today
           GROUP BY oi.product_name
           HAVING SUM(oi.quantity) > 0
           ORDER BY SUM(oi.quantity) DESC
           LIMIT 6
        ) s
      ) AS sellers,
      (
        SELECT COALESCE(json_agg(r), '[]'::json)
        FROM (
          SELECT COALESCE(NULLIF(trim(o.region), ''), NULLIF(trim(o.city), ''), 'Not written') AS label,
                 count(*)::int AS orders,
                 SUM(o.total)::text AS revenue
           FROM orders o, bounds b4
           WHERE o.payment_status = 'paid' AND o.status NOT IN ('cancelled','refunded')
             AND (o.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN b4.month_start AND b4.today
           GROUP BY 1
           ORDER BY count(*) DESC
           LIMIT 6
        ) r
      ) AS regions,
      count(*) FILTER (
        WHERE p.delivery_method = 'delivery'
          AND (p.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN b.month_start AND b.today
      )::text AS delivery_orders,
      count(*) FILTER (
        WHERE p.delivery_method = 'collection'
          AND (p.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN b.month_start AND b.today
      )::text AS collection_orders,
      (
        SELECT count(*)::text
         FROM orders o, bounds b5
         WHERE o.payment_status = 'paid' AND o.status NOT IN ('cancelled','refunded')
           AND (o.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN b5.month_start AND b5.today
           AND o.customer_id IS NULL
      ) AS guest_paid,
      (
        SELECT count(*)::text
         FROM orders o
         LEFT JOIN lifetime l ON l.customer_id = o.customer_id, bounds b6
         WHERE o.payment_status = 'paid' AND o.status NOT IN ('cancelled','refunded')
           AND (o.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN b6.month_start AND b6.today
           AND o.customer_id IS NOT NULL AND COALESCE(l.n, 1) = 1
      ) AS first_paid,
      (
        SELECT count(*)::text
         FROM orders o
         JOIN lifetime l ON l.customer_id = o.customer_id, bounds b7
         WHERE o.payment_status = 'paid' AND o.status NOT IN ('cancelled','refunded')
           AND (o.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN b7.month_start AND b7.today
           AND l.n > 1
      ) AS returning_paid,
      (SELECT count(*)::text FROM orders WHERE payment_status IN ('pending','unpaid') AND status = 'pending_payment') AS waiting,
      (SELECT count(*)::text FROM orders WHERE payment_status = 'paid' AND status IN ('paid','packing')) AS packing,
      (SELECT count(*)::text FROM orders WHERE status IN ('shipped','ready_for_collection')) AS out,
      (SELECT count(*)::text FROM orders WHERE status IN ('delivered','collected')) AS done
     FROM bounds b
     LEFT JOIN paid p ON TRUE
     GROUP BY b.today, b.this_start, b.prev_start, b.prev_end, b.month_start, b.series_start
  `);

  const row = result.rows[0];
  let visitDays: { day: string; views: number }[] = [];
  try {
    const visits = await query<{ day: string; views: string }>(sql`
      SELECT gs.day::text AS day, count(v.id)::text AS views
       FROM generate_series(
         (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 13,
         (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date,
         interval '1 day'
       ) AS gs(day)
       LEFT JOIN store_page_views v ON (v.created_at AT TIME ZONE 'Africa/Accra')::date = gs.day
       GROUP BY gs.day
       ORDER BY gs.day
    `);
    visitDays = visits.rows
      .map((d) => ({ day: toIsoDay(d.day), views: Number(d.views) }))
      .filter((d) => d.day);
  } catch {
    visitDays = [];
  }

  return {
    thisPaid: Number(row?.this_paid ?? 0),
    prevPaid: Number(row?.prev_paid ?? 0),
    thisOrders: Number(row?.this_orders ?? 0),
    prevOrders: Number(row?.prev_orders ?? 0),
    thisAov: Number(row?.this_aov ?? 0),
    prevAov: Number(row?.prev_aov ?? 0),
    thisCustomers: Number(row?.this_customers ?? 0),
    prevCustomers: Number(row?.prev_customers ?? 0),
    allTimePaid: Number(row?.all_paid ?? 0),
    allTimeOrders: Number(row?.all_orders ?? 0),
    days: asRows(row?.days)
      .map((d) => ({
        day: toIsoDay(d.day),
        paidGhs: Number(d.paid_ghs),
        paidOrders: Number(d.paid_orders),
        allOrders: Number(d.all_orders),
      }))
      .filter((d) => d.day),
    sellers: asRows(row?.sellers).map((s) => ({
      name: s.product_name,
      units: Number(s.units),
      revenue: Number(s.revenue),
    })),
    regions: asRows(row?.regions).map((r) => ({
      label: r.label,
      orders: Number(r.orders),
      revenue: Number(r.revenue),
    })),
    deliveryOrders: Number(row?.delivery_orders ?? 0),
    collectionOrders: Number(row?.collection_orders ?? 0),
    guestPaid: Number(row?.guest_paid ?? 0),
    firstPaid: Number(row?.first_paid ?? 0),
    returningPaid: Number(row?.returning_paid ?? 0),
    pipeline: [
      { label: "Waiting", count: Number(row?.waiting ?? 0) },
      { label: "Packing", count: Number(row?.packing ?? 0) },
      { label: "Out", count: Number(row?.out ?? 0) },
      { label: "Delivered", count: Number(row?.done ?? 0) },
    ],
    visitDays,
  };
});
