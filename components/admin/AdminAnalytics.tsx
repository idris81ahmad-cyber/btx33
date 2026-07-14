"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminOrder } from "@/components/admin/OrderManager";
import { computeSalesOverview } from "@/lib/analytics";

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

  const stats = useMemo(() => computeSalesOverview(orders), [orders]);
  const maxDayRevenue = Math.max(1, ...stats.last7Days.map((d) => d.revenue));

  if (loading) {
    return (
      <div className="space-y-4 mb-8" aria-busy="true" aria-label="Loading sales overview">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="h-40 skeleton rounded-2xl" />
        <div className="h-48 skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <section className="mb-8 space-y-4" aria-labelledby="sales-overview-heading">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="sales-overview-heading" className="font-semibold text-lg tracking-tight">
            Sales overview
          </h2>
          <p className="text-xs text-[#6B5F54] mt-0.5">
            Live from confirmed orders · cancelled excluded from revenue
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Total revenue"
          value={`₦${stats.totalRevenue.toLocaleString()}`}
          hint="All non-cancelled orders"
        />
        <StatCard
          label="Orders today"
          value={String(stats.ordersToday)}
          hint={`₦${stats.revenueToday.toLocaleString()} today`}
        />
        <StatCard
          label="Average order"
          value={`₦${stats.averageOrderValue.toLocaleString()}`}
          hint={`${stats.paidOrders} paid orders`}
        />
        <StatCard
          label="Open pipeline"
          value={String(stats.openOrders)}
          hint={
            stats.cancelledOrders > 0
              ? `${stats.cancelledOrders} cancelled (excluded)`
              : "Pending / confirmed / processing"
          }
        />
      </div>

      <div className="bg-white border border-[#D4C9B8] rounded-2xl p-4 md:p-5">
        <h3 className="font-semibold text-sm mb-4">Last 7 days</h3>
        <div
          className="flex items-end gap-2 sm:gap-3 h-32"
          role="img"
          aria-label="Revenue by day for the last 7 days"
        >
          {stats.last7Days.map((d) => {
            const heightPct = Math.max(4, Math.round((d.revenue / maxDayRevenue) * 100));
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <span className="text-[10px] text-[#6B5F54] tabular-nums truncate w-full text-center">
                  {d.revenue > 0 ? `₦${compactNaira(d.revenue)}` : "—"}
                </span>
                <div className="w-full flex items-end justify-center h-20">
                  <div
                    className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-[#6B2D3C] to-[#C5A46E] transition-all"
                    style={{ height: `${heightPct}%` }}
                    title={`${d.label}: ${d.orders} orders, ₦${d.revenue.toLocaleString()}`}
                  />
                </div>
                <span className="text-[10px] font-medium text-[#6B5F54]">{d.label}</span>
                <span className="text-[10px] text-[#A89B8A] tabular-nums">{d.orders}</span>
              </div>
            );
          })}
        </div>
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
    </section>
  );
}

function compactNaira(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
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
