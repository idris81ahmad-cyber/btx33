import { Resend } from "resend";
import { siteConfig } from "@/lib/site";
import type { ShippingJson } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { isEmailEnvReady } from "@/lib/env";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail =
  process.env.RESEND_FROM_EMAIL ?? "BIYORA SHOP <onboarding@resend.dev>";

export function hasEmail(): boolean {
  return isEmailEnvReady() && Boolean(resend);
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
};

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
  if (!params.to?.includes("@")) {
    logger.error("email", "Invalid recipient for order confirmation", {
      orderNumber: params.orderNumber,
    });
    return { ok: false, error: "invalid_recipient" };
  }

  if (!resend) {
    logger.ops("email", "Order confirmation DEMO (no RESEND_API_KEY)", {
      orderNumber: params.orderNumber,
      to: params.to,
      total: params.total,
    });
    return { ok: true, demo: true };
  }

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
        <p style="color:#6B5F54;font-size:14px;margin-top:24px;padding-top:16px;border-top:1px solid #EDE6D9">
          We will notify you when your order ships. Questions? Reply to this email or WhatsApp us.<br/>
          — ${siteConfig.name}
        </p>
      </div>
    </div>`;

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: `Order confirmed — ${params.orderNumber} | BIYORA SHOP`,
      html,
    });

    if (result.error) {
      logger.error("email", "Resend rejected order confirmation", {
        orderNumber: params.orderNumber,
        to: params.to,
        error: result.error.message,
      });
      return { ok: false, error: result.error.message };
    }

    logger.ops("email", "Order confirmation sent", {
      orderNumber: params.orderNumber,
      to: params.to,
      id: result.data?.id,
    });
    return { ok: true, providerId: result.data?.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "send_failed";
    logger.error("email", "Resend order email failed", {
      orderNumber: params.orderNumber,
      to: params.to,
      error: message,
    });
    return { ok: false, error: message };
  }
}

export async function sendContactReply(params: {
  to: string;
  name: string;
  subject: string;
  message: string;
}): Promise<EmailSendResult> {
  if (!resend) {
    logger.ops("email", "Contact reply DEMO (no RESEND_API_KEY)", {
      to: params.to,
    });
    return { ok: true, demo: true };
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: `We received your message — ${siteConfig.name}`,
      html: `<p>Dear ${escapeHtml(params.name)},</p><p>Thank you for contacting BIYORA SHOP regarding "<strong>${escapeHtml(params.subject)}</strong>". Our team will respond within 24 hours.</p><p style="color:#6B5F54;font-size:13px">Your message:<br/>${escapeHtml(params.message)}</p>`,
    });

    if (process.env.CONTACT_INBOX_EMAIL) {
      await resend.emails.send({
        from: fromEmail,
        to: process.env.CONTACT_INBOX_EMAIL,
        subject: `New contact: ${params.subject}`,
        html: `<p><strong>${escapeHtml(params.name)}</strong> (${escapeHtml(params.to)})</p><p>${escapeHtml(params.message)}</p>`,
      });
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "send_failed";
    logger.error("email", "Resend contact email failed", { error: message });
    return { ok: false, error: message };
  }
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
