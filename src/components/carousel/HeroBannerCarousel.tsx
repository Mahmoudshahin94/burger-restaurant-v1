"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Banner } from "@/types";

interface HeroBannerCarouselProps {
  banners: Banner[];
  interval?: number;
  lang: "en" | "ar";
  isRTL: boolean;
}

export default function HeroBannerCarousel({
  banners,
  interval = 5000,
  lang,
  isRTL,
}: HeroBannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Native touch/pointer swipe — avoids framer-motion drag gesture listeners
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const activeBanners = banners.filter((b) => b.active).sort((a, b) => (a.sort_order ?? a.order ?? 0) - (b.sort_order ?? b.order ?? 0));
  const total = activeBanners.length;

  const goTo = useCallback(
    (index: number, dir?: number) => {
      const resolvedDir = dir ?? (index > current ? 1 : -1);
      setDirection(isRTL ? -resolvedDir : resolvedDir);
      setCurrent(index);
    },
    [current, isRTL]
  );

  const next = useCallback(() => {
    goTo((current + 1) % total, 1);
  }, [current, total, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + total) % total, -1);
  }, [current, total, goTo]);

  useEffect(() => {
    if (total <= 1 || paused) return;
    timerRef.current = setTimeout(next, interval);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, total, interval, paused, next]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setPaused(true);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    setPaused(false);
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    // Only swipe if horizontal movement dominates
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) next();
    else prev();
  }, [next, prev]);

  if (total === 0) return null;

  const banner = activeBanners[current];
  const title = lang === "ar" ? banner.title_ar : banner.title_en;
  const subtitle = lang === "ar" ? banner.subtitle_ar : banner.subtitle_en;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "60%" : "-60%", opacity: 0, scale: 0.97 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-60%" : "60%", opacity: 0, scale: 0.97 }),
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl select-none min-h-[200px] sm:min-h-[280px] lg:min-h-[360px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={banner.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background image */}
          {banner.image ? (
            <div className="absolute inset-0">
              <Image
                src={banner.image}
                alt={title || "Banner"}
                fill
                className="object-cover"
                priority
                unoptimized={banner.image.startsWith("http")}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-red-700 to-red-900" />
          )}

          {/* Content */}
          <div
            className={`relative z-10 flex flex-col h-full px-5 sm:px-8 lg:px-10 pb-10 sm:pb-14 lg:pb-16 pt-6 sm:pt-8 lg:pt-10 justify-end ${
              isRTL ? "items-end text-right" : "items-start text-left"
            }`}
          >
            {title && (
              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12 }}
                className="text-white font-bold text-xl sm:text-2xl lg:text-3xl leading-tight drop-shadow-lg max-w-xs sm:max-w-sm lg:max-w-md"
              >
                {title}
              </motion.h2>
            )}
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.22 }}
                className="text-white/85 text-sm sm:text-base lg:text-lg mt-1.5 sm:mt-2 font-medium drop-shadow max-w-xs sm:max-w-sm lg:max-w-md"
              >
                {subtitle}
              </motion.p>
            )}
            {banner.link && (
              <motion.a
                href={banner.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.32 }}
                className="mt-4 sm:mt-5 inline-flex items-center gap-1.5 sm:gap-2 bg-white text-primary font-semibold text-sm sm:text-base px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-full hover:bg-white/90 transition-colors shadow-lg"
              >
                {lang === "ar" ? "اكتشف المزيد" : "Explore"}
                <span className={isRTL ? "rotate-180 inline-block" : ""}>→</span>
              </motion.a>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next arrows — only when multiple */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute top-1/2 -translate-y-1/2 start-2 sm:start-4 lg:start-5 z-20 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <svg className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${isRTL ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute top-1/2 -translate-y-1/2 end-2 sm:end-4 lg:end-5 z-20 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <svg className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${isRTL ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 lg:bottom-5 inset-x-0 z-20 flex justify-center gap-1.5 sm:gap-2">
          {activeBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? "w-5 sm:w-6 lg:w-7 h-1.5 sm:h-2 bg-white"
                  : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {total > 1 && !paused && (
        <motion.div
          key={`progress-${current}`}
          className="absolute bottom-0 start-0 h-0.5 sm:h-1 bg-white/60 z-20"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: interval / 1000, ease: "linear" }}
        />
      )}
    </div>
  );
}
