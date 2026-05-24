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

const PLACEHOLDERS = [
  { from: "#FFF8E1", to: "#FFE0B2", emoji: "🍔" },
  { from: "#FFEBEE", to: "#FFCDD2", emoji: "🍕" },
  { from: "#E8F5E9", to: "#C8E6C9", emoji: "🥗" },
  { from: "#FFF3E0", to: "#FFE0B2", emoji: "🍟" },
  { from: "#E3F2FD", to: "#BBDEFB", emoji: "🥤" },
  { from: "#FCE4EC", to: "#F8BBD9", emoji: "🍰" },
];

export default function MenuItemCard({ item, index, category, itemImages }: MenuItemCardProps) {
  const { lang, t, isRTL } = useLanguage();
  const [imgError, setImgError] = useState(false);

  const name = lang === "ar" ? (item.name_ar || item.name_en) : (item.name_en || item.name_ar);
  const nameSub = lang === "ar" ? item.name_en : item.name_ar;

  const hasSmall = (item.price_small ?? 0) > 0;
  const hasLarge = (item.price_large ?? 0) > 0;
  const primaryPrice = hasSmall ? item.price_small : (hasLarge ? item.price_large : null);
  const hasMultipleSizes = hasSmall && hasLarge;

  const ph = PLACEHOLDERS[index % PLACEHOLDERS.length];

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
        className={`flex flex-col items-center text-center ${!item.available ? "opacity-60" : ""}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Circular Image Container */}
        <div className="relative mb-3 sm:mb-4">
          <div 
            className={`
              menu-card-circle relative overflow-hidden
              w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48
              rounded-full
              transition-all duration-500 ease-out
              group-hover:scale-105
            `}
          >
            {hasImage ? (
              <>
                <Image
                  src={primaryImageUrl}
                  alt={name}
                  fill
                  sizes="(max-width: 640px) 128px, (max-width: 1024px) 160px, 192px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  unoptimized={primaryImageUrl.startsWith("http") || primaryImageUrl.startsWith("data:")}
                  onError={() => setImgError(true)}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </>
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(145deg, ${ph.from}, ${ph.to})`,
                }}
              >
                <span className="text-5xl sm:text-6xl lg:text-7xl opacity-50 select-none drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                  {ph.emoji}
                </span>
              </div>
            )}

            {/* Unavailable overlay */}
            {!item.available && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px] rounded-full">
                <span className="bg-black/70 text-white text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full">
                  {t("unavailable")}
                </span>
              </div>
            )}
          </div>

          {/* Add to Cart Button - Floating on circle */}
          {item.available && (
            <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 z-10">
              <AddToCartButton 
                product={item} 
                compact 
                className="!shadow-xl !shadow-primary/25"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="w-full px-2 mt-2">
          <h3 className="font-semibold text-ink text-sm sm:text-base lg:text-lg leading-snug tracking-tight line-clamp-2">
            {name}
          </h3>
          
          {nameSub && nameSub !== name && (
            <p className="text-ink-3 text-[10px] sm:text-xs mt-0.5 line-clamp-1">{nameSub}</p>
          )}

          {/* Price */}
          <div className="mt-2 sm:mt-3">
            {primaryPrice ? (
              <span className="inline-flex items-center gap-1">
                {hasMultipleSizes && (
                  <span className="text-[10px] sm:text-xs text-ink-3 font-medium">
                    {lang === "ar" ? "من" : "From"}
                  </span>
                )}
                <span className="text-base sm:text-lg lg:text-xl font-bold text-primary tracking-tight">
                  {primaryPrice}
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-ink-3">
                  {t("egp")}
                </span>
              </span>
            ) : (
              <span className="text-ink-3 text-sm">—</span>
            )}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
