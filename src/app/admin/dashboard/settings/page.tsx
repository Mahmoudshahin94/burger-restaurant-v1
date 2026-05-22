"use client";

import { useState, useEffect } from "react";
import { id } from "@instantdb/react";
import Image from "next/image";
import AdminLayout from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";

interface Setting {
  id: string;
  key: string;
  value: string;
}

export default function SettingsPage() {
  const { data, isLoading } = db.useQuery({ settings: {} });

  const [logoUrl, setLogoUrl] = useState("");
  const [defaultLang, setDefaultLang] = useState("ar");
  const [carouselSec, setCarouselSec] = useState(5);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data?.settings) return;
    const settings: Setting[] = data.settings;
    const logo = settings.find((s) => s.key === "logo");
    const lang = settings.find((s) => s.key === "default_lang");
    const interval = settings.find((s) => s.key === "carousel_interval");
    if (logo) setLogoUrl(logo.value ?? "");
    if (lang) setDefaultLang(lang.value ?? "ar");
    if (interval) {
      const ms = parseInt(interval.value, 10);
      if (!isNaN(ms)) setCarouselSec(Math.round(ms / 1000));
    }
  }, [data?.settings]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const settings: Setting[] = data?.settings ?? [];

    const logoSetting = settings.find((s) => s.key === "logo");
    const langSetting = settings.find((s) => s.key === "default_lang");
    const intervalSetting = settings.find((s) => s.key === "carousel_interval");

    const clampedSec = Math.min(30, Math.max(2, carouselSec));
    const intervalMs = String(clampedSec * 1000);

    const transactions = [];

    if (logoSetting) {
      transactions.push(db.tx.settings[logoSetting.id].update({ value: logoUrl }));
    } else {
      const newId = id();
      transactions.push(db.tx.settings[newId].update({ key: "logo", value: logoUrl }));
    }

    if (langSetting) {
      transactions.push(db.tx.settings[langSetting.id].update({ value: defaultLang }));
    } else {
      const newId = id();
      transactions.push(db.tx.settings[newId].update({ key: "default_lang", value: defaultLang }));
    }

    if (intervalSetting) {
      transactions.push(db.tx.settings[intervalSetting.id].update({ value: intervalMs }));
    } else {
      const newId = id();
      transactions.push(db.tx.settings[newId].update({ key: "carousel_interval", value: intervalMs }));
    }

    await db.transact(transactions);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AdminLayout title="Settings">
      <div className="max-w-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure your coffee shop branding and preferences
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-20 skeleton" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
            {/* Logo URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Logo URL
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Paste a URL to your logo image. Leave empty to use the default JudyTech logo.
              </p>

              {/* Preview */}
              <div className="mb-3 flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Logo Preview"
                      fill
                      className="object-contain p-2"
                      onError={() => {}}
                    />
                  ) : (
                    <Image
                      src="/logo.png"
                      alt="Default Logo"
                      fill
                      className="object-contain p-2"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {logoUrl ? "Custom logo" : "Default JudyTech logo"}
                </p>
              </div>

              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all"
                dir="ltr"
              />
            </div>

            <hr className="border-gray-100" />

            {/* Default Language */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Default Language
              </label>
              <p className="text-xs text-gray-400 mb-3">
                The language shown to customers when they first open the menu.
              </p>
              <div className="flex gap-3">
                <label
                  className={`flex-1 flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                    defaultLang === "ar"
                      ? "border-brand-red bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    value="ar"
                    checked={defaultLang === "ar"}
                    onChange={() => setDefaultLang("ar")}
                    className="text-brand-red"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">العربية</p>
                    <p className="text-xs text-gray-400">Arabic (RTL)</p>
                  </div>
                </label>
                <label
                  className={`flex-1 flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                    defaultLang === "en"
                      ? "border-brand-red bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    value="en"
                    checked={defaultLang === "en"}
                    onChange={() => setDefaultLang("en")}
                    className="text-brand-red"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">English</p>
                    <p className="text-xs text-gray-400">English (LTR)</p>
                  </div>
                </label>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Carousel Interval */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Carousel Auto-Slide Interval
              </label>
              <p className="text-xs text-gray-400 mb-3">
                How long each banner is displayed before auto-advancing. Min 2 s, max 30 s.
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={2}
                  max={30}
                  step={1}
                  value={carouselSec}
                  onChange={(e) => setCarouselSec(Number(e.target.value))}
                  className="flex-1 accent-brand-red"
                />
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-24">
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={carouselSec}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setCarouselSec(Math.min(30, Math.max(2, isNaN(v) ? 5 : v)));
                    }}
                    className="w-10 text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
                  />
                  <span className="text-xs text-gray-400">sec</span>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Save button */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-brand-red hover:bg-brand-red-dark disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </button>
              {saved && (
                <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                  ✅ Settings saved!
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
