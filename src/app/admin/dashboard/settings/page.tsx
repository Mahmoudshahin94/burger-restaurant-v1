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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data?.settings) return;
    const settings: Setting[] = data.settings;
    const logo = settings.find((s) => s.key === "logo");
    const lang = settings.find((s) => s.key === "default_lang");
    if (logo) setLogoUrl(logo.value ?? "");
    if (lang) setDefaultLang(lang.value ?? "ar");
  }, [data?.settings]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const settings: Setting[] = data?.settings ?? [];

    const logoSetting = settings.find((s) => s.key === "logo");
    const langSetting = settings.find((s) => s.key === "default_lang");

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
