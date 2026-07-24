/** Pure sales overview helpers for admin analytics (unit-tested). */

export type AnalyticsOrder = {
  status?: string;
  total?: number;
  createdAt: string | Date;
  couponCode?: string | null;
  items?: {
    name?: string;
    quantity?: number;
    lineTotal?: number;
    category?: string;
  }[];
};

export type SalesOverview = {
  totalRevenue: number;
  ordersToday: number;
  revenueToday: number;
  openOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  revenue7d: number;
  revenue30d: number;
  orders7d: number;
  orders30d: number;
  last7Days: { date: string; label: string; orders: number; revenue: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  topCategories: { category: string; quantity: number; revenue: number }[];
  couponPerformance: { code: string; orders: number; revenue: number }[];
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function computeSalesOverview(
  orders: AnalyticsOrder[],
  now: Date = new Date(),
): SalesOverview {
  const today = startOfDay(now);
  let totalRevenue = 0;
  let ordersToday = 0;
  let revenueToday = 0;
  let openOrders = 0;
  let paidOrders = 0;
  let cancelledOrders = 0;
  let paidRevenueForAov = 0;
  let revenue7d = 0;
  let revenue30d = 0;
  let orders7d = 0;
  let orders30d = 0;
  const productMap = new Map<string, { quantity: number; revenue: number }>();
  const categoryMap = new Map<string, { quantity: number; revenue: number }>();
  const couponMap = new Map<string, { orders: number; revenue: number }>();

  const day7 = new Date(today);
  day7.setDate(day7.getDate() - 6);
  const day30 = new Date(today);
  day30.setDate(day30.getDate() - 29);

  const last7: { date: string; label: string; orders: number; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last7.push({
      date: dayKey(d),
      label: d.toLocaleDateString("en-NG", { weekday: "short" }),
      orders: 0,
      revenue: 0,
    });
  }
  const dayIndex = new Map(last7.map((d, i) => [d.date, i]));

  for (const o of orders) {
    const status = (o.status || "").toLowerCase();
    const total = Number(o.total) || 0;
    const created = new Date(o.createdAt);
    const createdOk = !Number.isNaN(created.getTime());

    if (status === "cancelled") {
      cancelledOrders += 1;
      continue;
    }

    totalRevenue += total;

    if (["confirmed", "processing", "shipped", "delivered"].includes(status)) {
      paidOrders += 1;
      paidRevenueForAov += total;
    }
    if (["pending", "confirmed", "processing"].includes(status)) {
      openOrders += 1;
    }

    if (createdOk && created >= today) {
      ordersToday += 1;
      revenueToday += total;
    }
    if (createdOk && created >= day7) {
      orders7d += 1;
      revenue7d += total;
    }
    if (createdOk && created >= day30) {
      orders30d += 1;
      revenue30d += total;
    }

    if (createdOk) {
      const key = dayKey(startOfDay(created));
      const idx = dayIndex.get(key);
      if (idx != null) {
        last7[idx].orders += 1;
        last7[idx].revenue += total;
      }
    }

    const coupon = o.couponCode?.trim().toUpperCase();
    if (coupon) {
      const prev = couponMap.get(coupon) || { orders: 0, revenue: 0 };
      couponMap.set(coupon, {
        orders: prev.orders + 1,
        revenue: prev.revenue + total,
      });
    }

    for (const item of o.items || []) {
      const name = item.name || "Unknown";
      const qty = Number(item.quantity) || 0;
      const line =
        typeof item.lineTotal === "number" && Number.isFinite(item.lineTotal)
          ? item.lineTotal
          : 0;
      const prev = productMap.get(name) || { quantity: 0, revenue: 0 };
      productMap.set(name, {
        quantity: prev.quantity + qty,
        revenue: prev.revenue + line,
      });
      const cat = item.category || "Uncategorised";
      const cprev = categoryMap.get(cat) || { quantity: 0, revenue: 0 };
      categoryMap.set(cat, {
        quantity: cprev.quantity + qty,
        revenue: cprev.revenue + line,
      });
    }
  }

  const topProducts = Array.from(productMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 5);

  const topCategories = Array.from(categoryMap.entries())
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const couponPerformance = Array.from(couponMap.entries())
    .map(([code, v]) => ({ code, ...v }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 8);

  return {
    totalRevenue,
    ordersToday,
    revenueToday,
    openOrders,
    paidOrders,
    cancelledOrders,
    averageOrderValue:
      paidOrders > 0 ? Math.round(paidRevenueForAov / paidOrders) : 0,
    revenue7d,
    revenue30d,
    orders7d,
    orders30d,
    last7Days: last7,
    topProducts,
    topCategories,
    couponPerformance,
  };
}
