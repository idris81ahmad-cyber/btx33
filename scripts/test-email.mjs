/**
 * Send a test order-confirmation-style email via Resend.
 * Usage: node scripts/test-email.mjs you@example.com
 */
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

const to = process.argv[2]?.trim();
if (!to || !to.includes("@")) {
  console.error("Usage: node scripts/test-email.mjs you@example.com");
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY;
const from =
  process.env.RESEND_FROM_EMAIL?.trim() || "BIYORA SHOP <onboarding@resend.dev>";

if (!apiKey) {
  console.error("RESEND_API_KEY is not set. Add it to .env.local or the environment.");
  process.exit(1);
}

console.log("From:", from);
console.log("To:", to);
console.log("Key prefix:", apiKey.slice(0, 8) + "…");

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from,
    to: [to],
    subject: "BIYORA SHOP — email delivery test",
    html: `<div style="font-family:Georgia,serif;padding:24px">
      <h1 style="color:#6B2D3C">Email test OK</h1>
      <p>If you received this, Resend is configured for BIYORA SHOP order confirmations.</p>
      <p style="color:#6B5F54;font-size:13px">Sent at ${new Date().toISOString()}</p>
    </div>`,
  }),
});

const body = await res.json().catch(() => ({}));
console.log("HTTP", res.status);
console.log(body);

if (!res.ok) {
  console.error("\nTips:");
  console.error("- Verify your domain in Resend and set RESEND_FROM_EMAIL to that domain");
  console.error("- onboarding@resend.dev can only send to your Resend account email");
  console.error("- Check API key is live and not revoked");
  process.exit(1);
}

console.log("\n✓ Test email accepted by Resend. Check the inbox (and spam).");
