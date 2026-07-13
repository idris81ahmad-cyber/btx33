"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { orderStatusClass, orderStatusLabel } from "@/lib/order-status";
import PageSkeleton from "@/components/PageSkeleton";

interface OrderItem {
  name: string;
  quantity: number;
  selectedLength?: string;
  lineTotal?: number;
}

interface Order {
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderHistoryPage() {
  const { status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") {
      if (status !== "loading") setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/account/orders", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Could not load orders");
        return r.json();
      })
      .then((d) => setOrders(Array.isArray(d.orders) ? d.orders : []))
      .catch(() => setError("We could not load your orders. Please try again."))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || (status === "authenticated" && loading)) {
    return <PageSkeleton variant="form" />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Please sign in</h1>
        <p className="text-[#6B5F54] mb-6">
          You need to be logged in to view your order history.
        </p>
        <Link
          href="/login?callbackUrl=/account/orders"
          className="btn-primary inline-block px-8 py-3 min-h-[44px]"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Orders</h1>
          <p className="text-sm text-[#6B5F54] mt-1">
            Track purchases and payment references
          </p>
        </div>
        <Link
          href="/account"
          className="text-sm text-[#6B2D3C] underline underline-offset-2"
        >
          Back to account
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-sm"
        >
          {error}
        </div>
      )}

      {orders.length === 0 && !error ? (
        <div className="bg-white rounded-2xl border border-[#D4C9B8] p-8 text-center py-12">
          <p className="text-[#6B5F54] mb-4">
            You have not placed an order yet.
          </p>
          <Link href="/shop" className="btn-primary inline-block px-6 py-2.5 min-h-[44px]">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="space-y-4" aria-label="Order history">
          {orders.map((o) => (
            <li
              key={o.orderNumber}
              className="bg-white rounded-2xl border border-[#D4C9B8] p-5 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs sm:text-sm font-medium break-all">
                    {o.orderNumber}
                  </p>
                  <p className="text-xs text-[#6B5F54] mt-1">
                    {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:text-right">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${orderStatusClass(o.status)}`}
                  >
                    {orderStatusLabel(o.status)}
                  </span>
                  <span className="font-semibold tabular-nums">
                    ₦{(o.total ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
              {o.items?.length > 0 && (
                <ul className="mt-4 pt-4 border-t border-[#EDE6D9] space-y-1.5 text-sm text-[#6B5F54]">
                  {o.items.map((item, idx) => (
                    <li key={`${o.orderNumber}-${idx}`}>
                      {item.name}
                      {item.selectedLength ? ` · ${item.selectedLength}` : ""} ×{" "}
                      {item.quantity}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
