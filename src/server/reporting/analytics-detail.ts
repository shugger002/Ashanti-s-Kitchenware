import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { accraCreatedWindow, type AnalyticsPeriod } from "@/server/reporting/service";

const PAID = sql`o.payment_status = 'paid' AND o.status NOT IN ('cancelled', 'refunded')`;
const NOT_DEMO = sql`oi.sku NOT ILIKE 'DEMO-%'`;

function toIsoDay(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const raw = String(value ?? "");
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function previousWindow(period: AnalyticsPeriod) {
  if (period === "week") {
    return sql`(o.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 13 AND (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 7`;
  }
  if (period === "month") {
    return sql`(o.created_at AT TIME ZONE 'Africa/Accra')::date BETWEEN (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 59 AND (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 30`;
  }
  return sql`(o.created_at AT TIME ZONE 'Africa/Accra')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 1`;
}

function seriesStart(period: AnalyticsPeriod) {
  if (period === "week") return sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 6`;
  if (period === "month") return sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 29`;
  return sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date`;
}

export function spanLabel(period: AnalyticsPeriod) {
  if (period === "week") return "the last 7 Accra days";
  if (period === "month") return "the last 30 Accra days";
  return "this Accra day";
}

export function compareLabel(period: AnalyticsPeriod) {
  if (period === "week") return "the previous 7 Accra days";
  if (period === "month") return "the 30 Accra days before that";
  return "yesterday";
}

function moneyRow(window: ReturnType<typeof accraCreatedWindow>) {
  return query<{
    paid_ghs: string;
    paid_orders: string;
    aov: string;
    unpaid: string;
    all_created: string;
  }>(sql`
    SELECT
      COALESCE(SUM(o.total) FILTER (WHERE ${PAID}), 0)::text AS paid_ghs,
      count(*) FILTER (WHERE ${PAID})::text AS paid_orders,
      COALESCE(AVG(o.total) FILTER (WHERE ${PAID}), 0)::text AS aov,
      count(*) FILTER (
        WHERE o.payment_status IN ('pending', 'unpaid') AND o.status = 'pending_payment'
      )::text AS unpaid,
      count(*)::text AS all_created
     FROM orders o
     WHERE ${window}
  `);
}

export type AnalyticsMoney = {
  period: AnalyticsPeriod;
  paidGhs: number;
  prevPaidGhs: number;
  paidOrders: number;
  prevPaidOrders: number;
  aov: number;
  prevAov: number;
  unpaid: number;
  prevUnpaid: number;
  allCreated: number;
  days: { day: string; paidGhs: number; paidOrders: number }[];
  hours: { hour: number; paidGhs: number; paidOrders: number }[];
};

export async function analyticsMoney(period: AnalyticsPeriod): Promise<AnalyticsMoney> {
  const [current, previous, days, hours] = await Promise.all([
    moneyRow(accraCreatedWindow(period)),
    moneyRow(previousWindow(period)),
    query<{ day: string; paid_ghs: string; paid_orders: string }>(sql`
      SELECT gs.day::text AS day,
             COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'paid' AND o.status NOT IN ('cancelled','refunded')), 0)::text AS paid_ghs,
             count(*) FILTER (WHERE o.payment_status = 'paid' AND o.status NOT IN ('cancelled','refunded'))::text AS paid_orders
       FROM generate_series(
         ${seriesStart(period)},
         (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date,
         interval '1 day'
       ) AS gs(day)
       LEFT JOIN orders o ON (o.created_at AT TIME ZONE 'Africa/Accra')::date = gs.day
       GROUP BY gs.day
       ORDER BY gs.day
    `),
    period === "today"
      ? query<{ hour: string; paid_ghs: string; paid_orders: string }>(sql`
          SELECT h.hour::text AS hour,
                 COALESCE(p.paid_ghs, 0)::text AS paid_ghs,
                 COALESCE(p.paid_orders, 0)::text AS paid_orders
           FROM generate_series(0, 23) AS h(hour)
           LEFT JOIN (
             SELECT EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'Africa/Accra')::int AS hour,
                    SUM(o.total) AS paid_ghs,
                    count(*)::int AS paid_orders
              FROM orders o
              WHERE ${PAID}
                AND ${accraCreatedWindow(period)}
              GROUP BY 1
           ) p ON p.hour = h.hour
           ORDER BY h.hour
        `)
      : Promise.resolve({ rows: [] as { hour: string; paid_ghs: string; paid_orders: string }[] }),
  ]);

  const cur = current.rows[0];
  const prev = previous.rows[0];
  return {
    period,
    paidGhs: Number(cur?.paid_ghs ?? 0),
    prevPaidGhs: Number(prev?.paid_ghs ?? 0),
    paidOrders: Number(cur?.paid_orders ?? 0),
    prevPaidOrders: Number(prev?.paid_orders ?? 0),
    aov: Number(cur?.aov ?? 0),
    prevAov: Number(prev?.aov ?? 0),
    unpaid: Number(cur?.unpaid ?? 0),
    prevUnpaid: Number(prev?.unpaid ?? 0),
    allCreated: Number(cur?.all_created ?? 0),
    days: days.rows
      .map((d) => ({
        day: toIsoDay(d.day),
        paidGhs: Number(d.paid_ghs),
        paidOrders: Number(d.paid_orders),
      }))
      .filter((d) => d.day),
    hours: hours.rows.map((h) => ({
      hour: Number(h.hour),
      paidGhs: Number(h.paid_ghs),
      paidOrders: Number(h.paid_orders),
    })),
  };
}

export type AnalyticsSold = {
  products: { name: string; sku: string; units: number; revenue: number }[];
  aisles: { label: string; units: number; revenue: number }[];
  regions: { label: string; orders: number; revenue: number }[];
  deliveryOrders: number;
  collectionOrders: number;
  paidCreated: number;
  unpaidCreated: number;
  bands: { label: string; count: number }[];
};

export async function analyticsSold(period: AnalyticsPeriod): Promise<AnalyticsSold> {
  const window = accraCreatedWindow(period);
  const [products, aisles, regions, mix, bands] = await Promise.all([
    query<{ product_name: string; sku: string; units: string; revenue: string }>(sql`
      SELECT oi.product_name, oi.sku, SUM(oi.quantity)::text AS units, SUM(oi.line_total)::text AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE ${PAID} AND ${window} AND ${NOT_DEMO}
       GROUP BY oi.product_name, oi.sku
       HAVING SUM(oi.quantity) > 0
       ORDER BY SUM(oi.quantity) DESC
       LIMIT 20
    `),
    query<{ label: string; units: string; revenue: string }>(sql`
      SELECT COALESCE(NULLIF(c.name, ''), 'No aisle') AS label,
             SUM(oi.quantity)::text AS units,
             SUM(oi.line_total)::text AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN products p ON p.id = oi.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${PAID} AND ${window} AND ${NOT_DEMO}
       GROUP BY 1
       HAVING SUM(oi.quantity) > 0
       ORDER BY SUM(oi.quantity) DESC
       LIMIT 12
    `),
    query<{ label: string; orders: string; revenue: string }>(sql`
      SELECT COALESCE(NULLIF(trim(o.region), ''), NULLIF(trim(o.city), ''), 'Not written') AS label,
             count(*)::text AS orders,
             SUM(o.total)::text AS revenue
       FROM orders o
       WHERE ${PAID} AND ${window}
       GROUP BY 1
       ORDER BY count(*) DESC
       LIMIT 8
    `),
    query<{ delivery: string; collection: string; paid: string; unpaid: string }>(sql`
      SELECT
        count(*) FILTER (WHERE ${PAID} AND o.delivery_method = 'delivery')::text AS delivery,
        count(*) FILTER (WHERE ${PAID} AND o.delivery_method = 'collection')::text AS collection,
        count(*) FILTER (WHERE ${PAID})::text AS paid,
        count(*) FILTER (
          WHERE o.payment_status IN ('pending', 'unpaid') AND o.status = 'pending_payment'
        )::text AS unpaid
       FROM orders o
       WHERE ${window}
    `),
    query<{ under: string; mid: string; over: string }>(sql`
      SELECT
        count(*) FILTER (WHERE o.total < 200)::text AS under,
        count(*) FILTER (WHERE o.total >= 200 AND o.total < 500)::text AS mid,
        count(*) FILTER (WHERE o.total >= 500)::text AS over
       FROM orders o
       WHERE ${PAID} AND ${window}
    `),
  ]);

  const mixRow = mix.rows[0];
  const bandRow = bands.rows[0];
  return {
    products: products.rows.map((r) => ({
      name: r.product_name,
      sku: r.sku,
      units: Number(r.units),
      revenue: Number(r.revenue),
    })),
    aisles: aisles.rows.map((r) => ({
      label: r.label,
      units: Number(r.units),
      revenue: Number(r.revenue),
    })),
    regions: regions.rows.map((r) => ({
      label: r.label,
      orders: Number(r.orders),
      revenue: Number(r.revenue),
    })),
    deliveryOrders: Number(mixRow?.delivery ?? 0),
    collectionOrders: Number(mixRow?.collection ?? 0),
    paidCreated: Number(mixRow?.paid ?? 0),
    unpaidCreated: Number(mixRow?.unpaid ?? 0),
    bands: [
      { label: "Under GH₵200", count: Number(bandRow?.under ?? 0) },
      { label: "GH₵200–499", count: Number(bandRow?.mid ?? 0) },
      { label: "GH₵500 and over", count: Number(bandRow?.over ?? 0) },
    ],
  };
}

export async function analyticsStaffCounts() {
  const result = await query<{ action: string; n: string }>(sql`
    SELECT action, count(*)::text AS n
     FROM admin_audit_logs
     WHERE (created_at AT TIME ZONE 'Africa/Accra')::date
       >= (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 6
     GROUP BY action
     ORDER BY count(*) DESC
     LIMIT 12
  `);
  return result.rows.map((row) => ({ action: row.action, count: Number(row.n) }));
}

