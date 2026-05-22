import { i } from "@instantdb/react";

const schema = i.schema({
  entities: {
    categories: i.entity({
      name_en: i.string(),
      name_ar: i.string(),
      icon: i.string(),
      order: i.number(),
      active: i.boolean(),
    }),
    items: i.entity({
      name_en: i.string(),
      name_ar: i.string(),
      description_en: i.string(),
      description_ar: i.string(),
      price_small: i.number(),
      price_large: i.number(),
      image: i.string(),
      available: i.boolean(),
      order: i.number(),
      category_id: i.string(),
    }),
    settings: i.entity({
      key: i.string(),
      value: i.string(),
    }),
    banners: i.entity({
      title_en: i.string(),
      title_ar: i.string(),
      subtitle_en: i.string(),
      subtitle_ar: i.string(),
      image: i.string(),
      link: i.string(),
      active: i.boolean(),
      order: i.number(),
    }),
    item_images: i.entity({
      item_id: i.string(),
      image: i.string(),
      is_primary: i.boolean(),
      order: i.number(),
    }),
  },
});

export type AppSchema = typeof schema;
export default schema;
