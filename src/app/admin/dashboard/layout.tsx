import { redirect } from "next/navigation";
import { getUnverifiedInstantUser } from "@/lib/instant/cookie";
import { adminDb } from "@/lib/instant/admin";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieUser = await getUnverifiedInstantUser(
    process.env.NEXT_PUBLIC_INSTANTDB_APP_ID!,
  );

  if (!cookieUser) {
    redirect("/admin/login");
  }

  let verifiedUser;
  try {
    verifiedUser = await adminDb.auth.verifyToken(cookieUser.refresh_token);
  } catch {
    redirect("/admin/login");
  }

  const { profiles } = await adminDb.query({
    profiles: { $: { where: { "$user.id": verifiedUser.id } } },
  });

  if (profiles[0]?.role !== "admin") {
    redirect("/");
  }

  return <>{children}</>;
}
