import { db } from "./db";

/**
 * Curated Unsplash photo URLs keyed by item name_en (lowercase).
 * Each URL uses ?w=600&q=85 for a good quality / size balance.
 */
const ITEM_PHOTOS: Record<string, string> = {
  // ── Hot Drinks ────────────────────────────────────────────
  "espresso":
    "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&q=85",
  "double espresso":
    "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&q=85",
  "americano":
    "https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&q=85",
  "cappuccino":
    "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=85",
  "nescafe":
    "https://images.unsplash.com/photo-1607944024060-0450380ddd33?w=600&q=85",
  "coffee latte":
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=85",
  "hazelnut":
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=85",
  "french vanilla":
    "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&q=85",
  "tea latte":
    "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=85",
  "hot chocolate":
    "https://images.unsplash.com/photo-1542990253-a781e8dece51?w=600&q=85",
  "hot oreo":
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=85",
  "hot pistachio":
    "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=85",
  "hot lotus":
    "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=85",
  "hot nutella":
    "https://images.unsplash.com/photo-1571066811602-716837d681de?w=600&q=85",
  "toffee caramel":
    "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=600&q=85",
  "salted caramel":
    "https://images.unsplash.com/photo-1593001872095-7d5b3868fb1d?w=600&q=85",
  "macchiato":
    "https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=600&q=85",
  "caramel macchiato":
    "https://images.unsplash.com/photo-1529892485617-25f63cd7b1e9?w=600&q=85",
  "affogato":
    "https://images.unsplash.com/photo-1617957743117-89b390e78c6e?w=600&q=85",

  // ── Cold Drinks ───────────────────────────────────────────
  "iced coffee":
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=85",
  "iced latte":
    "https://images.unsplash.com/photo-1517959105821-eaf2591984ca?w=600&q=85",
  "iced americano":
    "https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=600&q=85",
  "iced spanish latte":
    "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=85",
  "iced vanilla":
    "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600&q=85",
  "iced chocolate":
    "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=85",
  "iced passionfruit":
    "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&q=85",
  "iced tea":
    "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=85",

  // ── Milkshakes ────────────────────────────────────────────
  "oreo milkshake":
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=85",
  "lotus milkshake":
    "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=85",
  "caramel milkshake":
    "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&q=85",
  "kinder milkshake":
    "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=85",
  "pistachio milkshake":
    "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600&q=85",
  "strawberry milkshake":
    "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=85",
  "cerblak milkshake":
    "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=85",
  "protein milkshake":
    "https://images.unsplash.com/photo-1609167830220-7164aa360951?w=600&q=85",
  "nutella milkshake":
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=85",

  // ── Smoothies ─────────────────────────────────────────────
  "mango smoothie":
    "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&q=85",
  "pineapple smoothie":
    "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=85",
  "strawberry smoothie":
    "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=85",
  "mixed berry smoothie":
    "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=85",
  "passionfruit smoothie":
    "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&q=85",
  "pineapple & mango":
    "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&q=85",
  "passionfruit & mango":
    "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&q=85",
  "pineapple & mixed berry":
    "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=85",
  "pineapple, strawberry & mango":
    "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=85",

  // ── Fresh Juice ───────────────────────────────────────────
  "lemon juice":
    "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&q=85",
  "lemon & mint":
    "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600&q=85",
  "orange juice":
    "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=85",
  "carrot juice":
    "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&q=85",

  // ── Cocktails ─────────────────────────────────────────────
  "piña colada":
    "https://images.unsplash.com/photo-1609168544516-d1e3c9f31f5e?w=600&q=85",
  "house cocktail":
    "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600&q=85",
  "avocado cocktail":
    "https://images.unsplash.com/photo-1596203791059-83ef99ffe4f0?w=600&q=85",

  // ── Mojito ────────────────────────────────────────────────
  "mojito":
    "https://images.unsplash.com/photo-1587223962930-cb7f31384c19?w=600&q=85",

  // ── Sweets ────────────────────────────────────────────────
  "crepe":
    "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=85",
  "dubai crepe":
    "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=85",
  "fshafesh":
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=85",
  "waffle":
    "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=85",
  "fshafesh cup":
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=85",
  "dubai cup":
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=85",
  "house cup":
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=85",
};

/** Resolve a photo URL for an item name (case-insensitive, with partial fallback) */
function resolvePhoto(name_en: string): string {
  const key = name_en.toLowerCase().trim();

  // Exact match first
  if (ITEM_PHOTOS[key]) return ITEM_PHOTOS[key];

  // Partial keyword match (first word)
  for (const [mapKey, url] of Object.entries(ITEM_PHOTOS)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return url;
  }

  // Generic fallback
  return "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=85";
}

/** Fetch all items and update those with empty images */
export async function seedItemPhotos(): Promise<{ updated: number; skipped: number }> {
  const result = await db.queryOnce({ items: {} });
  const items = result.data?.items ?? [];

  let updated = 0;
  const skipped = 0;

  // Build transactions in batches of 20
  const allTx = items.map((item: { id: string; name_en: string; image?: string }) => {
    const photo = resolvePhoto(item.name_en ?? "");
    return db.tx.items[item.id].update({ image: photo });
  });

  if (allTx.length === 0) return { updated: 0, skipped: 0 };

  const batchSize = 20;
  for (let i = 0; i < allTx.length; i += batchSize) {
    await db.transact(allTx.slice(i, i + batchSize));
  }

  updated = allTx.length;
  return { updated, skipped };
}
