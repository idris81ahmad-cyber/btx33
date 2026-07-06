"use client";

import Link from "next/link";
import { Home, ShoppingBag, Heart, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useUIStore } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.getTotalItems());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const setCartDrawerOpen = useUIStore((s) => s.setCartDrawerOpen);

  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) return null;

  const links = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/shop", icon: Search, label: "Shop" },
    { href: "#cart", icon: ShoppingBag, label: "Cart", badge: cartCount, onClick: () => setCartDrawerOpen(true) },
    { href: "/shop?wishlist=1", icon: Heart, label: "Saved", badge: wishlistCount },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#D4C9B8] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map(({ href, icon: Icon, label, badge, onClick }) => {
          const active = href === "/" ? pathname === "/" : href !== "#cart" && pathname.startsWith(href.split("?")[0]);
          const inner = (
            <>
              <div className="relative">
                <Icon className={cn("w-5 h-5", active && "text-[#6B2D3C]")} />
                {badge ? (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#6B2D3C] text-white text-[9px] flex items-center justify-center">
                    {badge}
                  </span>
                ) : null}
              </div>
              <span className={cn("text-[10px] mt-0.5", active ? "text-[#6B2D3C] font-medium" : "text-[#6B5F54]")}>
                {label}
              </span>
            </>
          );

          if (onClick) {
            return (
              <button key={label} type="button" onClick={onClick} className="flex flex-col items-center py-1 px-3">
                {inner}
              </button>
            );
          }

          return (
            <Link key={label} href={href} className="flex flex-col items-center py-1 px-3">
              {inner}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}