import { create } from "zustand";
import type { Product } from "@/types/product";

interface FlyTarget {
  image: string;
  fromX: number;
  fromY: number;
}

interface UIStore {
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  flyTarget: FlyTarget | null;
  triggerFlyToCart: (image: string, rect: DOMRect) => void;
  clearFlyTarget: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  cartDrawerOpen: false,
  setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),
  quickViewProduct: null,
  setQuickViewProduct: (product) => set({ quickViewProduct: product }),
  flyTarget: null,
  triggerFlyToCart: (image, rect) =>
    set({
      flyTarget: {
        image,
        fromX: rect.left + rect.width / 2,
        fromY: rect.top + rect.height / 2,
      },
    }),
  clearFlyTarget: () => set({ flyTarget: null }),
}));