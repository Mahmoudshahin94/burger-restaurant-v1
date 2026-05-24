"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import CartItemRow from "./CartItemRow";

interface CartDrawerProps {
  isOpen: boolean;
}

export default function CartDrawer({ isOpen }: CartDrawerProps) {
  const { items, subtotal, closeCart, clearCart } = useCart();
  const { lang, isRTL } = useLanguage();

  const DELIVERY_FEE = 0;
  const total = subtotal + DELIVERY_FEE;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: isRTL ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`fixed top-0 ${isRTL ? "left-0" : "right-0"} h-full w-full max-w-sm bg-surface border-${isRTL ? "r" : "l"} border-border shadow-2xl z-50 flex flex-col`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h2 className="font-bold text-ink text-base">
                  {lang === "ar" ? "سلة التسوق" : "Shopping Cart"}
                </h2>
                {items.length > 0 && (
                  <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                    {items.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                  >
                    {lang === "ar" ? "إفراغ" : "Clear"}
                  </button>
                )}
                <button
                  onClick={closeCart}
                  className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-ink-2 hover:text-ink transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-3 px-4 space-y-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <div className="text-6xl mb-4 opacity-30">🛒</div>
                  <p className="text-ink-2 font-semibold text-base">
                    {lang === "ar" ? "سلتك فارغة" : "Your cart is empty"}
                  </p>
                  <p className="text-ink-3 text-sm mt-1">
                    {lang === "ar" ? "أضف منتجات للبدء" : "Add items to get started"}
                  </p>
                  <button
                    onClick={closeCart}
                    className="mt-6 px-5 py-2.5 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    {lang === "ar" ? "تصفح المنتجات" : "Browse products"}
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <CartItemRow key={item.id} item={item} />
                ))
              )}
            </div>

            {/* Footer / Summary */}
            {items.length > 0 && (
              <div className="border-t border-border px-5 py-4 space-y-3 flex-shrink-0 bg-surface">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm text-ink-2">
                    <span>{lang === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                    <span className="font-semibold tabular-nums">
                      {subtotal.toFixed(2)} ₪
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-ink-2">
                    <span>{lang === "ar" ? "رسوم التوصيل" : "Delivery"}</span>
                    <span className="text-green-600 font-semibold">
                      {DELIVERY_FEE === 0
                        ? (lang === "ar" ? "مجاني" : "Free")
                        : `${DELIVERY_FEE} ₪`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-ink border-t border-border pt-1.5 mt-1.5">
                    <span>{lang === "ar" ? "الإجمالي" : "Total"}</span>
                    <span className="text-primary text-lg tabular-nums">
                      {total.toFixed(2)} ₪
                    </span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-sm text-center hover:bg-primary/90 active:scale-[0.99] transition-all shadow-lg shadow-primary/20"
                >
                  {lang === "ar" ? "إتمام الطلب" : "Proceed to Checkout"}
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
