"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import { productImageAlt } from "@/lib/image-blur";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import type { Product } from "@/types/product";

interface RecentlyViewedProps {
  excludeId?: number;
  title?: string;
}

export default function RecentlyViewed({ excludeId, title = "Recently Viewed" }: RecentlyViewedProps) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    const viewed = getRecentlyViewed().filter((p) => p.id !== excludeId);
    setItems(viewed);
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="mt-16 pt-10 border-t border-[#D4C9B8]">
      <div className="text-xs tracking-[2px] text-[#C5A46E] mb-2">CONTINUE EXPLORING</div>
      <h3 className="text-2xl font-semibold tracking-tight mb-6">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {items.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`} className="group block">
            <div className="bg-white rounded-2xl border border-[#D4C9B8] overflow-hidden fabric-texture-hover">
              <div className="relative aspect-square">
                <ProductImage
                  src={product.images[0]}
                  alt={productImageAlt(product.name, product.category)}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 150px"
                  className="group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <p className="text-xs font-medium line-clamp-2 leading-tight group-hover:text-[#6B2D3C]">
                  {product.name}
                </p>
                <p className="text-xs font-mono mt-1">
                  ₦{(product.salePrice || product.price).toLocaleString()}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}