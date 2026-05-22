"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/db";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import ImageCarousel from "@/components/menu/ImageCarousel";
import type { MenuItem, Category, ItemImage } from "@/types";

const WHATSAPP_ORDER_HREF = "https://wa.me/972524171936";

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

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.123 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function SkeletonDetail() {
  return (
    <div className="min-h-screen bg-bg" style={{ height: "100dvh" }}>
      {/* Nav skeleton */}
      <div className="h-14 glass-header flex items-center px-4 gap-3 flex-shrink-0">
        <div className="skeleton w-6 h-6 rounded-full" />
        <div className="skeleton w-16 h-3 rounded" />
        <div className="flex-1" />
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="skeleton w-8 h-8 rounded-full" />
      </div>
      {/* Mobile: stacked */}
      <div className="md:hidden">
        <div className="skeleton w-full" style={{ height: "55vw", minHeight: 220 }} />
        <div className="p-5 space-y-4">
          <div className="skeleton w-20 h-5 rounded-full" />
          <div className="skeleton h-8 w-3/4 rounded-xl" />
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="skeleton h-10 w-32 rounded-xl" />
          <div className="skeleton h-px w-full" />
          <div className="space-y-2">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
            <div className="skeleton h-3 w-4/6 rounded" />
          </div>
        </div>
      </div>
      {/* Desktop: two-column */}
      <div className="hidden md:flex max-w-4xl mx-auto my-8 gap-8 px-6">
        <div className="skeleton flex-1 rounded-3xl" style={{ minHeight: 400 }} />
        <div className="flex-1 space-y-4 py-4">
          <div className="skeleton w-24 h-6 rounded-full" />
          <div className="skeleton h-10 w-full rounded-xl" />
          <div className="skeleton h-5 w-1/2 rounded" />
          <div className="skeleton h-12 w-40 rounded-xl" />
          <div className="flex gap-3">
            <div className="skeleton flex-1 h-20 rounded-2xl" />
            <div className="skeleton flex-1 h-20 rounded-2xl" />
          </div>
          <div className="skeleton h-px w-full" />
          <div className="space-y-2">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { lang, t, isRTL } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [selectedSize, setSelectedSize] = useState<"small" | "large" | null>(null);
  const [shared, setShared] = useState(false);

  const { data, isLoading } = db.useQuery({ items: {}, categories: {}, item_images: {} });

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
      // user cancelled share
    }
  }, []);

  if (isLoading) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"}>
        <SkeletonDetail />
      </div>
    );
  }

  const item = (data?.items as MenuItem[] | undefined)?.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6" dir={isRTL ? "rtl" : "ltr"}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <span className="text-7xl block">🍽️</span>
          <p className="text-ink-2 text-lg font-medium">{t("no_items")}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline underline-offset-4"
          >
            {isRTL ? "← العودة للقائمة" : "← Back to menu"}
          </Link>
        </motion.div>
      </div>
    );
  }

  const category = (data?.categories as Category[] | undefined)?.find(
    (c) => c.id === item.category_id
  );

  const allItemImages = (data?.item_images as ItemImage[] | undefined) ?? [];
  const itemImages = allItemImages
    .filter((img) => img.item_id === id)
    .sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });

  const imageUrls: string[] =
    itemImages.length > 0
      ? itemImages.map((img) => img.image).filter(Boolean)
      : item.image
      ? [item.image]
      : [];

  const name = lang === "ar" ? item.name_ar || item.name_en : item.name_en || item.name_ar;
  const nameSub = lang === "ar" ? item.name_en : item.name_ar;
  const description = lang === "ar" ? item.description_ar : item.description_en;
  const categoryName = category
    ? lang === "ar" ? category.name_ar : category.name_en
    : null;

  const hasSmall = (item.price_small ?? 0) > 0;
  const hasLarge = (item.price_large ?? 0) > 0;
  const hasBothSizes = hasSmall && hasLarge;
  const hasPrices = hasSmall || hasLarge;

  // Default size selection
  const effectiveSize =
    selectedSize ?? (hasBothSizes ? "large" : hasSmall ? "small" : hasLarge ? "large" : null);

  const displayPrice =
    effectiveSize === "small"
      ? item.price_small
      : effectiveSize === "large"
      ? item.price_large
      : hasSmall
      ? item.price_small
      : item.price_large;

  const phIndex =
    id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % PLACEHOLDERS.length;
  const ph = PLACEHOLDERS[phIndex];

  const sizeLabel =
    hasBothSizes && effectiveSize
      ? ` (${effectiveSize === "small" ? t("small") : t("large")})`
      : "";

  const whatsappText = encodeURIComponent(
    isRTL
      ? `مرحباً، أريد طلب: ${name}${sizeLabel ? ` ${sizeLabel}` : ""}`
      : `Hi, I'd like to order: ${name}${sizeLabel}`
  );

  const InfoContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col gap-5"
    >
      {/* Category badge */}
      {categoryName && (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-3 bg-surface-2 px-3 py-1 rounded-full uppercase tracking-wider border border-border">
            {category?.icon && <span>{category.icon}</span>}
            {categoryName}
          </span>
        </div>
      )}

      {/* Name */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink leading-tight tracking-tight">
          {name}
        </h1>
        {nameSub && nameSub !== name && (
          <p className="text-sm text-ink-3 font-medium">{nameSub}</p>
        )}
      </div>

      {/* Price + availability row */}
      <div className="flex items-center gap-3 flex-wrap">
        {hasPrices && displayPrice && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-primary tabular-nums">
              {displayPrice}
            </span>
            <span className="text-base font-semibold text-ink-3">{t("egp")}</span>
          </div>
        )}

        {/* Availability badge */}
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
            item.available
              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
              : "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              item.available ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
          {item.available ? t("available") : t("unavailable")}
        </span>
      </div>

      {/* Size selector */}
      {hasBothSizes && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-ink-3 uppercase tracking-widest">
            {isRTL ? "الحجم" : "Choose Size"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedSize("small")}
              className={`flex-1 py-3 px-4 rounded-2xl border-2 transition-all duration-200 text-start ${
                effectiveSize === "small"
                  ? "border-primary item-size-active shadow-sm"
                  : "border-border bg-surface hover:border-ink-3"
              }`}
            >
              <p className={`text-[10px] font-bold uppercase tracking-wide mb-0.5 ${effectiveSize === "small" ? "text-primary" : "text-ink-3"}`}>
                {t("small")}
              </p>
              <p className={`text-base font-extrabold ${effectiveSize === "small" ? "text-primary" : "text-ink"}`}>
                {item.price_small}
                <span className="text-[11px] font-normal ms-1 opacity-70">{t("egp")}</span>
              </p>
            </button>

            <button
              onClick={() => setSelectedSize("large")}
              className={`flex-1 py-3 px-4 rounded-2xl border-2 transition-all duration-200 text-start ${
                effectiveSize === "large"
                  ? "border-primary item-size-active shadow-sm"
                  : "border-border bg-surface hover:border-ink-3"
              }`}
            >
              <p className={`text-[10px] font-bold uppercase tracking-wide mb-0.5 ${effectiveSize === "large" ? "text-primary" : "text-ink-3"}`}>
                {t("large")}
              </p>
              <p className={`text-base font-extrabold ${effectiveSize === "large" ? "text-primary" : "text-ink"}`}>
                {item.price_large}
                <span className="text-[11px] font-normal ms-1 opacity-70">{t("egp")}</span>
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Divider */}
      {description && <div className="border-t border-border" />}

      {/* Description */}
      {description && (
        <p className="text-ink-2 text-sm leading-relaxed">{description}</p>
      )}
    </motion.div>
  );

  const CtaButton = ({ className = "" }: { className?: string }) => (
    item.available ? (
      <a
        href={`${WHATSAPP_ORDER_HREF}?text=${whatsappText}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center gap-2.5 w-full rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] active:scale-[0.98] text-white font-bold text-[15px] transition-all shadow-lg shadow-green-500/20 py-4 ${className}`}
      >
        <WhatsAppIcon />
        {isRTL ? "اطلب عبر واتساب" : "Order on WhatsApp"}
      </a>
    ) : (
      <div
        className={`flex items-center justify-center w-full rounded-2xl bg-surface-2 border border-border text-ink-3 font-bold text-[15px] cursor-not-allowed py-4 ${className}`}
      >
        {t("unavailable")}
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-bg" dir={isRTL ? "rtl" : "ltr"}>

      {/* ── Sticky glass navigation ───────────────────── */}
      <nav className="sticky top-0 z-50 glass-header h-14 flex items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-ink-2 hover:text-ink transition-colors cursor-pointer"
          aria-label={isRTL ? "رجوع" : "Back to menu"}
        >
          <svg className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="text-sm font-semibold hidden sm:inline">
            {isRTL ? "القائمة" : "Menu"}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Share button */}
          <button
            onClick={() => handleShare(name)}
            aria-label={isRTL ? "مشاركة" : "Share"}
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface-2 transition-all"
          >
            <AnimatePresence mode="wait">
              {shared ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-green-500"
                >
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </motion.span>
              ) : (
                <motion.span key="share" initial={{ scale: 1 }} animate={{ scale: 1 }}>
                  <ShareIcon />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => toggleTheme()}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface-2 transition-all"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </nav>

      {/* ── Mobile layout (default, hidden md+) ───────── */}
      <div className="md:hidden flex flex-col" style={{ minHeight: "calc(100dvh - 3.5rem)" }}>
        {/* Hero carousel */}
        <div className="relative w-full flex-shrink-0" style={{ height: "56vw", minHeight: 220, maxHeight: 360 }}>
          <ImageCarousel
            images={imageUrls}
            alt={name}
            className="w-full h-full"
            placeholderFrom={ph.from}
            placeholderTo={ph.to}
            placeholderEmoji={ph.emoji}
            objectFit="contain"
            showCounter={true}
            showThumbnails={false}
          />
        </div>

        {/* Info panel */}
        <div className="flex-1 px-5 pt-5 pb-28 space-y-5 overflow-y-auto scrollbar-hide">
          <InfoContent />
        </div>

        {/* Sticky bottom CTA */}
        <div className="fixed bottom-0 inset-x-0 bg-surface border-t border-border px-5 py-3 pb-safe z-40">
          <CtaButton />
        </div>
      </div>

      {/* ── Desktop / Tablet layout (md+) ─────────────── */}
      <div className="hidden md:block">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-surface rounded-3xl shadow-2xl overflow-hidden border border-border"
          >
            <div className="flex">
              {/* Left: image carousel */}
              <div className="flex-[5] min-w-0 bg-surface-2">
                <div className="flex flex-col h-full" style={{ minHeight: 520 }}>
                  <div className="relative flex-1 min-h-0" style={{ minHeight: 420 }}>
                    <ImageCarousel
                      images={imageUrls}
                      alt={name}
                      className="w-full h-full"
                      placeholderFrom={ph.from}
                      placeholderTo={ph.to}
                      placeholderEmoji={ph.emoji}
                      objectFit="contain"
                      showCounter={imageUrls.length > 1}
                      showThumbnails={imageUrls.length > 1}
                    />
                  </div>
                </div>
              </div>

              {/* Right: info panel */}
              <div className="flex-[4] flex flex-col min-w-0 border-s border-border">
                <div className="flex-1 overflow-y-auto scrollbar-hide p-8">
                  <InfoContent />
                </div>

                {/* CTA pinned to bottom of right panel */}
                <div className="p-6 border-t border-border flex-shrink-0 bg-surface">
                  <CtaButton />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
