"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminOrder } from "@/components/admin/OrderManager";

type Stats = {
  totalRevenue: number;
  ordersToday: number;
  revenueToday: number;
  openOrders: number;
  confirmedOrders: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeStats(orders: AdminOrder[]): Stats {
  const today = startOfToday();
  let totalRevenue = 0;
  let ordersToday = 0;
  let revenueToday = 0;
  let openOrders = 0;
  let confirmedOrders = 0;
  const productMap = new Map<string, { quantity: number; revenue: number }>();

  for (const o of orders) {
    const status = (o.status || "").toLowerCase();
    if (status === "cancelled") continue;

    const total = Number(o.total) || 0;
    totalRevenue += total;
    if (status === "confirmed" || status === "processing" || status === "shipped" || status === "delivered") {
      confirmedOrders += 1;
    }
    if (status === "pending" || status === "confirmed" || status === "processing") {
      openOrders += 1;
    }

    const created = new Date(o.createdAt);
    if (!Number.isNaN(created.getTime()) && created >= today) {
      ordersToday += 1;
      revenueToday += total;
    }

    for (const item of o.items || []) {
      const name = item.name || "Unknown";
      const qty = Number(item.quantity) || 0;
      const rawLine = (item as { lineTotal?: unknown }).lineTotal;
      const line = typeof rawLine === "number" && Number.isFinite(rawLine) ? rawLine : 0;
      const prev = productMap.get(name) || { quantity: 0, revenue: 0 };
      productMap.set(name, {
        quantity: prev.quantity + qty,
        revenue: prev.revenue + line,
      });
    }
  }

  const topProducts = Array.from(productMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totalRevenue,
    ordersToday,
    revenueToday,
    openOrders,
    confirmedOrders,
    topProducts,
  };
}

export default function AdminAnalytics() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/orders", { credentials: "include" });
        const data = await res.json();
        const list: AdminOrder[] = Array.isArray(data) ? data : data.orders ?? [];
        if (!cancelled) setOrders(list);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => computeStats(orders), [orders]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 skeleton rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total revenue" value={`₦${stats.totalRevenue.toLocaleString()}`} hint="Excludes cancelled" />
        <StatCard label="Orders today" value={String(stats.ordersToday)} hint={`₦${stats.revenueToday.toLocaleString()} today`} />
        <StatCard label="Open pipeline" value={String(stats.openOrders)} hint="Pending / confirmed / processing" />
        <StatCard label="Paid orders" value={String(stats.confirmedOrders)} hint="Confirmed → delivered" />
      </div>

      <div className="bg-white border border-[#D4C9B8] rounded-2xl p-4 md:p-5">
        <h3 className="font-semibold text-sm mb-3">Top products (by quantity sold)</h3>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-[#6B5F54]">No order line items yet.</p>
        ) : (
          <ul className="space-y-2">
            {stats.topProducts.map((p, i) => (
              <li
                key={p.name}
                className="flex items-center justify-between gap-3 text-sm border-b border-[#EDE6D9] last:border-0 pb-2 last:pb-0"
              >
                <span className="min-w-0 truncate">
                  <span className="text-[#6B5F54] mr-2 tabular-nums">{i + 1}.</span>
                  {p.name}
                </span>
                <span className="shrink-0 text-[#6B5F54] tabular-nums">
                  {p.quantity} sold
                  {p.revenue > 0 ? ` · ₦${p.revenue.toLocaleString()}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-white border border-[#D4C9B8] rounded-2xl p-4 md:p-5">
      <div className="text-xs md:text-sm text-[#6B5F54]">{label}</div>
      <div className="text-xl md:text-3xl font-semibold mt-1 tracking-tight tabular-nums break-all">
        {value}
      </div>
      {hint && <div className="text-[10px] md:text-xs text-[#6B5F54] mt-1">{hint}</div>}
    </div>
  );
}
