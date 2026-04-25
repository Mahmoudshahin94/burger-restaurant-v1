/**
 * Copy all `categories`, `items`, and `settings` from a source InstantDB app
 * to a target app, preserving record IDs (so item → category links stay valid).
 *
 * Schema (instant.schema.ts) is code — push it to the new app in the Instant
 * dashboard (Schema) or via instant-cli before running this, if the target is empty.
 *
 * Get each app’s admin token: https://instantdb.com/dash → app → Admin.
 *
 * Usage:
 *   SOURCE_ADMIN_TOKEN=... TARGET_ADMIN_TOKEN=... npx tsx scripts/instant-migrate.ts
 *
 * Optional:
 *   SOURCE_APP_ID, TARGET_APP_ID  (defaults match your old/new UUIDs)
 *   --dry-run                     (read source only; needs SOURCE_ADMIN_TOKEN)
 */

import { init, type TransactionChunk } from "@instantdb/admin";
import schema from "../instant.schema";

const DEFAULT_SOURCE_APP = "254b5091-5192-46ff-b314-ae031e8e0607";
const DEFAULT_TARGET_APP = "4a86cbee-44d0-49db-b911-09c3a6985bf4";

const SOURCE_APP_ID = process.env.SOURCE_APP_ID?.trim() || DEFAULT_SOURCE_APP;
const TARGET_APP_ID = process.env.TARGET_APP_ID?.trim() || DEFAULT_TARGET_APP;

const dryRun = process.argv.includes("--dry-run");

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return v;
}

type Row = Record<string, unknown> & { id: string };

function attrsForUpdate(row: Row, keys: readonly string[]): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const k of keys) {
    if (k === "id") continue;
    const v = row[k];
    if (v !== undefined) o[k] = v;
  }
  return o;
}

const CATEGORY_KEYS = ["name_en", "name_ar", "icon", "order", "active"] as const;
const ITEM_KEYS = [
  "name_en",
  "name_ar",
  "description_en",
  "description_ar",
  "price_small",
  "price_large",
  "image",
  "available",
  "order",
  "category_id",
] as const;
const SETTINGS_KEYS = ["key", "value"] as const;

async function main() {
  const sourceToken = requireEnv("SOURCE_ADMIN_TOKEN");
  const source = init({
    appId: SOURCE_APP_ID,
    adminToken: sourceToken,
    schema,
  });

  console.log(`Query source app ${SOURCE_APP_ID}…`);
  const data = await source.query({
    categories: {},
    items: {},
    settings: {},
  });

  const categories = (data.categories ?? []) as Row[];
  const items = (data.items ?? []) as Row[];
  const settings = (data.settings ?? []) as Row[];

  console.log(
    `Found ${categories.length} categories, ${items.length} items, ${settings.length} settings.`,
  );

  if (dryRun) {
    console.log("Dry run: no writes to target.");
    return;
  }

  const targetToken = requireEnv("TARGET_ADMIN_TOKEN");
  const target = init({
    appId: TARGET_APP_ID,
    adminToken: targetToken,
    schema,
  });

  const batchSize = 25;

  async function writeBatches(
    label: string,
    rows: Row[],
    buildTx: (row: Row) => TransactionChunk<any, any>,
  ): Promise<void> {
    for (let i = 0; i < rows.length; i += batchSize) {
      const slice = rows.slice(i, i + batchSize);
      const chunks = slice.map((row) => buildTx(row));
      await target.transact(chunks);
      console.log(`  ${label}: ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
    }
  }

  console.log(`Writing to target app ${TARGET_APP_ID}…`);

  if (categories.length) {
    await writeBatches("categories", categories, (row) =>
      target.tx.categories[row.id].update(attrsForUpdate(row, [...CATEGORY_KEYS]) as never),
    );
  }

  if (items.length) {
    await writeBatches("items", items, (row) =>
      target.tx.items[row.id].update(attrsForUpdate(row, [...ITEM_KEYS]) as never),
    );
  }

  if (settings.length) {
    await writeBatches("settings", settings, (row) =>
      target.tx.settings[row.id].update(attrsForUpdate(row, [...SETTINGS_KEYS]) as never),
    );
  }

  console.log("Migration finished.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
