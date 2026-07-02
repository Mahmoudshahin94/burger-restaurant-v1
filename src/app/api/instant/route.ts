// Imported from @instantdb/core (not @instantdb/react/nextjs) — that
// package's barrel also pulls in InstantNextDatabase/InstantReactWebDatabase,
// which extend a browser-only base class and crash when evaluated in this
// route handler's Node.js runtime ("Class extends value ... is not a
// constructor"). @instantdb/core exports the same function without that
// baggage.
import { createInstantRouteHandler, id } from "@instantdb/admin";
import { adminDb } from "@/lib/instant/admin";

const { POST: syncUser } = createInstantRouteHandler({
  appId: process.env.NEXT_PUBLIC_INSTANTDB_APP_ID!,
});

// InstantDB has no server-side hook on $users creation (unlike Supabase's Postgres
// trigger), so this route — the one checkpoint every sign-in passes through via
// firstPartyPath — also bootstraps the profiles row on first sign-in.
export async function POST(req: Request) {
  const body = await req
    .clone()
    .json()
    .catch(() => null);

  const response = await syncUser(req);

  if (body?.type === "sync-user" && body.user?.id) {
    const { profiles } = await adminDb.query({
      profiles: { $: { where: { "$user.id": body.user.id } } },
    });

    if (profiles.length === 0) {
      await adminDb.transact(
        adminDb.tx.profiles[id()]
          .update({
            email: body.user.email,
            role: "customer",
            created_at: new Date().toISOString(),
          })
          .link({ $user: body.user.id }),
      );
    }
  }

  return response;
}
