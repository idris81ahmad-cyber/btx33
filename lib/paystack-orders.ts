import { createOrder, getOrderByNumber } from "@/lib/db/orders";
import { hasDatabase } from "@/lib/db";
import { sendOrderConfirmation } from "@/lib/email";
import { getProducts, updateProductStock } from "@/lib/products-store";
import type { PaystackTransactionData } from "@/lib/paystack-types";
import type { OrderItemJson } from "@/lib/db/schema";

export interface FulfillPaystackResult {
  ok: boolean;
  order?: Awaited<ReturnType<typeof createOrder>>;
  alreadyExists?: boolean;
  error?: string;
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
    return { ok: false, error: "Database not configured" };
  }

  const existing = await getOrderByNumber(reference);
  if (existing) {
    return { ok: true, order: existing, alreadyExists: true };
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingFee = metadata.shippingFee ?? 0;
  const discount = metadata.discount ?? 0;
  const paidTotal = Math.round(paymentData.amount / 100);

  const order = await createOrder({
    orderNumber: reference,
    userId: metadata.userId ? parseInt(String(metadata.userId), 10) : undefined,
    email: paymentData.customer.email,
    fullName: metadata.fullName || "Customer",
    phone: metadata.phone || "",
    items: cartItems,
    shipping: metadata.shipping ?? { address: "", city: "", state: "" },
    subtotal: subtotal || paidTotal - shippingFee + discount,
    shippingFee,
    discount,
    total: paidTotal,
    paymentMethod: "paystack",
    notes: metadata.notes,
  });

  if (!order) {
    return { ok: false, error: "Failed to create order" };
  }

  const products = await getProducts();
  for (const item of cartItems) {
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      await updateProductStock(item.productId, Math.max(0, product.inStock - item.quantity));
    }
  }

  await sendOrderConfirmation({
    to: order.email,
    orderNumber: order.orderNumber,
    customerName: order.fullName,
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

  return { ok: true, order };
}