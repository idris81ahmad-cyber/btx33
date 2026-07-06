"use client";

import CartDrawer from "@/components/CartDrawer";
import QuickViewModal from "@/components/QuickViewModal";
import AddToCartFly from "@/components/AddToCartFly";
import MobileNav from "@/components/MobileNav";

export default function UXProviders() {
  return (
    <>
      <CartDrawer />
      <QuickViewModal />
      <AddToCartFly />
      <MobileNav />
    </>
  );
}