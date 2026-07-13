/**
 * Local webhook signature + live health checks.
 * Usage:
 *   node scripts/test-webhook.mjs
 *   node scripts/test-webhook.mjs --live
 */
import { createHmac } from "node:crypto";
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

const secret = process.env.PAYSTACK_SECRET_KEY;
const live = process.argv.includes("--live");
const base = process.env.NEXT_PUBLIC_SITE_URL || "https://biyora-shop.vercel.app";

console.log("--- webhook test ---");
console.log("secret set:", Boolean(secret));
console.log("mode:", secret?.includes("_test_") ? "test" : secret ? "live-or-custom" : "n/a");

if (secret) {
  const body = JSON.stringify({
    event: "charge.success",
    data: {
      status: "success",
      reference: "BIYORA-WEBHOOK-TEST",
      amount: 10000,
      customer: { email: "test@example.com" },
      metadata: { orderNumber: "BIYORA-WEBHOOK-TEST" },
    },
  });
  const signature = createHmac("sha512", secret).update(body).digest("hex");
  console.log("sample signature length:", signature.length);
  console.log("sample body bytes:", Buffer.byteLength(body));

  if (live) {
    console.log("POST", `${base.replace(/\/$/, "")}/api/paystack/webhook`);
    const res = await fetch(`${base.replace(/\/$/, "")}/api/paystack/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-paystack-signature": signature,
      },
      body,
    });
    console.log("live POST status:", res.status);
    console.log("live POST body:", (await res.text()).slice(0, 300));
  } else {
    console.log("Skip live POST (pass --live to hit production).");
    console.log("Note: live POST with fake reference may 500 if order missing — that is OK for retry semantics.");
  }
}

if (live || true) {
  for (const path of ["/api/paystack/webhook", "/api/health"]) {
    const url = `${base.replace(/\/$/, "")}${path}`;
    try {
      const res = await fetch(url);
      console.log("GET", path, res.status, (await res.text()).slice(0, 220));
    } catch (e) {
      console.log("GET", path, "ERR", e.message);
    }
  }
}
