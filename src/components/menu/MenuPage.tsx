"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/db";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import CategoryTabs from "./CategoryTabs";
import SearchBar from "./SearchBar";
import MenuItemCard from "./MenuItemCard";
import LanguageToggle from "./LanguageToggle";
import HeroBannerCarousel from "@/components/carousel/HeroBannerCarousel";
import type { Category, MenuItem, Banner, ItemImage } from "@/types";

/* ── Arabic search normalization ────────────────────────
   Strips diacritics, normalizes alef variants, ta-marbuta,
   final-ya, tatweel, and invisible Unicode direction marks
   so Arabic search is tolerant of typing variations.
*/
function normalizeSearch(text: string): string {
  return (text ?? "")
    .replace(/[\u064B-\u065F\u0670]/g, "")   // strip harakat / diacritics
    .replace(/[أإآٱ]/g, "ا")                  // unify alef variants
    .replace(/ة/g, "ه")                        // ta-marbuta → ha
    .replace(/ى/g, "ي")                        // alef maqsura → ya
    .replace(/ـ/g, "")                         // remove tatweel / kashida
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, "") // strip invisible marks
    .toLowerCase()
    .trim();
}

/* ── Skeleton card ───────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-surface rounded-3xl overflow-hidden border border-border shadow-card">
      <div className="skeleton h-44 w-full" />
      <div className="p-4 space-y-2.5">
        <div className="skeleton h-4 w-3/4 rounded-lg" />
        <div className="skeleton h-3 w-1/2 rounded-lg" />
        <div className="skeleton h-7 w-2/5 rounded-xl mt-3" />
      </div>
    </div>
  );
}

function SkeletonCategoryCard() {
  return <div className="skeleton flex-shrink-0 w-[88px] h-[110px] rounded-[20px]" />;
}

/* ── Icons ───────────────────────────────────────────── */
function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36-6.36-.71.71M6.34 17.66l-.71.71M17.66 17.66l-.71-.71M6.34 6.34l-.71-.71M12 5a7 7 0 100 14A7 7 0 0012 5z"
        strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

const WHATSAPP_ORDER_HREF = "https://wa.me/972524171936";

const DEFAULT_BRAND_LOGO = "/logo.png";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.123 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function MenuPage() {
  const { t, lang, isRTL } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const { data, isLoading, error } = db.useQuery({
    categories: {},
    items: {},
    settings: {},
    banners: {},
    item_images: {},
  });

  /* Scroll listener – shrink header */
  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const shopName = useMemo(() => {
    if (!data?.settings) return null;
    const s = data.settings.find((s: { key: string; value: string }) => s.key === "shop_name");
    return s?.value || null;
  }, [data?.settings]);

  const brandLogoSrc = useMemo(() => {
    if (!data?.settings) return DEFAULT_BRAND_LOGO;
    const s = data.settings.find((x: { key: string; value: string }) => x.key === "logo");
    const v = s?.value?.trim();
    return v || DEFAULT_BRAND_LOGO;
  }, [data?.settings]);

  const brandLogoAlt = shopName || t("site_name");
  const brandLogoRemote =
    brandLogoSrc.startsWith("http://") || brandLogoSrc.startsWith("https://");

  const banners: Banner[] = useMemo(() => {
    if (!data?.banners) return [];
    return data.banners as Banner[];
  }, [data?.banners]);

  const carouselInterval = useMemo(() => {
    if (!data?.settings) return 5000;
    const s = data.settings.find((x: { key: string; value: string }) => x.key === "carousel_interval");
    const ms = s ? parseInt(s.value, 10) : NaN;
    return isNaN(ms) ? 5000 : ms;
  }, [data?.settings]);

  const hasActiveBanners = banners.some((b) => b.active);

  const categories: Category[] = useMemo(() => {
    if (!data?.categories) return [];
    return (data.categories as Category[]).filter((c) => c.active).sort((a, b) => a.order - b.order);
  }, [data?.categories]);

  const allItems: MenuItem[] = useMemo(() => {
    if (!data?.items) return [];
    return data.items as MenuItem[];
  }, [data?.items]);

  const allItemImages: ItemImage[] = useMemo(() => {
    if (!data?.item_images) return [];
    return data.item_images as ItemImage[];
  }, [data?.item_images]);

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (activeCategory) {
      items = items.filter((item) => item.category_id === activeCategory);
    }
    if (search.trim()) {
      const q = normalizeSearch(search);
      items = items.filter(
        (item) =>
          normalizeSearch(item.name_en ?? "").includes(q) ||
          normalizeSearch(item.name_ar ?? "").includes(q) ||
          normalizeSearch(item.description_en ?? "").includes(q) ||
          normalizeSearch(item.description_ar ?? "").includes(q)
      );
    }
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [allItems, activeCategory, search]);

  const groupedByCategory = useMemo(() => {
    if (activeCategory || search.trim()) return null;
    const groups: Array<{ category: Category; items: MenuItem[] }> = [];
    for (const cat of categories) {
      const catItems = allItems
        .filter((item) => item.category_id === cat.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      if (catItems.length > 0) groups.push({ category: cat, items: catItems });
    }
    return groups;
  }, [categories, allItems, activeCategory, search]);

  useEffect(() => {
    if (activeCategory) {
      setShowSearch(false);
      setSearch("");
    }
  }, [activeCategory]);

  /* ── Loading ─────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg" dir={isRTL ? "rtl" : "ltr"}>
        {/* Skeleton Header */}
        <div className="glass-header sticky top-0 z-50 h-16 flex items-center px-4">
          <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="skeleton w-9 h-9 rounded-full" />
              <div className="skeleton w-24 h-4 rounded-lg" />
            </div>
            <div className="flex gap-2">
              <div className="skeleton w-8 h-8 rounded-full" />
              <div className="skeleton w-8 h-8 rounded-full" />
              <div className="skeleton w-20 h-8 rounded-full" />
            </div>
          </div>
        </div>
        {/* Skeleton hero */}
        <div className="hero-section flex flex-col items-center py-10">
          <div className="skeleton w-44 h-44 rounded-full" />
          <div className="skeleton w-48 h-4 rounded-lg mt-4" />
          <div className="skeleton w-32 h-3 rounded-lg mt-2" />
        </div>
        {/* Skeleton categories */}
        <div className="flex gap-3 px-4 py-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonCategoryCard key={i} />)}
        </div>
        {/* Skeleton grid */}
        <div className="max-w-2xl mx-auto px-4 py-6 grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────── */
  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="text-center bg-surface rounded-3xl p-8 shadow-card max-w-sm w-full border border-border">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-primary font-semibold text-lg mb-1">{t("error")}</p>
          <p className="text-ink-3 text-xs font-mono break-all">{String(error)}</p>
        </div>
      </div>
    );
  }

  /* ── Main render ─────────────────────────────────── */
  return (
    <div className="min-h-screen bg-bg" dir={isRTL ? "rtl" : "ltr"}>

      {/* ─── STICKY HEADER ──────────────────────────── */}
      <header className="glass-header sticky top-0 z-50">
        <div
          className={`max-w-2xl mx-auto px-4 flex items-center justify-between gap-3 transition-all duration-300 ease-in-out ${
            isScrolled ? "py-2" : "py-3"
          }`}
        >
          {/* Compact brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`relative flex-shrink-0 transition-all duration-300 ease-in-out ${
                isScrolled ? "w-8 h-8" : "w-10 h-10"
              }`}
            >
              <Image
                src={brandLogoSrc}
                alt={brandLogoAlt}
                fill
                className="object-contain"
                priority
                unoptimized={brandLogoRemote}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => {
                setShowSearch((v) => !v);
                if (showSearch) setSearch("");
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                showSearch
                  ? "bg-primary text-white shadow-md"
                  : "bg-surface-2 text-ink-2 hover:text-ink border border-border"
              }`}
              aria-label="Search"
            >
              <SearchIcon />
            </button>

            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-surface-2 border border-border text-ink-2 hover:text-ink flex items-center justify-center transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            <LanguageToggle />
          </div>
        </div>

        {/* Expandable search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="max-w-2xl mx-auto px-4 pb-3">
                <SearchBar value={search} onChange={setSearch} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── HERO SECTION ────────────────────────────── */}
      {hasActiveBanners ? (
        <section className="px-4 pt-4 pb-2 max-w-2xl mx-auto">
          <HeroBannerCarousel
            banners={banners}
            interval={carouselInterval}
            lang={lang}
            isRTL={isRTL}
          />
        </section>
      ) : (
        <section className="hero-section">
          {/* Decorative ambient glows */}
          <div
            className="hero-glow w-64 h-64 -top-16 -start-16"
            style={{ background: "radial-gradient(circle, rgba(204,80,30,0.18) 0%, transparent 70%)", position: "absolute" }}
          />
          <div
            className="hero-glow w-48 h-48 -bottom-8 -end-8"
            style={{ background: "radial-gradient(circle, rgba(204,0,0,0.12) 0%, transparent 70%)", position: "absolute" }}
          />

          <div className="relative z-10 flex flex-col items-center text-center px-4">
            {/* Logo orb */}
            <div className="hero-logo-wrap">
              <div className="relative w-44 h-44">
                <Image
                  src={brandLogoSrc}
                  alt={brandLogoAlt}
                  fill
                  className="object-contain drop-shadow-lg"
                  priority
                  sizes="176px"
                  unoptimized={brandLogoRemote}
                />
              </div>
            </div>

            {/* WhatsApp — order */}
            <motion.a
              href={WHATSAPP_ORDER_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex flex-col items-center gap-1 rounded-2xl px-4 py-2.5 text-center transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
            >
              <span className="inline-flex items-center gap-2 text-[#25D366]">
                <WhatsAppIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-semibold text-ink">{t("order_whatsapp")}</span>
              </span>
              <span className="text-xs font-medium text-ink-2 tabular-nums" dir="ltr">
                +972 52-417-1936
              </span>
            </motion.a>

            {/* Shop name */}
            <motion.h1
              className="mt-4 text-2xl font-bold text-ink tracking-tight tagline-fade"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {shopName || t("site_name")}
            </motion.h1>

            {/* Tagline */}
            <motion.p
              className="mt-1.5 text-ink-2 text-sm font-medium tagline-fade"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              {t("tagline")}
            </motion.p>

            {/* Decorative divider */}
            <motion.div
              className="mt-5 flex items-center gap-3"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <span className="h-px w-16 bg-gradient-to-r from-transparent via-border to-transparent" />
              <span className="text-ink-3 text-xs">✦</span>
              <span className="h-px w-16 bg-gradient-to-l from-transparent via-border to-transparent" />
            </motion.div>
          </div>
        </section>
      )}

      {/* ─── STICKY CATEGORY CARDS ───────────────────── */}
      <div
        className="sticky z-40 bg-bg/90 backdrop-blur-md border-b border-border/60"
        style={{ top: "var(--header-height)" }}
      >
        <div className="max-w-2xl mx-auto">
          <CategoryTabs
            categories={categories}
            activeId={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>
      </div>

      {/* ─── MAIN CONTENT ────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-20">
        <AnimatePresence mode="wait">

          {/* Filtered / single-category view */}
          {(search.trim() || activeCategory) && (
            <motion.div
              key={`filtered-${activeCategory}-${search}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {/* Category heading */}
              {activeCategory && !search && (() => {
                const cat = categories.find((c) => c.id === activeCategory);
                if (!cat) return null;
                return (
                  <div className="flex items-center gap-3 mb-6">
                    {cat.icon && (
                      <span className="text-4xl drop-shadow-sm">{cat.icon}</span>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-ink leading-tight">
                        {lang === "ar" ? cat.name_ar : cat.name_en}
                      </h2>
                      <p className="text-ink-3 text-xs mt-0.5">
                        {filteredItems.length}{" "}
                        {lang === "ar" ? "منتج" : "items"}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {filteredItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-24"
                >
                  <div className="text-7xl mb-5 opacity-30">☕</div>
                  <p className="text-ink-2 font-semibold text-lg">{t("no_items")}</p>
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="mt-4 px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                    >
                      {lang === "ar" ? "مسح البحث" : "Clear search"}
                    </button>
                  )}
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                  {filteredItems.map((item, i) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      index={i}
                      category={categories.find((c) => c.id === item.category_id)}
                      itemImages={allItemImages.filter((img) => img.item_id === item.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* All-categories grouped view */}
          {!search.trim() && !activeCategory && groupedByCategory && (
            <motion.div
              key="grouped"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-10"
            >
              {groupedByCategory.length === 0 ? (
                <div className="text-center py-24">
                  <div className="text-7xl mb-5 opacity-25">☕</div>
                  <p className="text-ink-2 font-semibold">{t("no_items")}</p>
                  <p className="text-ink-3 text-sm mt-1.5">
                    {lang === "ar"
                      ? "أضف عناصر من لوحة الإدارة"
                      : "Add items from the admin panel"}
                  </p>
                </div>
              ) : (
                groupedByCategory.map(({ category, items: catItems }, groupIdx) => (
                  <section
                    key={category.id}
                    ref={(el) => {
                      if (el) sectionRefs.current.set(category.id, el);
                    }}
                    className="section-reveal"
                    style={{ animationDelay: `${groupIdx * 60}ms` }}
                  >
                    {/* Category header row */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        {category.icon && (
                          <span className="text-2xl drop-shadow-sm">{category.icon}</span>
                        )}
                        <div>
                          <h2 className="text-lg font-bold text-ink leading-tight">
                            {lang === "ar" ? category.name_ar : category.name_en}
                          </h2>
                          <p className="text-ink-3 text-[11px]">
                            {catItems.length}{" "}
                            {lang === "ar" ? "منتج" : "items"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveCategory(category.id)}
                        className="flex items-center gap-1 text-primary text-xs font-semibold hover:opacity-70 transition-opacity flex-shrink-0 bg-surface-2 px-3 py-1.5 rounded-full"
                      >
                        {lang === "ar" ? "عرض الكل" : "See all"}
                        <span className={isRTL ? "rotate-180" : ""}>→</span>
                      </button>
                    </div>

                    {/* Items grid */}
                    <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                      {catItems.slice(0, 4).map((item, i) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          index={i}
                          category={category}
                          itemImages={allItemImages.filter((img) => img.item_id === item.id)}
                        />
                      ))}
                    </div>

                    {catItems.length > 4 && (
                      <button
                        onClick={() => setActiveCategory(category.id)}
                        className="mt-3.5 w-full py-3.5 rounded-2xl border border-border text-ink-2 text-sm font-semibold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200"
                      >
                        {lang === "ar"
                          ? `عرض ${catItems.length - 4} منتج إضافي`
                          : `Show ${catItems.length - 4} more items`}
                      </button>
                    )}
                  </section>
                ))
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ─── FOOTER ──────────────────────────────────── */}
      <footer className="border-t border-border py-8 text-center bg-surface-2/40">
        <div className="flex items-center justify-center gap-2 text-ink-3 text-xs">
          <span className="font-extrabold text-primary text-sm">{t("site_name")}</span>
          <span className="text-border">·</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <p className="text-ink-3 text-[11px] mt-1">{t("tagline")}</p>
      </footer>
    </div>
  );
}
