import type { Product } from "@/types/product";

const STORAGE_KEY = "biyora-recently-viewed";
const MAX_ITEMS = 6;

export function getRecentlyViewed(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(product: Product): Product[] {
  const existing = getRecentlyViewed().filter((p) => p.id !== product.id);
  const updated = [product, ...existing].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}