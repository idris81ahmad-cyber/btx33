/**
 * Send a realistic order-confirmation email via Resend (no Paystack charge).
 * Usage: node scripts/send-test-order-email.mjs you@example.com
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
  console.error("Usage: node scripts/send-test-order-email.mjs you@example.com");
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY;
const from =
  process.env.RESEND_FROM_EMAIL?.trim() || "BIYORA SHOP <onboarding@resend.dev>";
const site = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://btx33.vercel.app"
).replace(/\/$/, "");

if (!apiKey) {
  console.error("❌ RESEND_API_KEY is not set.");
  console.error("");
  console.error("Fix:");
  console.error("  1. Create a key at https://resend.com/api-keys");
  console.error("  2. Vercel → Project → Settings → Environment Variables");
  console.error("     RESEND_API_KEY=re_...");
  console.error("     RESEND_FROM_EMAIL=BIYORA SHOP <hello@your-verified-domain.com>");
  console.error("  3. Redeploy, then: vercel env pull .env.local");
  console.error("  4. Re-run this script");
  console.error("");
  console.error("Check production: GET /api/health → flags.email should be true");
  process.exit(1);
}

const orderNumber = `BIYORA-TEST-${Date.now().toString(36).toUpperCase()}`;

const html = `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2C2522">
  <div style="background:#6B2D3C;color:#fff;padding:24px;border-radius:16px 16px 0 0">
    <h1 style="margin:0;font-size:24px">Thank you, Test Customer!</h1>
    <p style="margin:8px 0 0;opacity:0.9">Order <strong>${orderNumber}</strong> is confirmed.</p>
  </div>
  <div style="border:1px solid #D4C9B8;border-top:0;padding:24px;border-radius:0 0 16px 16px">
    <h2 style="font-size:16px;color:#6B2D3C;margin:0 0 8px">Delivery address</h2>
    <p style="margin:0 0 20px;color:#4A4038;line-height:1.6">
      Test Customer<br/>12 Market Road<br/>Kano, Kano<br/>Nigeria<br/>Tel: 08012345678
    </p>
    <h2 style="font-size:16px;color:#6B2D3C;margin:0 0 8px">Your fabrics</h2>
    <table width="100%" style="margin:0 0 20px">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #EDE6D9">Royal Gold Ankara<br/>
          <span style="color:#6B5F54;font-size:13px">6 yards × 1</span>
        </td>
        <td align="right" style="padding:8px 0;border-bottom:1px solid #EDE6D9">₦18,500</td>
      </tr>
    </table>
    <p style="margin:0;line-height:1.8">
      Subtotal: ₦18,500<br/>
      Shipping: ₦2,500<br/>
      <strong style="font-size:18px;color:#6B2D3C">Total paid: ₦21,000</strong>
    </p>
    <p style="margin:24px 0 0">
      <a href="${site}/account/orders" style="display:inline-block;background:#6B2D3C;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-size:14px">
        Track your order
      </a>
    </p>
    <p style="color:#6B5F54;font-size:14px;margin-top:24px;padding-top:16px;border-top:1px solid #EDE6D9">
      This is a <strong>test</strong> confirmation email from BIYORA SHOP ops.<br/>
      — BIYORA SHOP
    </p>
  </div>
</div>`;

console.log("From:", from);
console.log("To:", to);
console.log("Order:", orderNumber);
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
    subject: `Order confirmed — ${orderNumber} | BIYORA SHOP`,
    html,
  }),
});

const body = await res.json().catch(() => ({}));
console.log("HTTP", res.status);
console.log(body);

if (!res.ok) {
  console.error("\n❌ Resend rejected the send.");
  console.error("Common fixes:");
  console.error("- Verify domain in Resend; set RESEND_FROM_EMAIL to that domain");
  console.error("- onboarding@resend.dev can only send to your Resend account email");
  process.exit(1);
}

console.log("\n✓ Test order confirmation accepted by Resend.");
console.log("  Check inbox (and spam) for:", to);
