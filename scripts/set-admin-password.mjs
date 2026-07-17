/**
 * Create or update a database admin password (bcrypt).
 *
 * Usage:
 *   node scripts/set-admin-password.mjs admin@example.com "YourStrongPassword12"
 *
 * Or:
 *   set ADMIN_EMAIL / ADMIN_PASSWORD in env, then:
 *   node scripts/set-admin-password.mjs
 *
 * Never commit real passwords. Prefer long random secrets.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
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

const email = (process.argv[2] || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.argv[3] || process.env.ADMIN_PASSWORD || "";
const name = process.env.ADMIN_NAME || "BIYORA SHOP Admin";

if (!email.includes("@") || password.length < 12) {
  console.error(
    "Usage: node scripts/set-admin-password.mjs <email> <password-min-12-chars>",
  );
  console.error(
    "Or set ADMIN_EMAIL and ADMIN_PASSWORD (12+ chars) in the environment.",
  );
  process.exit(1);
}

const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!url) {
  console.error("No DATABASE_URL / POSTGRES_URL in environment.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();

const existing = await c.query(`SELECT id, role FROM users WHERE lower(email) = $1`, [email]);
if (existing.rows.length) {
  await c.query(
    `UPDATE users SET password_hash = $1, role = 'admin', name = COALESCE(name, $2) WHERE id = $3`,
    [hash, name, existing.rows[0].id],
  );
  console.log(`✓ Updated admin password for ${email} (id ${existing.rows[0].id})`);
} else {
  const ins = await c.query(
    `INSERT INTO users (email, name, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     RETURNING id`,
    [email, name, hash],
  );
  console.log(`✓ Created admin ${email} (id ${ins.rows[0].id})`);
}

await c.end();
console.log("Sign in at /admin/login with this email. Do not commit the password.");
