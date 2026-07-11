import { Resend } from "resend";
import { siteConfig } from "@/lib/site";
import type { ShippingJson } from "@/lib/db/schema";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "BIYORA SHOP <onboarding@resend.dev>";

export function hasEmail(): boolean {
  return Boolean(resend);
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
}): Promise<{ ok: boolean; demo?: boolean }> {
  if (!resend) {
    console.log("[email demo] Order confirmation", params.orderNumber, "→", params.to);
    return { ok: true, demo: true };
  }

  const itemsHtml = params.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #EDE6D9">${i.name}<br/>
            <span style="color:#6B5F54;font-size:13px">${i.length} × ${i.quantity}</span>
          </td>
          <td align="right" style="padding:8px 0;border-bottom:1px solid #EDE6D9">₦${i.lineTotal.toLocaleString()}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2C2522">
      <div style="background:#6B2D3C;color:#fff;padding:24px;border-radius:16px 16px 0 0">
        <h1 style="margin:0;font-size:24px">Thank you, ${params.customerName}!</h1>
        <p style="margin:8px 0 0;opacity:0.9">Order <strong>${params.orderNumber}</strong> is confirmed.</p>
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
    await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: `Order confirmed — ${params.orderNumber} | BIYORA SHOP`,
      html,
    });
    return { ok: true };
  } catch (e) {
    console.error("Resend order email failed:", e);
    return { ok: false };
  }
}

export async function sendContactReply(params: {
  to: string;
  name: string;
  subject: string;
  message: string;
}) {
  if (!resend) {
    console.log("[email demo] Contact reply →", params.to);
    return { ok: true, demo: true };
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: `We received your message — ${siteConfig.name}`,
      html: `<p>Dear ${params.name},</p><p>Thank you for contacting BIYORA SHOP regarding "<strong>${params.subject}</strong>". Our team will respond within 24 hours.</p><p style="color:#6B5F54;font-size:13px">Your message:<br/>${params.message}</p>`,
    });

    if (process.env.CONTACT_INBOX_EMAIL) {
      await resend.emails.send({
        from: fromEmail,
        to: process.env.CONTACT_INBOX_EMAIL,
        subject: `New contact: ${params.subject}`,
        html: `<p><strong>${params.name}</strong> (${params.to})</p><p>${params.message}</p>`,
      });
    }
    return { ok: true };
  } catch (e) {
    console.error("Resend contact email failed:", e);
    return { ok: false };
  }
}