import { Resend } from "resend";
import { siteConfig } from "@/lib/site";
import type { ShippingJson } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { isEmailEnvReady } from "@/lib/env";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail =
  process.env.RESEND_FROM_EMAIL?.trim() || "BIYORA SHOP <onboarding@resend.dev>";
const replyTo = process.env.CONTACT_INBOX_EMAIL?.trim() || undefined;

const MAX_SEND_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 400;

export function hasEmail(): boolean {
  return isEmailEnvReady() && Boolean(resend);
}

function siteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    siteConfig.url ||
    "https://biyora-shop.vercel.app"
  ).replace(/\/$/, "");
}

function formatShippingAddress(shipping: ShippingJson): string {
  const lines = [
    shipping.fullName,
    shipping.address,
    [shipping.city, shipping.state, shipping.postalCode].filter(Boolean).join(", "),
    shipping.country ?? "Nigeria",
    shipping.phone ? `Tel: ${shipping.phone}` : null,
  ].filter(Boolean);

  return lines.join("<br/>");
}

export type EmailSendResult = {
  ok: boolean;
  demo?: boolean;
  error?: string;
  providerId?: string;
  attempts?: number;
};

function normalizeRecipient(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isPermanentSendError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("invalid") ||
    m.includes("not allowed") ||
    m.includes("unverified") ||
    m.includes("domain") ||
    m.includes("blocked") ||
    m.includes("forbidden") ||
    m.includes("api key") ||
    m.includes("unauthorized") ||
    m.includes("validation")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWithRetry(params: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  scope: string;
  meta?: Record<string, unknown>;
}): Promise<EmailSendResult> {
  if (!resend) {
    logger.ops("email", `${params.scope} DEMO (no RESEND_API_KEY)`, params.meta);
    return { ok: true, demo: true, attempts: 0 };
  }

  if (
    process.env.NODE_ENV === "production" &&
    fromEmail.includes("onboarding@resend.dev")
  ) {
    logger.warn(
      "email",
      "Using Resend onboarding sender — verify a domain and set RESEND_FROM_EMAIL for reliable delivery",
    );
  }

  let lastError: string | undefined;

  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
    try {
      const result = await resend.emails.send({
        from: fromEmail,
        to: params.to,
        subject: params.subject,
        html: params.html,
        ...(params.replyTo || replyTo
          ? { replyTo: params.replyTo || replyTo }
          : {}),
      });

      if (result.error) {
        lastError = result.error.message || "resend_rejected";
        logger.warn("email", `${params.scope} attempt failed`, {
          ...params.meta,
          attempt,
          error: lastError,
        });
        if (isPermanentSendError(lastError) || attempt === MAX_SEND_ATTEMPTS) {
          break;
        }
        await sleep(BASE_BACKOFF_MS * attempt * attempt);
        continue;
      }

      logger.ops("email", `${params.scope} sent`, {
        ...params.meta,
        attempt,
        id: result.data?.id,
      });
      return {
        ok: true,
        providerId: result.data?.id,
        attempts: attempt,
      };
    } catch (e) {
      lastError = e instanceof Error ? e.message : "send_failed";
      logger.warn("email", `${params.scope} attempt threw`, {
        ...params.meta,
        attempt,
        error: lastError,
      });
      if (isPermanentSendError(lastError) || attempt === MAX_SEND_ATTEMPTS) {
        break;
      }
      await sleep(BASE_BACKOFF_MS * attempt * attempt);
    }
  }

  logger.error("email", `${params.scope} failed after retries`, {
    ...params.meta,
    error: lastError,
    attempts: MAX_SEND_ATTEMPTS,
  });
  return { ok: false, error: lastError, attempts: MAX_SEND_ATTEMPTS };
}

export async function sendOrderConfirmation(params: {
  to: string;
  orderNumber: string;
  customerName: string;
  shipping: ShippingJson;
  items: { name: string; quantity: number; length: string; lineTotal: number }[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
}): Promise<EmailSendResult> {
  const to = normalizeRecipient(params.to);
  if (!isValidEmail(to)) {
    logger.error("email", "Invalid recipient for order confirmation", {
      orderNumber: params.orderNumber,
    });
    return { ok: false, error: "invalid_recipient" };
  }

  const trackUrl = `${siteBaseUrl()}/account/orders`;
  const shopUrl = `${siteBaseUrl()}/shop`;
  const itemsHtml = params.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:12px 0;border-bottom:1px solid #EDE6D9;vertical-align:top">
            <div style="font-weight:600">${escapeHtml(i.name)}</div>
            <div style="color:#6B5F54;font-size:13px;margin-top:4px">${escapeHtml(i.length)} × ${i.quantity}</div>
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid #EDE6D9;vertical-align:top;white-space:nowrap">₦${i.lineTotal.toLocaleString()}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:Georgia,'Times New Roman',serif;background:#F8F4EC;padding:24px 12px">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #D4C9B8">
        <div style="background:linear-gradient(135deg,#6B2D3C 0%,#4A1F2A 100%);color:#fff;padding:28px 28px 24px">
          <div style="font-size:11px;letter-spacing:0.2em;opacity:0.85;margin-bottom:10px">BIYORA SHOP · KANTIN KWARI</div>
          <h1 style="margin:0;font-size:26px;font-weight:600;line-height:1.2">Thank you, ${escapeHtml(params.customerName)}!</h1>
          <p style="margin:10px 0 0;opacity:0.92;font-size:15px;line-height:1.5">
            Your payment is confirmed. We’re preparing your fabrics with care.
          </p>
          <div style="margin-top:16px;display:inline-block;background:rgba(255,255,255,0.12);padding:8px 14px;border-radius:999px;font-size:13px">
            Order <strong style="font-family:ui-monospace,monospace">${escapeHtml(params.orderNumber)}</strong>
          </div>
        </div>
        <div style="padding:28px">
          <div style="background:#FBF8F3;border:1px solid #E8DFD0;border-radius:14px;padding:14px 16px;margin-bottom:22px;font-size:13px;color:#4A4038;line-height:1.55">
            <strong style="color:#6B2D3C">What happens next</strong><br/>
            1. We inspect &amp; pack your order<br/>
            2. You get a shipping email when it leaves us<br/>
            3. Track progress anytime in your account
          </div>
          <h2 style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#C5A46E;margin:0 0 8px">Deliver to</h2>
          <p style="margin:0 0 22px;color:#4A4038;line-height:1.65;font-size:15px">${formatShippingAddress(params.shipping)}</p>
          <h2 style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#C5A46E;margin:0 0 8px">Your fabrics</h2>
          <table width="100%" style="margin:0 0 20px;font-size:15px">${itemsHtml}</table>
          <table width="100%" style="font-size:14px;color:#4A4038">
            <tr><td style="padding:4px 0">Subtotal</td><td align="right">₦${params.subtotal.toLocaleString()}</td></tr>
            <tr><td style="padding:4px 0">Shipping</td><td align="right">₦${params.shippingFee.toLocaleString()}</td></tr>
            ${params.discount > 0 ? `<tr><td style="padding:4px 0">Discount</td><td align="right">−₦${params.discount.toLocaleString()}</td></tr>` : ""}
            <tr><td style="padding:12px 0 0;font-size:18px;font-weight:700;color:#6B2D3C;border-top:2px solid #EDE6D9">Total paid</td>
                <td align="right" style="padding:12px 0 0;font-size:18px;font-weight:700;color:#6B2D3C;border-top:2px solid #EDE6D9">₦${params.total.toLocaleString()}</td></tr>
          </table>
          <div style="margin:28px 0 8px;text-align:center">
            <a href="${trackUrl}" style="display:inline-block;background:#6B2D3C;color:#fff;text-decoration:none;padding:14px 22px;border-radius:14px;font-size:14px;font-weight:600">
              Track your order
            </a>
          </div>
          <div style="margin-top:24px;padding:16px;border-radius:14px;background:#F8F4EC;border:1px dashed #D4C9B8;text-align:center">
            <div style="font-size:12px;letter-spacing:0.14em;color:#C5A46E;margin-bottom:6px">A THANK YOU GIFT</div>
            <div style="font-size:15px;color:#2C2522;line-height:1.5">
              Use code <strong style="font-family:ui-monospace,monospace;color:#6B2D3C">THANKYOU5</strong> for
              <strong> 5% off</strong> your next order (min ₦15,000).
            </div>
            <a href="${shopUrl}" style="display:inline-block;margin-top:12px;color:#6B2D3C;font-size:13px">Shop again →</a>
          </div>
          <p style="color:#6B5F54;font-size:13px;margin:24px 0 0;line-height:1.6;text-align:center">
            Sourced from Kantin Kwari · Inspected before shipping · 7-day returns<br/>
            Questions? Reply to this email or WhatsApp us.<br/>
            — ${escapeHtml(siteConfig.name)}
          </p>
        </div>
      </div>
    </div>`;

  return sendWithRetry({
    to,
    subject: `Order confirmed — ${params.orderNumber} | BIYORA SHOP`,
    html,
    scope: "Order confirmation",
    meta: { orderNumber: params.orderNumber, to },
  });
}

export async function sendShippingNotification(params: {
  to: string;
  orderNumber: string;
  customerName: string;
  trackingNumber?: string;
  note?: string;
}): Promise<EmailSendResult> {
  const to = normalizeRecipient(params.to);
  if (!isValidEmail(to)) {
    return { ok: false, error: "invalid_recipient" };
  }
  const trackUrl = `${siteBaseUrl()}/account/orders`;
  const tracking = params.trackingNumber?.trim();
  const html = `
    <div style="font-family:Georgia,serif;background:#F8F4EC;padding:24px 12px">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #D4C9B8">
        <div style="background:#6B2D3C;color:#fff;padding:28px">
          <div style="font-size:11px;letter-spacing:0.2em;opacity:0.85">BIYORA SHOP</div>
          <h1 style="margin:10px 0 0;font-size:24px">Your fabric is on the way</h1>
          <p style="margin:10px 0 0;opacity:0.9;font-size:15px">
            Hi ${escapeHtml(params.customerName)}, order
            <strong style="font-family:ui-monospace,monospace">${escapeHtml(params.orderNumber)}</strong>
            has been shipped.
          </p>
        </div>
        <div style="padding:28px;color:#4A4038;font-size:15px;line-height:1.6">
          ${
            tracking
              ? `<p style="margin:0 0 16px"><strong>Tracking number</strong><br/>
                 <span style="font-family:ui-monospace,monospace;font-size:16px;color:#6B2D3C">${escapeHtml(tracking)}</span></p>`
              : `<p style="margin:0 0 16px">Your parcel has left our workshop. We’ll keep your delivery timeline updated in your account.</p>`
          }
          ${params.note ? `<p style="margin:0 0 16px;color:#6B5F54">${escapeHtml(params.note)}</p>` : ""}
          <p style="margin:0 0 20px">Typical windows: <strong>Kano &amp; Abuja 2–4 days</strong> · <strong>Lagos 3–6 days</strong> · other states 3–7 days.</p>
          <a href="${trackUrl}" style="display:inline-block;background:#6B2D3C;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-size:14px">
            Track delivery
          </a>
          <p style="color:#6B5F54;font-size:13px;margin:24px 0 0">— ${escapeHtml(siteConfig.name)}</p>
        </div>
      </div>
    </div>`;

  return sendWithRetry({
    to,
    subject: `Shipped — ${params.orderNumber} | BIYORA SHOP`,
    html,
    scope: "Shipping notification",
    meta: { orderNumber: params.orderNumber, to, tracking: tracking || null },
  });
}

export async function sendContactReply(params: {
  to: string;
  name: string;
  subject: string;
  message: string;
}): Promise<EmailSendResult> {
  const to = normalizeRecipient(params.to);
  if (!isValidEmail(to)) {
    return { ok: false, error: "invalid_recipient" };
  }

  const customerResult = await sendWithRetry({
    to,
    subject: `We received your message — ${siteConfig.name}`,
    html: `<p>Dear ${escapeHtml(params.name)},</p><p>Thank you for contacting BIYORA SHOP regarding "<strong>${escapeHtml(params.subject)}</strong>". Our team will respond within 24 hours.</p><p style="color:#6B5F54;font-size:13px">Your message:<br/>${escapeHtml(params.message)}</p>`,
    scope: "Contact auto-reply",
    meta: { to },
  });

  if (process.env.CONTACT_INBOX_EMAIL) {
    const inbox = normalizeRecipient(process.env.CONTACT_INBOX_EMAIL);
    if (isValidEmail(inbox)) {
      await sendWithRetry({
        to: inbox,
        subject: `New contact: ${params.subject}`,
        html: `<p><strong>${escapeHtml(params.name)}</strong> (${escapeHtml(to)})</p><p>${escapeHtml(params.message)}</p>`,
        replyTo: to,
        scope: "Contact inbox notify",
        meta: { to: inbox },
      });
    }
  }

  return customerResult;
}

export async function sendWholesaleInquiryEmail(params: {
  company: string;
  contactName: string;
  email: string;
  phone: string;
  fabricTypes: string;
  estimatedQuantity: string;
  message?: string;
}): Promise<EmailSendResult> {
  const inbox = process.env.CONTACT_INBOX_EMAIL?.trim();
  if (!inbox) {
    logger.ops("email", "Wholesale inquiry stored; no CONTACT_INBOX_EMAIL for notify", {
      company: params.company,
    });
    return { ok: true, demo: true };
  }

  const to = normalizeRecipient(inbox);
  const reply = normalizeRecipient(params.email);

  return sendWithRetry({
    to,
    subject: `Wholesale inquiry — ${params.company}`,
    html: `<p><strong>${escapeHtml(params.contactName)}</strong> at ${escapeHtml(params.company)}</p>
           <p>Email: ${escapeHtml(params.email)} | Phone: ${escapeHtml(params.phone)}</p>
           <p>Fabrics: ${escapeHtml(params.fabricTypes)}</p>
           <p>Quantity: ${escapeHtml(params.estimatedQuantity)}</p>
           <p>${escapeHtml(params.message ?? "")}</p>`,
    replyTo: isValidEmail(reply) ? reply : undefined,
    scope: "Wholesale inquiry",
    meta: { company: params.company, to },
  });
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
