import { cookies } from "next/headers";

export type InstantCookieUser = {
  id: string;
  email?: string;
  refresh_token: string;
};

/**
 * Reads and JSON-parses the `instant_user_<appId>` cookie set by
 * `createInstantRouteHandler` (see src/app/api/instant/route.ts). Unverified —
 * no crypto/session check, just a fast "is someone logged in" read for
 * middleware-adjacent server code. For anything security-sensitive, pass
 * `refresh_token` to `adminDb.auth.verifyToken`.
 *
 * Hand-rolled instead of importing `getUnverifiedUserFromInstantCookie` from
 * `@instantdb/react/nextjs`: that package's barrel file also pulls in
 * `InstantNextDatabase`/`InstantReactWebDatabase`, which extend a
 * browser-only base class and crash ("Class extends value ... is not a
 * constructor") when the module is evaluated in a Server
 * Component/Action's Node.js runtime. This mirrors the library's own
 * implementation exactly, minus the unsafe import.
 */
export async function getUnverifiedInstantUser(appId: string): Promise<InstantCookieUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(`instant_user_${appId}`)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}
