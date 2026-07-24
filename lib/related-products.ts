import type { Product } from "@/types/product";
import { hydrateProduct } from "@/lib/product-education";

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

function occasionOverlap(a: Product, b: Product): number {
  const setA = new Set((a.bestUses || []).map((x) => x.toLowerCase()));
  const setB = (b.bestUses || []).map((x) => x.toLowerCase());
  let n = 0;
  for (const tag of setB) if (setA.has(tag)) n += 1;
  return n;
}

function scoreRelated(base: Product, candidate: Product): number {
  let score = 0;
  if (candidate.colorFamily === base.colorFamily) score += 40;
  if (candidate.category === base.category) score += 15;
  if ((COMPLEMENTARY[base.category] ?? []).includes(candidate.category)) score += 25;
  score += occasionOverlap(base, candidate) * 12;
  if (candidate.patternStyle === base.patternStyle) score += 5;
  score += Math.min(10, Math.round((candidate.rating - 4) * 10));
  return score;
}

/**
 * Rank related fabrics by color family + occasion overlap + complementary category.
 */
export function getSmartRelatedProducts(
  product: Product,
  allProducts: Product[],
  limit = 4,
): Product[] {
  const base = hydrateProduct(product);
  const scored = allProducts
    .filter((p) => p.id !== base.id)
    .map((p) => {
      const h = hydrateProduct(p);
      return { product: h, score: scoreRelated(base, h) };
    })
    .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating);

  return scored.slice(0, limit).map((s) => s.product);
}

/** Short reason for why a fabric is paired (for UI chips) */
export function relatedReason(base: Product, related: Product): string {
  const a = hydrateProduct(base);
  const b = hydrateProduct(related);
  if (a.colorFamily === b.colorFamily) return `Same ${a.colorFamily} family`;
  const overlap = occasionOverlap(a, b);
  if (overlap > 0) {
    const shared = (a.bestUses || []).find((u) =>
      (b.bestUses || []).map((x) => x.toLowerCase()).includes(u.toLowerCase()),
    );
    if (shared) return `Also for ${shared}`;
  }
  if ((COMPLEMENTARY[a.category] ?? []).includes(b.category)) return "Complements this fabric";
  if (a.category === b.category) return "Same category";
  return "Customers also browse";
}
