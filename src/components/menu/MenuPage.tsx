"use client";

import { useState, useMemo, useRef, useEffect, Component, ReactNode } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { createPublicClient } from "@/lib/supabase/client";

/* ── Lightweight error boundary so banner/animation crashes don't kill the page ── */
class SectionErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
import { useLanguage } from "@/context/LanguageContext";
import CategoryTabs from "./CategoryTabs";
import MenuItemCard from "./MenuItemCard";
import HeroBannerCarousel from "@/components/carousel/HeroBannerCarousel";
import Header from "@/components/layout/Header";
import type { Category, MenuItem, Banner, ItemImage } from "@/types";

function normalizeSearch(text: string): string {
  return (text ?? "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "")
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, "")
    .toLowerCase()
    .trim();
}

function SkeletonCard() {
  return (
    <div className="flex flex-col items-center">
      <div className="skeleton w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full mb-3 sm:mb-4" />
      <div className="w-full px-2 space-y-2 flex flex-col items-center">
        <div className="skeleton h-4 w-3/4 rounded-full" />
        <div className="skeleton h-3 w-1/2 rounded-full" />
        <div className="skeleton h-5 w-2/5 mt-1 rounded-full" />
      </div>
    </div>
  );
}

function SkeletonCategoryCard() {
  return (
    <div className="flex flex-col items-center gap-2.5 flex-shrink-0">
      <div className="skeleton w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full" />
      <div className="skeleton h-3 w-14 sm:w-16 lg:w-20 rounded-full" />
    </div>
  );
}

const DEFAULT_BRAND_LOGO = "/logo.svg";

export default function MenuPage() {
  const { t, lang, isRTL } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const [categories, setCategories] = useState<Category[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [allItemImages, setAllItemImages] = useState<ItemImage[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<Array<{ key: string; value: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createPublicClient(), []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, itemsRes, imagesRes, bannersRes, settingsRes] = await Promise.all([
          supabase.from("categories").select("*").order("sort_order"),
          supabase.from("products").select("*").order("sort_order"),
          supabase.from("product_images").select("*").order("sort_order"),
          supabase.from("banners").select("*").order("sort_order"),
          supabase.from("settings").select("*"),
        ]);

        if (catRes.error) throw catRes.error;
        if (itemsRes.error) throw itemsRes.error;

        setCategories((catRes.data ?? []) as Category[]);
        setAllItems(
          (itemsRes.data ?? []).map((p) => ({
            ...p,
            order: p.sort_order,
            category_id: p.category_id,
          })) as MenuItem[]
        );
        setAllItemImages(
          (imagesRes.data ?? []).map((img) => ({
            id: img.id,
            product_id: img.product_id,
            item_id: img.product_id ?? undefined,
            image: img.image_url,
            image_url: img.image_url,
            is_primary: img.is_primary,
            sort_order: img.sort_order,
            order: img.sort_order,
          })) as ItemImage[]
        );
        setBanners((bannersRes.data ?? []) as Banner[]);
        setSettings(settingsRes.data ?? []);
      } catch (err) {
        setError(String(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shopName = useMemo(() => {
    const s = settings.find((s) => s.key === "shop_name");
    return s?.value || null;
  }, [settings]);

  const brandLogoSrc = useMemo(() => {
    const s = settings.find((x) => x.key === "logo");
    const v = s?.value?.trim();
    return v || DEFAULT_BRAND_LOGO;
  }, [settings]);

  const brandLogoAlt = shopName || t("site_name");
  const brandLogoRemote =
    brandLogoSrc.startsWith("http://") || brandLogoSrc.startsWith("https://");

  const carouselInterval = useMemo(() => {
    const s = settings.find((x) => x.key === "carousel_interval");
    const ms = s ? parseInt(s.value ?? "", 10) : NaN;
    return isNaN(ms) ? 5000 : ms;
  }, [settings]);

  const hasActiveBanners = banners.some((b) => b.active);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.active).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [categories]
  );

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
    return items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [allItems, activeCategory, search]);

  const groupedByCategory = useMemo(() => {
    if (activeCategory || search.trim()) return null;
    const groups: Array<{ category: Category; items: MenuItem[] }> = [];
    for (const cat of activeCategories) {
      const catItems = allItems
        .filter((item) => item.category_id === cat.id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      if (catItems.length > 0) groups.push({ category: cat, items: catItems });
    }
    return groups;
  }, [activeCategories, allItems, activeCategory, search]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg" dir={isRTL ? "rtl" : "ltr"}>
        <div className="glass-header sticky top-0 z-50 h-16 flex items-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="skeleton w-9 h-9 sm:w-10 sm:h-10 rounded-full" />
            <div className="flex gap-2">
              <div className="skeleton w-8 h-8 rounded-full" />
              <div className="skeleton w-8 h-8 rounded-full" />
              <div className="skeleton w-20 h-8 rounded-full" />
            </div>
          </div>
        </div>
        <div className="hero-section flex flex-col items-center py-10 sm:py-12 lg:py-16">
          <div className="skeleton w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-full" />
        </div>
        <div className="flex gap-4 sm:gap-5 lg:gap-6 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 overflow-hidden max-w-7xl mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <SkeletonCategoryCard key={i} />)}
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8 lg:gap-10">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-bg" dir={isRTL ? "rtl" : "ltr"}>

      {/* ─── STICKY HEADER ──────────────────────────── */}
      <Header
        brandLogoSrc={brandLogoSrc}
        brandLogoAlt={brandLogoAlt}
        shopName={shopName}
        search={search}
        onSearchChange={setSearch}
      />

      {/* ─── HERO SECTION ────────────────────────────── */}
      {hasActiveBanners ? (
        <section className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4 max-w-7xl mx-auto">
          <SectionErrorBoundary>
            <HeroBannerCarousel
              banners={banners}
              interval={carouselInterval}
              lang={lang}
              isRTL={isRTL}
            />
          </SectionErrorBoundary>
        </section>
      ) : (
        <section className="mesh-gradient hero-section">
          <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6">
            {/* Logo with luxury shadow */}
            <motion.div 
              className="hero-logo-wrap"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32">
                <Image
                  src={brandLogoSrc}
                  alt={brandLogoAlt}
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px"
                  unoptimized={brandLogoRemote}
                />
              </div>
            </motion.div>

            {/* Shop name with refined typography */}
            <motion.h1
              className="mt-6 sm:mt-8 lg:mt-10 text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink tracking-tight"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {shopName || t("site_name")}
            </motion.h1>

            {/* Tagline */}
            <motion.p
              className="mt-2 sm:mt-3 text-ink-2 text-sm sm:text-base lg:text-lg max-w-md"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              {t("tagline")}
            </motion.p>

            {/* Decorative divider */}
            <motion.div
              className="mt-6 sm:mt-8 flex items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <span className="h-px w-12 sm:w-16 lg:w-20 bg-gradient-to-r from-transparent to-border" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span className="h-px w-12 sm:w-16 lg:w-20 bg-gradient-to-l from-transparent to-border" />
            </motion.div>
          </div>
        </section>
      )}

      {/* ─── STICKY CATEGORY CARDS ───────────────────── */}
      <div
        className="sticky z-40 bg-bg/95 backdrop-blur-xl border-b border-border"
        style={{ top: "var(--header-height)" }}
      >
        <div className="max-w-7xl mx-auto">
          <SectionErrorBoundary>
            <CategoryTabs
              categories={activeCategories}
              activeId={activeCategory}
              onSelect={setActiveCategory}
            />
          </SectionErrorBoundary>
        </div>
      </div>

      {/* ─── MAIN CONTENT ────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 pb-20">
        <AnimatePresence mode="wait">

          {(search.trim() || activeCategory) && (
            <motion.div
              key={`filtered-${activeCategory}-${search}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {activeCategory && !search && (() => {
                const cat = activeCategories.find((c) => c.id === activeCategory);
                if (!cat) return null;
                return (
                  <div className="flex items-center gap-4 sm:gap-5 mb-8 sm:mb-10">
                    {/* Category Image or Icon */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
                      {cat.image ? (
                        <Image
                          src={cat.image}
                          alt={lang === "ar" ? cat.name_ar : cat.name_en}
                          fill
                          sizes="96px"
                          className="object-cover"
                          unoptimized={cat.image.startsWith("http")}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-surface-2 flex items-center justify-center">
                          <span className="text-3xl sm:text-4xl lg:text-5xl">
                            {cat.icon || "🍽️"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink leading-tight tracking-tight">
                        {lang === "ar" ? cat.name_ar : cat.name_en}
                      </h2>
                      <p className="text-ink-3 text-sm sm:text-base mt-1.5 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary/60"></span>
                        {filteredItems.length} {lang === "ar" ? "منتج" : "items"}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {filteredItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-24 sm:py-32"
                >
                  <div className="text-7xl sm:text-8xl mb-5 opacity-30">🍔</div>
                  <p className="text-ink-2 font-semibold text-lg sm:text-xl">{t("no_items")}</p>
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="mt-4 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm sm:text-base font-semibold hover:bg-primary/20 transition-colors"
                    >
                      {lang === "ar" ? "مسح البحث" : "Clear search"}
                    </button>
                  )}
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8 lg:gap-10">
                  {filteredItems.map((item, i) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      index={i}
                      category={activeCategories.find((c) => c.id === item.category_id)}
                      itemImages={allItemImages.filter((img) => img.item_id === item.id || img.product_id === item.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {!search.trim() && !activeCategory && groupedByCategory && (
            <motion.div
              key="grouped"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-10 sm:space-y-12 lg:space-y-16"
            >
              {groupedByCategory.length === 0 ? (
                <div className="text-center py-24 sm:py-32">
                  <div className="text-7xl sm:text-8xl mb-5 opacity-25">🍔</div>
                  <p className="text-ink-2 font-semibold text-lg sm:text-xl">{t("no_items")}</p>
                  <p className="text-ink-3 text-sm sm:text-base mt-1.5">
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
                    style={{ animationDelay: `${groupIdx * 80}ms` }}
                  >
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                      <div className="flex items-center gap-4 sm:gap-5">
                        {/* Category Image or Icon */}
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                          {category.image ? (
                            <Image
                              src={category.image}
                              alt={lang === "ar" ? category.name_ar : category.name_en}
                              fill
                              sizes="80px"
                              className="object-cover"
                              unoptimized={category.image.startsWith("http")}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-surface-2 flex items-center justify-center">
                              <span className="text-2xl sm:text-3xl lg:text-4xl">
                                {category.icon || "🍽️"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-ink leading-tight tracking-tight">
                            {lang === "ar" ? category.name_ar : category.name_en}
                          </h2>
                          <p className="text-ink-3 text-xs sm:text-sm mt-1 flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                            {catItems.length} {lang === "ar" ? "منتج" : "items"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveCategory(category.id)}
                        className="btn-luxury flex items-center gap-2 text-primary text-xs sm:text-sm font-semibold flex-shrink-0 bg-primary/5 hover:bg-primary/10 border border-primary/20 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full transition-all"
                      >
                        {lang === "ar" ? "عرض الكل" : "View all"}
                        <svg className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8 lg:gap-10">
                      {catItems.slice(0, 5).map((item, i) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          index={i}
                          category={category}
                          itemImages={allItemImages.filter((img) => img.item_id === item.id || img.product_id === item.id)}
                        />
                      ))}
                    </div>

                    {catItems.length > 5 && (
                      <button
                        onClick={() => setActiveCategory(category.id)}
                        className="btn-luxury mt-6 sm:mt-8 w-full py-4 sm:py-5 rounded-2xl bg-surface border border-border text-ink text-sm sm:text-base font-medium hover:border-ink-3 transition-all duration-300"
                      >
                        {lang === "ar"
                          ? `عرض ${catItems.length - 5} منتج إضافي`
                          : `Show ${catItems.length - 5} more items`}
                      </button>
                    )}
                  </section>
                ))
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="border-t border-border py-10 sm:py-12 lg:py-16 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-ink font-semibold text-base sm:text-lg tracking-tight">{t("site_name")}</p>
          <p className="text-ink-3 text-sm mt-2">{t("tagline")}</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-ink-3 text-xs">
            <span>© {new Date().getFullYear()}</span>
            <span>·</span>
            <span>All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
