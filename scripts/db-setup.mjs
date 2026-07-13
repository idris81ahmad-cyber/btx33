/**
 * Apply Drizzle migrations and seed admin users + default products.
 * Usage: node scripts/db-setup.mjs [--force-products]
 *
 * Requires POSTGRES_URL or DATABASE_URL in environment (.env.local loaded if present).
 */
import { execSync } from "node:child_process";
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

const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error(
    "DATABASE_URL or POSTGRES_URL is required. Connect Neon via Vercel and run `vercel env pull .env.local`."
  );
  process.exit(1);
}

if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}

const forceProducts = process.argv.includes("--force-products");

async function applySqlMigration() {
  const drizzleDir = resolve(process.cwd(), "drizzle");
  const { readdirSync } = await import("node:fs");
  const files = readdirSync(drizzleDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    throw new Error(`No SQL migrations found in ${drizzleDir}`);
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    for (const file of files) {
      const migrationPath = resolve(drizzleDir, file);
      console.log(`  · ${file}`);
      const statements = readFileSync(migrationPath, "utf8")
        .split(/--> statement-breakpoint/g)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const statement of statements) {
        await client.query(statement);
      }
    }
  } finally {
    await client.end();
  }
}

console.log("→ Applying schema to Postgres…");
await applySqlMigration();

console.log("→ Seeding database…");
execSync(
  `npx tsx scripts/seed-db.ts${forceProducts ? " --force-products" : ""}`,
  { stdio: "inherit" },
);

console.log("✓ Database setup complete");