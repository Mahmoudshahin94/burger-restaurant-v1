// Imported from @instantdb/core (not @instantdb/react) — this schema file is
// shared by both the browser client (src/lib/instant/client.ts) and
// server-side code (src/lib/instant/admin.ts, scripts/migrate-supabase-to-instant.ts).
// @instantdb/react also exports `i`, but importing it here would pull its
// browser-only InstantReactWebDatabase class into every server module that
// transitively imports this schema, crashing Server Components/Actions
// ("Class extends value ... is not a constructor"). @instantdb/core is the
// platform-agnostic package both @instantdb/react and @instantdb/admin build on.
import { i } from "@instantdb/core";

const schema = i.schema({
  entities: {
    // $users is InstantDB's built-in auth entity. It must be declared here
    // (with its real fields) for our own entities to link to it — leaving
    // it undeclared and only referencing the "$users" string in `links`
    // causes the push API to reject the link with a "non existing entity"
    // error, even though $users always exists on the backend. Confirmed by
    // pulling this app's live schema (`instant-cli pull schema`), which
    // shows InstantDB's own generated files declare $users the same way.
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),

    profiles: i.entity({
      email: i.string().indexed(),
      full_name: i.string().optional(),
      phone: i.string().optional(),
      avatar_url: i.string().optional(),
      role: i.string().indexed(), // "customer" | "admin"
      created_at: i.date().indexed(),
      updated_at: i.date().optional(),
    }),

    addresses: i.entity({
      label: i.string().optional(),
      street: i.string(),
      city: i.string(),
      area: i.string().optional(),
      building: i.string().optional(),
      floor: i.string().optional(),
      notes: i.string().optional(),
      is_default: i.boolean().indexed(),
      created_at: i.date().indexed(),
    }),

    categories: i.entity({
      name_en: i.string(),
      name_ar: i.string(),
      icon: i.string().optional(),
      image: i.string().optional(),
      active: i.boolean().indexed(),
      sort_order: i.number().indexed(),
      created_at: i.date().optional(),
    }),

    products: i.entity({
      name_en: i.string(),
      name_ar: i.string(),
      description_en: i.string().optional(),
      description_ar: i.string().optional(),
      price_small: i.number().optional(),
      price_large: i.number().optional(),
      image: i.string().optional(),
      available: i.boolean().indexed(),
      sort_order: i.number().indexed(),
      created_at: i.date().optional(),
      updated_at: i.date().optional(),
    }),

    productImages: i.entity({
      image_url: i.string(),
      is_primary: i.boolean().indexed(),
      sort_order: i.number().indexed(),
    }),

    cartItems: i.entity({
      size: i.string().optional(),
      quantity: i.number(),
      created_at: i.date().indexed(),
    }),

    orders: i.entity({
      order_number: i.number().unique().indexed(),
      status: i.string().indexed(),
      payment_method: i.string().optional(),
      payment_status: i.string().optional(),
      subtotal: i.number(),
      delivery_fee: i.number().optional(),
      total: i.number(),
      notes: i.string().optional(),
      delivery_address: i.json().optional(),
      confirmed_at: i.date().optional(),
      out_for_delivery_at: i.date().optional(),
      delivered_at: i.date().optional(),
      cancelled_at: i.date().optional(),
      created_at: i.date().indexed(),
      updated_at: i.date().optional(),
    }),

    orderItems: i.entity({
      product_name_en: i.string(),
      product_name_ar: i.string(),
      size: i.string().optional(),
      quantity: i.number(),
      unit_price: i.number(),
      total_price: i.number(),
    }),

    banners: i.entity({
      title_en: i.string().optional(),
      title_ar: i.string().optional(),
      subtitle_en: i.string().optional(),
      subtitle_ar: i.string().optional(),
      image: i.string(),
      link: i.string().optional(),
      active: i.boolean().indexed(),
      sort_order: i.number().indexed(),
    }),

    settings: i.entity({
      key: i.string().unique().indexed(),
      value: i.string().optional(),
    }),

    // Supports order_number display sequence (InstantDB has no native auto-increment).
    counters: i.entity({
      key: i.string().unique().indexed(),
      value: i.number(),
    }),
  },

  links: {
    // profiles <-> $users (1:1) — the identity bridge.
    profileUser: {
      forward: { on: "profiles", has: "one", label: "$user" },
      reverse: { on: "$users", has: "one", label: "profile" },
    },

    categoryProducts: {
      forward: { on: "products", has: "one", label: "category" },
      reverse: { on: "categories", has: "many", label: "products" },
    },

    productImageLinks: {
      forward: { on: "productImages", has: "one", label: "product", onDelete: "cascade" },
      reverse: { on: "products", has: "many", label: "images" },
    },

    profileAddresses: {
      forward: { on: "addresses", has: "one", label: "profile", onDelete: "cascade" },
      reverse: { on: "profiles", has: "many", label: "addresses" },
    },
    addressOwner: {
      forward: { on: "addresses", has: "one", label: "$user", onDelete: "cascade" },
      reverse: { on: "$users", has: "many", label: "addresses" },
    },

    profileCartItems: {
      forward: { on: "cartItems", has: "one", label: "profile", onDelete: "cascade" },
      reverse: { on: "profiles", has: "many", label: "cartItems" },
    },
    cartItemOwner: {
      forward: { on: "cartItems", has: "one", label: "$user", onDelete: "cascade" },
      reverse: { on: "$users", has: "many", label: "cartItems" },
    },
    cartItemProduct: {
      forward: { on: "cartItems", has: "one", label: "product" },
      reverse: { on: "products", has: "many", label: "cartItems" },
    },

    profileOrders: {
      forward: { on: "orders", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "orders" },
    },
    orderOwner: {
      forward: { on: "orders", has: "one", label: "$user" },
      reverse: { on: "$users", has: "many", label: "orders" },
    },

    orderOrderItems: {
      forward: { on: "orderItems", has: "one", label: "order", onDelete: "cascade" },
      reverse: { on: "orders", has: "many", label: "order_items" },
    },
    orderItemProduct: {
      forward: { on: "orderItems", has: "one", label: "product" },
      reverse: { on: "products", has: "many", label: "orderItems" },
    },
  },
});

export default schema;
export type AppSchema = typeof schema;
