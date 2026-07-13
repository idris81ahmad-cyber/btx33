"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight, Heart, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import ProductImage from "@/components/ProductImage";
import { productImageAlt } from "@/lib/image-blur";
import { useCartStore } from "@/lib/cart-store";
import { useUIStore } from "@/lib/ui-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { cartItemToProduct } from "@/lib/cart-utils";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function CartDrawer() {
  const { cartDrawerOpen, setCartDrawerOpen } = useUIStore();
  const { items, removeFromCart, updateQuantity, getTotalPrice } = useCartStore();
  const { add: addToWishlist } = useWishlistStore();
  const { data: session } = useSession();
  const total = getTotalPrice();
  const ordersHref =
    session?.user?.role === "admin"
      ? "/admin"
      : session
        ? "/account/orders"
        : "/login?callbackUrl=/account/orders";

  const saveForLater = (item: (typeof items)[0]) => {
    addToWishlist(cartItemToProduct(item));
    removeFromCart(item.id, item.selectedLength);
    toast.success("Saved for later", { description: item.name });
  };

  return (
    <Sheet open={cartDrawerOpen} onOpenChange={setCartDrawerOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 border-[#D4C9B8]">
        <SheetHeader className="px-6 py-5 border-b border-[#D4C9B8]">
          <SheetTitle className="flex items-center gap-2 text-xl tracking-tight">
            <ShoppingBag className="w-5 h-5 text-[#6B2D3C]" />
            Your Cart
            {items.length > 0 && (
              <span className="text-sm font-normal text-[#6B5F54]">
                ({items.reduce((s, i) => s + i.quantity, 0)} items)
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="text-5xl mb-4">🛍️</div>
                <p className="text-[#6B5F54] mb-6">Your cart is empty</p>
                <div className="flex flex-col gap-3 items-center">
                  <Button asChild onClick={() => setCartDrawerOpen(false)}>
                    <Link href="/shop">Browse fabrics</Link>
                  </Button>
                  <Link
                    href={ordersHref}
                    onClick={() => setCartDrawerOpen(false)}
                    className="inline-flex items-center gap-1.5 text-sm text-[#6B2D3C] underline underline-offset-2"
                  >
                    <Package className="w-4 h-4" />
                    Track my orders
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <motion.div
                    key={`${item.id}-${item.selectedLength}`}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-4 p-4 bg-[#F8F4EC] rounded-2xl border border-[#D4C9B8]"
                  >
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-[#EDE4D4]">
                      <ProductImage
                        src={item.images[0]}
                        alt={productImageAlt(item.name, item.category)}
                        fill
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={() => setCartDrawerOpen(false)}
                        className="font-medium text-sm leading-tight hover:text-[#6B2D3C] line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-[#6B5F54] mt-0.5">{item.selectedLength}</p>
                      <p className="font-mono text-sm mt-1">
                        ₦{(item.currentPrice * item.quantity).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-[#D4C9B8] rounded-xl text-xs bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.selectedLength, Math.max(1, item.quantity - 1))
                            }
                            className="px-2.5 py-1.5"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-mono">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.selectedLength, item.quantity + 1)}
                            className="px-2.5 py-1.5"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => saveForLater(item)}
                          className="text-[10px] text-[#6B5F54] hover:text-[#6B2D3C] flex items-center gap-0.5"
                        >
                          <Heart className="w-3 h-3" /> Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            removeFromCart(item.id, item.selectedLength);
                            toast.info("Removed from cart");
                          }}
                          className="text-[#6B5F54] hover:text-red-600 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-[#D4C9B8] bg-white space-y-3">
            <div className="flex justify-between text-lg font-semibold">
              <span>Subtotal</span>
              <span className="font-mono">₦{total.toLocaleString()}</span>
            </div>
            <Button asChild className="w-full py-6 rounded-2xl bg-[#6B2D3C] hover:bg-[#4A1F2A]" size="lg">
              <Link href="/checkout" onClick={() => setCartDrawerOpen(false)}>
                Checkout <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-2xl">
              <Link href="/cart" onClick={() => setCartDrawerOpen(false)}>
                View full cart
              </Link>
            </Button>
            <Link
              href={ordersHref}
              onClick={() => setCartDrawerOpen(false)}
              className="flex items-center justify-center gap-2 text-sm text-[#6B5F54] hover:text-[#6B2D3C] py-2 min-h-[44px]"
            >
              <Package className="w-4 h-4" />
              Order history & delivery
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}