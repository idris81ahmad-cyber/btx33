import { Resend } from "resend";
import { siteConfig } from "@/lib/site";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "BIYORA SHOP <onboarding@resend.dev>";

export function hasEmail(): boolean {
  return Boolean(resend);
}

export async function sendOrderConfirmation(params: {
  to: string;
  orderNumber: string;
  customerName: string;
  items: { name: string; quantity: number; length: string; lineTotal: number }[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
}) {
  if (!resend) {
    console.log("[email demo] Order confirmation", params.orderNumber, "→", params.to);
    return { ok: true, demo: true };
  }

  const itemsHtml = params.items
    .map((i) => `<tr><td style="padding:8px 0">${i.name} (${i.length}) × ${i.quantity}</td><td align="right">₦${i.lineTotal.toLocaleString()}</td></tr>`)
    .join("");

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2C2522">
      <h1 style="color:#6B2D3C">Thank you, ${params.customerName}!</h1>
      <p>Your order <strong>${params.orderNumber}</strong> is confirmed.</p>
      <table width="100%" style="border-top:1px solid #D4C9B8;margin:20px 0">${itemsHtml}</table>
      <p>Subtotal: ₦${params.subtotal.toLocaleString()}<br/>
      Shipping: ₦${params.shippingFee.toLocaleString()}<br/>
      ${params.discount > 0 ? `Discount: −₦${params.discount.toLocaleString()}<br/>` : ""}
      <strong>Total: ₦${params.total.toLocaleString()}</strong></p>
      <p style="color:#6B5F54;font-size:14px">Kwari Market quality, delivered with care.<br/>— ${siteConfig.name}</p>
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