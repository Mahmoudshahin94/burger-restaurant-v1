"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/hooks/useUser";
import ImageCarousel from "@/components/menu/ImageCarousel";
import type { MenuItem, Category, ItemImage } from "@/types";

const PLACEHOLDERS = [
  { from: "#FFF3E8", to: "#FFD9B0", emoji: "☕" },
  { from: "#FFF8E1", to: "#FFE082", emoji: "🍵" },
  { from: "#FBE9E7", to: "#FFAB91", emoji: "🥤" },
  { from: "#F3E5F5", to: "#CE93D8", emoji: "🧋" },
  { from: "#E8F5E9", to: "#A5D6A7", emoji: "🍹" },
  { from: "#E3F2FD", to: "#90CAF9", emoji: "🧃" },
  { from: "#FCE4EC", to: "#F48FB1", emoji: "🍸" },
  { from: "#E0F7FA", to: "#80DEEA", emoji: "🍰" },
];

function MoonIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function SkeletonDetail() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="h-14 glass-header flex items-center px-4 gap-3">
        <div className="skeleton w-6 h-6 rounded-full" />
        <div className="skeleton w-16 h-3 rounded" />
        <div className="flex-1" />
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="skeleton w-8 h-8 rounded-full" />
      </div>
      <div className="md:hidden">
        <div className="skeleton w-full" style={{ height: "55vw", minHeight: 220 }} />
        <div className="p-5 space-y-4">
          <div className="skeleton w-20 h-5 rounded-full" />
          <div className="skeleton h-8 w-3/4 rounded-xl" />
          <div className="skeleton h-10 w-32 rounded-xl" />
          <div className="skeleton h-14 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { lang, t, isRTL } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { addItem, openCart } = useCart();
  const { isAdmin } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [selectedSize, setSelectedSize] = useState<"small" | "large" | null>(null);
  const [shared, setShared] = useState(false);
  const [added, setAdded] = useState(false);

  const [item, setItem] = useState<MenuItem | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [itemImages, setItemImages] = useState<ItemImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchItem() {
      const [itemRes, imagesRes] = await Promise.all([
        supabase.from("products").select("*, categories(*)").eq("id", id).single(),
        supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
      ]);

      if (itemRes.data) {
        const productData = itemRes.data;
        setItem({
          id: productData.id,
          name_en: productData.name_en,
          name_ar: productData.name_ar,
          description_en: productData.description_en,
          description_ar: productData.description_ar,
          price_small: productData.price_small,
          price_large: productData.price_large,
          image: productData.image,
          available: productData.available,
          sort_order: productData.sort_order,
          category_id: productData.category_id,
        });

        if ((productData as { categories?: Category | null }).categories) {
          setCategory((productData as { categories?: Category | null }).categories as Category);
        }
      }

      if (imagesRes.data) {
        setItemImages(
          imagesRes.data.map((img) => ({
            id: img.id,
            product_id: img.product_id,
            item_id: img.product_id ?? undefined,
            image: img.image_url,
            image_url: img.image_url,
            is_primary: img.is_primary,
            sort_order: img.sort_order,
            order: img.sort_order,
          }))
        );
      }

      setIsLoading(false);
    }

    fetchItem();
  // supabase is stable (useMemo), only re-fetch when id changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleShare = useCallback(async (itemName: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: itemName, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // user cancelled
    }
  }, []);

  if (isLoading) {
    return <div dir={isRTL ? "rtl" : "ltr"}><SkeletonDetail /></div>;
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6" dir={isRTL ? "rtl" : "ltr"}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <span className="text-7xl block">🍽️</span>
          <p className="text-ink-2 text-lg font-medium">{t("no_items")}</p>
          <Link href="/" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline underline-offset-4">
            {isRTL ? "← العودة للقائمة" : "← Back to menu"}
          </Link>
        </motion.div>
      </div>
    );
  }

  const sortedImages = [...itemImages].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const imageUrls: string[] =
    sortedImages.length > 0
      ? sortedImages.map((img) => img.image).filter(Boolean)
      : item.image ? [item.image] : [];

  const name = lang === "ar" ? item.name_ar || item.name_en : item.name_en || item.name_ar;
  const nameSub = lang === "ar" ? item.name_en : item.name_ar;
  const description = lang === "ar" ? item.description_ar : item.description_en;
  const categoryName = category ? (lang === "ar" ? category.name_ar : category.name_en) : null;

  const hasSmall = (item.price_small ?? 0) > 0;
  const hasLarge = (item.price_large ?? 0) > 0;
  const hasBothSizes = hasSmall && hasLarge;
  const hasPrices = hasSmall || hasLarge;

  const effectiveSize =
    selectedSize ?? (hasBothSizes ? "large" : hasSmall ? "small" : hasLarge ? "large" : null);

  const displayPrice =
    effectiveSize === "small" ? item.price_small
    : effectiveSize === "large" ? item.price_large
    : hasSmall ? item.price_small : item.price_large;

  const phIndex = id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % PLACEHOLDERS.length;
  const ph = PLACEHOLDERS[phIndex];

  function handleAddToCart() {
    if (!item) return;
    addItem(item, effectiveSize);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openCart();
    }, 800);
  }

  const InfoContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col gap-5"
    >
      {categoryName && (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-3 bg-surface-2 px-3 py-1 rounded-full uppercase tracking-wider border border-border">
            {category?.icon && <span>{category.icon}</span>}
            {categoryName}
          </span>
        </div>
      )}

      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink leading-tight tracking-tight">{name}</h1>
        {nameSub && nameSub !== name && <p className="text-sm text-ink-3 font-medium">{nameSub}</p>}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {hasPrices && displayPrice && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-primary tabular-nums">{displayPrice}</span>
            <span className="text-base font-semibold text-ink-3">{t("egp")}</span>
          </div>
        )}
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
          item.available
            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
            : "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${item.available ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          {item.available ? t("available") : t("unavailable")}
        </span>
      </div>

      {hasBothSizes && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-ink-3 uppercase tracking-widest">
            {isRTL ? "الحجم" : "Choose Size"}
          </p>
          <div className="flex gap-3">
            {[{ key: "small" as const, label: t("small"), price: item.price_small },
              { key: "large" as const, label: t("large"), price: item.price_large }].map((s) => (
              <button
                key={s.key}
                onClick={() => setSelectedSize(s.key)}
                className={`flex-1 py-3 px-4 rounded-2xl border-2 transition-all duration-200 text-start ${
                  effectiveSize === s.key ? "border-primary item-size-active shadow-sm" : "border-border bg-surface hover:border-ink-3"
                }`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-wide mb-0.5 ${effectiveSize === s.key ? "text-primary" : "text-ink-3"}`}>{s.label}</p>
                <p className={`text-base font-extrabold ${effectiveSize === s.key ? "text-primary" : "text-ink"}`}>
                  {s.price}<span className="text-[11px] font-normal ms-1 opacity-70">{t("egp")}</span>
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {description && <div className="border-t border-border" />}
      {description && <p className="text-ink-2 text-sm leading-relaxed">{description}</p>}
    </motion.div>
  );

  const CtaButton = ({ className = "" }: { className?: string }) => {
    // Don't show add to cart for admin users
    if (isAdmin) {
      return null;
    }
    
    return item.available ? (
      <button
        onClick={handleAddToCart}
        className={`flex items-center justify-center gap-2.5 w-full rounded-2xl font-bold text-[15px] transition-all py-4 ${
          added
            ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
            : "bg-primary hover:bg-primary/90 active:scale-[0.98] text-white shadow-lg shadow-primary/20"
        } ${className}`}
      >
        {added ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {isRTL ? "تمت الإضافة!" : "Added to cart!"}
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {isRTL ? "أضف للسلة" : "Add to Cart"}
          </>
        )}
      </button>
    ) : (
      <div className={`flex items-center justify-center w-full rounded-2xl bg-surface-2 border border-border text-ink-3 font-bold text-[15px] cursor-not-allowed py-4 ${className}`}>
        {t("unavailable")}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg" dir={isRTL ? "rtl" : "ltr"}>
      <nav className="sticky top-0 z-50 glass-header h-14 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-ink-2 hover:text-ink transition-colors">
          <svg className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="text-sm font-semibold hidden sm:inline">{isRTL ? "القائمة" : "Menu"}</span>
        </Link>

        <div className="flex items-center gap-1">
          <button onClick={() => handleShare(name)} aria-label={isRTL ? "مشاركة" : "Share"}
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface-2 transition-all"
          >
            <AnimatePresence mode="wait">
              {shared ? (
                <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-green-500">
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </motion.span>
              ) : (
                <motion.span key="share" initial={{ scale: 1 }} animate={{ scale: 1 }}><ShareIcon /></motion.span>
              )}
            </AnimatePresence>
          </button>
          <button onClick={() => toggleTheme()} aria-label="Toggle theme"
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface-2 transition-all"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile */}
      <div className="md:hidden flex flex-col" style={{ minHeight: "calc(100dvh - 3.5rem)" }}>
        <div className="relative w-full flex-shrink-0" style={{ height: "56vw", minHeight: 220, maxHeight: 360 }}>
          <ImageCarousel images={imageUrls} alt={name} className="w-full h-full" placeholderFrom={ph.from} placeholderTo={ph.to} placeholderEmoji={ph.emoji} objectFit="contain" showCounter={true} showThumbnails={false} />
        </div>
        <div className="flex-1 px-5 pt-5 pb-28 space-y-5 overflow-y-auto scrollbar-hide"><InfoContent /></div>
        <div className="fixed bottom-0 inset-x-0 bg-surface border-t border-border px-5 py-3 pb-safe z-40">
          <CtaButton />
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-surface rounded-3xl shadow-2xl overflow-hidden border border-border"
          >
            <div className="flex">
              <div className="flex-[5] min-w-0 bg-surface-2">
                <div className="flex flex-col h-full" style={{ minHeight: 520 }}>
                  <div className="relative flex-1 min-h-0" style={{ minHeight: 420 }}>
                    <ImageCarousel images={imageUrls} alt={name} className="w-full h-full" placeholderFrom={ph.from} placeholderTo={ph.to} placeholderEmoji={ph.emoji} objectFit="contain" showCounter={imageUrls.length > 1} showThumbnails={imageUrls.length > 1} />
                  </div>
                </div>
              </div>
              <div className="flex-[4] flex flex-col min-w-0 border-s border-border">
                <div className="flex-1 overflow-y-auto scrollbar-hide p-8"><InfoContent /></div>
                <div className="p-6 border-t border-border flex-shrink-0 bg-surface"><CtaButton /></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
