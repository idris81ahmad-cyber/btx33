import { describe, expect, it } from "vitest";
import { getStockMessage } from "@/lib/stock-messaging";

describe("getStockMessage", () => {
  it("shows restocking when empty", () => {
    const m = getStockMessage(0);
    expect(m.tone).toBe("out");
    expect(m.text).toMatch(/restock/i);
    expect(m.show).toBe(true);
  });

  it("shows only N left when scarce", () => {
    expect(getStockMessage(4).text).toBe("Only 4 left");
    expect(getStockMessage(1).text).toBe("Only 1 left");
    expect(getStockMessage(4).tone).toBe("urgent");
  });

  it("shows soft low stock under 10", () => {
    expect(getStockMessage(8).tone).toBe("low");
    expect(getStockMessage(8).show).toBe(true);
  });

  it("hides badge when plentiful", () => {
    expect(getStockMessage(40).show).toBe(false);
  });
});
