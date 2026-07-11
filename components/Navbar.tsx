"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Menu, X, Search, User } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/cart-store";
import { useUIStore } from "@/lib/ui-store";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const cartCount = useCartStore((s) => s.getTotalItems());
  const setCartDrawerOpen = useUIStore((s) => s.setCartDrawerOpen);

  const accountHref = session
    ? session.user.role === "admin"
      ? "/admin"
      : "/account"
    : "/login";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/journal", label: "Journal" },
    { href: "/about", label: "Our Story" },
    { href: "/wholesale", label: "Wholesale" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="navbar sticky top-0 z-50 border-b border-[#D4C9B8]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/biyora-logo.png"
            alt="BIYORA SHOP"
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-[#D4C9B8]"
            priority
          />
          <div>
            <div className="font-semibold text-xl tracking-[-0.8px] text-[#2C2522]">BIYORA SHOP</div>
            <div className="text-[10px] text-[#6B5F54] -mt-1.5 tracking-[1.5px]">KANO • LAGOS • WORLD</div>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative transition-colors duration-200 hover:text-[#6B2D3C] ${
                isActive(link.href)
                  ? "text-[#6B2D3C] after:absolute after:bottom-[-2px] after:left-0 after:h-[1.5px] after:w-full after:bg-[#6B2D3C]"
                  : "after:absolute after:bottom-[-2px] after:left-0 after:h-[1px] after:w-0 after:bg-[#6B2D3C] hover:after:w-full after:transition-all"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/shop"
            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-[#6B5F54] hover:text-[#2C2522] transition-colors rounded-full hover:bg-white/60"
          >
            <Search className="w-4 h-4" />
            <span className="text-xs tracking-widest">SEARCH</span>
          </Link>

          <Link
            href="/calculator"
            className="hidden md:block text-xs tracking-widest text-[#6B5F54] hover:text-[#6B2D3C] px-3 py-1.5"
            >
            FABRIC CALC
          </Link>

          <Link
            href={accountHref}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#6B5F54] hover:text-[#2C2522] rounded-full hover:bg-white/60 transition"
          >
            <User className="w-4 h-4" />
            {session ? (session.user.role === "admin" ? "Admin" : "Account") : "Sign in"}
          </Link>

          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            className="relative flex items-center justify-center p-2.5 rounded-full hover:bg-white/60 transition-all active:scale-95 group"
            aria-label="Open cart"
          >
            <ShoppingCart className="w-5 h-5 text-[#2C2522] group-hover:scale-105 transition" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#6B2D3C] text-white text-[10px] font-medium flex items-center justify-center ring-2 ring-[#F8F4EC]"
                >
                  {cartCount}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2.5"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-[#D4C9B8] bg-[#F8F4EC]"
          >
            <div className="px-6 py-8 flex flex-col gap-5 text-lg font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-[#6B2D3C] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/calculator" onClick={() => setIsMenuOpen(false)} className="text-[#6B5F54]">
                Fabric Calculator
              </Link>
              <Link href="/faq" onClick={() => setIsMenuOpen(false)} className="text-[#6B5F54]">
                FAQ
              </Link>
              <div className="pt-4 border-t border-[#D4C9B8]">
                <Link
                  href={accountHref}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 text-[#6B5F54]"
                >
                  <User className="w-4 h-4" />
                  {session ? (session.user.role === "admin" ? "Admin dashboard" : "My account") : "Sign in"}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}