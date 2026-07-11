import { createOrder, getOrderByNumber } from "@/lib/db/orders";
import { hasDatabase } from "@/lib/db";
import { sendOrderConfirmation } from "@/lib/email";
import { getProducts, updateProductStock } from "@/lib/products-store";
import type { PaystackTransactionData } from "@/lib/paystack-types";
import type { OrderItemJson, ShippingJson } from "@/lib/db/schema";

export interface FulfillPaystackResult {
  ok: boolean;
  order?: Awaited<ReturnType<typeof createOrder>>;
  alreadyExists?: boolean;
  emailSent?: boolean;
  emailDemo?: boolean;
  error?: string;
}

function buildShipping(metadata: PaystackTransactionData["metadata"]): ShippingJson {
  const raw = metadata?.shipping;
  return {
    fullName: raw?.fullName || metadata?.fullName || "Customer",
    phone: raw?.phone || metadata?.phone || "",
    address: raw?.address || "",
    city: raw?.city || "",
    state: raw?.state || "",
    postalCode: raw?.postalCode,
    country: raw?.country || "Nigeria",
  };
}

export async function fulfillPaystackPayment(
  paymentData: PaystackTransactionData,
): Promise<FulfillPaystackResult> {
  if (paymentData.status !== "success") {
    return { ok: false, error: "Payment was not successful" };
  }

  const reference = paymentData.reference;
  const metadata = paymentData.metadata ?? {};
  const cartItems: OrderItemJson[] = metadata.cartItems ?? [];

  if (!hasDatabase()) {
    return { ok: false, error: "Database not configured — orders cannot be saved" };
  }

  const existing = await getOrderByNumber(reference);
  if (existing) {
    return { ok: true, order: existing, alreadyExists: true, emailSent: true };
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingFee = metadata.shippingFee ?? 0;
  const discount = metadata.discount ?? 0;
  const paidTotal = Math.round(paymentData.amount / 100);
  const shipping = buildShipping(metadata);

  const order = await createOrder({
    orderNumber: reference,
    userId: metadata.userId ? parseInt(String(metadata.userId), 10) : undefined,
    email: paymentData.customer.email,
    fullName: metadata.fullName || shipping.fullName,
    phone: metadata.phone || shipping.phone,
    items: cartItems,
    shipping,
    subtotal: subtotal || paidTotal - shippingFee + discount,
    shippingFee,
    discount,
    total: paidTotal,
    paymentMethod: "paystack",
    notes: metadata.notes,
  });

  if (!order) {
    return { ok: false, error: "Failed to create order in database" };
  }

  const products = await getProducts();
  for (const item of cartItems) {
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      await updateProductStock(item.productId, Math.max(0, product.inStock - item.quantity));
    }
  }

  const emailResult = await sendOrderConfirmation({
    to: order.email,
    orderNumber: order.orderNumber,
    customerName: order.fullName,
    shipping: order.shipping,
    items: cartItems.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      length: i.selectedLength,
      lineTotal: i.lineTotal,
    })),
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discount: order.discount,
    total: order.total,
  });

  return {
    ok: true,
    order,
    emailSent: emailResult.ok,
    emailDemo: emailResult.demo,
  };
}