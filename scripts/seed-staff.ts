import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { createPgPool } from "@/server/db/config";

type StaffSeed = {
  email: string;
  fullName: string;
  role: "super_admin" | "store_admin" | "order_manager" | "inventory_manager";
};

function password(): string {
  return randomBytes(9).toString("base64url");
}

async function main() {
  const ownerEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@ashantisakitchenware.com").trim().toLowerCase();
  const staff: StaffSeed[] = [
    { email: ownerEmail, fullName: process.env.BOOTSTRAP_ADMIN_NAME ?? "Store Owner", role: "super_admin" },
    { email: "store@ashantisakitchenware.com", fullName: "Store administrator", role: "store_admin" },
    { email: "orders@ashantisakitchenware.com", fullName: "Order manager", role: "order_manager" },
    { email: "stock@ashantisakitchenware.com", fullName: "Inventory manager", role: "inventory_manager" },
  ];

  const pool = createPgPool("migrate");

  const created: { email: string; role: string; password: string }[] = [];
  try {
    for (const person of staff) {
      const plain = process.env.BOOTSTRAP_ADMIN_PASSWORD && person.role === "super_admin"
        ? process.env.BOOTSTRAP_ADMIN_PASSWORD
        : password();
      if (plain.length < 12) {
        throw new Error(`Password for ${person.email} must be at least 12 characters`);
      }
      const hash = await argon2.hash(plain, { type: argon2.argon2id });
      const user = await pool.query<{ id: string }>(
        `INSERT INTO users (email, password_hash, full_name, is_active)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           full_name = EXCLUDED.full_name,
           is_active = TRUE,
           updated_at = now()
         RETURNING id`,
        [person.email, hash, person.fullName],
      );
      await pool.query(
        `INSERT INTO user_roles (user_id, role_slug) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [user.rows[0].id, person.role],
      );
      created.push({ email: person.email, role: person.role, password: plain });
    }
  } finally {
    await pool.end();
  }

  console.log("Staff logins for http://localhost:3000/admin/login");
  console.log("Change these after first sign-in. They are not stored in the repo.");
  for (const row of created) {
    console.log(`${row.role}\t${row.email}\t${row.password}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
