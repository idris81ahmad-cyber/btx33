import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import {
  getOrdersByUserId,
  getOrdersByEmail,
  linkOrdersToUser,
} from "@/lib/db/orders";
import { getOrderStatusHistory } from "@/lib/db/order-history";
import { getUserByEmail } from "@/lib/db/users";
import { hasDatabase } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

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
  userId?: number | null;
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
    userId: order.userId ?? null,
    createdAt:
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt,
  };
}

export async function GET() {
  try {
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

    const sessionEmail = session.user.email?.trim().toLowerCase() || "";
    // Prefer DB user id by email — session id alone can be stale/wrong across accounts
    let userId = 0;
    if (sessionEmail) {
      const dbUser = await getUserByEmail(sessionEmail);
      if (dbUser) userId = dbUser.id;
    }
    if (!userId) {
      const parsed = parseInt(session.user.id, 10);
      if (!Number.isNaN(parsed) && parsed > 0) userId = parsed;
    }

    // Backfill + repair: attach orders for this email; fix wrong user_id
    if (userId > 0 && sessionEmail) {
      await linkOrdersToUser(userId, sessionEmail);
    }

    const byUser = userId > 0 ? await getOrdersByUserId(userId) : [];
    const byEmail = sessionEmail ? await getOrdersByEmail(sessionEmail) : [];

    // Also try raw session email in case of unusual casing stored pre-fix
    const byEmailRaw =
      session.user.email && session.user.email !== sessionEmail
        ? await getOrdersByEmail(session.user.email)
        : [];

    const map = new Map<string, (typeof byUser)[number]>();
    for (const o of [...byUser, ...byEmail, ...byEmailRaw]) {
      map.set(o.orderNumber, o);
    }

    const sorted = Array.from(map.values()).sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return tb - ta;
    });

    const orders = await Promise.all(
      sorted.map(async (o) => {
        let statusHistory: {
          id: number;
          fromStatus: string | null;
          toStatus: string;
          note: string | null;
          actor: string;
          createdAt: string;
        }[] = [];
        try {
          const history = await getOrderStatusHistory(o.orderNumber);
          statusHistory = history.map((h) => ({
            id: h.id,
            fromStatus: h.fromStatus,
            toStatus: h.toStatus,
            note: h.note,
            actor: h.actor,
            createdAt:
              h.createdAt instanceof Date
                ? h.createdAt.toISOString()
                : String(h.createdAt),
          }));
        } catch {
          statusHistory = [];
        }
        return {
          ...serializeOrder(o),
          statusHistory,
        };
      }),
    );

    logger.info("account-orders", "Listed orders", {
      userId: userId || null,
      email: sessionEmail || null,
      count: orders.length,
    });

    return NextResponse.json(
      {
        orders,
        meta: {
          userId: userId || null,
          email: sessionEmail || null,
          count: orders.length,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (e) {
    logger.error("account-orders", "Failed to list orders", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "Failed to load orders", orders: [] },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
