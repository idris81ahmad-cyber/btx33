import {
  confirmPendingOrder,
  createOrder,
  getOrderByNumber,
} from "@/lib/db/orders";
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

/** Only accept positive integer user IDs that can exist in the users table. */
export function parseUserId(raw: unknown): number | undefined {
  if (raw == null || raw === "" || raw === "null" || raw === "undefined") {
    return undefined;
  }
  const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    return undefined;
  }
  return n;
}

function tryParseJson<T>(value: unknown): T | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || (trimmed[0] !== "{" && trimmed[0] !== "[")) return undefined;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return undefined;
  }
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

/**
 * Paystack often returns nested metadata as JSON strings or with stringified numbers.
 * Normalize into the shapes our order layer expects.
 */
export function normalizePaystackMetadata(
  raw: PaystackTransactionData["metadata"] | Record<string, unknown> | null | undefined,
): {
  fullName?: string;
  phone?: string;
  shipping: ShippingJson;
  cartItems: OrderItemJson[];
  shippingFee: number;
  discount: number;
  userId?: number;
  notes?: string;
  orderNumber?: string;
} {
  const meta =
    (typeof raw === "string" ? tryParseJson<Record<string, unknown>>(raw) : raw) ?? {};

  const shippingParsed =
    typeof meta.shipping === "string"
      ? tryParseJson<Partial<ShippingJson>>(meta.shipping)
      : (meta.shipping as Partial<ShippingJson> | undefined);
  const shippingRaw: Partial<ShippingJson> = shippingParsed ?? {};

  const cartRaw =
    typeof meta.cartItems === "string"
      ? tryParseJson<OrderItemJson[]>(meta.cartItems)
      : meta.cartItems;

  const cartItems: OrderItemJson[] = Array.isArray(cartRaw)
    ? cartRaw.map((item) => ({
        productId: asNumber((item as OrderItemJson).productId),
        name: String((item as OrderItemJson).name ?? "Fabric"),
        slug: String((item as OrderItemJson).slug ?? ""),
        category: String((item as OrderItemJson).category ?? ""),
        image: String((item as OrderItemJson).image ?? ""),
        selectedLength: String((item as OrderItemJson).selectedLength ?? "5 yards"),
        quantity: Math.max(1, asNumber((item as OrderItemJson).quantity, 1)),
        unitPrice: asNumber((item as OrderItemJson).unitPrice),
        lineTotal: asNumber((item as OrderItemJson).lineTotal),
      }))
    : [];

  const fullName =
    (typeof meta.fullName === "string" && meta.fullName) ||
    shippingRaw.fullName ||
    "Customer";
  const phone =
    (typeof meta.phone === "string" && meta.phone) || shippingRaw.phone || "";

  const shipping: ShippingJson = {
    fullName,
    phone,
    address: shippingRaw.address || "",
    city: shippingRaw.city || "",
    state: shippingRaw.state || "",
    postalCode: shippingRaw.postalCode,
    country: shippingRaw.country || "Nigeria",
  };

  return {
    fullName,
    phone,
    shipping,
    cartItems,
    shippingFee: asNumber(meta.shippingFee),
    discount: asNumber(meta.discount),
    userId: parseUserId(meta.userId),
    notes: typeof meta.notes === "string" ? meta.notes : undefined,
    orderNumber: typeof meta.orderNumber === "string" ? meta.orderNumber : undefined,
  };
}

function serializeOrder<T extends { createdAt?: Date | string | null }>(order: T) {
  return {
    ...order,
    createdAt:
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt,
  };
}

async function deductStock(cartItems: OrderItemJson[]) {
  if (!cartItems.length) return;
  try {
    const products = await getProducts();
    for (const item of cartItems) {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        await updateProductStock(
          item.productId,
          Math.max(0, product.inStock - item.quantity),
        );
      }
    }
  } catch (e) {
    console.error("[paystack-orders] Stock update failed (order still valid):", e);
  }
}

async function sendConfirmationForOrder(order: NonNullable<Awaited<ReturnType<typeof createOrder>>>) {
  const items = Array.isArray(order.items) ? order.items : [];
  return sendOrderConfirmation({
    to: order.email,
    orderNumber: order.orderNumber,
    customerName: order.fullName,
    shipping: order.shipping,
    items: items.map((i) => ({
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
}

/**
 * Confirm a paid Paystack transaction into our orders table.
 *
 * Preferred path: pending order already created at initialize time (reference = orderNumber).
 * Fallback: create order from Paystack metadata if the pending row is missing.
 */
export async function fulfillPaystackPayment(
  paymentData: PaystackTransactionData,
): Promise<FulfillPaystackResult> {
  if (paymentData.status !== "success") {
    return { ok: false, error: "Payment was not successful" };
  }

  if (!hasDatabase()) {
    return { ok: false, error: "Database not configured — orders cannot be saved" };
  }

  const reference = paymentData.reference;
  const meta = normalizePaystackMetadata(paymentData.metadata);
  const lookupKey = meta.orderNumber || reference;

  // 1) Preferred: confirm existing pending order created at initialize
  const existing = await getOrderByNumber(lookupKey);
  if (existing) {
    if (existing.status !== "pending") {
      return {
        ok: true,
        order: serializeOrder(existing) as typeof existing,
        alreadyExists: true,
        emailSent: true,
      };
    }

    const confirmed = await confirmPendingOrder(lookupKey);
    const order = confirmed ?? (await getOrderByNumber(lookupKey));
    if (!order) {
      return { ok: false, error: "Order found but could not be confirmed" };
    }

    // Only the winner of pending→confirmed should stock+email
    if (confirmed) {
      await deductStock(Array.isArray(order.items) ? order.items : []);
      const emailResult = await sendConfirmationForOrder(order);
      return {
        ok: true,
        order: serializeOrder(order) as typeof order,
        emailSent: emailResult.ok,
        emailDemo: emailResult.demo,
      };
    }

    return {
      ok: true,
      order: serializeOrder(order) as typeof order,
      alreadyExists: true,
      emailSent: true,
    };
  }

  // 2) Fallback: no pending row — create from metadata (legacy / webhook-only)
  const cartItems = meta.cartItems;
  const shipping = meta.shipping;
  const paidTotal = Math.round(asNumber(paymentData.amount) / 100);
  const shippingFee = meta.shippingFee;
  const discount = meta.discount;
  const subtotal =
    cartItems.reduce((sum, item) => sum + asNumber(item.lineTotal), 0) ||
    Math.max(0, paidTotal - shippingFee + discount);

  const email =
    paymentData.customer?.email ||
    (typeof (paymentData as { customer?: { email?: string } }).customer?.email === "string"
      ? (paymentData as { customer: { email: string } }).customer.email
      : "");

  if (!email) {
    return { ok: false, error: "Payment verified but customer email is missing" };
  }

  const order = await createOrder({
    orderNumber: reference,
    userId: meta.userId,
    email,
    fullName: meta.fullName || shipping.fullName || "Customer",
    phone: meta.phone || shipping.phone || "N/A",
    items: cartItems,
    shipping,
    subtotal,
    shippingFee,
    discount,
    total: paidTotal,
    paymentMethod: "paystack",
    notes: meta.notes,
    status: "confirmed",
  });

  if (!order) {
    // Race: another request may have inserted between our get and create
    const raced = await getOrderByNumber(reference);
    if (raced) {
      return {
        ok: true,
        order: serializeOrder(raced) as typeof raced,
        alreadyExists: true,
        emailSent: true,
      };
    }
    return {
      ok: false,
      error:
        "Payment succeeded but order could not be saved. Contact support with your reference.",
    };
  }

  await deductStock(cartItems);
  const emailResult = await sendConfirmationForOrder(order);

  return {
    ok: true,
    order: serializeOrder(order) as typeof order,
    emailSent: emailResult.ok,
    emailDemo: emailResult.demo,
  };
}
