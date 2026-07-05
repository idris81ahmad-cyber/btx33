"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { categories, colorFamilies, patternStyles } from "@/lib/products";
import type { Product } from "@/types/product";
import { Filter, X } from "lucide-react";

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All Categories";

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedColor, setSelectedColor] = useState("All Colors");
  const [selectedPattern, setSelectedPattern] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 60000]);
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high" | "rating">("featured");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/products")
      .then(r => r.json())
      .then(data => setAllProducts(Array.isArray(data) ? data : []))
      .catch(() => setAllProducts([]))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.colorFamily.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "All Categories") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (selectedColor !== "All Colors") {
      result = result.filter((p) => p.colorFamily === selectedColor);
    }

    if (selectedPattern) {
      result = result.filter((p) => p.patternStyle === selectedPattern);
    }

    result = result.filter((p) => {
      const price = p.salePrice || p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (sortBy === "price-low") {
      result.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [searchQuery, selectedCategory, selectedColor, selectedPattern, priceRange, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All Categories");
    setSelectedColor("All Colors");
    setSelectedPattern("");
    setPriceRange([0, 60000]);
    setSortBy("featured");
  };

  const hasActiveFilters = 
    searchQuery || 
    selectedCategory !== "All Categories" || 
    selectedColor !== "All Colors" || 
    selectedPattern || 
    priceRange[0] > 0 || 
    priceRange[1] < 60000 ||
    sortBy !== "featured";

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="uppercase text-xs tracking-[3px] text-[#C5A46E]">THE COLLECTION</div>
          <h1 className="text-6xl tracking-[-2.5px] font-semibold">Shop Premium Fabrics</h1>
          <p className="text-[#6B5F54] mt-2">Showing <span className="font-medium text-[#2C2522]">{filteredProducts.length}</span> of {allProducts.length} beautiful pieces • From Kano with love</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 px-5 py-2.5 border border-[#D4C9B8] rounded-2xl text-sm"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as "featured" | "price-low" | "price-high" | "rating")}
            className="bg-white border border-[#D4C9B8] rounded-2xl px-5 py-2.5 text-sm focus:outline-none focus:border-[#C5A46E]"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-72 shrink-0`}>
          <div className="sticky top-24 bg-white border border-[#D4C9B8] rounded-3xl p-7">
            <div className="flex items-center justify-between mb-6">
              <div className="font-semibold tracking-tight">Filters</div>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs flex items-center gap-1 text-[#C5A46E] hover:underline">
                  CLEAR ALL <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="mb-6">
              <label className="text-xs tracking-widest text-[#6B5F54] block mb-2">SEARCH</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fabrics..."
                className="input-premium w-full rounded-2xl px-4 py-3 text-sm"
              />
            </div>

            <div className="mb-6">
              <label className="text-xs tracking-widest text-[#6B5F54] block mb-3">CATEGORY</label>
              <div className="space-y-1.5 text-sm">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`filter-chip w-full text-left px-4 py-2 rounded-2xl border transition flex justify-between items-center ${selectedCategory === cat ? 'active border-[#6B2D3C] bg-[#6B2D3C] text-white' : 'border-[#D4C9B8] hover:bg-[#F8F4EC]'}`}
                  >
                    {cat}
                    {cat !== "All Categories" && (
                      <span className="text-xs opacity-60">{allProducts.filter(p => p.category === cat).length}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs tracking-widest text-[#6B5F54] block mb-3">COLOR FAMILY</label>
              <select 
                value={selectedColor} 
                onChange={(e) => setSelectedColor(e.target.value)}
                className="input-premium w-full rounded-2xl px-4 py-3 text-sm"
              >
                {colorFamilies.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="text-xs tracking-widest text-[#6B5F54] block mb-3">PATTERN STYLE</label>
              <div className="flex gap-2">
                {patternStyles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedPattern(selectedPattern === style ? "" : style)}
                    className={`filter-chip flex-1 py-2.5 rounded-2xl border text-sm transition ${selectedPattern === style ? 'active border-[#6B2D3C] bg-[#6B2D3C] text-white' : 'border-[#D4C9B8] hover:bg-[#F8F4EC]'}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs tracking-widest text-[#6B5F54] block mb-3">PRICE RANGE (₦)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  value={priceRange[0]} 
                  onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])} 
                  className="input-premium w-full rounded-2xl px-3 py-2 text-sm" 
                />
                <span className="text-[#6B5F54]">—</span>
                <input 
                  type="number" 
                  value={priceRange[1]} 
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 60000])} 
                  className="input-premium w-full rounded-2xl px-3 py-2 text-sm" 
                />
              </div>
              <div className="text-[10px] text-center text-[#6B5F54] mt-1.5">Up to ₦60,000</div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl border border-[#D4C9B8] overflow-hidden">
                  <div className="aspect-[4/3.2] skeleton" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-24 skeleton rounded" />
                    <div className="h-5 w-4/5 skeleton rounded" />
                    <div className="h-7 w-28 skeleton rounded mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="product-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-[#D4C9B8] rounded-3xl">
              <div className="text-6xl mb-4">🧵</div>
              <h3 className="text-2xl font-semibold mb-2">No fabrics found</h3>
              <p className="text-[#6B5F54]">Try adjusting your filters or search terms.</p>
              <button onClick={clearFilters} className="mt-6 text-sm underline">Clear all filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-6 py-20 text-center">Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}