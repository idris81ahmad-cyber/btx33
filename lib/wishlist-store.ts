import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";

interface WishlistStore {
  items: Product[];
  add: (product: Product) => void;
  remove: (id: number) => void;
  toggle: (product: Product) => void;
  has: (id: number) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product) =>
        set((state) =>
          state.items.some((p) => p.id === product.id)
            ? state
            : { items: [...state.items, product] },
        ),
      remove: (id) =>
        set((state) => ({ items: state.items.filter((p) => p.id !== id) })),
      toggle: (product) => {
        if (get().has(product.id)) get().remove(product.id);
        else get().add(product);
      },
      has: (id) => get().items.some((p) => p.id === id),
    }),
    { name: "biyora-wishlist" },
  ),
);