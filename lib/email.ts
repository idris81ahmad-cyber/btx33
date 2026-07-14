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
  const itemsHtml = params.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #EDE6D9">${escapeHtml(i.name)}<br/>
            <span style="color:#6B5F54;font-size:13px">${escapeHtml(i.length)} × ${i.quantity}</span>
          </td>
          <td align="right" style="padding:8px 0;border-bottom:1px solid #EDE6D9">₦${i.lineTotal.toLocaleString()}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2C2522">
      <div style="background:#6B2D3C;color:#fff;padding:24px;border-radius:16px 16px 0 0">
        <h1 style="margin:0;font-size:24px">Thank you, ${escapeHtml(params.customerName)}!</h1>
        <p style="margin:8px 0 0;opacity:0.9">Order <strong>${escapeHtml(params.orderNumber)}</strong> is confirmed.</p>
      </div>
      <div style="border:1px solid #D4C9B8;border-top:0;padding:24px;border-radius:0 0 16px 16px">
        <h2 style="font-size:16px;color:#6B2D3C;margin:0 0 8px">Delivery address</h2>
        <p style="margin:0 0 20px;color:#4A4038;line-height:1.6">${formatShippingAddress(params.shipping)}</p>
        <h2 style="font-size:16px;color:#6B2D3C;margin:0 0 8px">Your fabrics</h2>
        <table width="100%" style="margin:0 0 20px">${itemsHtml}</table>
        <p style="margin:0;line-height:1.8">
          Subtotal: ₦${params.subtotal.toLocaleString()}<br/>
          Shipping: ₦${params.shippingFee.toLocaleString()}<br/>
          ${params.discount > 0 ? `Discount: −₦${params.discount.toLocaleString()}<br/>` : ""}
          <strong style="font-size:18px;color:#6B2D3C">Total paid: ₦${params.total.toLocaleString()}</strong>
        </p>
        <p style="margin:24px 0 0">
          <a href="${trackUrl}" style="display:inline-block;background:#6B2D3C;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-size:14px">
            Track your order
          </a>
        </p>
        <p style="color:#6B5F54;font-size:14px;margin-top:24px;padding-top:16px;border-top:1px solid #EDE6D9">
          We will notify you when your order ships. Questions? Reply to this email or WhatsApp us.<br/>
          — ${escapeHtml(siteConfig.name)}
        </p>
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
