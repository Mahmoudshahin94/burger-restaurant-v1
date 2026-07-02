"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/instant/client";
import { syncInstantAuthCookie } from "@/lib/instant/syncAuthCookie";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user } = db.useAuth();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);

  const { data } = db.useQuery(
    user ? { profiles: { $: { where: { "$user.id": user.id } } } } : null,
  );

  useEffect(() => {
    if (!user || !data) return;

    setCheckingRole(true);
    const role = data.profiles?.[0]?.role;

    if (role === "admin") {
      // Wait for the session cookie to actually be set before navigating —
      // the admin dashboard layout verifies it server-side, and the SDK's own
      // background cookie sync isn't guaranteed to finish before this runs
      // (see syncInstantAuthCookie for details).
      syncInstantAuthCookie(user).then(() => {
        router.replace("/admin/dashboard");
      });
      return;
    }

    // Signed in, but not an admin — reject and sign back out.
    db.auth.signOut();
    setError("Access denied. Admin account required.");
    setCheckingRole(false);
  }, [user, data, router]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await db.auth.sendMagicCode({ email });
      setStep("code");
    } catch {
      setError("Couldn't send the login code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await db.auth.signInWithMagicCode({ email, code });
      // Role check + redirect happens in the effect above.
    } catch {
      setError("Invalid or expired code.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-espresso flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-brand-latte/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-8">
          <div className="relative w-32 h-32 mx-auto mb-4 rounded-2xl overflow-hidden bg-white/10 border border-white/20 shadow-xl">
            <Image src="/logo.png" alt="JudyTech" fill className="object-contain p-2" sizes="128px" priority />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Panel</h1>
          <p className="text-white/50 text-sm mt-1">Sign in to manage your store</p>
        </div>

        <div className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] rounded-3xl p-6 shadow-2xl">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/20 border border-red-400/30 text-red-300 text-sm px-4 py-3 rounded-2xl flex items-center gap-2 mb-4"
              >
                <span>⚠</span>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@judytech.com"
                  className="w-full bg-white/10 border border-white/15 rounded-2xl px-4 py-3.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 hover:shadow-lg active:scale-[0.98] mt-1 flex items-center justify-center gap-2"
              >
                {loading ? "Sending code..." : "Send login code →"}
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <p className="text-white/60 text-sm">Enter the code sent to {email}</p>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
                placeholder="123456"
                className="w-full bg-white/10 border border-white/15 rounded-2xl px-4 py-3.5 text-white text-sm text-center tracking-[0.4em] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <button
                type="submit"
                disabled={loading || checkingRole}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading || checkingRole ? "Verifying..." : "Sign In →"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
                className="w-full text-center text-white/40 hover:text-white/70 text-sm transition-colors"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-white/25 text-xs mt-5">Judy Tech — Admin Panel</p>
      </motion.div>
    </div>
  );
}
