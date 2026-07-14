import { describe, expect, it } from "vitest";
import { buildInvoiceHtml, type InvoiceOrder } from "@/lib/invoice";

const sample: InvoiceOrder = {
  orderNumber: "BIYORA-TEST-1",
  email: "buyer@example.com",
  fullName: "Amina Yusuf",
  phone: "08012345678",
  status: "confirmed",
  createdAt: "2026-07-14T12:00:00.000Z",
  paymentMethod: "paystack",
  couponCode: "KWARI10",
  items: [
    {
      name: "Royal Gold Ankara",
      quantity: 2,
      selectedLength: "6 yards",
      lineTotal: 37000,
    },
  ],
  shipping: {
    fullName: "Amina Yusuf",
    phone: "08012345678",
    address: "12 Market Road",
    city: "Kano",
    state: "Kano",
    country: "Nigeria",
  },
  subtotal: 37000,
  shippingFee: 2500,
  discount: 3700,
  total: 35800,
};

describe("buildInvoiceHtml", () => {
  it("includes order number, totals, and line items", () => {
    const html = buildInvoiceHtml(sample);
    expect(html).toContain("BIYORA-TEST-1");
    expect(html).toContain("Royal Gold Ankara");
    expect(html).toContain("buyer@example.com");
    expect(html).toContain("KWARI10");
    expect(html).toContain("35800".replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "35,800");
    // Naira formatting uses locale commas
    expect(html).toMatch(/35[,.]?800|₦35/);
  });

  it("escapes HTML in customer fields", () => {
    const html = buildInvoiceHtml({
      ...sample,
      fullName: `<script>alert(1)</script>`,
      items: [{ name: "Lace & Silk", quantity: 1, lineTotal: 1000 }],
      total: 1000,
      discount: 0,
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Lace &amp; Silk");
  });
});
