import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "./index";
import type { OrderItemJson, ShippingJson } from "./schema";
import { appendOrderStatusHistory } from "./order-history";

type OrderStatus = (typeof schema.orderStatusEnum.enumValues)[number];

export interface CreateOrderInput {
  orderNumber: string;
  userId?: number;
  email: string;
  fullName: string;
  phone: string;
  items: OrderItemJson[];
  shipping: ShippingJson;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  notes?: string;
  couponCode?: string;
  /** Default "confirmed". Use "pending" before Paystack redirect. */
  status?: OrderStatus;
}

export async function createOrder(input: CreateOrderInput) {
  const db = getDb();
  if (!db) return null;

  // Never pass NaN / invalid FKs — legacy admin ids like "admin-1" parse badly
  const userId =
    typeof input.userId === "number" &&
    Number.isInteger(input.userId) &&
    input.userId > 0
      ? input.userId
      : null;

  try {
    const [order] = await db
      .insert(schema.orders)
      .values({
        orderNumber: input.orderNumber,
        userId,
        email: input.email,
        fullName: input.fullName,
        phone: input.phone || "N/A",
        status: input.status ?? "confirmed",
        items: input.items,
        shipping: input.shipping,
        subtotal: input.subtotal,
        shippingFee: input.shippingFee,
        discount: input.discount,
        total: input.total,
        paymentMethod: input.paymentMethod,
        notes: input.notes,
        couponCode: input.couponCode,
      })
      .returning();
    if (order) {
      await appendOrderStatusHistory({
        orderNumber: order.orderNumber,
        fromStatus: null,
        toStatus: order.status,
        note: "Order created",
        actor: order.paymentMethod === "paystack" ? "paystack" : "system",
      });
    }
    return order;
  } catch (e) {
    console.error("createOrder failed:", e);
    return null;
  }
}

/**
 * Atomically move an order from pending → confirmed.
 * Returns the updated row only for the winner (avoids double stock/email).
 */
export async function confirmPendingOrder(orderNumber: string) {
  const db = getDb();
  if (!db) return null;
  try {
    const [order] = await db
      .update(schema.orders)
      .set({ status: "confirmed" })
      .where(
        and(
          eq(schema.orders.orderNumber, orderNumber),
          eq(schema.orders.status, "pending"),
        ),
      )
      .returning();
    if (order) {
      await appendOrderStatusHistory({
        orderNumber,
        fromStatus: "pending",
        toStatus: "confirmed",
        note: "Payment confirmed",
        actor: "paystack",
      });
    }
    return order ?? null;
  } catch (e) {
    console.error("confirmPendingOrder failed:", e);
    return null;
  }
}

export async function getOrderByNumber(orderNumber: string) {
  const db = getDb();
  if (!db) return null;
  try {
    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.orderNumber, orderNumber))
      .limit(1);
    return order ?? null;
  } catch {
    return null;
  }
}

export async function getAllOrders() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
  } catch {
    return [];
  }
}

export async function getOrdersByUserId(userId: number) {
  const db = getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.userId, userId))
      .orderBy(desc(schema.orders.createdAt));
  } catch {
    return [];
  }
}

export async function getOrdersByEmail(email: string) {
  const db = getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.email, email))
      .orderBy(desc(schema.orders.createdAt));
  } catch {
    return [];
  }
}

export async function updateOrderStatus(
  orderNumber: string,
  status: typeof schema.orderStatusEnum.enumValues[number],
  opts?: { actor?: string; note?: string },
) {
  const db = getDb();
  if (!db) return false;
  try {
    const existing = await getOrderByNumber(orderNumber);
    if (!existing) return false;
    if (existing.status === status) return true;

    await db
      .update(schema.orders)
      .set({ status })
      .where(eq(schema.orders.orderNumber, orderNumber));

    await appendOrderStatusHistory({
      orderNumber,
      fromStatus: existing.status,
      toStatus: status,
      note: opts?.note ?? "Status updated",
      actor: opts?.actor ?? "admin",
    });
    return true;
  } catch {
    return false;
  }
}

/** Bulk status update for admin multi-select. Returns count of attempted updates. */
export async function updateOrdersStatus(
  orderNumbers: string[],
  status: typeof schema.orderStatusEnum.enumValues[number],
  opts?: { actor?: string },
) {
  if (orderNumbers.length === 0) return 0;
  let count = 0;
  for (const n of orderNumbers) {
    const ok = await updateOrderStatus(n, status, {
      actor: opts?.actor ?? "admin",
      note: "Bulk status update",
    });
    if (ok) count += 1;
  }
  return count;
}