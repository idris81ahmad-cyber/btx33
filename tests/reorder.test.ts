import { describe, expect, it } from "vitest";
import { buildReorderLines, totalReorderPieces } from "@/lib/reorder";

describe("buildReorderLines", () => {
  it("returns empty for missing items", () => {
    expect(buildReorderLines(null)).toEqual([]);
    expect(buildReorderLines([])).toEqual([]);
  });

  it("maps quantities and unit prices", () => {
    const lines = buildReorderLines([
      {
        productId: 5,
        name: "Adire Indigo",
        quantity: 3,
        selectedLength: "5 yards",
        lineTotal: 45000,
        image: "/images/adire.jpg",
      },
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(3);
    expect(lines[0].length).toBe("5 yards");
    expect(lines[0].product.id).toBe(5);
    expect(lines[0].product.price).toBe(15000);
    expect(totalReorderPieces(lines)).toBe(3);
  });

  it("defaults length and quantity", () => {
    const lines = buildReorderLines([{ name: "Plain Cotton", quantity: 0 }]);
    expect(lines[0].quantity).toBe(1);
    expect(lines[0].length).toBe("5 yards");
  });
});
