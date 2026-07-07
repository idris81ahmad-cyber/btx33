import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllOrders, updateOrderStatus } from "@/lib/db/orders";
import { hasDatabase } from "@/lib/db";

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

  const { orderNumber, status } = await req.json();
  if (!orderNumber || !status) {
    return NextResponse.json({ error: "orderNumber and status required" }, { status: 400 });
  }

  const ok = await updateOrderStatus(orderNumber, status);
  return NextResponse.json({ ok });
}