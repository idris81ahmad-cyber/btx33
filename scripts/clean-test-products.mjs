/**
 * Delete Storage Test / Test Fabric junk products from Postgres.
 * Usage: node scripts/clean-test-products.mjs
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

const found = await c.query(`
  SELECT id, slug, name FROM products
  WHERE name ILIKE 'Storage Test%'
     OR name ILIKE 'Test Fabric%'
     OR slug ILIKE 'storage-test%'
     OR slug ILIKE 'test-fabric%'
  ORDER BY id
`);
console.log("matching products:", found.rows);

if (found.rows.length === 0) {
  console.log("✓ No test products in DB");
  await c.end();
  process.exit(0);
}

const ids = found.rows.map((r) => r.id);
// Remove dependent reviews first (FK)
const rev = await c.query(
  `DELETE FROM reviews WHERE product_id = ANY($1::int[]) RETURNING id, product_id`,
  [ids],
);
console.log("deleted reviews:", rev.rows.length);

const deleted = await c.query(
  `
  DELETE FROM products
  WHERE id = ANY($1::int[])
  RETURNING id, slug, name
`,
  [ids],
);
console.log("deleted products:", deleted.rows);
console.log(`✓ Removed ${deleted.rows.length} test product(s) from production DB`);
await c.end();
