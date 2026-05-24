"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/hooks/useUser";
import SearchBar from "@/components/menu/SearchBar";
import LanguageToggle from "@/components/menu/LanguageToggle";
import CartIcon from "@/components/cart/CartIcon";
import UserMenu from "@/components/auth/UserMenu";

interface HeaderProps {
  brandLogoSrc: string;
  brandLogoAlt: string;
  shopName?: string | null;
  search: string;
  onSearchChange: (value: string) => void;
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
    <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
      <path
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36-6.36-.71.71M6.34 17.66l-.71.71M17.66 17.66l-.71-.71M6.34 6.34l-.71-.71M12 5a7 7 0 100 14A7 7 0 0012 5z"
        strokeWidth="2"
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export default function Header({
  brandLogoSrc,
  brandLogoAlt,
  shopName,
  search,
  onSearchChange,
}: HeaderProps) {
  const { lang, isRTL } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, profile, isAdmin, loading: userLoading } = useUser();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const brandLogoRemote =
    brandLogoSrc.startsWith("http://") || brandLogoSrc.startsWith("https://");

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const toggleMobileSearch = () => {
    setShowMobileSearch((v) => !v);
    if (showMobileSearch) onSearchChange("");
  };

  return (
    <header className="glass-header sticky top-0 z-50">
      <div
        className={`header-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 transition-all duration-300 ${
          isScrolled ? "py-2" : "py-3 sm:py-4"
        }`}
      >
        {/* Brand Section */}
        <div className="header-brand flex items-center gap-3 sm:gap-4 min-w-0 flex-shrink-0">
          <div
            className={`relative flex-shrink-0 transition-all duration-300 ${
              isScrolled ? "w-8 h-8 sm:w-9 sm:h-9" : "w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11"
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
          {shopName && (
            <span
              className={`hidden sm:block font-semibold text-ink truncate max-w-[140px] lg:max-w-[180px] tracking-tight transition-all duration-300 ${
                isScrolled ? "text-sm lg:text-base" : "text-base lg:text-lg"
              }`}
            >
              {shopName}
            </span>
          )}
        </div>

        {/* Desktop Search Bar */}
        <div className="header-search hidden sm:flex flex-1 max-w-md lg:max-w-lg mx-4 lg:mx-6">
          <div className="relative w-full group">
            <div
              className={`absolute inset-y-0 flex items-center pointer-events-none z-10 ${
                isRTL ? "right-4" : "left-4"
              }`}
            >
              <SearchIcon className="w-4 h-4 lg:w-[18px] lg:h-[18px] text-ink-3 group-focus-within:text-ink transition-colors duration-200" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={lang === "ar" ? "ابحث عن منتج..." : "Search products..."}
              dir={isRTL ? "rtl" : "ltr"}
              className={`w-full bg-surface border border-border rounded-full py-2.5 lg:py-3 text-sm text-ink placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-ink/5 focus:border-ink/20 transition-all duration-200 ${
                isRTL ? "pr-11 pl-4" : "pl-11 pr-4"
              }`}
            />
            {search && (
              <button
                onClick={() => onSearchChange("")}
                className={`absolute inset-y-0 flex items-center ${
                  isRTL ? "left-3" : "right-3"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-surface-2 flex items-center justify-center hover:bg-ink/10 transition-colors duration-200">
                  <svg
                    className="w-3 h-3 text-ink-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="header-actions flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Mobile Search Toggle */}
          <button
            onClick={toggleMobileSearch}
            className={`sm:hidden header-icon-btn transition-all duration-200 ${
              showMobileSearch
                ? "bg-ink text-white"
                : "bg-surface text-ink-2 hover:text-ink border border-border hover:border-ink/20"
            }`}
            aria-label="Search"
          >
            <SearchIcon />
          </button>

          {/* Divider - Mobile */}
          <div className="sm:hidden header-divider" />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="header-icon-btn bg-surface border border-border text-ink-2 hover:text-ink hover:border-ink/20 transition-all duration-200"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Language Toggle */}
          <LanguageToggle />

          {/* Divider */}
          <div className="header-divider" />

          {/* Cart Icon (hidden for admins) */}
          {!isAdmin && <CartIcon />}

          {/* User Menu */}
          <UserMenu profile={profile} user={user} loading={userLoading} />
        </div>
      </div>

      {/* Mobile Search Drawer */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="sm:hidden overflow-hidden border-t border-border/50"
          >
            <div className="max-w-7xl mx-auto px-4 py-3">
              <SearchBar value={search} onChange={onSearchChange} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
