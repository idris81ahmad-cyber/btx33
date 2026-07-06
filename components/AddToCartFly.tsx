"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/lib/ui-store";
import ProductImage from "@/components/ProductImage";

export default function AddToCartFly() {
  const { flyTarget, clearFlyTarget } = useUIStore();

  useEffect(() => {
    if (!flyTarget) return;
    const t = setTimeout(clearFlyTarget, 700);
    return () => clearTimeout(t);
  }, [flyTarget, clearFlyTarget]);

  return (
    <AnimatePresence>
      {flyTarget && (
        <motion.div
          initial={{ left: flyTarget.fromX, top: flyTarget.fromY, scale: 1, opacity: 1 }}
          animate={{ left: "calc(100% - 3rem)", top: "2.5rem", scale: 0.2, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="fixed z-[200] w-14 h-14 rounded-xl overflow-hidden border-2 border-[#C5A46E] shadow-xl pointer-events-none -translate-x-1/2 -translate-y-1/2"
        >
          <ProductImage src={flyTarget.image} alt="" fill sizes="56px" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}