import type { InstantRules } from "@instantdb/react";

const rules = {
  categories: {
    allow: { view: "true", create: "isAdmin", update: "isAdmin", delete: "isAdmin" },
    bind: ["isAdmin", "auth.id != null && 'admin' in auth.ref('$user.profile.role')"],
  },
  products: {
    allow: { view: "true", create: "isAdmin", update: "isAdmin", delete: "isAdmin" },
    bind: ["isAdmin", "auth.id != null && 'admin' in auth.ref('$user.profile.role')"],
  },
  productImages: {
    allow: { view: "true", create: "isAdmin", update: "isAdmin", delete: "isAdmin" },
    bind: ["isAdmin", "auth.id != null && 'admin' in auth.ref('$user.profile.role')"],
  },
  banners: {
    allow: { view: "true", create: "isAdmin", update: "isAdmin", delete: "isAdmin" },
    bind: ["isAdmin", "auth.id != null && 'admin' in auth.ref('$user.profile.role')"],
  },
  settings: {
    allow: { view: "true", create: "isAdmin", update: "isAdmin", delete: "isAdmin" },
    bind: ["isAdmin", "auth.id != null && 'admin' in auth.ref('$user.profile.role')"],
  },
  counters: {
    // Never touched from the client; admin-token-only. Locked down defensively.
    allow: { view: "isAdmin", create: "isAdmin", update: "isAdmin", delete: "false" },
    bind: ["isAdmin", "auth.id != null && 'admin' in auth.ref('$user.profile.role')"],
  },

  profiles: {
    allow: {
      view: "isSelf || isAdmin",
      create: "isSelf",
      update: "(isSelf && notChangingRole) || isAdmin",
      delete: "isAdmin",
    },
    bind: [
      "isSelf", "auth.id != null && auth.id in data.ref('$user.id')",
      "isAdmin", "auth.id != null && 'admin' in auth.ref('$user.profile.role')",
      "notChangingRole", "newData.role == data.role",
    ],
  },

  addresses: {
    allow: {
      view: "isOwner || isAdmin",
      create: "isOwner",
      update: "isOwner || isAdmin",
      delete: "isOwner || isAdmin",
    },
    bind: [
      "isOwner", "auth.id != null && auth.id in data.ref('$user.id')",
      "isAdmin", "auth.id != null && 'admin' in auth.ref('$user.profile.role')",
    ],
  },
  cartItems: {
    allow: { view: "isOwner", create: "isOwner", update: "isOwner", delete: "isOwner" },
    bind: ["isOwner", "auth.id != null && auth.id in data.ref('$user.id')"],
  },
  orders: {
    allow: {
      view: "isOwner || isAdmin",
      create: "isOwner",
      // Customers may only cancel their own order or edit notes; all other status
      // transitions are admin-only.
      update: "isAdmin || (isOwner && onlyCustomerEditableFields)",
      delete: "false", // orders are never hard-deleted, only status-cancelled
    },
    bind: [
      "isOwner", "auth.id != null && auth.id in data.ref('$user.id')",
      "isAdmin", "auth.id != null && 'admin' in auth.ref('$user.profile.role')",
      "onlyCustomerEditableFields", "request.modifiedFields.all(f, f in ['notes', 'status', 'cancelled_at']) && (newData.status == data.status || newData.status == 'cancelled')",
    ],
  },
  orderItems: {
    allow: {
      view: "isOwnerOfOrder || isAdmin",
      create: "isOwnerOfOrder || isAdmin",
      update: "isAdmin",
      delete: "isAdmin",
    },
    bind: [
      // NOTE: verify this 2-hop ref in the InstantDB permissions playground before launch.
      // Fallback if it misbehaves: add a direct orderItems.$user link (same pattern as
      // orders/addresses/cartItems) and swap this to "auth.id in data.ref('$user.id')".
      "isOwnerOfOrder", "auth.id != null && auth.id in data.ref('order.$user.id')",
      "isAdmin", "auth.id != null && 'admin' in auth.ref('$user.profile.role')",
    ],
  },

  $users: {
    allow: { view: "isSelf || isAdmin", create: "false", update: "false", delete: "false" },
    bind: [
      "isSelf", "auth.id == data.id",
      "isAdmin", "auth.id != null && 'admin' in auth.ref('$user.profile.role')",
    ],
  },
} satisfies InstantRules;

export default rules;
