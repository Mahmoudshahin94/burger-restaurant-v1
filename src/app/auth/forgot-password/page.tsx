"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

export default function ForgotPasswordPage() {
  const { lang, isRTL } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="JudyTech" className="w-12 h-12 object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-ink">
            {lang === "ar" ? "إعادة تعيين كلمة المرور" : "Reset password"}
          </h1>
          <p className="text-ink-2 text-sm mt-1">
            {lang === "ar"
              ? "سنرسل لك رابط إعادة التعيين"
              : "We'll send you a reset link"}
          </p>
        </div>

        <div className="bg-surface rounded-3xl border border-border shadow-card p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="text-5xl">📧</div>
              <p className="text-ink font-semibold">
                {lang === "ar" ? "تم إرسال البريد الإلكتروني!" : "Email sent!"}
              </p>
              <p className="text-ink-2 text-sm">
                {lang === "ar"
                  ? `تحقق من بريدك الإلكتروني ${email} للحصول على رابط إعادة التعيين.`
                  : `Check ${email} for a password reset link.`}
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all"
              >
                {lang === "ar" ? "العودة لتسجيل الدخول" : "Back to sign in"}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                  {lang === "ar" ? "البريد الإلكتروني" : "Email"}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink placeholder-ink-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {lang === "ar" ? "جاري الإرسال..." : "Sending..."}
                  </span>
                ) : (
                  lang === "ar" ? "إرسال رابط الإعادة" : "Send reset link"
                )}
              </button>

              <p className="text-center text-sm text-ink-2">
                <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                  {lang === "ar" ? "العودة لتسجيل الدخول" : "Back to sign in"}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
