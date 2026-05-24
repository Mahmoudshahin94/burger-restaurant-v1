"use client";

import { useCart } from "@/context/CartContext";
import { useUser } from "@/hooks/useUser";
import CartDrawer from "./CartDrawer";
import { motion, AnimatePresence } from "framer-motion";

export default function CartIcon() {
  const { totalItems, openCart, isOpen } = useCart();
  const { isAdmin } = useUser();

  // Don't show cart for admin users
  if (isAdmin) {
    return null;
  }

  return (
    <>
      <button
        onClick={openCart}
        className="header-icon-btn relative bg-surface-2 border border-border text-ink-2 hover:text-ink hover:bg-surface hover:border-ink-3/30"
        aria-label={`Cart (${totalItems} items)`}
      >
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center leading-none px-1.5 shadow-sm"
            >
              {totalItems > 9 ? "9+" : totalItems}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <CartDrawer isOpen={isOpen} />
    </>
  );
}
