"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

export default function SearchBar({ value, onChange, autoFocus = true }: SearchBarProps) {
  const { t, isRTL } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [autoFocus]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="relative"
    >
      {/* Search icon */}
      <div
        className={`absolute inset-y-0 flex items-center pointer-events-none z-10 ${
          isRTL ? "right-4" : "left-4"
        }`}
      >
        <svg
          className="w-[18px] h-[18px] text-ink-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("search_placeholder")}
        dir={isRTL ? "rtl" : "ltr"}
        className={`w-full bg-surface border border-border rounded-2xl py-3.5 text-base text-ink placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all shadow-sm ${
          isRTL ? "pr-12 pl-11" : "pl-12 pr-11"
        }`}
      />

      {/* Clear button */}
      {value && (
        <motion.button
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className={`absolute inset-y-0 flex items-center ${isRTL ? "left-3.5" : "right-3.5"}`}
        >
          <span className="w-6 h-6 rounded-full bg-ink-3/20 flex items-center justify-center hover:bg-ink-3/40 active:scale-95 transition-all">
            <svg
              className="w-3.5 h-3.5 text-ink-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </span>
        </motion.button>
      )}
    </motion.div>
  );
}
