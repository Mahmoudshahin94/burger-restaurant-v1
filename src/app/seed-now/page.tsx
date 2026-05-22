"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";

/* ── Photo map (all verified portrait photos) ────────────────── */
const ITEM_PHOTOS: Record<string, string> = {
  // Hot Drinks
  "espresso":                       "https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=600&q=85",
  "double espresso":                "https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=600&q=85",
  "americano":                      "https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&q=85",
  "cappuccino":                     "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=85",
  "nescafe":                        "https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=600&q=85",
  "coffee latte":                   "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&q=85",
  "hazelnut":                       "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=85",
  "french vanilla":                 "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&q=85",
  "tea latte":                      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=85",
  "hot chocolate":                  "https://images.unsplash.com/photo-1571066811602-716837d681de?w=600&q=85",
  "hot oreo":                       "https://images.unsplash.com/photo-1571066811602-716837d681de?w=600&q=85",
  "hot pistachio":                  "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=85",
  "hot lotus":                      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=85",
  "hot nutella":                    "https://images.unsplash.com/photo-1571066811602-716837d681de?w=600&q=85",
  "toffee caramel":                 "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=600&q=85",
  "salted caramel":                 "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=85",
  "macchiato":                      "https://images.unsplash.com/photo-1529892485617-25f63cd7b1e9?w=600&q=85",
  "caramel macchiato":              "https://images.unsplash.com/photo-1529892485617-25f63cd7b1e9?w=600&q=85",
  "affogato":                       "https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=600&q=85",
  // Cold Drinks
  "iced coffee":                    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=85",
  "iced latte":                     "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&q=85",
  "iced americano":                 "https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=600&q=85",
  "iced spanish latte":             "https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&q=85",
  "iced vanilla":                   "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600&q=85",
  "iced chocolate":                 "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=85",
  "iced passionfruit":              "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&q=85",
  "iced tea":                       "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=85",
  // Milkshakes
  "oreo milkshake":                 "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&q=85",
  "lotus milkshake":                "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=85",
  "caramel milkshake":              "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&q=85",
  "kinder milkshake":               "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=85",
  "pistachio milkshake":            "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600&q=85",
  "strawberry milkshake":           "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=85",
  "cerblak milkshake":              "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=85",
  "protein milkshake":              "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600&q=85",
  "nutella milkshake":              "https://images.unsplash.com/photo-1571066811602-716837d681de?w=600&q=85",
  // Smoothies
  "mango smoothie":                 "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&q=85",
  "pineapple smoothie":             "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=85",
  "strawberry smoothie":            "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=85",
  "mixed berry smoothie":           "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=85",
  "passionfruit smoothie":          "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&q=85",
  "pineapple & mango":              "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&q=85",
  "passionfruit & mango":           "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&q=85",
  "pineapple & mixed berry":        "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=85",
  "pineapple, strawberry & mango":  "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&q=85",
  // Fresh Juice
  "lemon juice":                    "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&q=85",
  "lemon & mint":                   "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&q=85",
  "orange juice":                   "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=85",
  "carrot juice":                   "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&q=85",
  // Cocktails
  "piña colada":                    "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&q=85",
  "house cocktail":                 "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=600&q=85",
  "avocado cocktail":               "https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&q=85",
  // Mojito
  "mojito":                         "https://images.unsplash.com/photo-1587223962930-cb7f31384c19?w=600&q=85",
  // Sweets
  "crepe":                          "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=85",
  "dubai crepe":                    "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=85",
  "fshafesh":                       "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=85",
  "waffle":                         "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=600&q=85",
  "fshafesh cup":                   "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=85",
  "dubai cup":                      "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=85",
  "house cup":                      "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=85",
};

const FALLBACK = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=85";

function resolvePhoto(name_en: string): string {
  const key = (name_en ?? "").toLowerCase().trim();
  if (ITEM_PHOTOS[key]) return ITEM_PHOTOS[key];
  for (const [k, url] of Object.entries(ITEM_PHOTOS)) {
    if (key.includes(k) || k.includes(key)) return url;
  }
  return FALLBACK;
}

/* ── Types ────────────────────────────────────────────────── */
type StepStatus = "pending" | "running" | "done" | "error";
type StepDef = { label: string; status: StepStatus };

const INITIAL_STEPS: StepDef[] = [
  { label: "Connecting to database…",    status: "pending" },
  { label: "Seeding categories & items…", status: "pending" },
  { label: "Adding photos to all items…", status: "pending" },
];

/* ── Page ─────────────────────────────────────────────────── */
export default function SeedNowPage() {
  const router = useRouter();
  const seedCalled = useRef(false);
  const photosCalled = useRef(false);

  const [steps, setSteps] = useState<StepDef[]>(INITIAL_STEPS);
  const [finished, setFinished] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [seedDone, setSeedDone] = useState(false);

  const mark = (i: number, status: StepStatus) =>
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status } : s)));

  /* Reactive query — stays live; auto-updates after seed writes */
  const { data, isLoading } = db.useQuery({ items: {}, categories: {} });

  /* Phase 1: Seed DB when connected and data is empty */
  useEffect(() => {
    if (isLoading || seedCalled.current) return;
    seedCalled.current = true;

    const items = (data?.items ?? []) as Array<{ id: string; name_en: string }>;
    const cats  = (data?.categories ?? []) as unknown[];

    mark(0, "done"); // connected

    if (items.length > 0 && cats.length > 0) {
      // Data already exists — skip seeding, go straight to photos
      mark(1, "done");
      setSeedDone(true);
      return;
    }

    // Need to seed
    mark(1, "running");
    seedDatabase()
      .then(() => {
        mark(1, "done");
        setSeedDone(true);
      })
      .catch((e: unknown) => {
        mark(1, "error");
        setErrMsg(e instanceof Error ? e.message : String(e));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  /* Phase 2: Add photos once items are in DB (reactive — fires when data updates) */
  useEffect(() => {
    if (!seedDone || photosCalled.current) return;

    const items = (data?.items ?? []) as Array<{ id: string; name_en: string }>;
    if (items.length === 0) return; // wait for WS push after seed

    photosCalled.current = true;
    mark(2, "running");

    const txs = items.map((item) =>
      db.tx.items[item.id].update({ image: resolvePhoto(item.name_en) })
    );

    const run = async () => {
      const batchSize = 20;
      for (let i = 0; i < txs.length; i += batchSize) {
        await db.transact(txs.slice(i, i + batchSize));
      }
      mark(2, "done");
      setFinished(true);
      setTimeout(() => router.push("/"), 2500);
    };

    run().catch((e: unknown) => {
      mark(2, "error");
      setErrMsg(e instanceof Error ? e.message : String(e));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedDone, data]);

  const icon = (status: StepStatus) => {
    if (status === "done")    return <span className="text-green-500 text-xl leading-none">✓</span>;
    if (status === "error")   return <span className="text-red-500 text-xl leading-none">✗</span>;
    if (status === "running") return (
      <svg className="animate-spin w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    );
    return <span className="w-5 h-5 rounded-full border-2 border-gray-200 block"/>;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg,#FEF6EC 0%,#FAF0E4 100%)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-sm w-full p-8">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Menu" className="w-20 h-20 object-contain drop-shadow-md" />
        </div>

        {!finished ? (
          <>
            <h1 className="text-xl font-bold text-gray-800 text-center mb-1">
              Setting Up Menu
            </h1>
            <p className="text-gray-400 text-sm text-center mb-8">
              This only runs once — adding all data &amp; photos
            </p>

            <div className="space-y-5">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                    {icon(step.status)}
                  </div>
                  <span className={`text-sm font-medium ${
                    step.status === "done"    ? "text-green-600" :
                    step.status === "running" ? "text-gray-800"  :
                    step.status === "error"   ? "text-red-500"   :
                    "text-gray-400"
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {errMsg && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-xs font-semibold mb-1">Error</p>
                <p className="text-red-500 text-xs font-mono break-all">{errMsg}</p>
                <button
                  onClick={() => {
                    seedCalled.current = false;
                    photosCalled.current = false;
                    setSeedDone(false);
                    setErrMsg("");
                    setSteps(INITIAL_STEPS);
                  }}
                  className="mt-3 text-xs font-semibold text-red-600 hover:underline"
                >
                  ↺ Try Again
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">All Done!</h1>
            <p className="text-gray-500 text-sm mb-1">
              Categories, items &amp; photos are ready.
            </p>
            <p className="text-gray-400 text-xs">Opening the menu now…</p>
          </div>
        )}
      </div>
    </div>
  );
}
