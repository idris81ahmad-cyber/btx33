"use client";

import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import { useCartStore } from "@/lib/cart-store";
import { Trash2, Plus, Minus, ArrowRight, Heart } from "lucide-react";
import { toast } from "sonner";
import { useWishlistStore } from "@/lib/wishlist-store";
import { cartItemToProduct } from "@/lib/cart-utils";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCartStore();
  const addToWishlist = useWishlistStore((s) => s.add);
  const total = getTotalPrice();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="text-7xl mb-6">🛍️</div>
        <h1 className="text-5xl tracking-[-1.5px] font-semibold mb-3">Your cart is empty</h1>
        <p className="text-[#6B5F54] mb-8">Discover beautiful premium fabrics from Kano&apos;s finest markets.</p>
        <Link href="/shop" className="btn-primary inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-lg">
          Start Shopping <ArrowRight />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs tracking-[3px] text-[#C5A46E]">YOUR SELECTIONS</div>
          <h1 className="text-5xl tracking-[-2px] font-semibold">Shopping Cart</h1>
          <p className="text-[#6B5F54] mt-1">{items.length} item{items.length !== 1 ? "s" : ""} • {items.reduce((s, i) => s + i.quantity, 0)} total pieces</p>
        </div>
        <button 
          onClick={() => {
            clearCart();
            toast.info("Cart cleared");
          }} 
          className="text-sm text-red-600 hover:underline flex items-center gap-1"
        >
          CLEAR CART
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-5">
          {items.map((item) => {
            const itemTotal = item.currentPrice * item.quantity;
            return (
              <div key={`${item.id}-${item.selectedLength}`} className="cart-item bg-white border border-[#D4C9B8] rounded-3xl p-6 flex gap-6">
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 border border-[#EDE4D4]">
                  <ProductImage src={item.images[0]} alt={item.name} fill sizes="112px" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <div>
                      <Link href={`/products/${item.slug}`} className="font-semibold text-xl tracking-tight hover:text-[#6B2D3C]">{item.name}</Link>
                      <div className="text-sm text-[#6B5F54]">{item.selectedLength} • {item.category}</div>
                    </div>
                    <div className="text-right font-mono text-xl tabular-nums">₦{itemTotal.toLocaleString()}</div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center border border-[#D4C9B8] rounded-2xl text-sm">
                      <button 
                        onClick={() => updateQuantity(item.id, item.selectedLength, Math.max(1, item.quantity - 1))}
                        className="qty-control px-4 py-2 rounded-l-2xl"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="px-5 font-mono tabular-nums border-x border-[#D4C9B8] py-2">{item.quantity}</div>
                      <button 
                        onClick={() => updateQuantity(item.id, item.selectedLength, item.quantity + 1)}
                        className="qty-control px-4 py-2 rounded-r-2xl"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          addToWishlist(cartItemToProduct(item));
                          removeFromCart(item.id, item.selectedLength);
                          toast.success("Saved for later");
                        }}
                        className="flex items-center gap-1 text-xs text-[#6B5F54] hover:text-[#6B2D3C] px-2 py-2"
                      >
                        <Heart className="w-3.5 h-3.5" /> SAVE
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          removeFromCart(item.id, item.selectedLength);
                          toast.error("Item removed from cart");
                        }}
                        className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 px-2 py-2"
                      >
                        <Trash2 className="w-4 h-4" /> REMOVE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white border border-[#D4C9B8] rounded-3xl p-8 sticky top-24">
            <div className="uppercase tracking-[2px] text-xs text-[#C5A46E] mb-4">ORDER SUMMARY</div>
            
            <div className="space-y-4 text-sm mb-8">
              {items.map((item) => (
                <div key={`${item.id}-${item.selectedLength}`} className="flex justify-between">
                  <div className="text-[#6B5F54] pr-4">{item.name} × {item.quantity}<br /><span className="text-xs">({item.selectedLength})</span></div>
                  <div className="font-mono tabular-nums whitespace-nowrap">₦{(item.currentPrice * item.quantity).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#D4C9B8] pt-5 flex justify-between text-xl font-semibold">
              <div>Total</div>
              <div className="font-mono tabular-nums">₦{total.toLocaleString()}</div>
            </div>

            <p className="text-xs text-[#6B5F54] mt-1">Shipping calculated at checkout</p>

            <Link 
              href="/checkout" 
              className="mt-8 btn-primary w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-lg font-medium"
            >
              PROCEED TO CHECKOUT <ArrowRight />
            </Link>

            <Link href="/shop" className="block text-center mt-5 text-sm text-[#6B5F54] hover:text-[#6B2D3C]">
              Continue Shopping
            </Link>

            <div className="mt-8 pt-6 border-t border-[#D4C9B8] text-xs text-[#6B5F54] space-y-1">
              <div>✓ Secure checkout powered by industry standards</div>
              <div>✓ Pay on delivery available for orders in Nigeria</div>
              <div>✓ 7-day easy returns</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}