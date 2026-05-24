"use client";

import { useEffect, useRef, forwardRef } from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import type { Category } from "@/types";

interface CategoryTabsProps {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

export default function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
  const { lang } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const sorted = [...categories].filter((c) => c.active).sort((a, b) => (a.sort_order ?? a.order ?? 0) - (b.sort_order ?? b.order ?? 0));

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const el = activeRef.current;
      const container = scrollRef.current;
      const elLeft = el.offsetLeft;
      const elRight = elLeft + el.offsetWidth;
      const visibleLeft = container.scrollLeft;
      const visibleRight = visibleLeft + container.offsetWidth;
      if (elLeft < visibleLeft + 16) {
        container.scrollTo({ left: elLeft - 16, behavior: "smooth" });
      } else if (elRight > visibleRight - 16) {
        container.scrollTo({ left: elRight - container.offsetWidth + 16, behavior: "smooth" });
      }
    }
  }, [activeId]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-4 sm:gap-5 lg:gap-6 overflow-x-auto scrollbar-hide py-5 sm:py-6 px-4 sm:px-6 lg:px-8"
    >
      {/* "All" card */}
      <CategoryCard
        isActive={activeId === null}
        onClick={() => onSelect(null)}
        icon="✦"
        name={lang === "ar" ? "الكل" : "All"}
      />

      {sorted.map((cat) => {
        const name = lang === "ar"
          ? (cat.name_ar || cat.name_en)
          : (cat.name_en || cat.name_ar);

        return (
          <CategoryCard
            key={cat.id}
            ref={activeId === cat.id ? activeRef : undefined}
            isActive={activeId === cat.id}
            onClick={() => onSelect(cat.id)}
            icon={cat.icon ?? undefined}
            image={cat.image ?? undefined}
            name={name || ""}
          />
        );
      })}
    </div>
  );
}

interface CardProps {
  isActive: boolean;
  onClick: () => void;
  icon?: string;
  image?: string;
  name: string;
  ref?: React.Ref<HTMLButtonElement>;
}

const CategoryCard = forwardRef<HTMLButtonElement, CardProps>(function CategoryCard(
  { isActive, onClick, icon, image, name },
  ref
) {
  const hasImage = !!image;

  return (
    <button
      ref={ref}
      onClick={onClick}
      aria-pressed={isActive}
      className="flex flex-col items-center gap-2.5 sm:gap-3 flex-shrink-0 group"
    >
      {/* Circular Image/Icon Container - Larger sizes */}
      <div 
        className={`
          category-circle relative overflow-hidden
          w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 
          rounded-full 
          transition-all duration-300 ease-out
          ${isActive 
            ? "ring-[3px] ring-primary ring-offset-[3px] ring-offset-bg scale-105 shadow-lg" 
            : "ring-2 ring-border/50 hover:ring-primary/40 hover:scale-105 hover:shadow-md"
          }
        `}
      >
        {hasImage ? (
          <>
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 640px) 64px, (max-width: 1024px) 80px, 96px"
              className="object-cover rounded-full transition-transform duration-500 group-hover:scale-110"
              unoptimized={image.startsWith("http")}
            />
            {/* Dark gradient overlay for better contrast */}
            <div className={`
              absolute inset-0 rounded-full transition-opacity duration-300
              ${isActive 
                ? "bg-gradient-to-t from-primary/30 via-transparent to-transparent" 
                : "bg-gradient-to-t from-black/25 via-transparent to-transparent group-hover:from-black/35"
              }
            `} />
          </>
        ) : icon ? (
          <div className={`
            w-full h-full rounded-full flex items-center justify-center
            transition-all duration-300
            ${isActive 
              ? "bg-primary shadow-inner" 
              : "bg-surface-2 group-hover:bg-surface-3"
            }
          `}>
            <span className={`
              text-2xl sm:text-3xl lg:text-4xl leading-none
              transition-all duration-300
              ${isActive ? "scale-110 brightness-0 invert" : "group-hover:scale-110"}
            `}>
              {icon}
            </span>
          </div>
        ) : (
          <div className="w-full h-full rounded-full bg-surface-2 flex items-center justify-center group-hover:bg-surface-3 transition-colors duration-300">
            <span className="text-ink-3 text-xl sm:text-2xl lg:text-3xl">📁</span>
          </div>
        )}
      </div>

      {/* Name - Slightly larger text */}
      <span className={`
        text-center text-xs sm:text-[13px] lg:text-sm font-medium leading-tight
        transition-colors duration-300 max-w-[72px] sm:max-w-[88px] lg:max-w-[100px] line-clamp-2
        ${isActive ? "text-primary font-semibold" : "text-ink-2 group-hover:text-ink"}
      `}>
        {name}
      </span>
    </button>
  );
});
