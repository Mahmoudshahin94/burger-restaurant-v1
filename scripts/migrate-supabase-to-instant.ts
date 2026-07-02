/**
 * One-time data migration: Supabase (Postgres + Auth) -> InstantDB.
 *
 * Run by hand, from an operator machine. Never run in CI. Supabase is only
 * ever read from — this script never writes to Supabase, so it's safe to
 * re-run (see "Idempotency" below).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   INSTANT_APP_ID=... INSTANT_ADMIN_TOKEN=... \
 *   npx tsx scripts/migrate-supabase-to-instant.ts [--dry-run] [--skip-counter-seed]
 *
 * (INSTANT_APP_ID/INSTANT_ADMIN_TOKEN fall back to NEXT_PUBLIC_INSTANTDB_APP_ID /
 * INSTANT_APP_ADMIN_TOKEN so you can just point this at your .env.local values.)
 *
 * Idempotency:
 * - Every entity is written with `.update()` keyed by a deterministic id (the
 *   Supabase row's own id, reused verbatim as the InstantDB id — see Decision
 *   D2 in the migration plan), so re-running overwrites with the same data
 *   rather than duplicating.
 * - Step 1 (`createToken`) is idempotent by email — re-running never creates a
 *   duplicate $users row for the same address.
 * - Step 8 (counters seed) is NOT idempotent by design (it sets an absolute
 *   value) — pass --skip-counter-seed on any re-run after the first successful
 *   pass, or you'll reset the order_number sequence backwards if new orders
 *   were created via the app in between.
 *
 * Order of operations respects link dependencies:
 *   identity ($users + profiles) -> categories -> products -> productImages
 *   -> banners -> settings -> addresses -> cartItems -> counters -> orders
 *   -> orderItems
 */

import { init, id as adminId } from "@instantdb/admin";
import schema from "../instant.schema";

const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_COUNTER_SEED = process.argv.includes("--skip-counter-seed");
const BATCH_SIZE = 25;

function requireEnv(...names: string[]): string {
  for (const name of names) {
    const v = process.env[name]?.trim();
    if (v) return v;
  }
  console.error(`Missing required environment variable (tried: ${names.join(", ")})`);
  process.exit(1);
}

const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const INSTANT_APP_ID = requireEnv("INSTANT_APP_ID", "NEXT_PUBLIC_INSTANTDB_APP_ID");
const INSTANT_ADMIN_TOKEN = requireEnv("INSTANT_ADMIN_TOKEN", "INSTANT_APP_ADMIN_TOKEN");

const adminDb = init({ appId: INSTANT_APP_ID, adminToken: INSTANT_ADMIN_TOKEN, schema });

type Row = Record<string, unknown> & { id: string };

// ── Supabase REST/Auth-Admin helpers (plain fetch — no @supabase/supabase-js
// dependency needed for this one-time script) ──────────────────────────────

async function supabaseRestTable(table: string): Promise<Row[]> {
  const rows: Row[] = [];
  const pageSize = 1000;
  let offset = 0;

  for (;;) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&order=id&limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Supabase REST fetch failed for ${table}: ${res.status} ${await res.text()}`);
    }
    const page = (await res.json()) as Row[];
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

type SupabaseAuthUser = { id: string; email: string | null };

async function supabaseAuthUsers(): Promise<SupabaseAuthUser[]> {
  const users: SupabaseAuthUser[] = [];
  let page = 1;
  const perPage = 1000;

  for (;;) {
    const url = `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Supabase auth admin fetch failed: ${res.status} ${await res.text()}`);
    }
    const body = (await res.json()) as { users: SupabaseAuthUser[] };
    users.push(...body.users);
    if (body.users.length < perPage) break;
    page += 1;
  }

  return users;
}

function attrsForUpdate(row: Row, keys: readonly string[]): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined) o[k] = v;
  }
  return o;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function writeBatches(label: string, rows: Row[], buildTx: (row: Row) => any): Promise<void> {
  if (rows.length === 0) {
    console.log(`  ${label}: nothing to write`);
    return;
  }
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const slice = rows.slice(i, i + BATCH_SIZE);
    const chunks = slice.map(buildTx);
    await adminDb.transact(chunks);
    console.log(`  ${label}: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }
}

async function main() {
  console.log(`Reading from Supabase (${SUPABASE_URL})...`);

  const [authUsers, profiles, categories, products, productImages, banners, settings, addresses, cartItems, orders, orderItems] =
    await Promise.all([
      supabaseAuthUsers(),
      supabaseRestTable("profiles"),
      supabaseRestTable("categories"),
      supabaseRestTable("products"),
      supabaseRestTable("product_images"),
      supabaseRestTable("banners"),
      supabaseRestTable("settings"),
      supabaseRestTable("addresses"),
      supabaseRestTable("cart_items"),
      supabaseRestTable("orders"),
      supabaseRestTable("order_items"),
    ]);

  console.log("Row counts:", {
    authUsers: authUsers.length,
    profiles: profiles.length,
    categories: categories.length,
    products: products.length,
    productImages: productImages.length,
    banners: banners.length,
    settings: settings.length,
    addresses: addresses.length,
    cartItems: cartItems.length,
    orders: orders.length,
    orderItems: orderItems.length,
  });

  if (DRY_RUN) {
    console.log("Dry run: no writes to InstantDB.");
    return;
  }

  console.log(`Writing to InstantDB app ${INSTANT_APP_ID}...`);

  // ── 1. Identity: Supabase auth.users + profiles -> InstantDB $users + profiles ──
  console.log("Step 1: identity ($users + profiles)");
  const userIdMap = new Map<string, string>(); // supabase auth.users.id -> instant $users.id
  const authEmailMap = new Map<string, string>(); // supabase auth.users.id -> email

  for (const authUser of authUsers) {
    if (!authUser.email) continue; // InstantDB identity is email-keyed; skip email-less accounts
    authEmailMap.set(authUser.id, authUser.email);
    await adminDb.auth.createToken({ email: authUser.email }); // idempotent; creates $users row if missing
    const instantUser = await adminDb.auth.getUser({ email: authUser.email });
    if (instantUser) userIdMap.set(authUser.id, instantUser.id);
  }
  console.log(`  provisioned ${userIdMap.size}/${authUsers.length} $users`);

  // profiles.email and profiles.created_at are required by instant.schema.ts; a handful
  // of legacy Supabase rows have these null, so fall back to the linked auth user's email
  // and to "now" for created_at rather than failing the whole batch.
  const PROFILE_KEYS = ["full_name", "phone", "avatar_url", "role", "updated_at"] as const;
  const skippedProfiles: string[] = [];
  const validProfiles = profiles.filter((row) => {
    if (row.email || authEmailMap.get(row.id)) return true;
    skippedProfiles.push(row.id);
    return false;
  });
  if (skippedProfiles.length) {
    console.log(`  profiles: skipping ${skippedProfiles.length} rows with no email anywhere: ${skippedProfiles.join(", ")}`);
  }
  await writeBatches("profiles", validProfiles, (row: Row) => {
    const instantUserId = userIdMap.get(row.id as string);
    const email = (row.email as string | null) || authEmailMap.get(row.id) || "";
    const created_at = (row.created_at as string | null) || new Date().toISOString();
    const tx = adminDb.tx.profiles[row.id].update({ ...attrsForUpdate(row, PROFILE_KEYS), email, created_at });
    return instantUserId ? tx.link({ $user: instantUserId }) : tx;
  });

  // ── 2. Categories ──────────────────────────────────────────────────────────
  const CATEGORY_KEYS = ["name_en", "name_ar", "icon", "image", "active", "sort_order", "created_at"] as const;
  await writeBatches("categories", categories, (row: Row) =>
    adminDb.tx.categories[row.id].update(attrsForUpdate(row, CATEGORY_KEYS)),);

  // ── 3. Products (link category) ─────────────────────────────────────────────
  const PRODUCT_KEYS = [
    "name_en", "name_ar", "description_en", "description_ar",
    "price_small", "price_large", "image", "available", "sort_order",
    "created_at", "updated_at",
  ] as const;
  await writeBatches("products", products, (row: Row) => {
    const tx = adminDb.tx.products[row.id].update(attrsForUpdate(row, PRODUCT_KEYS));
    return row.category_id ? tx.link({ category: row.category_id as string }) : tx;
  });

  // ── 4. Product images (link product) ────────────────────────────────────────
  const IMAGE_KEYS = ["is_primary", "sort_order"] as const;
  await writeBatches(
    "productImages",
    productImages.filter((row) => row.product_id),
    (row: Row) =>
      adminDb.tx.productImages[row.id]
        .update({ ...attrsForUpdate(row, IMAGE_KEYS), image_url: row.image_url as string })
        .link({ product: row.product_id as string }),);

  // ── 5. Banners & settings (no deps) ─────────────────────────────────────────
  const BANNER_KEYS = ["title_en", "title_ar", "subtitle_en", "subtitle_ar", "image", "link", "active", "sort_order"] as const;
  await writeBatches("banners", banners, (row: Row) =>
    adminDb.tx.banners[row.id].update(attrsForUpdate(row, BANNER_KEYS)),);

  const SETTINGS_KEYS = ["key", "value"] as const;
  await writeBatches("settings", settings, (row: Row) =>
    adminDb.tx.settings[row.id].update(attrsForUpdate(row, SETTINGS_KEYS)),);

  // ── 6. Addresses (link profile + $user) ─────────────────────────────────────
  const ADDRESS_KEYS = ["label", "street", "city", "area", "building", "floor", "notes", "is_default", "created_at"] as const;
  await writeBatches(
    "addresses",
    addresses.filter((row) => row.user_id),
    (row: Row) => {
      const instantUserId = userIdMap.get(row.user_id as string);
      let tx = adminDb.tx.addresses[row.id]
        .update(attrsForUpdate(row, ADDRESS_KEYS))
        .link({ profile: row.user_id as string });
      if (instantUserId) tx = tx.link({ $user: instantUserId });
      return tx;
    },);

  // ── 7. Cart items (link profile + $user + product) ──────────────────────────
  const productIds = new Set(products.map((p) => p.id));
  const CART_ITEM_KEYS = ["size", "quantity", "created_at"] as const;
  const validCartItems = cartItems.filter((row) => row.user_id && row.product_id && productIds.has(row.product_id as string));
  console.log(`  cartItems: skipping ${cartItems.length - validCartItems.length} rows with missing user/product`);
  await writeBatches("cartItems", validCartItems, (row: Row) => {
    const instantUserId = userIdMap.get(row.user_id as string);
    let tx = adminDb.tx.cartItems[row.id]
      .update(attrsForUpdate(row, CART_ITEM_KEYS))
      .link({ profile: row.user_id as string, product: row.product_id as string });
    if (instantUserId) tx = tx.link({ $user: instantUserId });
    return tx;
  });

  // ── 8. Counters (seed order_number sequence) ────────────────────────────────
  if (!SKIP_COUNTER_SEED) {
    const maxOrderNumber = orders.reduce((max, o) => Math.max(max, Number(o.order_number) || 0), 0);
    console.log(`Step 8: seeding order_number counter to ${maxOrderNumber}`);
    await adminDb.transact(
      adminDb.tx.counters[adminId()].update({ key: "order_number", value: maxOrderNumber }),
    );
  } else {
    console.log("Step 8: skipped (--skip-counter-seed)");
  }

  // ── 9. Orders (link profile + $user) ────────────────────────────────────────
  const ORDER_KEYS = [
    "order_number", "status", "payment_method", "payment_status",
    "subtotal", "delivery_fee", "total", "notes", "delivery_address",
    "confirmed_at", "out_for_delivery_at", "delivered_at", "cancelled_at",
    "created_at", "updated_at",
  ] as const;
  let unownedOrders = 0;
  await writeBatches("orders", orders, (row: Row) => {
    let tx = adminDb.tx.orders[row.id].update(attrsForUpdate(row, ORDER_KEYS));
    if (row.user_id) {
      const instantUserId = userIdMap.get(row.user_id as string);
      tx = tx.link({ profile: row.user_id as string });
      if (instantUserId) tx = tx.link({ $user: instantUserId });
    } else {
      unownedOrders += 1;
    }
    return tx;
  });
  if (unownedOrders) {
    console.log(`  ${unownedOrders} orders have no user_id — migrated unowned (admin-only visible per permissions)`);
  }

  // ── 10. Order items (link order + product) ──────────────────────────────────
  const ORDER_ITEM_KEYS = ["product_name_en", "product_name_ar", "size", "quantity", "unit_price", "total_price"] as const;
  await writeBatches(
    "orderItems",
    orderItems.filter((row) => row.order_id),
    (row: Row) => {
      let tx = adminDb.tx.orderItems[row.id]
        .update(attrsForUpdate(row, ORDER_ITEM_KEYS))
        .link({ order: row.order_id as string });
      if (row.product_id && productIds.has(row.product_id as string)) {
        tx = tx.link({ product: row.product_id as string });
      }
      return tx;
    },);

  console.log("Migration finished.");
  console.log("Spot-check: run a query like");
  console.log('  adminDb.query({ orders: { order_items: {}, profile: {} } })');
  console.log("and compare counts above against the live Supabase project.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
