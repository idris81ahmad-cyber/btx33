import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "./index";
import type { OrderItemJson, ShippingJson } from "./schema";

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
}

export async function createOrder(input: CreateOrderInput) {
  const db = getDb();
  if (!db) return null;
  try {
    const [order] = await db
      .insert(schema.orders)
      .values({
        orderNumber: input.orderNumber,
        userId: input.userId ?? null,
        email: input.email,
        fullName: input.fullName,
        phone: input.phone,
        status: "confirmed",
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
    return order;
  } catch (e) {
    console.error("createOrder failed:", e);
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

export async function updateOrderStatus(orderNumber: string, status: typeof schema.orderStatusEnum.enumValues[number]) {
  const db = getDb();
  if (!db) return false;
  try {
    await db.update(schema.orders).set({ status }).where(eq(schema.orders.orderNumber, orderNumber));
    return true;
  } catch {
    return false;
  }
}