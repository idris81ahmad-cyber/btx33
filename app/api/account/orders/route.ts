import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { getOrdersByUserId, getOrdersByEmail } from "@/lib/db/orders";
import { getOrderStatusHistory } from "@/lib/db/order-history";
import { hasDatabase } from "@/lib/db";

function serializeOrder(order: {
  id: number;
  orderNumber: string;
  email: string;
  fullName: string;
  phone: string;
  status: string;
  items: unknown;
  shipping: unknown;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  couponCode?: string | null;
  createdAt: Date | string;
}) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    email: order.email,
    fullName: order.fullName,
    phone: order.phone,
    status: order.status,
    items: order.items,
    shipping: order.shipping,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discount: order.discount,
    total: order.total,
    paymentMethod: order.paymentMethod,
    couponCode: order.couponCode ?? null,
    createdAt:
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt,
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return NextResponse.json({
      orders: [],
      message: "Order history requires database connection.",
    });
  }

  // Prefer userId; also merge email matches so guest checkouts with same email appear after signup
  const userId = parseInt(session.user.id, 10);
  const byUser =
    !Number.isNaN(userId) && userId > 0 ? await getOrdersByUserId(userId) : [];
  const byEmail = session.user.email
    ? await getOrdersByEmail(session.user.email)
    : [];

  const map = new Map<string, (typeof byUser)[number]>();
  for (const o of [...byUser, ...byEmail]) {
    map.set(o.orderNumber, o);
  }

  const sorted = Array.from(map.values()).sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return tb - ta;
  });

  const orders = await Promise.all(
    sorted.map(async (o) => {
      const history = await getOrderStatusHistory(o.orderNumber);
      return {
        ...serializeOrder(o),
        statusHistory: history.map((h) => ({
          id: h.id,
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          note: h.note,
          actor: h.actor,
          createdAt:
            h.createdAt instanceof Date ? h.createdAt.toISOString() : h.createdAt,
        })),
      };
    }),
  );

  return NextResponse.json({ orders });
}
