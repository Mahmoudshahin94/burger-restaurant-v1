// ── Legacy types (kept for backward compatibility during migration) ──────────

export interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  icon: string | null;
  image: string | null;
  sort_order: number | null;
  order?: number;
  active: boolean | null;
  created_at?: string | null;
}

export interface MenuItem {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string | null;
  description_ar?: string | null;
  price_small: number | null;
  price_large: number | null;
  image?: string | null;
  available: boolean | null;
  sort_order: number | null;
  order?: number;
  category_id?: string | null;
}

export interface Settings {
  id: string;
  key: string;
  value: string | null;
}

export interface Banner {
  id: string;
  title_en: string | null;
  title_ar: string | null;
  subtitle_en: string | null;
  subtitle_ar: string | null;
  image: string;
  link: string | null;
  active: boolean | null;
  sort_order: number | null;
  order?: number;
}

export interface ItemImage {
  id: string;
  item_id?: string;
  product_id?: string | null;
  image: string;
  image_url?: string;
  is_primary: boolean | null;
  order?: number | null;
  sort_order?: number | null;
}

export type Language = "en" | "ar";

export interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

// ── New e-commerce types ─────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: "customer" | "admin" | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  street: string;
  city: string;
  area: string | null;
  building: string | null;
  floor: string | null;
  notes: string | null;
  is_default: boolean | null;
  created_at: string | null;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  size: "small" | "large" | null;
  quantity: number | null;
  created_at: string | null;
  product?: MenuItem;
}

export interface CartItemWithProduct extends CartItem {
  product: MenuItem;
}

export type OrderStatus = "pending" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";
export type PaymentMethod = "cod" | "card";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Order {
  id: string;
  order_number: number;
  user_id: string | null;
  status: OrderStatus | null;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus | null;
  subtotal: number;
  delivery_fee: number | null;
  total: number;
  notes: string | null;
  delivery_address: DeliveryAddress | null;
  confirmed_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  order_items?: OrderItem[];
  profile?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_en: string;
  product_name_ar: string;
  size: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  area?: string | null;
  building?: string | null;
  floor?: string | null;
  notes?: string | null;
  label?: string | null;
}
