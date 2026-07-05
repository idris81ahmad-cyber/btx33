"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, ShoppingCart, Heart } from "lucide-react";
import type { Product } from "@/types/product";
import { useCartStore } from "@/lib/cart-store";
import { toast } from "sonner";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    params.then(({ slug }) => {
      fetch("/api/products")
        .then(r => r.json())
        .then((list: Product[]) => {
          const found = list.find((p) => p.slug === slug);
          if (!found) {
            router.replace("/shop");
            return;
          }
          setProduct(found);
          const related = list
            .filter((p) => p.category === found.category && p.id !== found.id)
            .slice(0, 4);
          setRelatedProducts(related);
          setLoading(false);
        })
        .catch(() => {
          router.replace("/shop");
        });
    });
  }, [params, router]);

  if (loading || !product) {
    return <div className="max-w-7xl mx-auto px-6 py-20 text-center">Loading beautiful fabric details...</div>;
  }

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}

function ProductDetailClient({ product, relatedProducts }: { product: Product; relatedProducts: Product[] }) {
  const [selectedLength, setSelectedLength] = useState(product.lengthOptions[0]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const { addToCart } = useCartStore();

  const currentPrice = product.salePrice || product.price;
  const totalPrice = currentPrice * quantity;

  const handleAddToCart = () => {
    // Support multi-quantity (calls add multiple times for demo)
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedLength);
    }
    
    toast.success(`Added to cart`, {
      description: `${product.name} • ${selectedLength} × ${quantity} — ₦${(currentPrice * quantity).toLocaleString()}`,
      action: {
        label: "View Cart",
        onClick: () => (window.location.href = "/cart"),
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center gap-2 text-sm mb-8 text-[#6B5F54]">
        <Link href="/shop" className="hover:text-[#6B2D3C] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Shop
        </Link>
        <span>/</span>
        <span>{product.category}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-x-16 gap-y-10">
        <div>
          <div 
            className="gallery-main aspect-[4/3.15] rounded-3xl overflow-hidden border border-[#D4C9B8] bg-[#F4EDE3] relative cursor-zoom-in group"
            onClick={() => setIsLightboxOpen(true)}
          >
            <img 
              src={product.images[selectedImageIndex]} 
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
            />
            <div className="absolute bottom-4 right-4 px-3 py-1 text-[10px] tracking-widest bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition">CLICK TO ENLARGE</div>
          </div>

          <div className="flex gap-3 mt-4">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`gallery-thumb w-20 h-20 rounded-2xl overflow-hidden border-2 transition ${selectedImageIndex === idx ? 'active border-[#6B2D3C]' : 'border-transparent hover:border-[#D4C9B8]'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-start justify-between">
            <div>
              <div className="uppercase tracking-[2px] text-xs text-[#C5A46E]">{product.category}</div>
              <h1 className="text-5xl tracking-[-1.8px] font-semibold leading-none mt-1 mb-3">{product.name}</h1>
            </div>
            <button className="p-3 text-[#6B5F54] hover:text-[#6B2D3C]">
              <Heart className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex text-[#C5A46E]">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
            </div>
            <span className="font-mono text-sm">{product.rating} <span className="text-[#6B5F54]">({product.reviewCount} reviews)</span></span>
          </div>

          <div className="mb-8">
            <div className="flex items-baseline gap-3">
              <span className="text-6xl font-semibold tabular-nums tracking-[-1.5px]">₦{currentPrice.toLocaleString()}</span>
              {product.salePrice && (
                <>
                  <span className="text-2xl text-[#6B5F54] line-through">₦{product.price.toLocaleString()}</span>
                  <span className="text-sm px-2.5 py-0.5 rounded-full bg-[#6B2D3C] text-white">Save ₦{(product.price - currentPrice).toLocaleString()}</span>
                </>
              )}
            </div>
            <div className="text-sm text-[#6B5F54]">per piece • prices vary by length selected</div>
          </div>

          <div className="mb-8">
            <div className="text-xs tracking-[2px] text-[#6B5F54] mb-3">SELECT LENGTH</div>
            <div className="flex flex-wrap gap-3">
              {product.lengthOptions.map((length) => (
                <button
                  key={length}
                  onClick={() => setSelectedLength(length)}
                  className={`length-btn px-8 py-3.5 rounded-2xl border text-sm font-medium transition-all ${selectedLength === length ? 'active border-[#6B2D3C] bg-[#6B2D3C] text-white' : 'border-[#D4C9B8] hover:bg-white'}`}
                >
                  {length}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#6B5F54] mt-2">Most popular: 6 yards for full traditional outfits</p>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div>
              <div className="text-xs tracking-widest text-[#6B5F54] mb-1.5">QUANTITY</div>
              <div className="flex border border-[#D4C9B8] rounded-2xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-5 py-3 hover:bg-[#F8F4EC] active:bg-white">-</button>
                <div className="px-8 py-3 font-mono tabular-nums border-x border-[#D4C9B8]">{quantity}</div>
                <button onClick={() => setQuantity(quantity + 1)} className="px-5 py-3 hover:bg-[#F8F4EC] active:bg-white">+</button>
              </div>
            </div>

            <button 
              onClick={handleAddToCart}
              className="btn-primary flex-1 flex items-center justify-center gap-3 py-[17px] text-lg rounded-2xl font-medium mt-6"
            >
              <ShoppingCart className="w-5 h-5" /> 
              ADD TO CART — ₦{totalPrice.toLocaleString()}
            </button>
          </div>

          <p className="text-lg text-[#4A4038] leading-relaxed mb-8">{product.shortDescription}</p>

          <div className="prose prose-stone max-w-none mb-10 text-[15px] leading-relaxed text-[#4A4038]">
            <p>{product.description}</p>
          </div>

          <div className="mb-10">
            <div className="uppercase text-xs tracking-[2.5px] text-[#C5A46E] mb-4">SPECIFICATIONS</div>
            <div className="border border-[#D4C9B8] rounded-3xl overflow-hidden text-sm">
              {Object.entries(product.specifications).map(([key, value], idx) => (
                <div key={idx} className="flex border-b last:border-b-0 border-[#D4C9B8] px-6 py-[17px] bg-white">
                  <div className="w-44 text-[#6B5F54] shrink-0">{key}</div>
                  <div className="font-medium text-[#2C2522]">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <div className="uppercase text-xs tracking-[2.5px] text-[#C5A46E] mb-4">HOW TO STYLE THIS FABRIC</div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-white border border-[#D4C9B8] rounded-3xl p-6">
                <div className="font-semibold mb-2">Traditional Look</div>
                <p className="text-[#6B5F54]">Pair with matching gele and ipele for stunning Asoebi or owambe appearances.</p>
              </div>
              <div className="bg-white border border-[#D4C9B8] rounded-3xl p-6">
                <div className="font-semibold mb-2">Modern Fusion</div>
                <p className="text-[#6B5F54]">Create a sleek shirt dress, tailored pants, or a statement blazer for contemporary elegance.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-[#6B5F54]">
            <div className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">IN STOCK • {product.inStock} yards remaining</div>
            <div>Free shipping on orders over ₦75,000</div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-[95vw] max-h-[90vh]">
            <button 
              onClick={() => setIsLightboxOpen(false)} 
              className="absolute -top-3 -right-3 bg-white text-black rounded-full w-9 h-9 flex items-center justify-center shadow text-sm"
            >
              ✕
            </button>
            <img 
              src={product.images[selectedImageIndex]} 
              alt={product.name} 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="flex justify-center gap-2 mt-4">
              {product.images.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                  className={`w-2.5 h-2.5 rounded-full transition ${selectedImageIndex === idx ? 'bg-white scale-125' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {relatedProducts.length > 0 && (
        <div className="mt-20 pt-12 border-t border-[#D4C9B8]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs tracking-[2px] text-[#C5A46E]">YOU MAY ALSO LOVE</div>
              <h3 className="text-3xl tracking-tight font-semibold">Similar Fabrics</h3>
            </div>
            <Link href="/shop" className="text-sm hover:underline">Browse more →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((related) => (
              <Link key={related.id} href={`/products/${related.slug}`} className="group block">
                <div className="product-card bg-white rounded-3xl overflow-hidden border border-[#D4C9B8]">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={related.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-[#C5A46E] tracking-wide">{related.category}</div>
                    <div className="font-semibold tracking-tight mt-0.5">{related.name}</div>
                    <div className="mt-1 text-sm font-medium tabular-nums">₦{(related.salePrice || related.price).toLocaleString()}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}