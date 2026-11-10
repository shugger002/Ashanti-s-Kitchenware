import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";

export async function claimNotification(event: string): Promise<boolean> {
  try {
    const result = await query<{ event: string }>(sql`
      INSERT INTO notification_sends (event) VALUES (${event})
      ON CONFLICT (event) DO NOTHING
      RETURNING event
    `);
    return Boolean(result.rows[0]);
  } catch (error) {
    console.error("claimNotification", error);
    return true;
  }
}
