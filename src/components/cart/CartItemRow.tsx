"use client";

import Image from "next/image";
import { useCart, type LocalCartItem } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

interface CartItemRowProps {
  item: LocalCartItem;
}

export default function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCart();
  const { lang, t } = useLanguage();

  if (!item.product) return null;

  const name = lang === "ar"
    ? (item.product.name_ar || item.product.name_en)
    : (item.product.name_en || item.product.name_ar);

  const price =
    item.size === "small"
      ? (item.product.price_small ?? 0)
      : (item.product.price_large ?? item.product.price_small ?? 0);

  const sizeLabel =
    item.size === "small" ? t("small") : item.size === "large" ? t("large") : null;

  const lineTotal = price * item.quantity;

  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-2 border border-border/60">
      {/* Image */}
      <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-surface">
        {item.product.image ? (
          <Image
            src={item.product.image}
            alt={name}
            fill
            className="object-cover"
            sizes="56px"
            unoptimized={item.product.image.startsWith("http")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">☕</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink text-sm leading-tight line-clamp-2">{name}</p>
        {sizeLabel && (
          <p className="text-xs text-ink-3 mt-0.5">{sizeLabel}</p>
        )}
        <p className="text-primary font-bold text-sm mt-1 tabular-nums">
          {lineTotal.toFixed(2)} ₪
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-ink-2 hover:text-red-500 hover:border-red-300 transition-colors"
          aria-label="Decrease"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
          </svg>
        </button>
        <span className="w-6 text-center text-sm font-bold text-ink tabular-nums">
          {item.quantity}
        </span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-ink-2 hover:text-primary hover:border-primary/40 transition-colors"
          aria-label="Increase"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => removeItem(item.id)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-ink-3 hover:text-red-500 hover:bg-red-50 transition-colors ms-1"
          aria-label="Remove"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
