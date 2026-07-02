"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { db } from "@/lib/instant/client";
import type { Profile } from "@/types";
import type { User } from "@instantdb/react";

interface UserMenuProps {
  profile: Profile | null;
  user?: User | null;
  loading?: boolean;
}

export default function UserMenu({ profile, user, loading }: UserMenuProps) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Show loading state only during initial auth check (no user yet)
  if (loading && !user && !profile) {
    return (
      <div className="header-icon-btn bg-surface-2 border border-border">
        <div className="w-4 h-4 border-2 border-ink-3/30 border-t-ink-3 rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in - show sign in link
  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="header-icon-btn bg-surface-2 border border-border text-ink-2 hover:text-ink hover:bg-surface hover:border-ink-3/30"
        aria-label={lang === "ar" ? "تسجيل الدخول" : "Sign in"}
      >
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </Link>
    );
  }

  // User is logged in (even if profile is still loading or doesn't exist)
  const displayName = profile?.full_name || user?.email?.split("@")[0] || (lang === "ar" ? "مستخدم" : "User");
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const isAdmin = profile?.role === "admin";
  const roleLabel = isAdmin 
    ? (lang === "ar" ? "مدير" : "Admin") 
    : (lang === "ar" ? "عميل" : "Customer");

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl bg-surface-2 border border-border p-1 pe-2.5 sm:pe-3 hover:bg-surface hover:border-ink-3/30 transition-all duration-200 active:scale-95"
        aria-label="User menu"
      >
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={displayName} className="w-8 h-8 rounded-lg object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center">
            {initials}
          </div>
        )}
        <span className="text-xs font-semibold text-ink max-w-[80px] truncate hidden sm:block">
          {displayName.split(" ")[0]}
        </span>
        <svg className={`w-3.5 h-3.5 text-ink-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute top-full mt-2 ${lang === "ar" ? "left-0" : "right-0"} w-56 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden z-50`}
          >
            <div className="px-4 py-3.5 border-b border-border bg-surface-2/30">
              <p className="text-sm font-bold text-ink truncate">{displayName}</p>
              <p className="text-xs text-ink-3 truncate mt-0.5">{roleLabel}</p>
            </div>

            <div className="py-1.5">
              {isAdmin ? (
                /* Admin menu - show Dashboard instead of My Orders */
                <Link href="/admin/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors">
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
                </Link>
              ) : (
                /* Customer menu - show My Account and My Orders */
                <>
                  <Link href="/account" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-surface-2 transition-colors">
                    <svg className="w-[18px] h-[18px] text-ink-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {lang === "ar" ? "حسابي" : "My Account"}
                  </Link>

                  <Link href="/orders" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-surface-2 transition-colors">
                    <svg className="w-[18px] h-[18px] text-ink-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {lang === "ar" ? "طلباتي" : "My Orders"}
                  </Link>
                </>
              )}
            </div>

            <div className="border-t border-border py-1.5">
              <button
                onClick={() => {
                  setOpen(false);
                  db.auth.signOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {lang === "ar" ? "تسجيل الخروج" : "Sign out"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
