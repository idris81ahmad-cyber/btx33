/**
 * Local diagnostics for Paystack + DB after payment failures.
 * Usage: node scripts/debug-payment.mjs [optional-reference]
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

const ref = process.argv[2];
const secret = process.env.PAYSTACK_SECRET_KEY;
const pub = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

console.log("--- env ---");
console.log("PAYSTACK_SECRET prefix:", secret ? secret.slice(0, 12) : "MISSING");
console.log("PAYSTACK_PUBLIC prefix:", pub ? pub.slice(0, 12) : "MISSING");
console.log("keys mode match:", secret && pub ? (secret.includes("_test_") === pub.includes("_test_")) : "n/a");
console.log("NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL || "MISSING");
console.log("has DATABASE_URL:", Boolean(databaseUrl));

if (databaseUrl) {
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`,
    );
    console.log(
      "tables:",
      tables.rows.map((r) => r.table_name).join(", ") || "(none)",
    );
    const orders = await client.query(
      `SELECT order_number, status, email, total, created_at FROM orders ORDER BY created_at DESC LIMIT 8`,
    ).catch((e) => ({ rows: [], error: e.message }));
    if (orders.error) console.log("orders query error:", orders.error);
    else {
      console.log("recent orders:", orders.rows.length);
      for (const o of orders.rows) {
        console.log(
          `  ${o.order_number} | ${o.status} | ${o.email} | ₦${o.total} | ${o.created_at}`,
        );
      }
    }
    await client.end();
  } catch (e) {
    console.error("DB connect failed:", e.message);
  }
}

if (ref && secret) {
  console.log("--- paystack verify", ref, "---");
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  const text = await res.text();
  console.log("HTTP", res.status);
  try {
    const json = JSON.parse(text);
    console.log("status:", json.status, "message:", json.message);
    console.log("data.status:", json.data?.status);
    console.log("data.reference:", json.data?.reference);
    console.log("data.amount:", json.data?.amount);
    console.log("customer:", json.data?.customer?.email);
    console.log("metadata keys:", Object.keys(json.data?.metadata || {}));
  } catch {
    console.log(text.slice(0, 500));
  }
}

// Live site probe
console.log("--- live site ---");
for (const url of [
  "https://biyora-shop.vercel.app/api/products",
  "https://biyora-shop.vercel.app/api/paystack/verify",
]) {
  try {
    const res = await fetch(url, {
      method: url.includes("verify") ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: url.includes("verify") ? "{}" : undefined,
    });
    const body = await res.text();
    console.log(url, res.status, body.slice(0, 200));
  } catch (e) {
    console.log(url, "ERR", e.message);
  }
}
