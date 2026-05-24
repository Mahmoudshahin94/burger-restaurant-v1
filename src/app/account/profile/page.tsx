"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { lang, isRTL } = useLanguage();
  const { user, profile, loading } = useUser();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?next=/account/profile");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", user.id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg" dir={isRTL ? "rtl" : "ltr"}>
      <header className="glass-header sticky top-0 z-50 h-14 flex items-center px-4">
        <div className="max-w-2xl mx-auto w-full flex items-center gap-3">
          <Link href="/account" className="flex items-center gap-2 text-ink-2 hover:text-ink transition-colors">
            <svg className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <h1 className="text-sm font-bold text-ink flex-1 text-center pe-8">
            {lang === "ar" ? "ملف التعريف" : "My Profile"}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSave} className="bg-surface rounded-3xl border border-border p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 border border-red-200 dark:border-red-800">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-xl px-4 py-3 border border-green-200 dark:border-green-800">
              {lang === "ar" ? "تم حفظ التغييرات!" : "Changes saved!"}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink-2 mb-1.5">{lang === "ar" ? "البريد الإلكتروني" : "Email"}</label>
            <input value={user?.email ?? ""} disabled className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink-3 text-sm opacity-60 cursor-not-allowed" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-2 mb-1.5">{lang === "ar" ? "الاسم الكامل" : "Full Name"}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-2 mb-1.5">{lang === "ar" ? "رقم الهاتف" : "Phone"}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+970 59 000 0000"
              className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {lang === "ar" ? "جاري الحفظ..." : "Saving..."}
              </span>
            ) : (
              lang === "ar" ? "حفظ التغييرات" : "Save Changes"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
