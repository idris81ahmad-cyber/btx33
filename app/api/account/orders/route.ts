import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { getOrdersByUserId, getOrdersByEmail } from "@/lib/db/orders";
import { hasDatabase } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return NextResponse.json({ orders: [] });
  }

  const userId = parseInt(session.user.id, 10);
  let orders = !isNaN(userId) ? await getOrdersByUserId(userId) : [];
  if (orders.length === 0 && session.user.email) {
    orders = await getOrdersByEmail(session.user.email);
  }

  return NextResponse.json({ orders });
}