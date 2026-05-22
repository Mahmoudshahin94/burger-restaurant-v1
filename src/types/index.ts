export interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  icon: string;
  order: number;
  active: boolean;
}

export interface MenuItem {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  price_small: number;
  price_large: number;
  image?: string;
  available: boolean;
  order: number;
  category_id?: string;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
}

export interface Banner {
  id: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  image: string;
  link: string;
  active: boolean;
  order: number;
}

export interface ItemImage {
  id: string;
  item_id: string;
  image: string;
  is_primary: boolean;
  order: number;
}

export type Language = "en" | "ar";

export interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}
