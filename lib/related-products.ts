import type { Product } from "@/types/product";

/** Complementary fabric pairings for smarter recommendations */
const COMPLEMENTARY: Record<string, string[]> = {
  "Ankara Prints": ["Premium Lace", "Silk, Chiffon & Voile", "Plain & Solid Premium Cottons"],
  "Premium Lace": ["Ankara Prints", "Brocade & Damask", "Shadda & Atiku"],
  "Brocade & Damask": ["Premium Lace", "Shadda & Atiku", "Ankara Prints"],
  "Adire & Tie-Dye": ["Ankara Prints", "Silk, Chiffon & Voile", "Plain & Solid Premium Cottons"],
  "Silk, Chiffon & Voile": ["Premium Lace", "Ankara Prints", "Adire & Tie-Dye"],
  "Plain & Solid Premium Cottons": ["Ankara Prints", "Adire & Tie-Dye", "Bazin"],
  "Shadda & Atiku": ["Premium Lace", "Brocade & Damask", "Bazin"],
  Bazin: ["Shadda & Atiku", "Ankara Prints", "Premium Lace"],
};

export function getSmartRelatedProducts(product: Product, allProducts: Product[], limit = 4): Product[] {
  const complementary = COMPLEMENTARY[product.category] ?? [];
  const sameCategory = allProducts.filter((p) => p.category === product.category && p.id !== product.id);
  const complementaryProducts = allProducts.filter(
    (p) => p.id !== product.id && complementary.includes(p.category),
  );

  const seen = new Set<number>();
  const result: Product[] = [];

  const push = (p: Product) => {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      result.push(p);
    }
  };

  // Mix: up to 2 same category, rest complementary
  sameCategory.slice(0, 2).forEach(push);
  complementaryProducts.forEach(push);
  allProducts
    .filter((p) => p.id !== product.id && p.rating >= 4.5)
    .forEach(push);

  return result.slice(0, limit);
}