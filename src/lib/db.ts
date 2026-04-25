import { init } from "@instantdb/react";
import schema from "../../instant.schema";

/** Retired app — still used in some env files / deployments; always use the new app instead. */
const LEGACY_INSTANT_APP_ID = "254b5091-5192-46ff-b314-ae031e8e0607";

const DEFAULT_INSTANT_APP_ID = "4a86cbee-44d0-49db-b911-09c3a6985bf4";

const fromEnv = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID?.trim();
const APP_ID =
  !fromEnv || fromEnv === LEGACY_INSTANT_APP_ID
    ? DEFAULT_INSTANT_APP_ID
    : fromEnv;

if (
  process.env.NODE_ENV === "development" &&
  fromEnv === LEGACY_INSTANT_APP_ID
) {
  console.warn(
    `[db] NEXT_PUBLIC_INSTANTDB_APP_ID is the legacy app; using ${DEFAULT_INSTANT_APP_ID} instead.`,
  );
}

export const db = init({ appId: APP_ID, schema });

export type DB = typeof db;
