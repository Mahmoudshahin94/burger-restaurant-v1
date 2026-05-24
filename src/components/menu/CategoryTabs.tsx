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
      className="flex gap-5 sm:gap-6 lg:gap-8 overflow-x-auto scrollbar-hide py-4 sm:py-5 px-4 sm:px-6 lg:px-8"
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
      className="flex flex-col items-center gap-2 sm:gap-2.5 flex-shrink-0 group"
    >
      {/* Circular Image/Icon Container */}
      <div 
        className={`
          relative w-14 h-14 sm:w-16 sm:h-16 lg:w-[72px] lg:h-[72px] rounded-full 
          transition-all duration-300 ease-out
          ${isActive 
            ? "ring-2 ring-primary ring-offset-2 ring-offset-bg scale-105" 
            : "ring-1 ring-border hover:ring-2 hover:ring-ink-3/30 hover:scale-105"
          }
        `}
      >
        {hasImage ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="72px"
            className="object-cover rounded-full"
            unoptimized={image.startsWith("http")}
          />
        ) : icon ? (
          <div className={`
            w-full h-full rounded-full flex items-center justify-center
            ${isActive ? "bg-primary" : "bg-surface-2"}
            transition-colors duration-300
          `}>
            <span className={`
              text-2xl sm:text-[28px] lg:text-[32px] leading-none
              transition-all duration-300
              ${isActive ? "scale-110 brightness-0 invert" : ""}
            `}>
              {icon}
            </span>
          </div>
        ) : (
          <div className="w-full h-full rounded-full bg-surface-2 flex items-center justify-center">
            <span className="text-ink-3 text-lg">📁</span>
          </div>
        )}
      </div>

      {/* Name */}
      <span className={`
        text-center text-[11px] sm:text-xs lg:text-[13px] font-medium leading-tight
        transition-colors duration-300 max-w-[70px] sm:max-w-[80px] line-clamp-2
        ${isActive ? "text-primary font-semibold" : "text-ink-2 group-hover:text-ink"}
      `}>
        {name}
      </span>
    </button>
  );
});
