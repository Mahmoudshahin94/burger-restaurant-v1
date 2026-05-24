"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  placeholderFrom?: string;
  placeholderTo?: string;
  placeholderEmoji?: string;
  showCounter?: boolean;
  objectFit?: "cover" | "contain";
  showThumbnails?: boolean;
  externalIndex?: number;
  onIndexChange?: (index: number) => void;
}

export default function ImageCarousel({
  images,
  alt,
  className = "",
  placeholderFrom = "#FFF3E8",
  placeholderTo = "#FFD9B0",
  placeholderEmoji = "☕",
  showCounter = true,
  objectFit = "cover",
  showThumbnails = false,
  externalIndex,
  onIndexChange,
}: ImageCarouselProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const controlled = externalIndex !== undefined;
  const current = controlled ? externalIndex : internalIndex;

  const total = images.filter((_, i) => !imgErrors.has(i)).length;

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return;
      const next = ((index % total) + total) % total;
      if (!controlled) setInternalIndex(next);
      onIndexChange?.(next);
    },
    [total, controlled, onIndexChange]
  );

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!showThumbnails || !thumbsRef.current) return;
    const btn = thumbsRef.current.children[current] as HTMLElement | undefined;
    btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [current, showThumbnails]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > dy && dx > 8) {
      isDragging.current = true;
      e.stopPropagation();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !isDragging.current) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      goTo(dx < 0 ? current + 1 : current - 1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isDragging.current = false;
  };

  if (total === 0) {
    return (
      <div
        className={`w-full flex items-center justify-center ${className}`}
        style={{ background: `linear-gradient(145deg, ${placeholderFrom}, ${placeholderTo})` }}
      >
        <span className="text-7xl opacity-40 select-none drop-shadow-sm">
          {placeholderEmoji}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Main image area */}
      <div className="relative overflow-hidden select-none flex-1 min-h-0">
        <div
          className="flex transition-transform duration-300 ease-out h-full"
          style={{ transform: `translateX(${current * -100}%)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {images.map((src, i) => (
            <div
              key={i}
              className="relative w-full flex-shrink-0 h-full overflow-hidden"
            >
              {imgErrors.has(i) ? (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `linear-gradient(145deg, ${placeholderFrom}, ${placeholderTo})` }}
                >
                  <span className="text-6xl opacity-40 select-none">{placeholderEmoji}</span>
                </div>
              ) : (
                <>
                  {objectFit === "contain" && (
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="100vw"
                      aria-hidden
                      className="object-cover scale-110 blur-xl brightness-50 saturate-150"
                      unoptimized={src.startsWith("http") || src.startsWith("data:")}
                    />
                  )}
                  <Image
                    src={src}
                    alt={`${alt} ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={objectFit === "contain" ? "object-contain relative z-10" : "object-cover"}
                    unoptimized={src.startsWith("http") || src.startsWith("data:")}
                    onError={() =>
                      setImgErrors((prev) => {
                        const next = new Set(prev);
                        next.add(i);
                        return next;
                      })
                    }
                    priority={i === 0}
                  />
                </>
              )}
            </div>
          ))}
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        {/* Arrow buttons */}
        {total > 1 && (
          <>
            <button
              onClick={() => goTo(current - 1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 active:scale-95 text-white flex items-center justify-center transition-all z-10 backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => goTo(current + 1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 active:scale-95 text-white flex items-center justify-center transition-all z-10 backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dot indicators */}
        {total > 1 && !showThumbnails && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Image ${i + 1}`}
                className={`rounded-full transition-all duration-200 ${
                  i === current
                    ? "w-5 h-2 bg-white"
                    : "w-2 h-2 bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        )}

        {/* Counter badge */}
        {total > 1 && showCounter && !showThumbnails && (
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10">
            {current + 1} / {total}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {showThumbnails && total > 1 && (
        <div
          ref={thumbsRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-1 pb-1"
        >
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                i === current
                  ? "border-primary shadow-md scale-105"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {imgErrors.has(i) ? (
                <div
                  className="w-full h-full flex items-center justify-center text-xl"
                  style={{ background: `linear-gradient(145deg, ${placeholderFrom}, ${placeholderTo})` }}
                >
                  {placeholderEmoji}
                </div>
              ) : (
                <Image
                  src={src}
                  alt={`${alt} thumbnail ${i + 1}`}
                  fill
                  sizes="56px"
                  className="object-cover"
                  unoptimized={src.startsWith("http") || src.startsWith("data:")}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
