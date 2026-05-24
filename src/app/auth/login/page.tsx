"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function LoginContent() {
  const { lang, isRTL } = useLanguage();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const next = searchParams.get("next") || "/";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (errorParam === "auth_failed") {
      setError(lang === "ar" ? "فشل تسجيل الدخول، يرجى المحاولة مجدداً" : "Authentication failed, please try again");
    }
  }, [errorParam, lang]);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message === "Email not confirmed") {
          setError(
            lang === "ar"
              ? "لم يتم تأكيد بريدك الإلكتروني بعد. تحقق من صندوق الوارد وانقر على رابط التأكيد."
              : "Your email is not confirmed yet. Please check your inbox and click the confirmation link."
          );
        } else {
          setError(lang === "ar" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password");
        }
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError(lang === "ar" ? "فشل تسجيل الدخول" : "Login failed");
        setLoading(false);
        return;
      }

      // Wait for auth state to be fully committed before redirect
      // This ensures cookies are properly set
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Hard redirect to ensure cookies are sent with the new request
      window.location.href = next;
    } catch (err) {
      console.error("Login error:", err);
      setError(lang === "ar" ? "حدث خطأ أثناء تسجيل الدخول" : "An error occurred during login");
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(lang === "ar" ? "فشل تسجيل الدخول بجوجل" : "Google sign in failed");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="JudyTech" className="w-12 h-12 object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-ink">
            {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
          </h1>
          <p className="text-ink-2 text-sm mt-1">
            {lang === "ar" ? "أهلاً بعودتك إلى JudyTech" : "Welcome back to JudyTech"}
          </p>
        </div>

        <div className="bg-surface rounded-3xl border border-border shadow-card p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border-2 border-border bg-surface hover:border-ink-3 transition-all font-semibold text-ink text-sm disabled:opacity-50"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {lang === "ar" ? "تسجيل الدخول بجوجل" : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-ink-3 font-medium">{lang === "ar" ? "أو" : "or"}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                {lang === "ar" ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={lang === "ar" ? "example@email.com" : "example@email.com"}
                required
                className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink placeholder-ink-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-ink-2">
                  {lang === "ar" ? "كلمة المرور" : "Password"}
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  {lang === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?"}
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink placeholder-ink-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 px-4 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-50 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {lang === "ar" ? "جاري الدخول..." : "Signing in..."}
                </span>
              ) : (
                lang === "ar" ? "تسجيل الدخول" : "Sign in"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-ink-2 pt-1">
            {lang === "ar" ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
            <Link href={`/auth/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-primary font-semibold hover:underline">
              {lang === "ar" ? "إنشاء حساب" : "Sign up"}
            </Link>
          </p>
        </div>

        {/* Back to menu */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-ink-3 hover:text-ink transition-colors">
            {lang === "ar" ? "← العودة للقائمة" : "← Back to menu"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
