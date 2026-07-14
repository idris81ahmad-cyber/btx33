import { describe, expect, it } from "vitest";
import { computeSalesOverview } from "@/lib/analytics";

describe("computeSalesOverview", () => {
  const now = new Date("2026-07-14T15:00:00.000Z");

  it("excludes cancelled from revenue and tracks AOV", () => {
    const stats = computeSalesOverview(
      [
        {
          status: "confirmed",
          total: 20000,
          createdAt: "2026-07-14T10:00:00.000Z",
          items: [{ name: "Ankara", quantity: 2, lineTotal: 17500 }],
        },
        {
          status: "delivered",
          total: 10000,
          createdAt: "2026-07-13T10:00:00.000Z",
          items: [{ name: "Lace", quantity: 1, lineTotal: 10000 }],
        },
        {
          status: "cancelled",
          total: 99999,
          createdAt: "2026-07-14T11:00:00.000Z",
          items: [{ name: "Brocade", quantity: 5, lineTotal: 99999 }],
        },
      ],
      now,
    );

    expect(stats.totalRevenue).toBe(30000);
    expect(stats.ordersToday).toBe(1);
    expect(stats.revenueToday).toBe(20000);
    expect(stats.paidOrders).toBe(2);
    expect(stats.cancelledOrders).toBe(1);
    expect(stats.averageOrderValue).toBe(15000);
    expect(stats.topProducts[0].name).toBe("Ankara");
    expect(stats.last7Days).toHaveLength(7);
  });
});
