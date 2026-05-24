"use client";

import { Suspense, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-400" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-400" };
  return { score, label: "Strong", color: "bg-green-500" };
}

function getPasswordStrengthAr(label: string) {
  const map: Record<string, string> = { Weak: "ضعيفة", Fair: "مقبولة", Good: "جيدة", Strong: "قوية" };
  return map[label] ?? label;
}

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

function SignupContent() {
  const { lang, isRTL } = useLanguage();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const next = searchParams.get("next") || "/";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordValid = password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setError(
        lang === "ar"
          ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حروف وأرقام"
          : "Password must be at least 8 characters and include letters and numbers"
      );
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("rate limit") || error.message.toLowerCase().includes("429")) {
        setError(
          lang === "ar"
            ? "تم تجاوز حد إرسال رسائل التأكيد. حاول مرة أخرى بعد ساعة أو استخدم بريداً مختلفاً."
            : "Email confirmation rate limit reached. Try again in an hour or use a different email."
        );
      } else if (error.message.toLowerCase().includes("invalid") && error.message.toLowerCase().includes("email")) {
        setError(lang === "ar" ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email address");
      } else if (error.message.toLowerCase().includes("already registered")) {
        setError(lang === "ar" ? "هذا البريد الإلكتروني مسجل مسبقاً" : "This email is already registered");
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    setSuccess(
      lang === "ar"
        ? "تم إنشاء حسابك! تحقق من بريدك الإلكتروني لتأكيد الحساب."
        : "Account created! Check your email to confirm your account."
    );
    setLoading(false);
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(lang === "ar" ? "فشل التسجيل بجوجل" : "Google sign up failed");
      setGoogleLoading(false);
    }
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
            {lang === "ar" ? "إنشاء حساب" : "Create account"}
          </h1>
          <p className="text-ink-2 text-sm mt-1">
            {lang === "ar" ? "انضم إلى JudyTech" : "Join JudyTech"}
          </p>
        </div>

        <div className="bg-surface rounded-3xl border border-border shadow-card p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-xl px-4 py-3 border border-green-200 dark:border-green-800">
              {success}
            </div>
          )}

          {!success && (
            <>
              <button
                onClick={handleGoogleSignup}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border-2 border-border bg-surface hover:border-ink-3 transition-all font-semibold text-ink text-sm disabled:opacity-50"
              >
                {googleLoading ? (
                  <span className="w-5 h-5 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                {lang === "ar" ? "التسجيل بجوجل" : "Continue with Google"}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-ink-3 font-medium">{lang === "ar" ? "أو" : "or"}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleSignup} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                    {lang === "ar" ? "الاسم الكامل" : "Full name"}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={lang === "ar" ? "محمد أحمد" : "John Doe"}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink placeholder-ink-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

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

                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                    {lang === "ar" ? "رقم الهاتف (اختياري)" : "Phone (optional)"}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+970 59 000 0000"
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink placeholder-ink-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                    {lang === "ar" ? "كلمة المرور" : "Password"}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink placeholder-ink-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              passwordStrength.score >= i ? passwordStrength.color : "bg-border"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-ink-3">
                        {lang === "ar"
                          ? `قوة كلمة المرور: ${getPasswordStrengthAr(passwordStrength.label)}`
                          : `Strength: ${passwordStrength.label}`}
                      </p>
                    </div>
                  )}
                  {passwordTouched && password.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      <li className={`text-[11px] flex items-center gap-1.5 ${password.length >= 8 ? "text-green-600 dark:text-green-400" : "text-ink-3"}`}>
                        <span>{password.length >= 8 ? "✓" : "○"}</span>
                        {lang === "ar" ? "8 أحرف على الأقل" : "At least 8 characters"}
                      </li>
                      <li className={`text-[11px] flex items-center gap-1.5 ${/[A-Za-z]/.test(password) ? "text-green-600 dark:text-green-400" : "text-ink-3"}`}>
                        <span>{/[A-Za-z]/.test(password) ? "✓" : "○"}</span>
                        {lang === "ar" ? "يحتوي على حروف" : "Contains letters"}
                      </li>
                      <li className={`text-[11px] flex items-center gap-1.5 ${/[0-9]/.test(password) ? "text-green-600 dark:text-green-400" : "text-ink-3"}`}>
                        <span>{/[0-9]/.test(password) ? "✓" : "○"}</span>
                        {lang === "ar" ? "يحتوي على أرقام" : "Contains numbers"}
                      </li>
                    </ul>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-50 mt-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {lang === "ar" ? "جاري الإنشاء..." : "Creating account..."}
                    </span>
                  ) : (
                    lang === "ar" ? "إنشاء الحساب" : "Create account"
                  )}
                </button>
              </form>
            </>
          )}

          {success && (
            <div className="text-center py-4">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all"
              >
                {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
              </Link>
            </div>
          )}

          {!success && (
            <p className="text-center text-sm text-ink-2 pt-1">
              {lang === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
              <Link href={`/auth/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-primary font-semibold hover:underline">
                {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
              </Link>
            </p>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-ink-3 hover:text-ink transition-colors">
            {lang === "ar" ? "← العودة للقائمة" : "← Back to menu"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
      <SignupContent />
    </Suspense>
  );
}
