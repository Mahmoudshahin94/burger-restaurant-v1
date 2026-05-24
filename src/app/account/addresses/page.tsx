"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import type { Address } from "@/types";

export default function AddressesPage() {
  const { lang, isRTL } = useLanguage();
  const { user, loading } = useUser();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ label: "Home", street: "", city: "", area: "", building: "", floor: "", notes: "" });

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login?next=/account/addresses");
  }, [user, loading, router]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
      setAddresses((data ?? []) as Address[]);
    }
    if (user) load();
  // supabase is stable (useMemo), only re-fetch when user changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form.street || !form.city) return;
    setSaving(true);

    if (editingId) {
      const { data } = await supabase.from("addresses").update({ ...form }).eq("id", editingId).select().single();
      if (data) setAddresses((prev) => prev.map((a) => a.id === editingId ? data as Address : a));
    } else {
      const { data } = await supabase.from("addresses").insert({ ...form, user_id: user.id, is_default: addresses.length === 0 }).select().single();
      if (data) setAddresses((prev) => [...prev, data as Address]);
    }

    setForm({ label: "Home", street: "", city: "", area: "", building: "", floor: "", notes: "" });
    setShowForm(false);
    setEditingId(null);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("addresses").delete().eq("id", id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  async function setDefault(id: string) {
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
  }

  function startEdit(addr: Address) {
    setForm({
      label: addr.label ?? "Home",
      street: addr.street,
      city: addr.city,
      area: addr.area ?? "",
      building: addr.building ?? "",
      floor: addr.floor ?? "",
      notes: addr.notes ?? "",
    });
    setEditingId(addr.id);
    setShowForm(true);
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
            {lang === "ar" ? "عناويني" : "My Addresses"}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {addresses.map((addr, i) => (
          <motion.div key={addr.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={`bg-surface rounded-3xl border-2 p-4 ${addr.is_default ? "border-primary" : "border-border"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-ink">{addr.label}</span>
                  {addr.is_default && (
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                      {lang === "ar" ? "افتراضي" : "Default"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-2">{addr.street}, {addr.city}</p>
                {addr.area && <p className="text-xs text-ink-3">{addr.area}</p>}
                {(addr.building || addr.floor) && (
                  <p className="text-xs text-ink-3">
                    {addr.building && `${lang === "ar" ? "مبنى" : "Building"} ${addr.building}`}
                    {addr.floor && `, ${lang === "ar" ? "طابق" : "Floor"} ${addr.floor}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!addr.is_default && (
                  <button onClick={() => setDefault(addr.id)} className="text-xs text-primary hover:underline px-2 py-1">
                    {lang === "ar" ? "افتراضي" : "Set default"}
                  </button>
                )}
                <button onClick={() => startEdit(addr)} className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center text-ink-2 hover:text-primary transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(addr.id)} className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center text-ink-2 hover:text-red-500 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add / Edit form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="bg-surface rounded-3xl border border-border p-5"
            >
              <h3 className="font-bold text-ink text-sm mb-4">
                {editingId ? (lang === "ar" ? "تعديل العنوان" : "Edit Address") : (lang === "ar" ? "عنوان جديد" : "New Address")}
              </h3>
              <form onSubmit={handleSave} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input value={form.street} onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))} required placeholder={lang === "ar" ? "الشارع *" : "Street *"}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                  <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} required placeholder={lang === "ar" ? "المدينة *" : "City *"}
                    className="px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                  <input value={form.area} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))} placeholder={lang === "ar" ? "المنطقة" : "Area"}
                    className="px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                  <input value={form.building} onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))} placeholder={lang === "ar" ? "المبنى" : "Building"}
                    className="px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                  <input value={form.floor} onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))} placeholder={lang === "ar" ? "الطابق" : "Floor"}
                    className="px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50">
                    {saving ? "..." : (lang === "ar" ? "حفظ" : "Save")}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ label: "Home", street: "", city: "", area: "", building: "", floor: "", notes: "" }); }}
                    className="px-5 py-3 rounded-2xl border border-border text-ink-2 text-sm font-medium hover:border-ink-3 transition-all">
                    {lang === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); }}
            className="w-full py-3.5 rounded-3xl border-2 border-dashed border-border text-ink-2 text-sm font-semibold hover:border-primary hover:text-primary transition-all"
          >
            + {lang === "ar" ? "إضافة عنوان جديد" : "Add new address"}
          </button>
        )}
      </main>
    </div>
  );
}
