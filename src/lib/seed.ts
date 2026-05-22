import { id } from "@instantdb/react";
import { db } from "./db";

export interface SeedCategory {
  name_en: string;
  name_ar: string;
  icon: string;
  order: number;
}

export interface SeedItem {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price_small: number;
  price_large: number;
  image: string;
  available: boolean;
  order: number;
  categoryIndex: number;
}

const categories: SeedCategory[] = [
  { name_en: "Hot Drinks", name_ar: "مشروبات ساخنة", icon: "☕", order: 1 },
  { name_en: "Cold Drinks", name_ar: "مشروبات باردة", icon: "🧊", order: 2 },
  { name_en: "Milkshake", name_ar: "ميلك شيك", icon: "🥤", order: 3 },
  { name_en: "Smoothie", name_ar: "سموذي", icon: "🍓", order: 4 },
  { name_en: "Fresh Juice", name_ar: "عصائر طبيعية", icon: "🍊", order: 5 },
  { name_en: "Cocktails", name_ar: "كوكتيل", icon: "🍹", order: 6 },
  { name_en: "Mojito", name_ar: "موهيتو", icon: "🌿", order: 7 },
  { name_en: "Sweets", name_ar: "حلويات", icon: "🍰", order: 8 },
];

// categoryIndex matches index in categories array above (0-based)
const items: SeedItem[] = [
  // Hot Drinks (0)
  { name_en: "Espresso", name_ar: "إسبرسو", description_en: "", description_ar: "", price_small: 0, price_large: 6, image: "", available: true, order: 1, categoryIndex: 0 },
  { name_en: "Double Espresso", name_ar: "إسبرسو دبل", description_en: "", description_ar: "", price_small: 0, price_large: 8, image: "", available: true, order: 2, categoryIndex: 0 },
  { name_en: "Americano", name_ar: "أمريكانو", description_en: "", description_ar: "", price_small: 7, price_large: 10, image: "", available: true, order: 3, categoryIndex: 0 },
  { name_en: "Cappuccino", name_ar: "كابتشينو", description_en: "", description_ar: "", price_small: 7, price_large: 10, image: "", available: true, order: 4, categoryIndex: 0 },
  { name_en: "Nescafe", name_ar: "نيسكافيه", description_en: "", description_ar: "", price_small: 7, price_large: 10, image: "", available: true, order: 5, categoryIndex: 0 },
  { name_en: "Coffee Latte", name_ar: "كوفي لاتيه", description_en: "", description_ar: "", price_small: 7, price_large: 10, image: "", available: true, order: 6, categoryIndex: 0 },
  { name_en: "Hazelnut", name_ar: "بندق", description_en: "", description_ar: "", price_small: 7, price_large: 10, image: "", available: true, order: 7, categoryIndex: 0 },
  { name_en: "French Vanilla", name_ar: "فرنش فانيلا", description_en: "", description_ar: "", price_small: 7, price_large: 10, image: "", available: true, order: 8, categoryIndex: 0 },
  { name_en: "Tea Latte", name_ar: "شاي لاتيه", description_en: "", description_ar: "", price_small: 7, price_large: 10, image: "", available: true, order: 9, categoryIndex: 0 },
  { name_en: "Hot Chocolate", name_ar: "هوت شوكليت", description_en: "", description_ar: "", price_small: 7, price_large: 10, image: "", available: true, order: 10, categoryIndex: 0 },
  { name_en: "Hot Oreo", name_ar: "هوت أوريو", description_en: "", description_ar: "", price_small: 7, price_large: 10, image: "", available: true, order: 11, categoryIndex: 0 },
  { name_en: "Hot Pistachio", name_ar: "هوت بستاشيو", description_en: "", description_ar: "", price_small: 7, price_large: 10, image: "", available: true, order: 12, categoryIndex: 0 },
  { name_en: "Hot Lotus", name_ar: "هوت لوتس", description_en: "", description_ar: "", price_small: 7, price_large: 10, image: "", available: true, order: 13, categoryIndex: 0 },
  { name_en: "Hot Nutella", name_ar: "هوت نيوتيلا", description_en: "", description_ar: "", price_small: 7, price_large: 10, image: "", available: true, order: 14, categoryIndex: 0 },
  { name_en: "Toffee Caramel", name_ar: "توفي كراميل", description_en: "", description_ar: "", price_small: 7, price_large: 10, image: "", available: true, order: 15, categoryIndex: 0 },
  { name_en: "Salted Caramel", name_ar: "سولتد كراميل", description_en: "", description_ar: "", price_small: 7, price_large: 10, image: "", available: true, order: 16, categoryIndex: 0 },
  { name_en: "Macchiato", name_ar: "مكياتو", description_en: "", description_ar: "", price_small: 0, price_large: 8, image: "", available: true, order: 17, categoryIndex: 0 },
  { name_en: "Caramel Macchiato", name_ar: "كراميل مكياتو", description_en: "", description_ar: "", price_small: 0, price_large: 10, image: "", available: true, order: 18, categoryIndex: 0 },
  { name_en: "Affogato", name_ar: "أفوجاتو", description_en: "", description_ar: "", price_small: 0, price_large: 12, image: "", available: true, order: 19, categoryIndex: 0 },

  // Cold Drinks (1)
  { name_en: "Iced Coffee", name_ar: "ايس كوفي", description_en: "", description_ar: "", price_small: 5, price_large: 10, image: "", available: true, order: 1, categoryIndex: 1 },
  { name_en: "Iced Latte", name_ar: "ايس لاتيه", description_en: "", description_ar: "", price_small: 10, price_large: 12, image: "", available: true, order: 2, categoryIndex: 1 },
  { name_en: "Iced Americano", name_ar: "ايس أمريكانو", description_en: "", description_ar: "", price_small: 10, price_large: 12, image: "", available: true, order: 3, categoryIndex: 1 },
  { name_en: "Iced Spanish Latte", name_ar: "ايس سبانيش لاتيه", description_en: "", description_ar: "", price_small: 12, price_large: 14, image: "", available: true, order: 4, categoryIndex: 1 },
  { name_en: "Iced Vanilla", name_ar: "ايس فانيلا", description_en: "", description_ar: "", price_small: 8, price_large: 10, image: "", available: true, order: 5, categoryIndex: 1 },
  { name_en: "Iced Chocolate", name_ar: "ايس شوكوليت", description_en: "", description_ar: "", price_small: 10, price_large: 12, image: "", available: true, order: 6, categoryIndex: 1 },
  { name_en: "Iced Passionfruit", name_ar: "ايس بسفلورا", description_en: "", description_ar: "", price_small: 5, price_large: 10, image: "", available: true, order: 7, categoryIndex: 1 },
  { name_en: "Iced Tea", name_ar: "ايس تي", description_en: "", description_ar: "", price_small: 5, price_large: 10, image: "", available: true, order: 8, categoryIndex: 1 },

  // Milkshake (2)
  { name_en: "Oreo Milkshake", name_ar: "أوريو", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 1, categoryIndex: 2 },
  { name_en: "Lotus Milkshake", name_ar: "لوتس", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 2, categoryIndex: 2 },
  { name_en: "Caramel Milkshake", name_ar: "كراميل", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 3, categoryIndex: 2 },
  { name_en: "Kinder Milkshake", name_ar: "كندر", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 4, categoryIndex: 2 },
  { name_en: "Pistachio Milkshake", name_ar: "بيستاشيو", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 5, categoryIndex: 2 },
  { name_en: "Strawberry Milkshake", name_ar: "فراولة", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 6, categoryIndex: 2 },
  { name_en: "Cerblak Milkshake", name_ar: "سيربلاك", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 7, categoryIndex: 2 },
  { name_en: "Protein Milkshake", name_ar: "بروتين", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 8, categoryIndex: 2 },
  { name_en: "Nutella Milkshake", name_ar: "نوتيلا", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 9, categoryIndex: 2 },

  // Smoothie (3)
  { name_en: "Mango Smoothie", name_ar: "مانجا", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 1, categoryIndex: 3 },
  { name_en: "Pineapple Smoothie", name_ar: "أناناس", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 2, categoryIndex: 3 },
  { name_en: "Strawberry Smoothie", name_ar: "فراولة", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 3, categoryIndex: 3 },
  { name_en: "Mixed Berry Smoothie", name_ar: "مكس بيري", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 4, categoryIndex: 3 },
  { name_en: "Passionfruit Smoothie", name_ar: "بسفلورا", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 5, categoryIndex: 3 },
  { name_en: "Pineapple & Mango", name_ar: "أناناس / مانجا", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 6, categoryIndex: 3 },
  { name_en: "Passionfruit & Mango", name_ar: "بسفلورا / مانجا", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 7, categoryIndex: 3 },
  { name_en: "Pineapple & Mixed Berry", name_ar: "أناناس / ميكس بيري", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 8, categoryIndex: 3 },
  { name_en: "Pineapple, Strawberry & Mango", name_ar: "أناناس / فراولة / مانجا", description_en: "", description_ar: "", price_small: 10, price_large: 15, image: "", available: true, order: 9, categoryIndex: 3 },

  // Fresh Juice (4)
  { name_en: "Lemon Juice", name_ar: "ليمون", description_en: "", description_ar: "", price_small: 10, price_large: 12, image: "", available: true, order: 1, categoryIndex: 4 },
  { name_en: "Lemon & Mint", name_ar: "ليمون ونعنع", description_en: "", description_ar: "", price_small: 10, price_large: 12, image: "", available: true, order: 2, categoryIndex: 4 },
  { name_en: "Orange Juice", name_ar: "برتقال", description_en: "", description_ar: "", price_small: 10, price_large: 12, image: "", available: true, order: 3, categoryIndex: 4 },
  { name_en: "Carrot Juice", name_ar: "جزر", description_en: "", description_ar: "", price_small: 10, price_large: 12, image: "", available: true, order: 4, categoryIndex: 4 },

  // Cocktails (5)
  { name_en: "Piña Colada", name_ar: "بيناكولادا", description_en: "", description_ar: "", price_small: 0, price_large: 20, image: "", available: true, order: 1, categoryIndex: 5 },
  { name_en: "House Cocktail", name_ar: "كوكتيل مميز", description_en: "", description_ar: "", price_small: 0, price_large: 20, image: "", available: true, order: 2, categoryIndex: 5 },
  { name_en: "Avocado Cocktail", name_ar: "أفوجادو", description_en: "", description_ar: "", price_small: 0, price_large: 20, image: "", available: true, order: 3, categoryIndex: 5 },

  // Mojito (6)
  { name_en: "Mojito", name_ar: "موهيتو", description_en: "Ask about available flavors", description_ar: "اسأل عن الأطعمة", price_small: 0, price_large: 12, image: "", available: true, order: 1, categoryIndex: 6 },

  // Sweets (7)
  { name_en: "Crepe", name_ar: "كريب", description_en: "", description_ar: "", price_small: 0, price_large: 10, image: "", available: true, order: 1, categoryIndex: 7 },
  { name_en: "Dubai Crepe", name_ar: "كريب دبي", description_en: "", description_ar: "", price_small: 0, price_large: 20, image: "", available: true, order: 2, categoryIndex: 7 },
  { name_en: "Fshafesh", name_ar: "فشافيش", description_en: "", description_ar: "", price_small: 0, price_large: 15, image: "", available: true, order: 3, categoryIndex: 7 },
  { name_en: "Waffle", name_ar: "وافل", description_en: "", description_ar: "", price_small: 0, price_large: 10, image: "", available: true, order: 4, categoryIndex: 7 },
  { name_en: "Fshafesh Cup", name_ar: "كاسة فشافيش", description_en: "", description_ar: "", price_small: 0, price_large: 10, image: "", available: true, order: 5, categoryIndex: 7 },
  { name_en: "Dubai Cup", name_ar: "كاسة دبي", description_en: "", description_ar: "", price_small: 0, price_large: 18, image: "", available: true, order: 6, categoryIndex: 7 },
  { name_en: "House Cup", name_ar: "كأس مميز", description_en: "", description_ar: "", price_small: 0, price_large: 18, image: "", available: true, order: 7, categoryIndex: 7 },
];

export async function seedDatabase() {
  const categoryIds: string[] = [];

  // Create categories first
  const categoryTransactions = categories.map((cat) => {
    const catId = id();
    categoryIds.push(catId);
    return db.tx.categories[catId].update({
      name_en: cat.name_en,
      name_ar: cat.name_ar,
      icon: cat.icon,
      order: cat.order,
      active: true,
    });
  });

  await db.transact(categoryTransactions);

  // Create items in batches with category_id field
  const itemBatch = items.map((item) => {
    const itemId = id();
    const categoryId = categoryIds[item.categoryIndex];
    return db.tx.items[itemId].update({
      name_en: item.name_en,
      name_ar: item.name_ar,
      description_en: item.description_en,
      description_ar: item.description_ar,
      price_small: item.price_small,
      price_large: item.price_large,
      image: item.image,
      available: item.available,
      order: item.order,
      category_id: categoryId,
    });
  });

  // Split into batches of 20
  const batchSize = 20;
  for (let i = 0; i < itemBatch.length; i += batchSize) {
    await db.transact(itemBatch.slice(i, i + batchSize));
  }

  // Create default settings
  const logoId = id();
  const langId = id();
  await db.transact([
    db.tx.settings[logoId].update({ key: "logo", value: "" }),
    db.tx.settings[langId].update({ key: "default_lang", value: "ar" }),
  ]);
}
