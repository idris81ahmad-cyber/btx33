"use client";

import Link from "next/link";
import { Star, ShoppingCart, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProductImage from "@/components/ProductImage";
import WishlistButton from "@/components/WishlistButton";
import { productImageAlt } from "@/lib/image-blur";
import { useUIStore } from "@/lib/ui-store";
import { addToCartWithFeedback } from "@/lib/add-to-cart";
import { useState, useEffect } from "react";

export default function QuickViewModal() {
  const { quickViewProduct, setQuickViewProduct } = useUIStore();
  const [selectedLength, setSelectedLength] = useState("");

  const product = quickViewProduct;

  useEffect(() => {
    setSelectedLength("");
  }, [product?.id]);

  const length = selectedLength || product?.lengthOptions[0] || "";
  const price = product ? (product.salePrice || product.price) : 0;

  const handleClose = () => setQuickViewProduct(null);

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!product) return;
    const rect = e.currentTarget.getBoundingClientRect();
    addToCartWithFeedback({ product, length, imageRect: rect });
    handleClose();
  };

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl rounded-3xl border-[#D4C9B8] p-0 overflow-hidden">
        <AnimatePresence>
          {product && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid md:grid-cols-2">
                <div className="relative aspect-square bg-[#F4EDE3] fabric-texture">
                  <ProductImage
                    src={product.images[0]}
                    alt={productImageAlt(product.name, product.category)}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    quality={85}
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <WishlistButton product={product} size="sm" />
                  </div>
                </div>
                <div className="p-6 md:p-8 flex flex-col">
                  <DialogHeader>
                    <div className="text-xs tracking-[2px] text-[#C5A46E] uppercase">{product.category}</div>
                    <DialogTitle className="text-2xl tracking-tight mt-1">{product.name}</DialogTitle>
                  </DialogHeader>

                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <div className="flex text-[#C5A46E]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-[#6B5F54]">{product.rating} ({product.reviewCount})</span>
                  </div>

                  <p className="text-[#6B5F54] text-sm mt-3 leading-relaxed">{product.shortDescription}</p>

                  <div className="mt-4 text-3xl font-semibold tabular-nums">₦{price.toLocaleString()}</div>

                  <div className="mt-4">
                    <div className="text-xs tracking-widest text-[#6B5F54] mb-2">LENGTH</div>
                    <div className="flex flex-wrap gap-2">
                      {product.lengthOptions.map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setSelectedLength(l)}
                          className={`px-4 py-2 rounded-xl text-sm border transition ${
                            length === l
                              ? "border-[#6B2D3C] bg-[#6B2D3C] text-white"
                              : "border-[#D4C9B8] hover:bg-[#F8F4EC]"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-6 flex flex-col gap-2">
                    <Button onClick={handleAdd} className="w-full py-5 rounded-2xl bg-[#6B2D3C] hover:bg-[#4A1F2A]" size="lg">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to cart — ₦{price.toLocaleString()}
                    </Button>
                    <Button asChild variant="outline" className="w-full rounded-2xl">
                      <Link href={`/products/${product.slug}`} onClick={handleClose}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View full details
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}