"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Language, LanguageContextType } from "@/types";
import en from "@/locales/en.json";
import ar from "@/locales/ar.json";

const translations: Record<Language, Record<string, string>> = { en, ar };

const LanguageContext = createContext<LanguageContextType>({
  lang: "ar",
  setLang: () => {},
  t: (key) => key,
  isRTL: true,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("ar");

  useEffect(() => {
    const stored = localStorage.getItem("menu-lang") as Language | null;
    if (stored === "en" || stored === "ar") {
      setLangState(stored);
    }
  }, []);

  useEffect(() => {
    const isRTL = lang === "ar";
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("menu-lang", newLang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[lang][key] ?? translations["en"][key] ?? key;
    },
    [lang]
  );

  const isRTL = lang === "ar";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
