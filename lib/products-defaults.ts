import type { Product } from "@/types/product";

/** Default catalog used for seeding Postgres and build-time fallbacks. */
export function getDefaultProducts(): Product[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./products");
    const list = mod.products || mod.default;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}