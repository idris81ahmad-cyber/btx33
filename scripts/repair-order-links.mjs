/**
 * Fix orders whose user_id does not match the email's user account.
 * Usage: node scripts/repair-order-links.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();

const mismatches = await c.query(`
  SELECT o.order_number, o.email, o.user_id, u.email AS user_email
  FROM orders o
  LEFT JOIN users u ON u.id = o.user_id
  WHERE o.user_id IS NOT NULL
    AND (u.id IS NULL OR lower(u.email) <> lower(o.email))
`);
console.log("mismatches before:", mismatches.rows);

const cleared = await c.query(`
  UPDATE orders o
  SET user_id = NULL
  WHERE user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = o.user_id AND lower(u.email) = lower(o.email)
    )
  RETURNING order_number, email
`);
console.log("cleared wrong user_id:", cleared.rows);

const linked = await c.query(`
  UPDATE orders o
  SET user_id = u.id
  FROM users u
  WHERE lower(o.email) = lower(u.email)
    AND (o.user_id IS NULL OR o.user_id <> u.id)
  RETURNING o.order_number, o.email, o.user_id
`);
console.log("linked by email:", linked.rows);

const sample = await c.query(`
  SELECT order_number, email, user_id, status
  FROM orders
  WHERE lower(email) IN ('gwada1@gmail.com', 'idris81ahmad@gmail.com')
  ORDER BY created_at DESC
`);
console.log("key customer orders:", sample.rows);

await c.end();
console.log("✓ repair complete");
