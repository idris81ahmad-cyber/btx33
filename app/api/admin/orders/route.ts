import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getAllOrders,
  updateOrderStatus,
  updateOrdersStatus,
} from "@/lib/db/orders";
import { hasDatabase } from "@/lib/db";
import { isValidOrderStatus } from "@/lib/order-status";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasDatabase()) {
    return NextResponse.json({
      orders: [],
      message: "Connect Vercel Postgres to persist orders",
    });
  }

  const orders = await getAllOrders();
  return NextResponse.json(orders);
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasDatabase()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = (await req.json()) as {
    orderNumber?: string;
    orderNumbers?: string[];
    status?: string;
  };

  const { status } = body;
  if (!status || !isValidOrderStatus(status)) {
    return NextResponse.json(
      { error: status ? `Invalid status: ${status}` : "status is required" },
      { status: 400 },
    );
  }

  // Bulk update
  if (Array.isArray(body.orderNumbers) && body.orderNumbers.length > 0) {
    const numbers = body.orderNumbers
      .map((n) => String(n).trim())
      .filter(Boolean);
    if (numbers.length === 0) {
      return NextResponse.json({ error: "orderNumbers required" }, { status: 400 });
    }
    const count = await updateOrdersStatus(numbers, status);
    if (!count) {
      return NextResponse.json(
        { error: "Bulk update failed" },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, count, status, orderNumbers: numbers });
  }

  // Single update
  const orderNumber = body.orderNumber?.trim();
  if (!orderNumber) {
    return NextResponse.json(
      { error: "orderNumber or orderNumbers required" },
      { status: 400 },
    );
  }

  const ok = await updateOrderStatus(orderNumber, status);
  if (!ok) {
    return NextResponse.json(
      { error: "Order not found or update failed" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, orderNumber, status });
}
