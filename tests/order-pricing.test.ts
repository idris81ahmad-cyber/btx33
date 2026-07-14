import { describe, expect, it } from "vitest";
import {
  catalogUnitPrice,
  computeOrderTotal,
  getShippingFee,
  priceCartAgainstCatalog,
} from "@/lib/order-pricing";
import type { Product } from "@/types/product";

const products: Product[] = [
  {
    id: 1,
    slug: "royal-gold-ankara",
    name: "Royal Gold Ankara",
    category: "Ankara",
    price: 20000,
    salePrice: 18500,
    images: ["/images/ankara-premium.jpg"],
    rating: 5,
    reviewCount: 10,
    shortDescription: "",
    description: "",
    inStock: 5,
    colorFamily: "Gold",
    patternStyle: "Wax",
    lengthOptions: ["5 yards", "6 yards"],
    specifications: {},
  },
  {
    id: 2,
    slug: "plain-cotton",
    name: "Plain Cotton",
    category: "Cotton",
    price: 10000,
    images: ["/images/ankara-premium.jpg"],
    rating: 4,
    reviewCount: 2,
    shortDescription: "",
    description: "",
    inStock: 0,
    colorFamily: "White",
    patternStyle: "Solid",
    lengthOptions: ["5 yards"],
    specifications: {},
  },
];

describe("catalogUnitPrice", () => {
  it("prefers sale price when set", () => {
    expect(catalogUnitPrice(products[0])).toBe(18500);
  });
  it("falls back to price", () => {
    expect(catalogUnitPrice(products[1])).toBe(10000);
  });
});

describe("priceCartAgainstCatalog", () => {
  it("rejects client underpricing and uses catalog totals", () => {
    const r = priceCartAgainstCatalog(
      [
        {
          productId: 1,
          name: "Hacked name",
          quantity: 2,
          unitPrice: 1,
          lineTotal: 2,
          selectedLength: "6 yards",
        },
      ],
      products,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.subtotal).toBe(37000);
      expect(r.items[0].unitPrice).toBe(18500);
      expect(r.items[0].lineTotal).toBe(37000);
      expect(r.items[0].name).toBe("Royal Gold Ankara");
    }
  });

  it("rejects unknown products", () => {
    const r = priceCartAgainstCatalog(
      [{ productId: 999, name: "Nope", quantity: 1 }],
      products,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("unknown_product");
  });

  it("rejects out of stock", () => {
    const r = priceCartAgainstCatalog(
      [{ productId: 2, quantity: 1 }],
      products,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("out_of_stock");
  });

  it("rejects empty cart", () => {
    const r = priceCartAgainstCatalog([], products);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("empty");
  });
});

describe("computeOrderTotal", () => {
  it("applies shipping and discount", () => {
    expect(
      computeOrderTotal({ subtotal: 37000, shippingFee: 2500, discount: 3700 }),
    ).toBe(35800);
  });
});

describe("getShippingFee", () => {
  it("returns a non-negative number", () => {
    expect(getShippingFee()).toBeGreaterThanOrEqual(0);
  });
});
