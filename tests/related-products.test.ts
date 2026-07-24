import { describe, expect, it } from "vitest";
import { getSmartRelatedProducts, relatedReason } from "@/lib/related-products";
import type { Product } from "@/types/product";

function p(partial: Partial<Product> & Pick<Product, "id" | "name" | "category" | "colorFamily">): Product {
  return {
    slug: `slug-${partial.id}`,
    price: 10000,
    images: ["/images/ankara-premium.jpg"],
    rating: 4.5,
    reviewCount: 1,
    shortDescription: "",
    description: "",
    inStock: 10,
    patternStyle: "Solid",
    lengthOptions: ["5 yards"],
    specifications: {},
    bestUses: ["everyday"],
    ...partial,
  } as Product;
}

describe("getSmartRelatedProducts", () => {
  const base = p({
    id: 1,
    name: "Base Gold Ankara",
    category: "Ankara Prints",
    colorFamily: "Gold",
    bestUses: ["asoebi", "bridal"],
  });

  const catalog = [
    base,
    p({
      id: 2,
      name: "Gold Lace",
      category: "Premium Lace",
      colorFamily: "Gold",
      bestUses: ["bridal", "gele"],
      rating: 4.9,
    }),
    p({
      id: 3,
      name: "Blue Cotton",
      category: "Plain & Solid Premium Cottons",
      colorFamily: "Royal Blue",
      bestUses: ["office"],
    }),
    p({
      id: 4,
      name: "Gold Adire",
      category: "Adire & Tie-Dye",
      colorFamily: "Gold",
      bestUses: ["everyday"],
    }),
  ];

  it("prefers same color family", () => {
    const related = getSmartRelatedProducts(base, catalog, 2);
    expect(related.every((r) => r.colorFamily === "Gold")).toBe(true);
  });

  it("returns a pairing reason", () => {
    const related = getSmartRelatedProducts(base, catalog, 1)[0];
    const reason = relatedReason(base, related);
    expect(reason.length).toBeGreaterThan(3);
  });
});
