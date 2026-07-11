import { runDatabaseSeed } from "../lib/db/seed";

const forceProducts = process.argv.includes("--force-products");

async function main() {
  const result = await runDatabaseSeed({ forceProducts });
  console.log(`Seeded ${result.admins} admin user(s) and ${result.products} product(s).`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});