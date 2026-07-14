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

const orders = await c.query(
  `SELECT order_number, status, email, user_id, total, created_at
   FROM orders ORDER BY created_at DESC LIMIT 12`,
);
console.log("--- ORDERS ---");
for (const r of orders.rows) console.log(r);

const users = await c.query(`SELECT id, email, role, name FROM users ORDER BY id`);
console.log("--- USERS ---");
for (const r of users.rows) console.log(r);

const hist = await c.query(`SELECT to_regclass('public.order_status_history') as t`);
console.log("--- history table ---", hist.rows[0]);

// Simulate account lookup for each customer email
for (const email of ["gwada1@gmail.com", "halifa@biyorashop.com", "Gwada1@gmail.com"]) {
  const byEmail = await c.query(
    `SELECT order_number, user_id FROM orders WHERE lower(email) = lower($1)`,
    [email],
  );
  console.log(`lookup lower(email)=${email}:`, byEmail.rows.length, "orders");
}

await c.end();
