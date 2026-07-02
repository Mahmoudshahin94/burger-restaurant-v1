import type { User } from "@instantdb/react";

/**
 * InstantDB's `firstPartyPath` cookie sync (see src/app/api/instant/route.ts)
 * runs in the background whenever auth state changes, but it's fire-and-forget:
 * the reactor notifies `db.useAuth()` subscribers *before* awaiting the sync
 * fetch (see @instantdb/core's Reactor.js `updateUser`). That's a real race —
 * a `useEffect` watching `db.useAuth()` and redirecting immediately can send
 * the browser to a middleware-protected route (e.g. /account) before the
 * httpOnly `instant_user_<appId>` cookie has actually been set, bouncing the
 * user straight back to the login page right after a successful sign-in.
 *
 * Since that cookie is httpOnly, client JS can't poll for it either. The fix:
 * perform the same sync call ourselves and await it before navigating.
 */
export async function syncInstantAuthCookie(user: User | null): Promise<void> {
  try {
    await fetch("/api/instant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "sync-user",
        appId: process.env.NEXT_PUBLIC_INSTANTDB_APP_ID,
        user,
      }),
    });
  } catch {
    // Best-effort — the SDK's own background sync will eventually catch up.
  }
}
