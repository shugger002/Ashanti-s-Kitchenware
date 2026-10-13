import { Pool } from "pg";
import argon2 from "argon2";

async function main() {
  const url = process.env.DATABASE_URL;
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME ?? "Store Owner";
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!email || !password) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required");
  }
  if (password.length < 12) {
    throw new Error("Bootstrap password must be at least 12 characters");
  }
  const pool = new Pool({ connectionString: url });
  const existing = await pool.query(`SELECT id FROM users WHERE lower(email) = $1`, [
    email.toLowerCase(),
  ]);
  if (existing.rowCount) {
    console.log("Admin already exists:", email);
    await pool.end();
    return;
  }
  const hash = await argon2.hash(password, { type: argon2.argon2id });
  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id`,
    [email.toLowerCase(), hash, name],
  );
  await pool.query(`INSERT INTO user_roles (user_id, role_slug) VALUES ($1, 'super_admin')`, [
    inserted.rows[0].id,
  ]);
  console.log("Created super administrator:", email);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
