"use client";

import { useLanguage } from "@/context/LanguageContext";

function GlobeIcon() {
  return (
    <svg
      className="w-[18px] h-[18px]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
}

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  const toggleLanguage = () => {
    setLang(lang === "ar" ? "en" : "ar");
  };

  return (
    <button
      onClick={toggleLanguage}
      className="header-icon-btn bg-surface-2 border border-border text-ink-2 hover:text-ink hover:bg-surface hover:border-ink-3/30 gap-1 px-2.5"
      aria-label={lang === "ar" ? "Switch to English" : "التبديل للعربية"}
    >
      <GlobeIcon />
      <span className="text-xs font-semibold uppercase">
        {lang === "ar" ? "ع" : "En"}
      </span>
    </button>
  );
}
