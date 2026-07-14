/** Client-safe invoice HTML builder for order receipts. */

export type InvoiceItem = {
  name: string;
  quantity: number;
  selectedLength?: string;
  unitPrice?: number;
  lineTotal?: number;
};

export type InvoiceOrder = {
  orderNumber: string;
  email: string;
  fullName?: string;
  phone?: string;
  status: string;
  createdAt: string;
  paymentMethod?: string;
  couponCode?: string | null;
  items: InvoiceItem[];
  shipping?: {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  total: number;
};

function esc(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function buildInvoiceHtml(order: InvoiceOrder): string {
  const items = Array.isArray(order.items) ? order.items : [];
  const ship = order.shipping;
  const subtotal =
    typeof order.subtotal === "number"
      ? order.subtotal
      : items.reduce((s, i) => s + (Number(i.lineTotal) || 0), 0);
  const shippingFee = Number(order.shippingFee) || 0;
  const discount = Number(order.discount) || 0;
  const total = Number(order.total) || Math.max(0, subtotal + shippingFee - discount);

  const rows = items
    .map((item) => {
      const line =
        typeof item.lineTotal === "number"
          ? item.lineTotal
          : (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
      return `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #EDE6D9">${esc(item.name)}
          <div style="color:#6B5F54;font-size:12px">${esc(item.selectedLength || "Standard")} × ${Number(item.quantity) || 0}</div>
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #EDE6D9;text-align:right">₦${line.toLocaleString()}</td>
      </tr>`;
    })
    .join("");

  const shipBlock = ship
    ? `${esc(ship.fullName || order.fullName || "")}<br/>
       ${esc(ship.phone || order.phone || "")}<br/>
       ${esc(ship.address || "")}<br/>
       ${esc([ship.city, ship.state, ship.postalCode].filter(Boolean).join(", "))}<br/>
       ${esc(ship.country || "Nigeria")}`
    : esc(order.fullName || order.email);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Invoice ${esc(order.orderNumber)} — BIYORA SHOP</title>
  <style>
    body{font-family:Georgia,serif;color:#2C2522;max-width:720px;margin:40px auto;padding:0 20px}
    h1{color:#6B2D3C;font-size:28px;margin:0}
    .muted{color:#6B5F54;font-size:13px}
    table{width:100%;border-collapse:collapse;margin:20px 0}
    .totals td{padding:6px 8px}
    .actions{margin-top:32px}
    @media print{.actions{display:none}body{margin:0}}
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
    <div>
      <h1>BIYORA SHOP</h1>
      <p class="muted">Premium African textiles · Kantin Kwari, Kano</p>
    </div>
    <div style="text-align:right">
      <div style="font-weight:700;font-size:18px">INVOICE</div>
      <div class="muted">${esc(order.orderNumber)}</div>
      <div class="muted">${esc(formatDate(order.createdAt))}</div>
      <div class="muted" style="text-transform:capitalize">Status: ${esc(order.status)}</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:28px">
    <div>
      <div style="font-size:11px;letter-spacing:0.12em;color:#C5A46E;font-weight:600">BILL TO</div>
      <p style="margin:8px 0 0;line-height:1.55">
        ${esc(order.fullName || ship?.fullName || "Customer")}<br/>
        ${esc(order.email)}<br/>
        ${order.phone ? esc(order.phone) : ""}
      </p>
    </div>
    <div>
      <div style="font-size:11px;letter-spacing:0.12em;color:#C5A46E;font-weight:600">SHIP TO</div>
      <p style="margin:8px 0 0;line-height:1.55">${shipBlock}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:left;padding:10px 8px;border-bottom:2px solid #D4C9B8">Item</th>
        <th style="text-align:right;padding:10px 8px;border-bottom:2px solid #D4C9B8">Amount</th>
      </tr>
    </thead>
    <tbody>${rows || `<tr><td colspan="2" class="muted" style="padding:16px">No line items</td></tr>`}</tbody>
  </table>

  <table class="totals" style="max-width:280px;margin-left:auto">
    <tr><td class="muted">Subtotal</td><td style="text-align:right">₦${subtotal.toLocaleString()}</td></tr>
    <tr><td class="muted">Shipping</td><td style="text-align:right">₦${shippingFee.toLocaleString()}</td></tr>
    ${
      discount > 0
        ? `<tr><td class="muted">Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ""}</td><td style="text-align:right">−₦${discount.toLocaleString()}</td></tr>`
        : ""
    }
    <tr>
      <td style="font-weight:700;padding-top:12px;border-top:2px solid #D4C9B8">Total</td>
      <td style="text-align:right;font-weight:700;padding-top:12px;border-top:2px solid #D4C9B8;color:#6B2D3C">₦${total.toLocaleString()}</td>
    </tr>
  </table>

  <p class="muted" style="margin-top:28px">
    Payment: ${esc(order.paymentMethod || "paystack")} · Thank you for shopping with BIYORA SHOP.
  </p>

  <div class="actions">
    <button onclick="window.print()" style="background:#6B2D3C;color:#fff;border:0;padding:12px 20px;border-radius:12px;font:inherit;cursor:pointer">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>`;
}

/** Open a print-ready invoice window (user can Save as PDF). */
export function openInvoiceWindow(order: InvoiceOrder): boolean {
  if (typeof window === "undefined") return false;
  const html = buildInvoiceHtml(order);
  const win = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}

/** Download invoice as an .html file (works when popups are blocked). */
export function downloadInvoiceHtml(order: InvoiceOrder): void {
  if (typeof window === "undefined") return;
  const html = buildInvoiceHtml(order);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `biyora-invoice-${order.orderNumber}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
