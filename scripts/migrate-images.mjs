/**
 * Migration: copy existing items.image → item_images table
 *
 * Run with:
 *   node --env-file=.env.local scripts/migrate-images.mjs
 *
 * Safe to re-run: skips items that already have item_images rows.
 */
import { init, id } from "@instantdb/admin";

const LEGACY_INSTANT_APP_ID = "254b5091-5192-46ff-b314-ae031e8e0607";
const DEFAULT_INSTANT_APP_ID = "4a86cbee-44d0-49db-b911-09c3a6985bf4";
const raw = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID?.trim();
const APP_ID =
  !raw || raw === LEGACY_INSTANT_APP_ID ? DEFAULT_INSTANT_APP_ID : raw;

const _db = init({ appId: APP_ID });
const db = _db.asUser({ guest: true });

async function main() {
  console.log("Fetching items and item_images...");

  const { data: itemsData } = await db.query({ items: {} });
  const { data: imagesData } = await db.query({ item_images: {} });

  const items = itemsData?.items ?? [];
  const existingImages = imagesData?.item_images ?? [];

  const existingItemIds = new Set(existingImages.map((img) => img.item_id));

  const toMigrate = items.filter(
    (item) => item.image && item.image.trim() !== "" && !existingItemIds.has(item.id)
  );

  if (toMigrate.length === 0) {
    console.log("Nothing to migrate — all items with images already have item_images rows.");
    return;
  }

  console.log(`Migrating ${toMigrate.length} item(s)...`);

  const txns = toMigrate.map((item) =>
    db.tx.item_images[id()].update({
      item_id: item.id,
      image: item.image,
      is_primary: true,
      order: 0,
    })
  );

  await db.transact(txns);

  console.log(`Done! Migrated ${toMigrate.length} item image(s) to item_images.`);
  console.log("Skipped items without images:", items.length - toMigrate.length - existingItemIds.size);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
