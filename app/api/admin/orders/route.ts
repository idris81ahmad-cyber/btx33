import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllOrders, updateOrderStatus } from "@/lib/db/orders";
import { hasDatabase } from "@/lib/db";
import { isValidOrderStatus } from "@/lib/order-status";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasDatabase()) {
    return NextResponse.json({ orders: [], message: "Connect Vercel Postgres to persist orders" });
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

  const { orderNumber, status } = await req.json();
  if (!orderNumber || !status) {
    return NextResponse.json({ error: "orderNumber and status required" }, { status: 400 });
  }

  if (!isValidOrderStatus(status)) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }

  const ok = await updateOrderStatus(orderNumber, status);
  if (!ok) {
    return NextResponse.json({ error: "Order not found or update failed" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, orderNumber, status });
}