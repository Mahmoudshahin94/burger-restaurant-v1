import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Use getSession() to read the session from cookies without a network call.
  // getUser() always hits the auth server which can timeout in restricted envs.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return <>{children}</>;
}
