// Run with: node --env-file=.env.local scripts/seed-restaurant.mjs   (Node 20+)
// Seeds InstantDB with "Your Burger" restaurant demo data.
// Uses the admin SDK (admin token), so it bypasses instant.perms.ts entirely —
// this is a standalone script with no logged-in user/session.

import { init, id } from "@instantdb/admin";

const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_APP_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error("❌  Missing InstantDB credentials in environment variables");
  console.error("   Set NEXT_PUBLIC_INSTANTDB_APP_ID and INSTANT_APP_ADMIN_TOKEN");
  process.exit(1);
}

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

const BATCH_SIZE = 25;

async function transactInBatches(txs, label) {
  if (txs.length === 0) return;
  for (let i = 0; i < txs.length; i += BATCH_SIZE) {
    const slice = txs.slice(i, i + BATCH_SIZE);
    await db.transact(slice);
    console.log(`   ✓ ${label}: ${Math.min(i + BATCH_SIZE, txs.length)}/${txs.length}`);
  }
}

// ─── Photo URLs (Unsplash - verified working) ─────────────────────────────────
const PHOTOS = {
  // Burgers
  "classic burger":     "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=85",
  "cheese burger":      "https://images.unsplash.com/photo-1550317138-10000687a72b?w=600&q=85",
  "double burger":      "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=85",
  "chicken burger":     "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=85",
  "veggie burger":      "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600&q=85",
  "bbq burger":         "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=85",

  // Pizzas
  "margherita pizza":   "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=85",
  "pepperoni pizza":    "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=85",
  "bbq chicken pizza":  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=85",
  "veggie pizza":       "https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=600&q=85",
  "meat lovers pizza":  "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=85",

  // Salads
  "caesar salad":       "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&q=85",
  "greek salad":        "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=85",
  "garden salad":       "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=85",

  // Sides
  "french fries":       "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=85",
  "onion rings":        "https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&q=85",
  "mozzarella sticks":  "https://images.unsplash.com/photo-1531749668029-2db88e27571f?w=600&q=85",
  "chicken wings":      "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=85",
  "nuggets":            "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=85",

  // Drinks
  "coca cola":          "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=85",
  "fresh juice":        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=85",
  "milkshake":          "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=85",
  "lemonade":           "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&q=85",
  "iced tea":           "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=85",

  // Desserts
  "chocolate cake":     "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=85",
  "cheesecake":         "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&q=85",
  "ice cream":          "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&q=85",
  "brownie":            "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=85",

  // Banners
  "burger banner":      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200&q=85",
  "pizza banner":       "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=85",
  "combo banner":       "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=1200&q=85",
};

const FALLBACK = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=85";

function photo(name) {
  const k = (name ?? "").toLowerCase().trim();
  if (PHOTOS[k]) return PHOTOS[k];
  for (const [key, url] of Object.entries(PHOTOS)) {
    if (k.includes(key) || key.includes(k)) return url;
  }
  return FALLBACK;
}

// ─── Category Images ──────────────────────────────────────────────────────────
const CATEGORY_IMAGES = {
  burgers: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=85",
  pizzas: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=85",
  salads: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=85",
  sides: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&q=85",
  drinks: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&q=85",
  desserts: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&q=85",
};

// ─── Categories ───────────────────────────────────────────────────────────────
const categories = [
  { name_en: "Burgers",  name_ar: "برجر",    icon: "🍔", image: CATEGORY_IMAGES.burgers,  sort_order: 1, active: true },
  { name_en: "Pizzas",   name_ar: "بيتزا",   icon: "🍕", image: CATEGORY_IMAGES.pizzas,   sort_order: 2, active: true },
  { name_en: "Salads",   name_ar: "سلطات",   icon: "🥗", image: CATEGORY_IMAGES.salads,   sort_order: 3, active: true },
  { name_en: "Sides",    name_ar: "إضافات",  icon: "🍟", image: CATEGORY_IMAGES.sides,    sort_order: 4, active: true },
  { name_en: "Drinks",   name_ar: "مشروبات", icon: "🥤", image: CATEGORY_IMAGES.drinks,   sort_order: 5, active: true },
  { name_en: "Desserts", name_ar: "حلويات",  icon: "🍰", image: CATEGORY_IMAGES.desserts, sort_order: 6, active: true },
];

// ─── Products ─────────────────────────────────────────────────────────────────
// [name_en, name_ar, desc_en, desc_ar, price_small, price_large, categoryIndex]
const products = [
  // Burgers (0)
  ["Classic Burger", "برجر كلاسيك", "Juicy beef patty with lettuce, tomato, onion & special sauce", "لحم بقري طازج مع خس، طماطم، بصل وصوص خاص", 35, 45, 0],
  ["Cheese Burger", "تشيز برجر", "Classic burger topped with melted cheddar cheese", "برجر كلاسيك مع جبن شيدر ذائب", 40, 50, 0],
  ["Double Burger", "دبل برجر", "Two beef patties with cheese, pickles & signature sauce", "قطعتين لحم بقري مع جبن، مخلل وصوص مميز", 55, 70, 0],
  ["Chicken Burger", "برجر دجاج", "Crispy chicken fillet with mayo & fresh vegetables", "فيليه دجاج مقرمش مع مايونيز وخضار طازج", 35, 45, 0],
  ["Veggie Burger", "برجر نباتي", "Plant-based patty with avocado & special sauce", "قطعة نباتية مع أفوكادو وصوص خاص", 38, 48, 0],
  ["BBQ Burger", "برجر باربكيو", "Beef patty with crispy bacon, onion rings & BBQ sauce", "لحم بقري مع بيكون مقرمش، حلقات بصل وصوص باربكيو", 50, 65, 0],

  // Pizzas (1)
  ["Margherita Pizza", "بيتزا مارجريتا", "Fresh tomato sauce, mozzarella & basil", "صوص طماطم طازج، جبن موزاريلا وريحان", 45, 75, 1],
  ["Pepperoni Pizza", "بيتزا بيبروني", "Loaded with spicy pepperoni & extra cheese", "محملة بالبيبروني الحار وجبن إضافي", 55, 90, 1],
  ["BBQ Chicken Pizza", "بيتزا دجاج باربكيو", "Grilled chicken, BBQ sauce, red onion & cheese", "دجاج مشوي، صوص باربكيو، بصل أحمر وجبن", 55, 90, 1],
  ["Veggie Pizza", "بيتزا خضار", "Bell peppers, mushrooms, olives & onions", "فلفل ملون، فطر، زيتون وبصل", 50, 85, 1],
  ["Meat Lovers Pizza", "بيتزا محبي اللحم", "Beef, pepperoni, sausage & crispy bacon", "لحم بقري، بيبروني، سجق وبيكون مقرمش", 65, 105, 1],

  // Salads (2)
  ["Caesar Salad", "سلطة سيزر", "Romaine lettuce, parmesan, croutons & caesar dressing", "خس روماني، جبن بارميزان، خبز محمص وصوص سيزر", 30, 45, 2],
  ["Greek Salad", "سلطة يونانية", "Cucumber, tomato, olives, feta & olive oil", "خيار، طماطم، زيتون، جبن فيتا وزيت زيتون", 28, 42, 2],
  ["Garden Salad", "سلطة خضراء", "Fresh mixed greens with house vinaigrette", "خضار ورقية طازجة مع صوص الدار", 22, 35, 2],

  // Sides (3)
  ["French Fries", "بطاطس مقلية", "Crispy golden fries with seasoning", "بطاطس ذهبية مقرمشة مع بهارات", 15, 25, 3],
  ["Onion Rings", "حلقات البصل", "Crispy battered onion rings", "حلقات بصل مقرمشة", 18, 28, 3],
  ["Mozzarella Sticks", "أصابع موزاريلا", "Fried mozzarella with marinara sauce", "موزاريلا مقلية مع صوص مارينارا", 25, 40, 3],
  ["Chicken Wings", "أجنحة الدجاج", "Spicy buffalo wings with blue cheese dip", "أجنحة دجاج حارة مع صوص الجبن الأزرق", 35, 55, 3],
  ["Chicken Nuggets", "ناجتس دجاج", "Crispy chicken nuggets with dipping sauce", "قطع دجاج مقرمشة مع صوص", 25, 40, 3],

  // Drinks (4)
  ["Coca Cola", "كوكا كولا", "Classic Coca Cola", "كوكا كولا كلاسيك", 8, 12, 4],
  ["Fresh Orange Juice", "عصير برتقال طازج", "Freshly squeezed orange juice", "عصير برتقال طازج معصور", 15, 22, 4],
  ["Chocolate Milkshake", "ميلك شيك شوكولاتة", "Creamy chocolate milkshake", "ميلك شيك شوكولاتة كريمي", 20, 28, 4],
  ["Lemonade", "ليموناضة", "Fresh lemonade with mint", "ليموناضة طازجة بالنعناع", 12, 18, 4],
  ["Iced Tea", "شاي مثلج", "Refreshing iced tea", "شاي مثلج منعش", 10, 15, 4],

  // Desserts (5)
  ["Chocolate Cake", "كيك شوكولاتة", "Rich chocolate layer cake", "كيك شوكولاتة طبقات غني", 25, 0, 5],
  ["New York Cheesecake", "تشيز كيك نيويورك", "Creamy classic cheesecake", "تشيز كيك كلاسيكي كريمي", 28, 0, 5],
  ["Ice Cream Sundae", "آيس كريم صنداي", "Three scoops with chocolate sauce", "ثلاث كرات مع صوص شوكولاتة", 22, 32, 5],
  ["Brownie", "براوني", "Warm chocolate brownie with ice cream", "براوني شوكولاتة ساخن مع آيس كريم", 25, 0, 5],
];

// ─── Banners ──────────────────────────────────────────────────────────────────
const banners = [
  {
    title_en: "Fresh Burgers Made to Order",
    title_ar: "برجر طازج حسب الطلب",
    subtitle_en: "100% Premium Beef",
    subtitle_ar: "لحم بقري ممتاز 100%",
    image: PHOTOS["burger banner"],
    link: "",
    active: true,
    sort_order: 1,
  },
  {
    title_en: "Wood-Fired Pizzas",
    title_ar: "بيتزا على الحطب",
    subtitle_en: "Authentic Italian Style",
    subtitle_ar: "على الطريقة الإيطالية الأصلية",
    image: PHOTOS["pizza banner"],
    link: "",
    active: true,
    sort_order: 2,
  },
  {
    title_en: "Combo Deals",
    title_ar: "عروض الكومبو",
    subtitle_en: "Burger + Fries + Drink",
    subtitle_ar: "برجر + بطاطس + مشروب",
    image: PHOTOS["combo banner"],
    link: "",
    active: true,
    sort_order: 3,
  },
];

// ─── Settings ─────────────────────────────────────────────────────────────────
const settings = [
  { key: "shop_name", value: "Your Burger" },
  { key: "logo", value: "/logo.svg" },
  { key: "default_lang", value: "en" },
  { key: "carousel_interval", value: "5000" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🍔  Your Burger — Database Seeder (InstantDB)\n");

  // Check existing data
  console.log("🔍  Checking existing data…");

  let existing;
  try {
    existing = await db.query({
      categories: {},
      products: {},
      productImages: {},
      banners: {},
      settings: {},
    });
  } catch (err) {
    console.error("❌  Could not connect to InstantDB:", err.message ?? err);
    process.exit(1);
  }

  const existingCats = existing.categories ?? [];
  const existingProducts = existing.products ?? [];
  const existingImages = existing.productImages ?? [];
  const existingBanners = existing.banners ?? [];
  const existingSettings = existing.settings ?? [];

  if (existingCats.length > 0 || existingProducts.length > 0) {
    console.log(
      `⚠️   Found existing data (${existingCats.length} categories, ${existingProducts.length} products).`
    );
    console.log("🗑️   Clearing existing data…");

    // Delete in order: productImages -> products -> categories -> banners -> settings
    const deleteTxs = [
      ...existingImages.map((row) => db.tx.productImages[row.id].delete()),
      ...existingProducts.map((row) => db.tx.products[row.id].delete()),
      ...existingCats.map((row) => db.tx.categories[row.id].delete()),
      ...existingBanners.map((row) => db.tx.banners[row.id].delete()),
      ...existingSettings.map((row) => db.tx.settings[row.id].delete()),
    ];
    await transactInBatches(deleteTxs, "Deleted");

    console.log("   ✓ Old data deleted");
  }

  // Create categories
  console.log("📂  Creating categories…");
  const categoryIds = categories.map(() => id());
  const catTxs = categories.map((cat, i) => db.tx.categories[categoryIds[i]].update(cat));
  await db.transact(catTxs);
  console.log(`   ✓ ${categoryIds.length} categories created`);

  // Create products (linked to their category)
  console.log(`🍽️   Creating ${products.length} products…`);
  const productIds = products.map(() => id());
  const productTxs = products.map(
    ([name_en, name_ar, desc_en, desc_ar, price_small, price_large, catIdx], i) =>
      db.tx.products[productIds[i]]
        .update({
          name_en,
          name_ar,
          description_en: desc_en,
          description_ar: desc_ar,
          ...(price_small ? { price_small } : {}),
          ...(price_large ? { price_large } : {}),
          image: photo(name_en),
          available: true,
          sort_order: i + 1,
        })
        .link({ category: categoryIds[catIdx] })
  );
  await transactInBatches(productTxs, "Products");
  console.log(`   ✓ ${productIds.length} products created`);

  // Create product images (primary image for each product, linked to it)
  console.log("📸  Creating product images…");
  const imageTxs = products.map(([name_en], i) =>
    db.tx.productImages[id()]
      .update({
        image_url: photo(name_en),
        is_primary: true,
        sort_order: 1,
      })
      .link({ product: productIds[i] })
  );

  try {
    await transactInBatches(imageTxs, "Product images");
    console.log(`   ✓ ${imageTxs.length} product images created`);
  } catch (err) {
    console.error("⚠️   Warning: Could not create product images:", err.message ?? err);
  }

  // Create banners
  console.log("🖼️   Creating banners…");
  try {
    const bannerTxs = banners.map((banner) => db.tx.banners[id()].update(banner));
    await db.transact(bannerTxs);
    console.log(`   ✓ ${bannerTxs.length} banners created`);
  } catch (err) {
    console.error("⚠️   Warning: Could not create banners:", err.message ?? err);
  }

  // Create/update settings (upsert by key)
  console.log("⚙️   Setting up configuration…");
  try {
    const { settings: currentSettings } = await db.query({ settings: {} });
    const existingByKey = new Map((currentSettings ?? []).map((row) => [row.key, row.id]));
    const settingTxs = settings.map((setting) =>
      db.tx.settings[existingByKey.get(setting.key) ?? id()].update(setting)
    );
    await db.transact(settingTxs);
    console.log("   ✓ Settings configured");
  } catch (err) {
    console.error("⚠️   Warning: Could not configure settings:", err.message ?? err);
  }

  console.log("\n🎉  All done! Open http://localhost:3000 to see Your Burger menu.\n");
}

main().catch((err) => {
  console.error("\n❌  Error:", err.message ?? err);
  process.exit(1);
});
