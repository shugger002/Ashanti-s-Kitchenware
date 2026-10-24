import { createHash } from "node:crypto";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";

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
