import { init } from "@instantdb/react";
import schema from "../../../instant.schema";

export const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANTDB_APP_ID!,
  schema,
  // Auto-POSTs auth-state changes to this route, which sets/clears the
  // httpOnly session cookie InstantDB's Next.js SSR helpers read.
  firstPartyPath: "/api/instant",
});

export type DB = typeof db;
