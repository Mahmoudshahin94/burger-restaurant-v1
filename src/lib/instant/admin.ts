import { init } from "@instantdb/admin";
import schema from "../../../instant.schema";

export const adminDb = init({
  appId: process.env.NEXT_PUBLIC_INSTANTDB_APP_ID!,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  schema,
});

export type AdminDB = typeof adminDb;
