/**
 * Invalidate known publicly exposed password hashes on admin accounts.
 * After this, those accounts cannot log in until set-admin-password.mjs is run.
 *
 * Usage: node scripts/lock-compromised-admins.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
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

/** Hashes that appeared in the public repo (legacyAdmins / verify-admin). */
const COMPROMISED_HASHES = new Set([
  "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // "password"
  "$2b$10$NHjw7GrEcNuRFzc0ohscbelRgHmN41fJoJ55KhbQ0GoF0FaAvDRmW", // known legacy
]);

const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();

const users = await c.query(
  `SELECT id, email, password_hash, role FROM users WHERE role = 'admin'`,
);

let locked = 0;
for (const u of users.rows) {
  if (!COMPROMISED_HASHES.has(u.password_hash)) continue;
  // Unusable random hash — nobody knows the plaintext
  const junk = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
  await c.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [junk, u.id]);
  console.log(`locked compromised admin: ${u.email} (id ${u.id})`);
  locked += 1;
}

await c.end();
console.log(
  locked
    ? `✓ Locked ${locked} admin(s). Set a new password with:\n  node scripts/set-admin-password.mjs you@email.com "NewStrongPass12!"`
    : "✓ No compromised password hashes found on admin users.",
);
