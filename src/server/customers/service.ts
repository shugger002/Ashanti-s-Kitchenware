import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";

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
