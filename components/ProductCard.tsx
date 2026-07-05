"use client";

import Link from "next/link";
import { Star, ShoppingCart } from "lucide-react";
import { Product } from "@/types/product";
import { useCartStore } from "@/lib/cart-store";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCartStore();
  const displayPrice = product.salePrice || product.price;
  const hasSale = !!product.salePrice;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const defaultLength = product.lengthOptions[0];
    addToCart(product, defaultLength);
    
    toast.success(`${product.name} (${defaultLength}) added to cart`, {
      description: `₦${displayPrice.toLocaleString()} × 1`,
      action: {
        label: "View Cart",
        onClick: () => window.location.href = "/cart",
      },
    });
  };

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="product-card bg-white rounded-3xl overflow-hidden h-full flex flex-col border border-[#D4C9B8]">
        {/* Image */}
        <div className="relative aspect-[4/3.2] bg-[#F4EDE3] overflow-hidden">
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
          />
          {hasSale && (
            <div className="absolute top-4 right-4 sale-badge bg-[#6B2D3C] text-white text-[10px] px-3.5 py-1 rounded-full font-medium tracking-[1px]">
              SALE
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
          
          {/* Quick view hint on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-all duration-300">
            <div className="opacity-0 group-hover:opacity-100 text-white text-xs tracking-[2px] font-medium bg-black/60 px-4 py-1 rounded-full transition">VIEW DETAILS</div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs text-[#C5A46E] tracking-[1px] font-medium mb-px">{product.category}</div>
                <h3 className="font-semibold text-[17px] tracking-[-0.3px] leading-tight line-clamp-2 pr-1 group-hover:text-[#6B2D3C] transition">
                  {product.name}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-2.5">
              <div className="flex text-[#C5A46E]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span className="text-xs text-[#6B5F54] font-mono tabular-nums">
                {product.rating} <span className="text-[#A89B8A]">({product.reviewCount})</span>
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums tracking-tight">
                ₦{displayPrice.toLocaleString()}
              </span>
              {hasSale && (
                <span className="text-sm text-[#6B5F54] line-through">₦{product.price.toLocaleString()}</span>
              )}
            </div>

            <div className="text-xs text-[#6B5F54] mt-1">
              {product.lengthOptions.join(" • ")} available
            </div>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={handleQuickAdd}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 text-sm font-medium border border-[#D4C9B8] hover:bg-[#6B2D3C] hover:text-white hover:border-[#6B2D3C] active:bg-[#4A1F2A] rounded-2xl transition-all group-hover:border-[#6B2D3C]/70 active:scale-[0.985]"
          >
            <ShoppingCart className="w-4 h-4" /> QUICK ADD — {product.lengthOptions[0]}
          </button>
        </div>
      </div>
    </Link>
  );
}