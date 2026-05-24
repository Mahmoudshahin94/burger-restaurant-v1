"use client";

import { useState, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/client";

interface MigrationLog {
  type: "info" | "success" | "error" | "warn";
  message: string;
}

interface MigrationStats {
  categories: { instantdb: number; supabase: number };
  products: { instantdb: number; supabase: number };
  images: { instantdb: number; supabase: number };
  banners: { instantdb: number; supabase: number };
  settings: { instantdb: number; supabase: number };
}

export default function MigratePage() {
  const supabase = useMemo(() => createClient(), []);
  const [logs, setLogs] = useState<MigrationLog[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [clearFirst, setClearFirst] = useState(false);

  const { data, isLoading: instantLoading } = db.useQuery({
    categories: {},
    items: {},
    item_images: {},
    banners: {},
    settings: {},
  });

  function log(type: MigrationLog["type"], message: string) {
    setLogs((prev) => [...prev, { type, message }]);
  }

  async function loadStats() {
    const [cats, products, images, banners, settings] = await Promise.all([
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("product_images").select("id", { count: "exact", head: true }),
      supabase.from("banners").select("id", { count: "exact", head: true }),
      supabase.from("settings").select("id", { count: "exact", head: true }),
    ]);

    const instantCategories = data?.categories ?? [];
    const instantItems = data?.items ?? [];
    const instantImages = data?.item_images ?? [];
    const instantBanners = data?.banners ?? [];
    const instantSettings = data?.settings ?? [];

    setStats({
      categories: { instantdb: instantCategories.length, supabase: cats.count ?? 0 },
      products: { instantdb: instantItems.length, supabase: products.count ?? 0 },
      images: { instantdb: instantImages.length, supabase: images.count ?? 0 },
      banners: { instantdb: instantBanners.length, supabase: banners.count ?? 0 },
      settings: { instantdb: instantSettings.length, supabase: settings.count ?? 0 },
    });
  }

  async function runMigration() {
    if (!data) {
      log("error", "InstantDB data not loaded yet.");
      return;
    }

    setRunning(true);
    setLogs([]);
    setDone(false);

    const categories = [...(data.categories ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const items = [...(data.items ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const itemImages = data.item_images ?? [];
    const banners = [...(data.banners ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const settings = data.settings ?? [];

    log("info", `Found in InstantDB: ${categories.length} categories, ${items.length} items, ${itemImages.length} images, ${banners.length} banners, ${settings.length} settings`);

    // ── Step 0: Clear existing data if requested ──────────────────────────
    if (clearFirst) {
      log("warn", "Clearing existing Supabase data...");
      await supabase.from("product_images").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("banners").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("settings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      log("success", "Cleared existing Supabase data.");
    }

    // ── Step 1: Migrate Categories ─────────────────────────────────────────
    log("info", "Migrating categories...");
    const categoryIdMap = new Map<string, string>(); // instantdb_id → supabase_id

    let catSuccess = 0;
    let catSkipped = 0;

    for (const cat of categories) {
      // Check for duplicate by name_en
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("name_en", cat.name_en)
        .maybeSingle();

      if (existing) {
        categoryIdMap.set(cat.id, existing.id);
        catSkipped++;
        continue;
      }

      const { data: inserted, error } = await supabase
        .from("categories")
        .insert({
          name_en: cat.name_en,
          name_ar: cat.name_ar,
          icon: cat.icon ?? "",
          sort_order: cat.order ?? 0,
          active: cat.active ?? true,
        })
        .select("id")
        .single();

      if (error || !inserted) {
        log("error", `Failed to insert category "${cat.name_en}": ${error?.message}`);
        continue;
      }

      categoryIdMap.set(cat.id, inserted.id);
      catSuccess++;
    }

    log("success", `Categories: ${catSuccess} inserted, ${catSkipped} already existed (mapped).`);

    // ── Step 2: Migrate Products ───────────────────────────────────────────
    log("info", "Migrating products...");
    const productIdMap = new Map<string, string>(); // instantdb_id → supabase_id

    let prodSuccess = 0;
    let prodSkipped = 0;

    for (const item of items) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("name_en", item.name_en)
        .maybeSingle();

      if (existing) {
        productIdMap.set(item.id, existing.id);
        prodSkipped++;
        continue;
      }

      const supabaseCategoryId = item.category_id ? categoryIdMap.get(item.category_id) ?? null : null;

      const { data: inserted, error } = await supabase
        .from("products")
        .insert({
          name_en: item.name_en,
          name_ar: item.name_ar,
          description_en: item.description_en ?? "",
          description_ar: item.description_ar ?? "",
          price_small: item.price_small ?? null,
          price_large: item.price_large ?? null,
          image: item.image ?? "",
          available: item.available ?? true,
          sort_order: item.order ?? 0,
          category_id: supabaseCategoryId,
        })
        .select("id")
        .single();

      if (error || !inserted) {
        log("error", `Failed to insert product "${item.name_en}": ${error?.message}`);
        continue;
      }

      productIdMap.set(item.id, inserted.id);
      prodSuccess++;
    }

    log("success", `Products: ${prodSuccess} inserted, ${prodSkipped} already existed (mapped).`);

    // ── Step 3: Migrate Product Images ─────────────────────────────────────
    log("info", "Migrating product images...");
    let imgSuccess = 0;
    let imgSkipped = 0;

    for (const img of itemImages) {
      const supabaseProductId = productIdMap.get(img.item_id);
      if (!supabaseProductId) {
        log("warn", `Skipping image — parent product not found for item_id: ${img.item_id}`);
        imgSkipped++;
        continue;
      }

      if (!img.image) {
        imgSkipped++;
        continue;
      }

      // Check for duplicate
      const { data: existing } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", supabaseProductId)
        .eq("image_url", img.image)
        .maybeSingle();

      if (existing) {
        imgSkipped++;
        continue;
      }

      const { error } = await supabase.from("product_images").insert({
        product_id: supabaseProductId,
        image_url: img.image,
        is_primary: img.is_primary ?? false,
        sort_order: img.order ?? 0,
      });

      if (error) {
        log("error", `Failed to insert image for product ${supabaseProductId}: ${error.message}`);
        imgSkipped++;
      } else {
        imgSuccess++;
      }
    }

    log("success", `Product images: ${imgSuccess} inserted, ${imgSkipped} skipped/duplicates.`);

    // ── Step 4: Migrate Banners ────────────────────────────────────────────
    log("info", "Migrating banners...");
    let bannerSuccess = 0;
    let bannerSkipped = 0;

    for (const banner of banners) {
      if (!banner.image) {
        bannerSkipped++;
        continue;
      }

      const { data: existing } = await supabase
        .from("banners")
        .select("id")
        .eq("image", banner.image)
        .maybeSingle();

      if (existing) {
        bannerSkipped++;
        continue;
      }

      const { error } = await supabase.from("banners").insert({
        title_en: banner.title_en ?? "",
        title_ar: banner.title_ar ?? "",
        subtitle_en: banner.subtitle_en ?? "",
        subtitle_ar: banner.subtitle_ar ?? "",
        image: banner.image,
        link: banner.link ?? "",
        active: banner.active ?? true,
        sort_order: banner.order ?? 0,
      });

      if (error) {
        log("error", `Failed to insert banner: ${error.message}`);
        bannerSkipped++;
      } else {
        bannerSuccess++;
      }
    }

    log("success", `Banners: ${bannerSuccess} inserted, ${bannerSkipped} skipped/duplicates.`);

    // ── Step 5: Migrate Settings ───────────────────────────────────────────
    log("info", "Migrating settings...");
    let settingSuccess = 0;
    let settingSkipped = 0;

    for (const setting of settings) {
      if (!setting.key) {
        settingSkipped++;
        continue;
      }

      const { data: existing } = await supabase
        .from("settings")
        .select("id")
        .eq("key", setting.key)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase.from("settings").update({ value: setting.value }).eq("id", existing.id);
        settingSkipped++;
        continue;
      }

      const { error } = await supabase.from("settings").insert({
        key: setting.key,
        value: setting.value,
      });

      if (error) {
        log("error", `Failed to insert setting "${setting.key}": ${error.message}`);
      } else {
        settingSuccess++;
      }
    }

    log("success", `Settings: ${settingSuccess} inserted, ${settingSkipped} updated/skipped.`);

    // ── Done ───────────────────────────────────────────────────────────────
    log("info", "─────────────────────────────────────────");
    log("success", "✅ Migration complete! You can now verify the data in the admin pages.");

    await loadStats();
    setRunning(false);
    setDone(true);
  }

  const instantCounts = {
    categories: (data?.categories ?? []).length,
    items: (data?.items ?? []).length,
    images: (data?.item_images ?? []).length,
    banners: (data?.banners ?? []).length,
    settings: (data?.settings ?? []).length,
  };
  const totalInstant = Object.values(instantCounts).reduce((a, b) => a + b, 0);

  return (
    <AdminLayout title="Migrate Data">
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-gray-800">InstantDB → Supabase Migration</h2>
          <p className="text-sm text-gray-500 mt-1">
            One-click migration to move all your existing data (categories, products, images, banners, settings) from InstantDB into Supabase.
          </p>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <span className="text-lg">⚠️</span>
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Before you run</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700 text-xs">
              <li>Make sure you are logged in as an <strong>admin</strong> — the migrated data requires admin write permissions.</li>
              <li>Duplicate items (matched by name) will be skipped automatically — safe to run multiple times.</li>
              <li>Category IDs are remapped automatically so product-category links are preserved.</li>
              <li>The &quot;Clear first&quot; option wipes all existing Supabase data in these tables before inserting.</li>
            </ul>
          </div>
        </div>

        {/* InstantDB source counts */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Source — InstantDB</h3>
          {instantLoading ? (
            <div className="text-sm text-gray-400 animate-pulse">Loading InstantDB data...</div>
          ) : (
            <div className="grid grid-cols-5 gap-3 text-center">
              {(["categories", "items", "images", "banners", "settings"] as const).map((key) => (
                <div key={key} className="bg-gray-50 rounded-xl py-3">
                  <p className="text-xl font-bold text-gray-800">
                    {key === "images" ? instantCounts.images : instantCounts[key === "items" ? "items" : key]}
                  </p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">{key}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supabase destination counts */}
        {stats && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Destination — Supabase</h3>
            <div className="grid grid-cols-5 gap-3 text-center">
              {(Object.entries(stats) as [keyof MigrationStats, { instantdb: number; supabase: number }][]).map(([key, val]) => (
                <div key={key} className={`rounded-xl py-3 ${val.supabase === val.instantdb ? "bg-green-50" : val.supabase > 0 ? "bg-yellow-50" : "bg-gray-50"}`}>
                  <p className={`text-xl font-bold ${val.supabase === val.instantdb ? "text-green-600" : "text-gray-800"}`}>{val.supabase}</p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">{key}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Options & Action */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={clearFirst}
              onChange={(e) => setClearFirst(e.target.checked)}
              className="w-4 h-4 rounded text-brand-red border-gray-300 focus:ring-brand-red"
            />
            <div>
              <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">Clear Supabase tables first</p>
              <p className="text-xs text-gray-400">Deletes all existing rows from categories, products, images, banners, settings before migrating. Use this for a clean import.</p>
            </div>
          </label>

          <div className="flex gap-3">
            <button
              onClick={loadStats}
              disabled={instantLoading || running}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors disabled:opacity-40"
            >
              Refresh Counts
            </button>
            <button
              onClick={runMigration}
              disabled={running || instantLoading || totalInstant === 0}
              className="flex-1 bg-brand-red hover:bg-brand-red-dark disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {running ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Migrating...
                </>
              ) : done ? (
                "✅ Run Migration Again"
              ) : (
                `Run Migration (${totalInstant} records)`
              )}
            </button>
          </div>
        </div>

        {/* Log output */}
        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-4 font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
            {logs.map((entry, i) => (
              <div
                key={i}
                className={
                  entry.type === "error" ? "text-red-400" :
                  entry.type === "success" ? "text-green-400" :
                  entry.type === "warn" ? "text-yellow-400" :
                  "text-gray-300"
                }
              >
                <span className="text-gray-500 select-none me-2">
                  {entry.type === "error" ? "✗" : entry.type === "success" ? "✓" : entry.type === "warn" ? "!" : "›"}
                </span>
                {entry.message}
              </div>
            ))}
            {running && (
              <div className="text-blue-400 animate-pulse">› Running...</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
