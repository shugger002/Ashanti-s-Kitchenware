import { withTransaction } from "@/server/db/pool";
import { sql } from "@/server/db/sql";

export type PruneResult = {
  visitDaysFolded: number;
  pageViewsRemoved: number;
  loginAttemptsRemoved: number;
  sessionsRemoved: number;
  customerSessionsRemoved: number;
  resetTokensRemoved: number;
  jobRunsRemoved: number;
};

/** Fold old shop visits into one row per day, then drop rows that are only noise. */
export async function pruneGrowthTables(): Promise<PruneResult> {
  return withTransaction(async (db) => {
    const folded = await db.query(sql`
      INSERT INTO store_visit_days (day, views, visitors)
      SELECT (created_at AT TIME ZONE 'Africa/Accra')::date,
             count(*)::int,
             count(DISTINCT visitor_hash)::int
        FROM store_page_views
       WHERE created_at < ((now() AT TIME ZONE 'Africa/Accra')::date - 90) AT TIME ZONE 'Africa/Accra'
       GROUP BY 1
      ON CONFLICT (day) DO UPDATE
        SET views = EXCLUDED.views,
            visitors = EXCLUDED.visitors
    `);
    const pageViews = await db.query(sql`
      DELETE FROM store_page_views
       WHERE created_at < ((now() AT TIME ZONE 'Africa/Accra')::date - 90) AT TIME ZONE 'Africa/Accra'
    `);
    const loginAttempts = await db.query(sql`
      DELETE FROM login_attempts
       WHERE attempted_at < now() - interval '7 days'
    `);
    const sessions = await db.query(sql`
      DELETE FROM sessions
       WHERE expires_at < now()
    `);
    const customerSessions = await db.query(sql`
      DELETE FROM customer_sessions
       WHERE expires_at < now()
    `);
    const resetTokens = await db.query(sql`
      DELETE FROM password_reset_tokens
       WHERE used_at IS NOT NULL
          OR expires_at < now()
    `);
    const jobRuns = await db.query(sql`
      DELETE FROM ops_job_runs
       WHERE created_at < now() - interval '90 days'
    `);
    return {
      visitDaysFolded: folded.rowCount ?? 0,
      pageViewsRemoved: pageViews.rowCount ?? 0,
      loginAttemptsRemoved: loginAttempts.rowCount ?? 0,
      sessionsRemoved: sessions.rowCount ?? 0,
      customerSessionsRemoved: customerSessions.rowCount ?? 0,
      resetTokensRemoved: resetTokens.rowCount ?? 0,
      jobRunsRemoved: jobRuns.rowCount ?? 0,
    };
  });
}
