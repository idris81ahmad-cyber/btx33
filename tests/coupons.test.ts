import { describe, expect, it } from "vitest";
import { validateCoupon } from "@/lib/coupons";

describe("validateCoupon", () => {
  it("rejects empty codes", () => {
    const r = validateCoupon("", 100_000);
    expect(r.valid).toBe(false);
  });

  it("rejects unknown codes", () => {
    const r = validateCoupon("NOPE", 100_000);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.message).toMatch(/invalid/i);
  });

  it("enforces minimum subtotal for KWARI10", () => {
    const low = validateCoupon("KWARI10", 10_000);
    expect(low.valid).toBe(false);

    const ok = validateCoupon("kwari10", 30_000);
    expect(ok.valid).toBe(true);
    if (ok.valid) {
      expect(ok.discount).toBe(Math.round(30_000 * 0.1));
      expect(ok.coupon.code).toBe("KWARI10");
    }
  });

  it("applies fixed discount without exceeding subtotal", () => {
    const r = validateCoupon("BIYORA5000", 60_000);
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.discount).toBe(5_000);
  });
});
