/**
 * Apply Drizzle migrations and seed admin users + default products.
 * Usage: node scripts/db-setup.mjs [--force-products]
 *
 * Requires POSTGRES_URL in environment (.env.local loaded via dotenv if present).
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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

if (!process.env.POSTGRES_URL) {
  console.error("POSTGRES_URL is required. Add it to .env.local or your shell environment.");
  process.exit(1);
}

const forceProducts = process.argv.includes("--force-products");

console.log("→ Pushing schema to Postgres (drizzle-kit push)…");
execSync("npx drizzle-kit push", { stdio: "inherit" });

console.log("→ Seeding database…");
execSync(
  `npx tsx scripts/seed-db.ts${forceProducts ? " --force-products" : ""}`,
  { stdio: "inherit" },
);

console.log("✓ Database setup complete");