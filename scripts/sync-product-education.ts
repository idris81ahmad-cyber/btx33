/**
 * Push catalog education specs into Postgres products.specifications by slug.
 * Usage: npx tsx scripts/sync-product-education.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { products } from "../lib/products";

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

if (!url) {
  console.error("No database URL");
  process.exit(1);
}

async function main() {
  const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  let updated = 0;
  for (const p of products) {
    const res = await c.query(
      `UPDATE products
       SET specifications = $1::jsonb,
           description = $2,
           short_description = $3,
           updated_at = NOW()
       WHERE slug = $4
       RETURNING id, name`,
      [
        JSON.stringify(p.specifications || {}),
        p.description,
        p.shortDescription,
        p.slug,
      ],
    );
    if (res.rowCount) {
      updated += 1;
      console.log("updated", p.slug);
    }
  }

  console.log(`✓ Synced education for ${updated}/${products.length} products`);
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
