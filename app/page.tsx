"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types/product";
import { fabricCategories, categoryShopHref } from "@/lib/products";
import RecentlyViewed from "@/components/RecentlyViewed";
import ProductGridSkeleton from "@/components/ProductGridSkeleton";
import { TrustBar, TrustGrid } from "@/components/TrustSignals";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllProducts(data);
        }
      })
      .catch(() => {});
  }, []);

  const featuredProducts = useMemo(
    () => [...allProducts].sort((a, b) => b.id - a.id).slice(0, 6),
    [allProducts],
  );

  const categories = useMemo(
    () =>
      fabricCategories.map((name) => ({
        name,
        count: allProducts.filter((p) => p.category === name).length,
        href: categoryShopHref(name),
      })),
    [allProducts],
  );

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[92vh] flex items-center justify-center bg-[#2C2522] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(#3D3631_0.8px,transparent_1px)] bg-[length:5px_5px] opacity-40" />
        
        <div className="relative z-10 max-w-5xl px-6 text-center">
          <div className="inline-block mb-4 px-5 py-1.5 rounded-full border border-[#C5A46E]/40 text-[#C5A46E] text-xs tracking-[3px] font-medium">
            KANTIN KWARI • KANO • NIGERIA
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-[82px] font-semibold tracking-[-3.5px] leading-[0.92] mb-6">
            Premium Textiles<br />from the Heart of Africa
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl md:text-2xl text-[#C5A46E]/90 tracking-[-0.3px] mb-10">
            Curated luxury fabrics from Kano&apos;s iconic Kwari Market.<br /> 
            Delivered with elegance, authenticity, and care.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/shop" 
              className="btn-primary inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl text-lg font-medium group"
            >
              Explore the Collection 
              <ArrowRight className="group-hover:translate-x-1 transition" />
            </Link>
            <Link 
              href="/sourcing" 
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-lg font-medium border border-white/40 hover:bg-white/5 transition"
            >
              Our Sourcing
            </Link>
          </div>
          
          <div className="mt-12 flex flex-col items-center text-xs tracking-[2px] text-white/50">
            <div>SCROLL TO DISCOVER</div>
            <div className="mt-2 w-px h-8 bg-gradient-to-b from-white/40 to-transparent scroll-indicator" />
          </div>
        </div>
      </section>

      <TrustBar />

      {/* Featured Fabrics */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="uppercase tracking-[3px] text-xs text-[#C5A46E] font-medium mb-1">DISCOVER</div>
            <h2 className="text-5xl tracking-[-1.8px] font-semibold">Latest Arrivals</h2>
          </div>
          <Link href="/shop" className="hidden md:flex items-center gap-2 text-sm font-medium hover:text-[#6B2D3C] group">
            VIEW ALL FABRICS <ArrowRight className="group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product, index) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <ProductCard product={product} priority={index < 2} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full">
              <ProductGridSkeleton count={6} />
            </div>
          )}
        </div>

        <div className="text-center mt-10 md:hidden">
          <Link href="/shop" className="btn-primary inline-flex items-center gap-2 px-8 py-3 rounded-2xl">
            Browse Full Collection <ArrowRight />
          </Link>
        </div>
      </section>

      {/* Category Highlights */}
      <section className="bg-white border-y border-[#D4C9B8] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="text-[#C5A46E] text-xs tracking-[3px] mb-2">EXPLORE BY CATEGORY</div>
            <h3 className="text-4xl tracking-[-1.5px] font-semibold">Iconic Textile Categories</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat, idx) => (
              <Link 
                key={idx} 
                href={cat.href}
                className="group border border-[#D4C9B8] hover:border-[#6B2D3C] rounded-3xl p-6 flex flex-col justify-between h-full transition-all hover:shadow-md bg-[#F8F4EC] hover:-translate-y-0.5"
              >
                <div>
                  <div className="font-semibold text-xl tracking-tight group-hover:text-[#6B2D3C] transition-colors">{cat.name}</div>
                  <div className="text-sm text-[#6B5F54] mt-1">{cat.count} premium pieces</div>
                </div>
                <div className="mt-8 text-xs text-[#C5A46E] flex items-center gap-1.5 group-hover:gap-2 transition-all">
                  SHOP NOW <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <TrustGrid />

      {/* Recently viewed */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        <RecentlyViewed />
      </section>

      {/* Newsletter */}
      <section className="bg-[#2C2522] py-16 text-white">
        <div className="max-w-xl mx-auto px-6 text-center">
          <div className="text-[#C5A46E] text-xs tracking-[3px] mb-3">STAY IN THE LOOP</div>
          <h4 className="text-4xl tracking-[-1.2px] font-semibold mb-3">Receive early access to new arrivals</h4>
          <p className="text-[#A89B8A] mb-8">Be the first to know about new premium drops, exclusive collections, and Kwari Market stories.</p>
          
          <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => { e.preventDefault(); alert("Thank you! You&apos;ve been added to our VIP list. (Demo)"); }}>
            <input 
              type="email" 
              placeholder="your@email.com" 
              className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-white/50 focus:outline-none focus:border-[#C5A46E]"
              required 
            />
            <button 
              type="submit"
              className="btn-gold px-10 py-4 rounded-2xl font-medium whitespace-nowrap"
            >
              JOIN THE LIST
            </button>
          </form>
          <p className="text-[10px] text-white/40 mt-4 tracking-widest">WE RESPECT YOUR INBOX. UNSUBSCRIBE ANYTIME.</p>
        </div>
      </section>
    </div>
  );
}