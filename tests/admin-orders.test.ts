import { describe, expect, it } from "vitest";
import { isValidOrderStatus, ORDER_STATUSES } from "@/lib/order-status";

/**
 * Admin status update contract — keeps bulk/single actions aligned with DB enum.
 */
describe("admin order status actions", () => {
  it("exposes a closed set of statuses for admin selects", () => {
    expect(ORDER_STATUSES).toEqual([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ]);
  });

  it("rejects arbitrary status strings (admin API guard)", () => {
    expect(isValidOrderStatus("refunded")).toBe(false);
    expect(isValidOrderStatus("CONFIRMED")).toBe(false);
  });
});
