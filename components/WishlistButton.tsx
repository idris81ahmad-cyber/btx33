"use client";

import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useWishlistStore } from "@/lib/wishlist-store";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WishlistButtonProps {
  product: Product;
  size?: "sm" | "md";
  className?: string;
}

export default function WishlistButton({ product, size = "md", className }: WishlistButtonProps) {
  const { has, toggle } = useWishlistStore();
  const active = has(product.id);
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const btnSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";

  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(product);
        toast(active ? "Removed from wishlist" : "Saved to wishlist", {
          description: product.name,
        });
      }}
      className={cn(
        btnSize,
        "rounded-full flex items-center justify-center transition-all backdrop-blur-sm",
        active
          ? "bg-[#6B2D3C] text-white shadow-md"
          : "bg-white/90 text-[#6B5F54] hover:text-[#6B2D3C] border border-[#D4C9B8]/80",
        className,
      )}
    >
      <motion.div animate={active ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
        <Heart className={cn(iconSize, active && "fill-current")} />
      </motion.div>
    </button>
  );
}