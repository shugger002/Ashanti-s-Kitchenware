import { createHash } from "node:crypto";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import type { AnalyticsPeriod } from "@/server/reporting/service";

function cleanPath(raw: string) {
  const path = raw.trim().split("?")[0]?.split("#")[0] ?? "";
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/admin") || path.startsWith("/api")) {
    return null;
  }
  if (path.length > 180) return null;
  return path;
}

function cleanReferrer(raw: string | null) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.hostname.slice(0, 120);
  } catch {
    return null;
  }
}

function visitorHash(ip: string | null, userAgent: string | null) {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${day}|${ip ?? "unknown"}|${userAgent ?? "unknown"}`)
    .digest("hex")
    .slice(0, 32);
}

export async function recordStorePageView(input: {
  path: string;
  referrer: string | null;
  ip: string | null;
  userAgent: string | null;
}): Promise<boolean> {
  const path = cleanPath(input.path);
  if (!path) return false;
  await query(sql`
    INSERT INTO store_page_views (path, referrer, visitor_hash)
     VALUES (${path}, ${cleanReferrer(input.referrer)}, ${visitorHash(input.ip, input.userAgent)})
  `);
  return true;
}

export async function storeVisitSummary() {
  const result = await query<{
    today_views: string;
    today_visitors: string;
    week_views: string;
    week_visitors: string;
  }>(sql`
    SELECT
      count(*) FILTER (WHERE (created_at AT TIME ZONE 'Africa/Accra')::date = (now() AT TIME ZONE 'Africa/Accra')::date)::text AS today_views,
      count(DISTINCT visitor_hash) FILTER (WHERE (created_at AT TIME ZONE 'Africa/Accra')::date = (now() AT TIME ZONE 'Africa/Accra')::date)::text AS today_visitors,
      count(*) FILTER (WHERE created_at >= now() - interval '7 days')::text AS week_views,
      count(DISTINCT visitor_hash) FILTER (WHERE created_at >= now() - interval '7 days')::text AS week_visitors
     FROM store_page_views
  `);
  const top = await query<{ path: string; views: string }>(sql`
    SELECT path, count(*)::text AS views
      FROM store_page_views
     WHERE created_at >= now() - interval '7 days'
     GROUP BY path
     ORDER BY count(*) DESC
     LIMIT 8
  `);
  return {
    todayViews: Number(result.rows[0]?.today_views ?? 0),
    todayVisitors: Number(result.rows[0]?.today_visitors ?? 0),
    weekViews: Number(result.rows[0]?.week_views ?? 0),
    weekVisitors: Number(result.rows[0]?.week_visitors ?? 0),
    topPaths: top.rows.map((row) => ({ path: row.path, views: Number(row.views) })),
  };
}

function visitCreatedWindow(period: AnalyticsPeriod) {
  if (period === "week") {
    return sql`(v.created_at AT TIME ZONE 'Africa/Accra')::date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 6`;
  }
  if (period === "month") {
    return sql`(v.created_at AT TIME ZONE 'Africa/Accra')::date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 29`;
  }
  return sql`(v.created_at AT TIME ZONE 'Africa/Accra')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date`;
}

function visitSeriesStart(period: AnalyticsPeriod) {
  if (period === "week") return sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 6`;
  if (period === "month") return sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date - 29`;
  return sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date`;
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

export async function storeVisitDetail(period: AnalyticsPeriod) {
  const window = visitCreatedWindow(period);
  try {
    const [totals, paths, referrers, days] = await Promise.all([
      query<{ views: string; people: string }>(sql`
        SELECT count(*)::text AS views, count(DISTINCT visitor_hash)::text AS people
         FROM store_page_views v
         WHERE ${window}
      `),
      query<{ path: string; views: string }>(sql`
        SELECT path, count(*)::text AS views
         FROM store_page_views v
         WHERE ${window}
         GROUP BY path
         ORDER BY count(*) DESC
         LIMIT 15
      `),
      query<{ referrer: string; views: string }>(sql`
        SELECT COALESCE(NULLIF(referrer, ''), 'Typed or unknown') AS referrer, count(*)::text AS views
         FROM store_page_views v
         WHERE ${window}
         GROUP BY 1
         ORDER BY count(*) DESC
         LIMIT 10
      `),
      query<{ day: string; views: string }>(sql`
        SELECT gs.day::text AS day, count(v.id)::text AS views
         FROM generate_series(
           ${visitSeriesStart(period)},
           (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Accra')::date,
           interval '1 day'
         ) AS gs(day)
         LEFT JOIN store_page_views v ON (v.created_at AT TIME ZONE 'Africa/Accra')::date = gs.day
         GROUP BY gs.day
         ORDER BY gs.day
      `),
    ]);
    return {
      views: Number(totals.rows[0]?.views ?? 0),
      people: Number(totals.rows[0]?.people ?? 0),
      paths: paths.rows.map((row) => ({ path: row.path, views: Number(row.views) })),
      referrers: referrers.rows.map((row) => ({ host: row.referrer, views: Number(row.views) })),
      days: days.rows
        .map((row) => ({ day: toIsoDay(row.day), views: Number(row.views) }))
        .filter((row) => row.day),
    };
  } catch {
    return { views: 0, people: 0, paths: [], referrers: [], days: [] };
  }
}
