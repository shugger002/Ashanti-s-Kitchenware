import { query } from "@/server/db/pool";

export async function findOrCreateGuestCustomer(input: {
  fullName: string;
  phone: string;
  email: string | null;
}): Promise<string> {
  const existing = await query<{ id: string }>(
    `SELECT id FROM customers
     WHERE phone = $1 AND ($2::text IS NULL OR lower(email) = lower($2))
     ORDER BY created_at DESC
     LIMIT 1`,
    [input.phone, input.email],
  );
  if (existing.rows[0]) return existing.rows[0].id;
  const inserted = await query<{ id: string }>(
    `INSERT INTO customers (email, full_name, phone) VALUES ($1, $2, $3) RETURNING id`,
    [input.email, input.fullName, input.phone],
  );
  return inserted.rows[0].id;
}
