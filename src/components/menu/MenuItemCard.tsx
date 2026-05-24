"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import AddToCartButton from "@/components/cart/AddToCartButton";
import type { MenuItem, Category, ItemImage } from "@/types";

interface MenuItemCardProps {
  item: MenuItem;
  index: number;
  category?: Category;
  itemImages?: ItemImage[];
}

/* Refined neutral gradients for luxury minimal aesthetic */
const PLACEHOLDERS = [
  { from: "#FAFAFA", to: "#F3F4F6", emoji: "☕" },
  { from: "#F8F8F8", to: "#E5E7EB", emoji: "🍵" },
  { from: "#FEFEFE", to: "#F3F4F6", emoji: "🥤" },
  { from: "#F9FAFB", to: "#E5E7EB", emoji: "🧋" },
  { from: "#FAFAFA", to: "#F3F4F6", emoji: "🍹" },
  { from: "#F8F8F8", to: "#E5E7EB", emoji: "🧃" },
  { from: "#FEFEFE", to: "#F3F4F6", emoji: "🍸" },
  { from: "#F9FAFB", to: "#E5E7EB", emoji: "🍰" },
];

export default function MenuItemCard({ item, index, category, itemImages }: MenuItemCardProps) {
  const { lang, t, isRTL } = useLanguage();
  const [imgError, setImgError] = useState(false);

  const name = lang === "ar" ? (item.name_ar || item.name_en) : (item.name_en || item.name_ar);
  const nameSub = lang === "ar" ? item.name_en : item.name_ar;
  const description = lang === "ar" ? item.description_ar : item.description_en;

  const hasSmall = (item.price_small ?? 0) > 0;
  const hasLarge = (item.price_large ?? 0) > 0;
  const hasPrices = hasSmall || hasLarge;

  const ph = PLACEHOLDERS[index % PLACEHOLDERS.length];

  // Resolve the primary image: item_images primary > first item_image > legacy item.image
  const sortedImages = itemImages
    ? [...itemImages].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return (a.order ?? 0) - (b.order ?? 0);
      })
    : [];

  const primaryImageUrl =
    sortedImages.length > 0 ? sortedImages[0].image : (item.image ?? "");

  const hasImage = !!primaryImageUrl && !imgError;
  const hasMultipleImages = sortedImages.length > 1;

  return (
    <Link href={`/m/${item.id}`} className="block group">
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: Math.min(index * 0.06, 0.6),
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className={`menu-card bg-surface rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col ${
          !item.available ? "opacity-60" : ""
        }`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* ── Image / Placeholder ── */}
        <div className={`relative w-full flex-shrink-0 overflow-hidden ${hasImage ? "h-40 sm:h-48 lg:h-56" : "h-28 sm:h-32 lg:h-36"}`}>
          {hasImage ? (
            <>
              <Image
                src={primaryImageUrl}
                alt={name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover menu-card-image"
                unoptimized={primaryImageUrl.startsWith("http") || primaryImageUrl.startsWith("data:")}
                onError={() => setImgError(true)}
                loading="lazy"
              />
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 img-overlay pointer-events-none" />

              {/* Unavailable overlay */}
              {!item.available && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center backdrop-blur-[2px]">
                  <span className="bg-black/70 text-white text-[11px] sm:text-xs font-semibold px-3 py-1.5 rounded-full">
                    {t("unavailable")}
                  </span>
                </div>
              )}

              {/* Multiple images indicator */}
              {hasMultipleImages && (
                <div className={`absolute bottom-2 sm:bottom-3 ${isRTL ? "left-2 sm:left-3" : "right-2 sm:right-3"} flex items-center gap-0.5 sm:gap-1`}>
                  {Array.from({ length: Math.min(sortedImages.length, 4) }).map((_, i) => (
                    <span
                      key={i}
                      className={`block rounded-full ${i === 0 ? "w-3.5 sm:w-4 h-1.5 sm:h-2 bg-white" : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/60"}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(145deg, ${ph.from}, ${ph.to})`,
              }}
            >
              <span className="text-5xl sm:text-6xl opacity-45 select-none drop-shadow-sm">{ph.emoji}</span>
            </div>
          )}

          {/* Category badge */}
          {category && (
            <div className={`absolute top-3 sm:top-4 ${isRTL ? "right-3 sm:right-4" : "left-3 sm:left-4"}`}>
              <span className="bg-white/90 backdrop-blur-md text-ink text-[10px] sm:text-[11px] font-medium px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm">
                {lang === "ar" ? category.name_ar : category.name_en}
              </span>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="p-4 sm:p-5 lg:p-6 flex flex-col flex-1 gap-3 sm:gap-4">
          {/* Name */}
          <div className="flex-1">
            <h3 className="font-semibold text-ink text-[15px] sm:text-base lg:text-lg leading-snug tracking-tight line-clamp-2">
              {name}
            </h3>
            {nameSub && nameSub !== name && (
              <p className="text-ink-3 text-[11px] sm:text-xs mt-1 line-clamp-1 tracking-wide">{nameSub}</p>
            )}
            {description && (
              <p className="text-ink-2 text-[11px] sm:text-xs mt-2 sm:mt-3 line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Prices */}
          <div className="flex items-end justify-between gap-3 pt-3 sm:pt-4 border-t border-border">
            <div className="flex items-center gap-3 sm:gap-4">
              {hasSmall && (
                <div className="flex flex-col items-start">
                  <span className="text-[9px] sm:text-[10px] text-ink-3 font-medium uppercase tracking-wider mb-0.5">
                    {t("small")}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-ink tracking-tight">
                    {item.price_small} <span className="text-[11px] sm:text-xs font-medium text-ink-3">{t("egp")}</span>
                  </span>
                </div>
              )}

              {hasSmall && hasLarge && (
                <div className="w-px h-8 sm:h-10 bg-border" />
              )}

              {hasLarge && (
                <div className="flex flex-col items-start">
                  <span className="text-[9px] sm:text-[10px] text-ink-3 font-medium uppercase tracking-wider mb-0.5">
                    {t("large")}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-ink tracking-tight">
                    {item.price_large} <span className="text-[11px] sm:text-xs font-medium text-ink-3">{t("egp")}</span>
                  </span>
                </div>
              )}

              {!hasPrices && (
                <span className="text-ink-3 text-base">—</span>
              )}
            </div>

            {/* Unavailable badge (no image) */}
            {!item.available && !hasImage && (
              <span className="text-[10px] sm:text-[11px] bg-surface-2 text-ink-2 px-3 py-1 rounded-full font-medium">
                {t("unavailable")}
              </span>
            )}

            {/* Add to cart */}
            {item.available && (
              <AddToCartButton product={item} compact className="flex-shrink-0 btn-luxury" />
            )}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
