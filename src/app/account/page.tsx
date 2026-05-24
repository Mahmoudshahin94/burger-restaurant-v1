"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/hooks/useUser";

const menuItems = [
  { href: "/account/profile", icon: "👤", label_en: "My Profile", label_ar: "ملف التعريف", desc_en: "Update name, phone", desc_ar: "تحديث الاسم والهاتف" },
  { href: "/orders", icon: "📦", label_en: "My Orders", label_ar: "طلباتي", desc_en: "View order history", desc_ar: "عرض سجل الطلبات" },
  { href: "/account/addresses", icon: "📍", label_en: "Addresses", label_ar: "عناويني", desc_en: "Manage delivery addresses", desc_ar: "إدارة عناوين التوصيل" },
];

export default function AccountPage() {
  const { lang, isRTL } = useLanguage();
  const { user, profile, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?next=/account");
    }
  }, [user, loading, router]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const initials = profile.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";

  return (
    <div className="min-h-screen bg-bg" dir={isRTL ? "rtl" : "ltr"}>
      <header className="glass-header sticky top-0 z-50 h-14 flex items-center px-4">
        <div className="max-w-2xl mx-auto w-full flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-ink-2 hover:text-ink transition-colors">
            <svg className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <h1 className="text-sm font-bold text-ink flex-1 text-center pe-8">
            {lang === "ar" ? "حسابي" : "My Account"}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-surface rounded-3xl border border-border p-5 flex items-center gap-4">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={profile.full_name || ""} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary text-white text-lg font-bold flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink text-base truncate">{profile.full_name || (lang === "ar" ? "مستخدم" : "User")}</p>
            <p className="text-xs text-ink-3 mt-0.5 truncate">{user?.email}</p>
            {profile.phone && <p className="text-xs text-ink-2 mt-0.5">{profile.phone}</p>}
          </div>
        </motion.div>

        {/* Menu items */}
        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <motion.div key={item.href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link href={item.href} className="flex items-center gap-4 p-4 bg-surface rounded-3xl border border-border hover:border-primary/30 hover:shadow-sm transition-all">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-ink text-sm">{lang === "ar" ? item.label_ar : item.label_en}</p>
                  <p className="text-xs text-ink-3">{lang === "ar" ? item.desc_ar : item.desc_en}</p>
                </div>
                <svg className={`w-4 h-4 text-ink-3 ${isRTL ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
