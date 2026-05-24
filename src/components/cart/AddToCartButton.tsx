"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/hooks/useUser";
import type { MenuItem } from "@/types";

interface AddToCartButtonProps {
  product: MenuItem;
  size?: "small" | "large" | null;
  className?: string;
  compact?: boolean;
}

export default function AddToCartButton({ product, size, className = "", compact = false }: AddToCartButtonProps) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const { lang } = useLanguage();
  const { isAdmin } = useUser();
  const [added, setAdded] = useState(false);

  // Resolve size consistently
  const resolvedSize: "small" | "large" | null =
    size ??
    ((product.price_small ?? 0) > 0 && (product.price_large ?? 0) > 0
      ? "large"
      : (product.price_small ?? 0) > 0
      ? "small"
      : (product.price_large ?? 0) > 0
      ? "large"
      : null);

  // Find this product+size in the cart - MUST be before any returns
  const cartItem = useMemo(
    () => items.find((i) => i.product_id === product.id && i.size === resolvedSize),
    [items, product.id, resolvedSize]
  );

  // Early returns AFTER all hooks
  if (isAdmin) {
    return null;
  }

  if (!product.available) {
    return null;
  }

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, resolvedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleDecrement(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem) return;
    if (cartItem.quantity <= 1) {
      removeItem(cartItem.id);
    } else {
      updateQuantity(cartItem.id, cartItem.quantity - 1);
    }
  }

  function handleIncrement(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem) return;
    updateQuantity(cartItem.id, cartItem.quantity + 1);
  }

  // ── Compact (card button) ──────────────────────────────────────────────────
  if (compact) {
    // When item is already in cart, show inline quantity stepper
    if (cartItem) {
      return (
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`flex items-center gap-1 bg-surface border border-border rounded-full shadow-sm ${className}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <button
            onClick={handleDecrement}
            className="w-7 h-7 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
            aria-label={lang === "ar" ? "إزالة" : "Remove one"}
          >
            {cartItem.quantity === 1 ? (
              /* trash icon when last unit */
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
              </svg>
            )}
          </button>
          <span className="w-5 text-center text-sm font-bold text-ink tabular-nums select-none">
            {cartItem.quantity}
          </span>
          <button
            onClick={handleIncrement}
            className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
            aria-label={lang === "ar" ? "زيادة" : "Add one more"}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </motion.div>
      );
    }

    return (
      <button
        onClick={handleAdd}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
          added
            ? "bg-green-500 text-white"
            : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30"
        } ${className}`}
        aria-label={lang === "ar" ? "أضف للسلة" : "Add to cart"}
      >
        <AnimatePresence mode="wait">
          {added ? (
            <motion.svg
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </motion.svg>
          ) : (
            <motion.svg
              key="cart"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>
    );
  }

  // ── Full button (product detail page) ─────────────────────────────────────
  if (cartItem) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`flex items-center justify-between gap-3 py-2 px-4 rounded-2xl border border-border bg-surface shadow-sm ${className}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <button
          onClick={handleDecrement}
          className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 border border-red-200 transition-colors"
          aria-label={lang === "ar" ? "إزالة" : "Remove one"}
        >
          {cartItem.quantity === 1 ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
            </svg>
          )}
        </button>
        <span className="font-bold text-ink text-base tabular-nums">
          {cartItem.quantity} {lang === "ar" ? "في السلة" : "in cart"}
        </span>
        <button
          onClick={handleIncrement}
          className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
          aria-label={lang === "ar" ? "زيادة" : "Add one more"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </motion.div>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className={`flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] ${
        added
          ? "bg-green-500 text-white"
          : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
      } ${className}`}
    >
      <AnimatePresence mode="wait">
        {added ? (
          <motion.span key="added" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {lang === "ar" ? "تمت الإضافة!" : "Added!"}
          </motion.span>
        ) : (
          <motion.span key="add" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {lang === "ar" ? "أضف للسلة" : "Add to cart"}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
