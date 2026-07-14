import type { Product } from "@/types/product";

export type ReorderItem = {
  productId?: number;
  name: string;
  slug?: string;
  category?: string;
  image?: string;
  quantity: number;
  selectedLength?: string;
  lineTotal?: number;
  unitPrice?: number;
};

export type ReorderLine = {
  product: Product;
  length: string;
  quantity: number;
};

/** Build cart-ready lines from a past order (pure — easy to unit test). */
export function buildReorderLines(items: ReorderItem[] | undefined | null): ReorderLine[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const lines: ReorderLine[] = [];

  for (const item of items) {
    if (!item?.name) continue;
    const length = (item.selectedLength || "5 yards").trim() || "5 yards";
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const unit =
      typeof item.unitPrice === "number" && item.unitPrice > 0
        ? item.unitPrice
        : item.lineTotal && item.quantity
          ? Math.round(Number(item.lineTotal) / Math.max(1, Number(item.quantity)))
          : 0;

    const product = {
      id: typeof item.productId === "number" && item.productId > 0 ? item.productId : 0,
      slug: item.slug || `reorder-${slugify(item.name)}`,
      name: item.name,
      category: item.category || "Fabric",
      price: unit || 0,
      images: item.image ? [item.image] : ["/images/ankara-premium.jpg"],
      rating: 4.5,
      reviewCount: 0,
      shortDescription: "",
      description: "",
      inStock: 99,
      colorFamily: "",
      patternStyle: "",
      lengthOptions: [length],
      specifications: {},
    } as Product;

    lines.push({ product, length, quantity });
  }

  return lines;
}

export function totalReorderPieces(lines: ReorderLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "item";
}
