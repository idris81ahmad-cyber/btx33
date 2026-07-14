"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import EmptyState from "@/components/EmptyState";
import { useCartStore } from "@/lib/cart-store";
import { Trash2, Plus, Minus, ArrowRight, Heart, Package, ShoppingBag, Tag } from "lucide-react";
import { toast } from "sonner";
import { useWishlistStore } from "@/lib/wishlist-store";
import { cartItemToProduct } from "@/lib/cart-utils";
import { useSession } from "next-auth/react";
import { validateCoupon, type Coupon } from "@/lib/coupons";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCartStore();
  const addToWishlist = useWishlistStore((s) => s.add);
  const { data: session } = useSession();
  const subtotal = getTotalPrice();
  const shippingFee = 2500;
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [publicCoupons, setPublicCoupons] = useState<
    { code: string; label: string; minSubtotal?: number }[]
  >([]);

  const total = Math.max(0, subtotal + shippingFee - discount);
  const ordersHref =
    session?.user?.role === "admin"
      ? "/admin"
      : session
        ? "/account/orders"
        : "/login?callbackUrl=/account/orders";

  useEffect(() => {
    fetch("/api/coupons")
      .then((r) => r.json())
      .then((d) => setPublicCoupons(Array.isArray(d.coupons) ? d.coupons : []))
      .catch(() => setPublicCoupons([]));
  }, []);

  useEffect(() => {
    if (!appliedCoupon) return;
    const result = validateCoupon(appliedCoupon.code, subtotal);
    if (!result.valid) {
      setAppliedCoupon(null);
      setDiscount(0);
      setCouponMessage(result.message);
      return;
    }
    setDiscount(result.discount);
  }, [subtotal, appliedCoupon]);

  const applyCoupon = async () => {
    // Prefer server validation when available; fall back to local rules
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponMessage(data.message || "Invalid coupon");
        toast.error(data.message || "Invalid coupon");
        return;
      }
      const local = validateCoupon(String(data.code), subtotal);
      if (!local.valid) {
        setCouponMessage(local.message);
        toast.error(local.message);
        return;
      }
      setAppliedCoupon(local.coupon);
      setDiscount(local.discount);
      setCouponMessage(`${local.coupon.label} applied`);
      toast.success("Coupon applied — finalize at checkout");
    } catch {
      const result = validateCoupon(couponInput, subtotal);
      if (!result.valid) {
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponMessage(result.message);
        toast.error(result.message);
        return;
      }
      setAppliedCoupon(result.coupon);
      setDiscount(result.discount);
      setCouponMessage(`${result.coupon.label} applied`);
      toast.success("Coupon applied — finalize at checkout");
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <EmptyState
          icon={ShoppingBag}
          eyebrow="YOUR BAG"
          title="Your cart is empty"
          description="Discover beautiful premium fabrics from Kano's finest markets — Ankara, lace, brocade, and more."
          actions={[
            { label: "Start shopping", href: "/shop" },
            { label: "Track my orders", href: ordersHref, variant: "secondary" },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="text-xs tracking-[3px] text-[#C5A46E]">YOUR SELECTIONS</div>
          <h1 className="text-5xl tracking-[-2px] font-semibold">Shopping Cart</h1>
          <p className="text-[#6B5F54] mt-1">{items.length} item{items.length !== 1 ? "s" : ""} • {items.reduce((s, i) => s + i.quantity, 0)} total pieces</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={ordersHref}
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 border border-[#D4C9B8] rounded-xl hover:bg-white min-h-[44px]"
          >
            <Package className="w-4 h-4" />
            Order history
          </Link>
          <button 
            onClick={() => {
              clearCart();
              toast.info("Cart cleared");
            }} 
            className="text-sm text-red-600 hover:underline flex items-center gap-1 min-h-[44px]"
          >
            CLEAR CART
          </button>
        </div>
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
                        type="button"
                        onClick={() => updateQuantity(item.id, item.selectedLength, Math.max(1, item.quantity - 1))}
                        className="qty-control px-4 py-2 rounded-l-2xl min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C5A46E]"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <div className="px-5 font-mono tabular-nums border-x border-[#D4C9B8] py-2" aria-live="polite">
                        {item.quantity}
                      </div>
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.id, item.selectedLength, item.quantity + 1)}
                        className="qty-control px-4 py-2 rounded-r-2xl min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C5A46E]"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
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

            <div className="space-y-2 text-sm border-t border-[#D4C9B8] pt-5">
              <div className="flex justify-between text-[#6B5F54]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#6B5F54]">
                <span>Est. shipping</span>
                <span className="font-mono tabular-nums">₦{shippingFee.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Discount {appliedCoupon ? `(${appliedCoupon.code})` : ""}</span>
                  <span className="font-mono tabular-nums">−₦{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-semibold pt-2">
                <div>Est. total</div>
                <div className="font-mono tabular-nums">₦{total.toLocaleString()}</div>
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="cart-coupon" className="text-xs text-[#6B5F54] mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" aria-hidden="true" /> Coupon code
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-mono font-medium text-emerald-900">{appliedCoupon.code}</p>
                    <p className="text-xs text-emerald-800 truncate">{appliedCoupon.label}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setDiscount(0);
                      setCouponInput("");
                      setCouponMessage("");
                    }}
                    className="text-xs font-medium text-emerald-900 underline min-h-[40px] px-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    id="cart-coupon"
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="e.g. KWARI10"
                    className="input-premium flex-1 min-h-[44px] text-sm font-mono"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => void applyCoupon()}
                    className="px-4 rounded-2xl border border-[#D4C9B8] text-sm font-medium min-h-[44px] hover:bg-[#F8F4EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C5A46E]"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponMessage && !appliedCoupon && (
                <p className="text-xs text-amber-800 mt-1.5" role="status">
                  {couponMessage}
                </p>
              )}
              {publicCoupons.length > 0 && !appliedCoupon && (
                <ul className="mt-2 space-y-1" aria-label="Available coupons">
                  {publicCoupons.map((c) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        onClick={() => setCouponInput(c.code)}
                        className="text-[11px] text-[#6B5F54] hover:text-[#6B2D3C] underline-offset-2 hover:underline text-left"
                      >
                        <span className="font-mono font-medium">{c.code}</span>
                        {c.minSubtotal
                          ? ` · min ₦${c.minSubtotal.toLocaleString()}`
                          : ""}{" "}
                        — {c.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] text-[#A89B8A] mt-2">
                Re-enter your code at checkout so it is applied to payment.
              </p>
            </div>

            <Link 
              href={
                appliedCoupon
                  ? `/checkout?coupon=${encodeURIComponent(appliedCoupon.code)}`
                  : "/checkout"
              }
              className="mt-8 btn-primary w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-lg font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46E]"
            >
              PROCEED TO CHECKOUT <ArrowRight aria-hidden="true" />
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