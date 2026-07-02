"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/instant/client";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const { user } = db.useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace(next);
    }
  }, [user, next, router]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await db.auth.sendMagicCode({ email });
      setStep("code");
    } catch {
      setError(lang === "ar" ? "تعذر إرسال رمز الدخول" : "Couldn't send the login code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await db.auth.signInWithMagicCode({ email, code });
      // Redirect happens via the useEffect above once db.useAuth() reports the user.
    } catch {
      setError(lang === "ar" ? "الرمز غير صحيح أو منتهي الصلاحية" : "Invalid or expired code");
      setLoading(false);
    }
  }

  const googleUrl =
    typeof window !== "undefined"
      ? db.auth.createAuthorizationURL({
          clientName:
            process.env.NEXT_PUBLIC_INSTANT_GOOGLE_CLIENT_NAME || "google-web",
          redirectURL: window.location.href,
        })
      : "#";

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

          {step === "email" && (
            <>
              {/* Google */}
              <a
                href={googleUrl}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border-2 border-border bg-surface hover:border-ink-3 transition-all font-semibold text-ink text-sm"
              >
                <GoogleIcon />
                {lang === "ar" ? "تسجيل الدخول بجوجل" : "Continue with Google"}
              </a>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-ink-3 font-medium">{lang === "ar" ? "أو" : "or"}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Email -> magic code */}
              <form onSubmit={handleSendCode} className="space-y-3">
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
                  className="w-full py-3 px-4 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-50 mt-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {lang === "ar" ? "جاري الإرسال..." : "Sending..."}
                    </span>
                  ) : lang === "ar" ? (
                    "إرسال رمز الدخول"
                  ) : (
                    "Email me a login code"
                  )}
                </button>
              </form>
            </>
          )}

          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-3">
              <p className="text-sm text-ink-2">
                {lang === "ar"
                  ? `أدخل الرمز المرسل إلى ${email}`
                  : `Enter the code we sent to ${email}`}
              </p>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink placeholder-ink-3 text-sm text-center tracking-[0.4em] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {loading
                  ? lang === "ar"
                    ? "جاري التحقق..."
                    : "Verifying..."
                  : lang === "ar"
                    ? "تأكيد"
                    : "Verify code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
                className="w-full text-center text-sm text-ink-3 hover:text-ink transition-colors"
              >
                {lang === "ar" ? "استخدام بريد إلكتروني آخر" : "Use a different email"}
              </button>
            </form>
          )}
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
